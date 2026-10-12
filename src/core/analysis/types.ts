/**
 * Le moteur de synthèse : des contributions aux idées atomiques, des idées aux
 * groupes, des groupes aux thèmes, des thèmes au rapport.
 *
 * Partage des rôles, non négociable :
 * - l'IA lit, découpe, nomme et rédige ;
 * - le code vérifie les citations, range, compte et calcule les indicateurs.
 * Aucun chiffre du rapport n'est écrit par l'IA sans avoir été calculé par le code.
 */

/**
 * Catégorie d'une idée. La suggestion n'est pas une polarité : elle est
 * comptée à part et n'entre jamais dans le calcul d'un consensus.
 */
export type IdeaCategory = 'positive' | 'negative' | 'neutral' | 'suggestion'
export const IDEA_CATEGORIES: IdeaCategory[] = ['positive', 'negative', 'neutral', 'suggestion']

export interface Idea {
  /** I0001, I0002… attribué par le code dans l'ordre du corpus. */
  id: string
  participantId: string
  contributionId: string
  /** L'idée en 2 à 6 mots, formulée par l'IA. */
  label: string
  /** Citation exacte, vérifiée dans le texte source. */
  verbatim: string
  category: IdeaCategory
  /** Position de la citation dans le texte de la contribution. */
  span: { start: number; end: number }
  /** Citation retrouvée avec de légers écarts (ponctuation, accents) plutôt qu'à l'identique. */
  approximate: boolean
}

/** Une citation proposée par l'IA que le code n'a pas retrouvée dans la source. */
export interface RejectedIdea {
  participantId: string
  label: string
  verbatim: string
  reason: string
}

export interface CategoryCounts {
  positive: number
  negative: number
  neutral: number
  suggestion: number
}

export type Stance = 'consensus' | 'divided' | 'thin' | 'none'

/** Indicateurs calculés par le code, jamais par l'IA. */
export interface Metrics {
  /** Nombre de mentions (idées). */
  mentions: number
  /** Nombre de personnes distinctes. */
  participants: number
  participantIds: string[]
  /** Mentions par catégorie. */
  mentionsByCategory: CategoryCounts
  /** Personnes ayant exprimé au moins une fois chaque catégorie. */
  participantsByCategory: CategoryCounts
  /** Personnes uniquement positives, uniquement négatives, ou les deux. */
  positiveOnly: string[]
  negativeOnly: string[]
  mixed: string[]
  /** Part du plus grand camp parmi les personnes ayant exprimé une polarité (0 à 1). */
  consensusRate: number | null
  /** Camp majoritaire, s'il y en a un. */
  majority: 'positive' | 'negative' | null
  stance: Stance
  /** Positions tenues par peu de personnes mais de façon constante. */
  minority: MinorityPosition | null
}

export interface MinorityPosition {
  side: 'positive' | 'negative'
  participantIds: string[]
  /** Idées qui fondent cette position minoritaire : l'affirmation porte sa preuve. */
  ideaIds: string[]
}

export interface Group {
  id: string
  title: string
  ideaIds: string[]
  summary: string
  metrics: Metrics
  /** Nombres de la synthèse qui ne correspondent à aucun chiffre calculé ni cité. */
  unverified?: string[]
}

export interface Theme {
  id: string
  title: string
  groupIds: string[]
  summary: string
  metrics: Metrics
  unverified?: string[]
}

export interface AnalysisSettings {
  /** Langue de rédaction des libellés et des synthèses. */
  language: 'fr' | 'en'
  /** Mode libre (thèmes émergents) ou grille imposée. */
  mode: 'free' | 'grid'
  /** Pour le mode grille : les catégories imposées. */
  grid: string[]
  /** Objectif de l'étude, donné à l'IA comme contexte. */
  researchQuestion: string
  /** Relecture de la langue des synthèses (fluidité, tournures naturelles), sens et citations contrôlés par le code. */
  polish: boolean
  temperature: number
  seed: number
}

export const DEFAULT_SETTINGS: AnalysisSettings = {
  language: 'fr',
  mode: 'free',
  grid: [],
  researchQuestion: '',
  polish: true,
  temperature: 0,
  seed: 42,
}

export type StepId = 'extract' | 'group' | 'summarize' | 'themes' | 'report' | 'polish'

export interface StepStatus {
  id: StepId
  state: 'pending' | 'running' | 'done' | 'error'
  done: number
  total: number
  message?: string
}

/** L'état complet d'une analyse : sérialisable, pour reprendre là où on s'est arrêté. */
export interface AnalysisState {
  id: string
  createdAt: string
  updatedAt: string
  settings: AnalysisSettings
  /** Moteur utilisé : fournisseur, modèle, adresse. */
  engine: { presetId: string; model: string; baseUrl: string }
  /** Empreinte du corpus analysé : si le corpus change, l'analyse est obsolète. */
  corpusHash: string
  /** Participants dont l'extraction est terminée (reprise). */
  extractedParticipants: string[]
  ideas: Idea[]
  rejected: RejectedIdea[]
  groups: Group[]
  themes: Theme[]
  globalSummary: string
  globalUnverified?: string[]
  /** Bilan de la relecture : textes relus, modifiés, et réécritures refusées par le contrôle. */
  polish?: { checked: number; changed: number; refused: number }
  steps: StepStatus[]
  /** Nombre d'appels au modèle, servis depuis le cache ou non. */
  calls: { total: number; cached: number; inputTokens: number; outputTokens: number }
  /** Réponses du modèle utilisées (clés du cache), pour un export rejouable. */
  cacheKeys: string[]
  status: 'idle' | 'running' | 'done' | 'error' | 'cancelled'
  error?: string
}
