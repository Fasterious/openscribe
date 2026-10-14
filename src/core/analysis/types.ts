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
 * Catégorie d'une idée. Suggestion, question et constat (neutre) ne sont pas
 * des polarités : comptés à part, ils n'entrent jamais dans l'échelle d'avis.
 * La question (« comment toucher d'autres publics ? ») ouvre des pistes au-delà
 * des solutions proposées ; une question rhétorique qui juge garde sa polarité.
 */
export type IdeaCategory = 'positive' | 'negative' | 'neutral' | 'suggestion' | 'question'
export const IDEA_CATEGORIES: IdeaCategory[] = ['positive', 'negative', 'neutral', 'suggestion', 'question']

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
  /** Position de la citation dans le texte de la contribution (du premier au dernier mot cité). */
  span: { start: number; end: number }
  /** Citation coupée par « […] » : la position de chaque fragment. */
  parts?: { start: number; end: number }[]
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
  question: number
}

/**
 * Échelle d'avis sur un motif (indicateurs v4, d'après la revue du
 * `methodologue`) : unanime, large majorité (80 % ou plus), majorité (plus de
 * la moitié), pas de majorité (un camp devant, sous la moitié), avis partagés
 * (camps proches, ou autant de mitigés que le camp le plus fort), peu d'avis,
 * ou aucun avis (seulement des suggestions, questions, constats).
 */
export type Stance = 'unanimous' | 'consensus' | 'majority' | 'lean' | 'divided' | 'thin' | 'none'

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
  /** Une seule voix qui change de camp changerait l'étiquette : à lire avec prudence. */
  fragile?: boolean
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
  /** Propositions de personnes différentes qui vont en sens contraire (signalées par le moteur, vérifiées par le code). */
  opposed?: { a: string; b: string; about: string }[]
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
  /**
   * Masque les prénoms des particuliers cités dans les réponses, à l'affichage et dans les exports.
   * Désactivé par défaut : on restitue les verbatims tels quels, avec le moins de déformation possible.
   */
  maskNames: boolean
  temperature: number
  seed: number
  /** Méthode propre à une famille de modèles (voir `methods.ts`), fixée d'après le modèle choisi. Par défaut : la référence. */
  method?: 'reference' | 'ministral' | 'gemini' | 'groq'
  /** Mode Confidentiel : rien ne quitte cet ordinateur (seuls les moteurs locaux sont acceptés, par le code). */
  confidential?: boolean
  /** Remplacé par `method` (analyses enregistrées avant les profils de méthode). */
  lightModel?: boolean
}

export const DEFAULT_SETTINGS: AnalysisSettings = {
  language: 'fr',
  mode: 'free',
  grid: [],
  researchQuestion: '',
  polish: true,
  maskNames: false,
  temperature: 0,
  seed: 42,
}

/** Deux motifs ou plus fusionnés par la passe de consolidation : l'IA propose, le code applique et garde la trace. */
export interface Merge {
  title: string
  from: string[]
  reason: string
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
  /** Particuliers nommés dans les réponses (vérifiés dans le texte source), masqués si `maskNames`. */
  names?: string[]
  /** Fusions de la passe de consolidation, dans l'ordre. */
  merges?: Merge[]
  /** Idées dont le ton a été rejugé par rapport à l'objet de leur motif (personnes mitigées), avec leur catégorie d'origine. */
  retoned?: { id: string; from: IdeaCategory; to: IdeaCategory }[]
  /** Idées déplacées par la relecture des motifs (titres du motif de départ et d'arrivée). */
  moved?: { id: string; from: string; to: string }[]
  /** Vérification des renvois : phrases relues, corrigées, retirées. */
  support?: { checked: number; fixed: number; dropped: number; added?: number }
  /** Phrases écrites par le code pour qu'aucun camp d'avis compté ne manque à la synthèse de son motif. */
  campsAdded?: number
  /** Phrases retirées des synthèses parce qu'elles citaient un nombre introuvable. */
  removedSentences?: number
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
