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
  /** Remplacé dans les tests. */
  fetchImpl?: typeof fetch
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
 * Fournisseur générique pour toute API compatible OpenAI (/chat/completions) :
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
      temperature: req.temperature,
    }
    if (req.maxTokens) body.max_tokens = req.maxTokens
    if (allowSeed && req.seed !== undefined && config.seedParam) body[config.seedParam] = req.seed
    if (allowJsonMode && req.json) body.response_format = { type: 'json_object' }
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`
    try {
      return await fetchImpl(`${base}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: req.signal,
      })
    } catch (e) {
      if (req.signal?.aborted) throw e
      throw new ProviderError(
        `Impossible de joindre ${config.label}. Vérifiez votre connexion, l'adresse du service, ou que le fournisseur accepte les appels depuis un navigateur.`,
        { status: 0 },
      )
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
        const fatal = status === 401 || status === 403 || status === 404
        const message =
          status === 401 || status === 403
            ? `${config.label} refuse la clé API (erreur ${status}). Vérifiez-la dans les réglages.`
            : status === 404
              ? `${config.label} ne trouve pas le modèle « ${config.model} » (erreur 404).`
              : status === 429
                ? `${config.label} limite le nombre de requêtes (erreur 429).`
                : `${config.label} a répondu par une erreur ${status}. ${detail}`
        throw new ProviderError(message, {
          status,
          fatal,
          retryAfterMs: parseRetryAfter(response.headers.get('retry-after')),
        })
      }
      const data = (await response.json()) as {
        choices?: { message?: { content?: unknown } }[]
        usage?: { prompt_tokens?: number; completion_tokens?: number }
      }
      const text = extractContent(data.choices?.[0]?.message?.content)
      if (!text) throw new ProviderError(`${config.label} a renvoyé une réponse vide.`, { status: response.status })
      return {
        text,
        usage: data.usage
          ? { inputTokens: data.usage.prompt_tokens ?? 0, outputTokens: data.usage.completion_tokens ?? 0 }
          : undefined,
      }
    },
  }
}
