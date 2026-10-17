import { ProviderError, type ChatRequest, type ChatResult, type LlmProvider } from './types'

export interface LimitOptions {
  /** Requêtes par minute autorisées (offres gratuites : souvent très bas). */
  requestsPerMinute: number
  /** Requêtes simultanées. */
  concurrency: number
  /** Nouvelles tentatives sur erreur temporaire (429, 5xx, réseau). */
  retries: number
  /** Prévenu avant chaque nouvelle tentative, pour l'afficher à l'utilisateur. */
  onRetry?: (info: { attempt: number; waitMs: number; error: Error }) => void
  /** Pour les tests : attente simulée. */
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>
  now?: () => number
}

export function abortableSleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason ?? new DOMException('Aborted', 'AbortError'))
    const t = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(t)
        reject(signal.reason ?? new DOMException('Aborted', 'AbortError'))
      },
      { once: true },
    )
  })
}

/**
 * Enveloppe un fournisseur : respecte le débit autorisé, limite le
 * parallélisme et réessaie les erreurs temporaires avec un délai croissant.
 * Les erreurs de configuration (clé refusée, modèle inconnu) remontent tout de suite.
 */
export function withLimits(provider: LlmProvider, options: LimitOptions): LlmProvider {
  const sleep = options.sleep ?? abortableSleep
  const now = options.now ?? (() => Date.now())
  const minInterval = 60_000 / Math.max(0.1, options.requestsPerMinute)
  let nextSlot = 0
  let active = 0
  const waiting: (() => void)[] = []

  async function acquire() {
    if (active >= options.concurrency) await new Promise<void>((r) => waiting.push(r))
    active++
  }
  function release() {
    active--
    waiting.shift()?.()
  }
  async function pace(signal?: AbortSignal) {
    const t = now()
    const wait = Math.max(0, nextSlot - t)
    nextSlot = Math.max(t, nextSlot) + minInterval
    if (wait > 0) await sleep(wait, signal)
  }

  return {
    label: provider.label,
    fingerprint: provider.fingerprint,
    async complete(req: ChatRequest): Promise<ChatResult> {
      await acquire()
      try {
        let attempt = 0
        for (;;) {
          await pace(req.signal)
          try {
            return await provider.complete(req)
          } catch (e) {
            const err = e as ProviderError
            const retryable =
              err instanceof ProviderError &&
              !err.fatal &&
              (err.status === 0 || err.status === 429 || (err.status ?? 0) >= 500)
            if (!retryable || attempt >= options.retries || req.signal?.aborted) throw e
            const backoff = err.retryAfterMs ?? Math.min(60_000, 2_000 * 2 ** attempt)
            attempt++
            options.onRetry?.({ attempt, waitMs: backoff, error: err })
            await sleep(backoff, req.signal)
          }
        }
      } finally {
        release()
      }
    },
  }
}
