import { runsLocally } from './location'
import { ProviderError, type ChatRequest, type ChatResult, type LlmProvider } from './types'
import type { ProviderPreset } from './presets'

export interface OpenAiCompatibleConfig {
  presetId: string
  label: string
  baseUrl: string
  apiKey?: string
  model: string
  seedParam?: ProviderPreset['seedParam']
  supportsJsonMode: boolean
  /** En-têtes propres au fournisseur (ex. autorisation d'appel depuis un navigateur). */
  extraHeaders?: Record<string, string>
  /** Ne pas envoyer de température (refusée par certains modèles). */
  omitTemperature?: boolean
  /** Longueur de réponse à réserver quand la demande n'en fixe pas (un fournisseur qui en impose une trop courte par défaut). */
  maxOutputTokens?: number
  /** Plafond de jetons d'une demande, texte envoyé et réponse réservée compris (offre gratuite de Groq : 8 000). */
  tokenBudget?: number
  /** Paramètres propres au modèle, ajoutés à chaque demande (ex. `reasoning_effort`). */
  extraBody?: Record<string, unknown>
  /** Délai maximal d'une demande, en millisecondes (180 s par défaut : un modèle qui réfléchit peut dépasser 90 s sur un long regroupement). */
  timeoutMs?: number
  /** Délai maximal du test de connexion (tâche « ping »), 20 s par défaut. */
  pingTimeoutMs?: number
  /** Remplacé dans les tests. */
  fetchImpl?: typeof fetch
}

const DEFAULT_TIMEOUT_MS = 180_000
const LOCAL_TIMEOUT_MS = 30 * 60_000
const DEFAULT_PING_TIMEOUT_MS = 20_000

class TimeoutError extends Error {}

/**
 * Combine le signal d'annulation de l'appelant et un délai maximal.
 * `timedOut()` distingue ensuite un dépassement de délai d'une annulation.
 */
function withTimeout(signal: AbortSignal | undefined, ms: number): { signal: AbortSignal; timedOut: () => boolean; done: () => void } {
  const timer = new AbortController()
  let expired = false
  const id = setTimeout(() => {
    expired = true
    timer.abort(new TimeoutError('timeout'))
  }, ms)
  if (!signal) return { signal: timer.signal, timedOut: () => expired, done: () => clearTimeout(id) }
  const any = (AbortSignal as unknown as { any?: (signals: AbortSignal[]) => AbortSignal }).any
  if (typeof any === 'function') {
    return { signal: any.call(AbortSignal, [signal, timer.signal]), timedOut: () => expired && !signal.aborted, done: () => clearTimeout(id) }
  }
  // Relais pour les navigateurs sans AbortSignal.any.
  const relay = new AbortController()
  const forward = (s: AbortSignal) => () => relay.abort(s.reason)
  const onCaller = forward(signal)
  const onTimer = forward(timer.signal)
  if (signal.aborted) relay.abort(signal.reason)
  else signal.addEventListener('abort', onCaller, { once: true })
  timer.signal.addEventListener('abort', onTimer, { once: true })
  return {
    signal: relay.signal,
    timedOut: () => expired && !signal.aborted,
    done: () => {
      clearTimeout(id)
      signal.removeEventListener('abort', onCaller)
      timer.signal.removeEventListener('abort', onTimer)
    },
  }
}

/** Contenu de message : texte simple, ou tableau de blocs (raisonnement + texte). */
function extractContent(content: unknown): string {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  return content
    .map((part) => {
      if (part && typeof part === 'object' && 'type' in part) {
        const p = part as { type?: string; text?: string }
        if (p.type === 'text' && typeof p.text === 'string') return p.text
      }
      return ''
    })
    .join('\n')
    .trim()
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined
  const seconds = Number(value)
  if (Number.isFinite(seconds)) return seconds * 1000
  const date = Date.parse(value)
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : undefined
}

/**
 * Fournisseur générique pour tout service compatible OpenAI (/chat/completions) :
 * Mistral, Groq, Gemini, OpenRouter, Ollama, LM Studio…
 *
 * Certains fournisseurs refusent un paramètre optionnel (graine, mode JSON).
 * Dans ce cas on le retire une fois et on s'en souvient, plutôt que d'échouer.
 */
