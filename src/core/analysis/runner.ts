import type { z } from 'zod'
import { sha256, stableStringify } from '../ids'
import type { LlmProvider } from '../providers/types'
import { parseJson, JsonShapeError } from './json'
import { PROMPT_VERSION } from './prompts'
import type { AnalysisSettings } from './types'

/**
 * Cache des réponses du modèle.
 *
 * C'est ce qui rend une analyse reproductible mot pour mot : la même consigne,
 * envoyée au même modèle avec les mêmes réglages, reçoit toujours la réponse
 * déjà obtenue. Relancer une analyse inchangée ne coûte donc rien et donne
 * exactement le même résultat.
 */
export interface ResponseCache {
  get(key: string): Promise<string | undefined>
  set(key: string, value: string): Promise<void>
}

export class MemoryCache implements ResponseCache {
  private map = new Map<string, string>()
  async get(key: string) {
    return this.map.get(key)
  }
  async set(key: string, value: string) {
    this.map.set(key, value)
  }
}

export interface CallStats {
  total: number
  cached: number
  inputTokens: number
  outputTokens: number
}

export interface PromptSpec {
  task: string
  system: string
  user: string
  json: boolean
}

export class LlmRunner {
  readonly stats: CallStats = { total: 0, cached: 0, inputTokens: 0, outputTokens: 0 }
  /** Clés de cache utilisées : permettent d'exporter un projet avec ses réponses, pour le rejouer à l'identique ailleurs. */
  readonly usedKeys = new Set<string>()
  private readonly provider: LlmProvider
  private readonly cache: ResponseCache
  private readonly settings: AnalysisSettings
  private readonly signal?: AbortSignal

  constructor(provider: LlmProvider, cache: ResponseCache, settings: AnalysisSettings, signal?: AbortSignal) {
    this.provider = provider
    this.cache = cache
    this.settings = settings
    this.signal = signal
  }

  private async key(spec: PromptSpec): Promise<string> {
    return sha256(
      stableStringify({
        v: PROMPT_VERSION,
        engine: this.provider.fingerprint,
        temperature: this.settings.temperature,
        seed: this.settings.seed,
        task: spec.task,
        system: spec.system,
        user: spec.user,
      }),
    )
  }

  async raw(spec: PromptSpec): Promise<string> {
    const key = await this.key(spec)
    this.usedKeys.add(key)
    this.stats.total++
    const hit = await this.cache.get(key)
    if (hit !== undefined) {
      this.stats.cached++
      return hit
    }
    const result = await this.provider.complete({
      ...spec,
      temperature: this.settings.temperature,
      seed: this.settings.seed,
      signal: this.signal,
    })
    if (result.usage) {
      this.stats.inputTokens += result.usage.inputTokens
      this.stats.outputTokens += result.usage.outputTokens
    }
    return result.text
  }

  /**
   * Appelle le modèle et vérifie la forme de la réponse. Une réponse mal
   * formée est redemandée deux fois (sans passer par le cache) : sur 378 réponses,
   * deux ratés de suite ont arrêté une synthèse entière (Gemini, 1/11/2026).
   * Seule une réponse valide est mise en cache.
   */
  async json<T>(spec: PromptSpec, schema: z.ZodType<T>): Promise<T> {
    const key = await this.key(spec)
    const first = await this.raw(spec)
    try {
      const value = parseJson(first, schema)
      await this.cache.set(key, first)
      return value
    } catch (e) {
      if (!(e instanceof JsonShapeError)) throw e
      let reason = e.message
      for (let attempt = 1; ; attempt++) {
        const retry = await this.provider.complete({
          ...spec,
          user: `${spec.user}\n\nATTENTION : ta réponse précédente était invalide (${reason}). Réponds uniquement avec le JSON demandé.`,
          temperature: this.settings.temperature,
          seed: this.settings.seed,
          signal: this.signal,
        })
        this.stats.total++
        try {
          const value = parseJson(retry.text, schema)
          await this.cache.set(key, retry.text)
          return value
        } catch (again) {
          if (!(again instanceof JsonShapeError) || attempt === 2) throw again
          reason = again.message
        }
      }
    }
  }
}
