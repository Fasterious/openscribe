/**
 * Le corpus : le format commun à tous les modules.
 *
 * Un corpus est une liste de contributions humaines, chacune rattachée à une
 * personne et à sa source. Un questionnaire, une transcription d'entretien ou
 * des notes d'atelier deviennent tous un corpus : c'est ce qui permet à un
 * module de produire des données (Observation) et à un autre de les analyser
 * (Synthèse) sans se connaître.
 *
 * Règle d'or : on ne perd jamais le lien entre une idée analysée, le texte
 * exact qui la porte et la personne qui l'a exprimée.
 */

export const CORPUS_FORMAT_VERSION = 1

export type SourceKind = 'survey' | 'transcript' | 'notes'

export interface Source {
  id: string
  kind: SourceKind
  /** Nom lisible : nom du fichier importé, titre de l'entretien… */
  name: string
  importedAt: string
}

export interface Participant {
  /** Identifiant pseudonyme et stable : P1, P2… Jamais un nom réel par défaut. */
  id: string
  /** Étiquette affichée. Peut être un prénom si l'utilisateur le choisit. */
  label: string
  /** Attributs de segmentation (profil, âge, rôle…), issus des colonnes fermées. */
  attributes: Record<string, string>
}

/** Position d'une contribution dans un enregistrement, en secondes. */
export interface TimeSpan {
  start: number
  end: number
}

export interface Contribution {
  id: string
  participantId: string
  sourceId: string
  /** La question posée (questionnaire, guide d'entretien), si elle existe. */
  prompt?: string
  /** Le texte exact, tel que la personne l'a exprimé. Jamais réécrit. */
  text: string
  /** Pour une transcription : où se trouve ce passage dans l'enregistrement. */
  time?: TimeSpan
}

export interface Corpus {
  formatVersion: typeof CORPUS_FORMAT_VERSION
  sources: Source[]
  participants: Participant[]
  contributions: Contribution[]
}

export function emptyCorpus(): Corpus {
  return { formatVersion: CORPUS_FORMAT_VERSION, sources: [], participants: [], contributions: [] }
}

/** Contributions d'une personne, dans l'ordre du corpus. */
export function contributionsOf(corpus: Corpus, participantId: string): Contribution[] {
  return corpus.contributions.filter((c) => c.participantId === participantId)
}

/**
 * Questions distinctes des questionnaires, dans leur ordre d'apparition. Les
 * relances d'un animateur dans un entretien ne sont pas des questions à choisir :
 * elles servent seulement de contexte à la réponse qui suit.
 */
export function promptsOf(corpus: Corpus): string[] {
  const surveys = new Set(corpus.sources.filter((s) => s.kind === 'survey').map((s) => s.id))
  const seen = new Set<string>()
  const out: string[] = []
  for (const c of corpus.contributions) {
    if (c.prompt && surveys.has(c.sourceId) && !seen.has(c.prompt)) {
      seen.add(c.prompt)
      out.push(c.prompt)
    }
  }
  return out
}

/** Participants ayant au moins une contribution non vide. */
export function activeParticipants(corpus: Corpus): Participant[] {
  const withText = new Set(
    corpus.contributions.filter((c) => c.text.trim().length > 0).map((c) => c.participantId),
  )
  return corpus.participants.filter((p) => withText.has(p.id))
}

/** Fusionne un corpus importé dans un corpus existant (nouvelle source). */
export function mergeCorpus(base: Corpus, added: Corpus): Corpus {
  return {
    formatVersion: CORPUS_FORMAT_VERSION,
    sources: [...base.sources, ...added.sources],
    participants: [...base.participants, ...added.participants],
    contributions: [...base.contributions, ...added.contributions],
  }
}

/** Renomme une source : « Entretien du 18 mai — Julie » se lit mieux qu'un nom de fichier. */
export function renameSource(corpus: Corpus, sourceId: string, name: string): Corpus {
  const clean = name.trim()
  if (!clean) return corpus
  return { ...corpus, sources: corpus.sources.map((s) => (s.id === sourceId ? { ...s, name: clean } : s)) }
}

/** Retire une source, ses contributions, et les participants qui n'ont plus rien dit ailleurs. */
export function removeSource(corpus: Corpus, sourceId: string): Corpus {
  const contributions = corpus.contributions.filter((c) => c.sourceId !== sourceId)
  const still = new Set(contributions.map((c) => c.participantId))
  return {
    ...corpus,
    sources: corpus.sources.filter((s) => s.id !== sourceId),
    participants: corpus.participants.filter((p) => still.has(p.id)),
    contributions,
  }
}