export function createOpenAiCompatibleProvider(config: OpenAiCompatibleConfig): LlmProvider {
  const fetchImpl = config.fetchImpl ?? globalThis.fetch.bind(globalThis)
  const base = config.baseUrl.replace(/\/+$/, '')
  let allowSeed = Boolean(config.seedParam)
  let allowJsonMode = config.supportsJsonMode

  async function call(req: ChatRequest): Promise<Response> {
    const body: Record<string, unknown> = {
      model: config.model,
      messages: [
        { role: 'system', content: req.system },
        { role: 'user', content: req.user },
      ],
    }
    if (!config.omitTemperature) body.temperature = req.temperature
    if (req.maxTokens) body.max_tokens = req.maxTokens
    else if (config.maxOutputTokens) {
      // Sous un plafond par demande, la réponse réservée est ce qui reste une fois le texte envoyé compté (environ 3 caractères par jeton).
      const sent = Math.ceil((req.system.length + req.user.length) / 3)
      body.max_tokens = config.tokenBudget ? Math.max(800, Math.min(config.maxOutputTokens, config.tokenBudget - sent - 150)) : config.maxOutputTokens
    }
    if (config.extraBody) Object.assign(body, config.extraBody)
    if (allowSeed && req.seed !== undefined && config.seedParam) body[config.seedParam] = req.seed
    if (allowJsonMode && req.json) body.response_format = { type: 'json_object' }
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...config.extraHeaders }
    if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`
    // Le test de connexion (tâche « ping ») doit échouer vite.
    // Sur l'ordinateur, pas de délai court : la confidentialité vaut l'attente (décision d'Arnaud, 14/10).
    const ms = req.task === 'ping' ? (config.pingTimeoutMs ?? DEFAULT_PING_TIMEOUT_MS) : (config.timeoutMs ?? (runsLocally(base) ? LOCAL_TIMEOUT_MS : DEFAULT_TIMEOUT_MS))
    const limit = withTimeout(req.signal, ms)
    try {
      const response = await fetchImpl(`${base}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: limit.signal,
      })
      // Le délai couvre aussi la lecture du corps : on le lit ici.
      const text = await response.text()
      const nullBody = response.status === 204 || response.status === 205 || response.status === 304
      return new Response(nullBody ? null : text, { status: response.status, statusText: response.statusText, headers: response.headers })
    } catch (e) {
      if (limit.timedOut()) {
        throw new ProviderError(
          runsLocally(base)
            ? `${config.label} n'a pas fini sa réponse dans le délai prévu : votre ordinateur est peut-être très occupé, ou le modèle trop gros pour lui. Reprenez l'analyse : ce qui a été fait est conservé.`
            : `${config.label} ne répond pas (délai dépassé). Vérifiez votre connexion ; un réseau d'entreprise peut bloquer ce service.`,
          {
          status: 0,
        })
      }
      if (req.signal?.aborted) throw e
      const local = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(base)
      throw new ProviderError(
        local
          ? `${config.label} ne répond pas sur cet ordinateur. Vérifiez qu'il est installé et ouvert.`
          : `Impossible de joindre ${config.label}. Vérifiez votre connexion à Internet. Si elle fonctionne, ${config.label} refuse peut-être les demandes venant d'un navigateur : choisissez un autre moteur.`,
        { status: 0 },
      )
    } finally {
      limit.done()
    }
  }

  return {
    label: `${config.label} · ${config.model}`,
    fingerprint: { presetId: config.presetId, model: config.model, baseUrl: base },
    async complete(req: ChatRequest): Promise<ChatResult> {
      let response = await call(req)
      if (response.status === 400 && (allowSeed || allowJsonMode)) {
        const detail = await response.clone().text()
        if (allowSeed && /seed/i.test(detail)) {
          allowSeed = false
          response = await call(req)
        } else if (allowJsonMode && /response_format|json/i.test(detail)) {
          allowJsonMode = false
          response = await call(req)
        }
      }
      if (!response.ok) {
        const detail = (await response.text()).slice(0, 400)
        const status = response.status
        const fatal = status === 401 || status === 403 || status === 404 || status === 413 || (status === 429 && /per day|daily|TPD|RPD/i.test(detail))
        const tierRefused = status === 403 && /tier|subscription|plan/i.test(detail)
        // Quota du jour épuisé : réessayer dans une minute ne sert à rien.
        const dailyQuota = status === 429 && /per day|daily|TPD|RPD/i.test(detail)
        const message = tierRefused
          ? `Votre offre chez ${config.label} ne donne pas accès au modèle « ${config.model} » (erreur 403) : choisissez un autre modèle.`
          : status === 413
            ? `${config.label} refuse une demande trop longue pour votre offre (erreur 413, limite de jetons par minute) : choisissez un modèle ou une offre aux limites plus larges.`
            : dailyQuota
              ? `${config.label} : le quota du jour de votre offre est épuisé (erreur 429). Reprenez demain : ce qui a été fait est conservé.`
              : status === 401 || status === 403
            ? `${config.label} refuse la clé d'accès (erreur ${status}) : vérifiez qu'elle a été copiée en entier, sans espace, et qu'elle est toujours active.`
            : status === 404
              ? `${config.label} ne trouve pas le modèle « ${config.model} » (erreur 404) : vérifiez le nom du modèle dans la configuration du moteur.`
              : status === 503
                ? `${config.label} est surchargé pour l'instant (erreur 503) : réessayez dans quelques minutes, ou choisissez un autre modèle.`
                : status === 429
                ? `${config.label} reçoit trop de demandes et les refuse pour l'instant (erreur 429). Réessayez dans une minute, ou baissez le nombre de demandes par minute (réglages avancés du moteur).`
                : `${config.label} a répondu par une erreur ${status}. Réessayez dans un instant ; si cela se répète, vérifiez la configuration du moteur.${detail ? ` Détail technique : ${detail}` : ''}`
        throw new ProviderError(message, {
          status,
          fatal,
          retryAfterMs: parseRetryAfter(response.headers.get('retry-after')),
        })
      }
      const data = (await response.json()) as {
        choices?: { message?: { content?: unknown }; finish_reason?: string }[]
        usage?: { prompt_tokens?: number; completion_tokens?: number }
      }
      // Réponse coupée par la limite de longueur du modèle : la redemander à l'identique donnerait la même coupure.
      if (data.choices?.[0]?.finish_reason === 'length' && !req.maxTokens)
        throw new ProviderError(
          `${config.label} a coupé sa réponse avant la fin : le modèle « ${config.model} » ne peut pas écrire une réponse aussi longue. Choisissez un modèle plus grand.`,
          { status: response.status, fatal: true, truncated: true },
        )
      const text = extractContent(data.choices?.[0]?.message?.content)
      if (!text)
        throw new ProviderError(`${config.label} n'a rien renvoyé. Réessayez dans un instant ; si cela se répète, essayez un autre modèle.`, {
          status: response.status,
        })
      return {
        text,
        usage: data.usage ? { inputTokens: data.usage.prompt_tokens ?? 0, outputTokens: data.usage.completion_tokens ?? 0 } : undefined,
      }
    },
  }
}
