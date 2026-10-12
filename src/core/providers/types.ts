/**
 * Moteurs interchangeables.
 *
 * Chaque capacité (modèle de langage aujourd'hui, transcription demain) est
 * décrite par un contrat. L'utilisateur choisit son fournisseur, apporte sa
 * clé, et peut en changer sans perdre ses données. Le reste du code ne connaît
 * que le contrat, jamais un fournisseur particulier.
 */

export interface ChatRequest {
  /** Identifiant de la tâche (utile aux journaux et au moteur de simulation). */
  task: string
  system: string
  user: string
  /** Demande une réponse JSON. */
  json: boolean
  temperature: number
  seed?: number
  maxTokens?: number
  signal?: AbortSignal
}

export interface ChatUsage {
  inputTokens: number
  outputTokens: number
}

export interface ChatResult {
  text: string
  usage?: ChatUsage
}

export interface LlmProvider {
  /** Décrit le moteur de façon stable : sert à l'empreinte de reproductibilité. */
  readonly fingerprint: { presetId: string; model: string; baseUrl: string }
  readonly label: string
  complete(req: ChatRequest): Promise<ChatResult>
}

export class ProviderError extends Error {
  readonly status?: number
  readonly retryAfterMs?: number
  /** Faute de configuration (clé invalide, modèle inconnu) : inutile de réessayer. */
  readonly fatal: boolean
  constructor(message: string, opts: { status?: number; retryAfterMs?: number; fatal?: boolean } = {}) {
    super(message)
    this.name = 'ProviderError'
    this.status = opts.status
    this.retryAfterMs = opts.retryAfterMs
    this.fatal = opts.fatal ?? false
  }
}
