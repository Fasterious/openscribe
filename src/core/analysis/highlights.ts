import type { Group, Idea } from './types'

/**
 * Ce qui a marché, ce qui bloque, ce qui divise, ce que proposent les
 * participants : des motifs classés par le code, sans un mot de l'IA. C'est la
 * partie la plus directement actionnable d'un rapport, et elle ne dépend
 * d'aucune rédaction.
 *
 * Les chiffres suivent exactement l'indicateur de consensus : même
 * dénominateur (les participants qui donnent un avis positif ou négatif sur le
 * motif), mitigés dans aucun camp. Un chiffre garde ainsi le même sens partout
 * dans le rapport.
 */

export interface Highlight {
  groupId: string
  title: string
  /** Participants du camp concerné (ou auteurs de propositions). */
  people: number
  /** Participants qui donnent un avis sur ce motif (ou qui s'y expriment, pour les propositions). */
  of: number
  /** Idées qui fondent la ligne : de quoi citer la preuve et, pour les propositions, les montrer. */
  ideaIds: string[]
  /** « Ce qui divise » : un constat partagé dont les pistes s'opposent (deux propositions et leur objet). */
  opposed?: { a: string; b: string; about: string }
}

export interface Highlights {
  strengths: Highlight[]
  blockers: Highlight[]
  divided: Highlight[]
  proposals: Highlight[]
  questions: Highlight[]
}

/** Avis exprimés sur un motif : positifs, négatifs et mitigés. Les suggestions et constats neutres n'en sont pas. */
const opinions = (g: Group) => g.metrics.positiveOnly.length + g.metrics.negativeOnly.length + g.metrics.mixed.length

/** Listes complètes : c'est à l'affichage de couper, en disant combien il en reste. */
export function highlights(groups: Group[], ideas?: Map<string, Idea>): Highlights {
  const ofCategory = (g: Group, cat: Idea['category']) => (ideas ? g.ideaIds.filter((id) => ideas.get(id)?.category === cat) : g.ideaIds)
  // « Ce qui a marché » et « ce qui bloque » : les motifs unanimes, en large majorité ou en majorité d'un côté, jamais « plutôt » ; la liste ne contredit pas la fiche du motif.
  const consensus = (side: 'positive' | 'negative') =>
    groups
      .filter((g) => (g.metrics.stance === 'unanimous' || g.metrics.stance === 'consensus' || g.metrics.stance === 'majority') && g.metrics.majority === side)
      .map((g) => ({
        groupId: g.id,
        title: g.title,
        people: (side === 'positive' ? g.metrics.positiveOnly : g.metrics.negativeOnly).length,
        of: opinions(g),
        ideaIds: ofCategory(g, side),
      }))
      // À nombre égal, le motif le plus net d'abord (4 sur 4 avant 4 sur 5).
      .sort((a, b) => b.people - a.people || b.people / b.of - a.people / a.of || a.title.localeCompare(b.title))
  // Ce qui divise : des avis qui s'opposent sur le motif, ou un constat partagé dont les pistes de solution s'opposent.
  const divided: Highlight[] = groups
    .filter((g) => g.metrics.stance === 'divided' || g.opposed?.length)
    .map((g) => ({
      groupId: g.id,
      title: g.title,
      people: opinions(g),
      of: opinions(g),
      ideaIds: g.opposed?.length ? [g.opposed[0].a, g.opposed[0].b] : g.ideaIds,
      opposed: g.opposed?.[0],
    }))
    .sort((a, b) => b.people - a.people || a.title.localeCompare(b.title))
  const nonPolar = (cat: 'suggestion' | 'question') =>
    groups
      .filter((g) => (g.metrics.participantsByCategory[cat] ?? 0) > 0)
      .map((g) => ({
        groupId: g.id,
        title: g.title,
        people: g.metrics.participantsByCategory[cat],
        of: g.metrics.participants,
        ideaIds: ofCategory(g, cat),
      }))
      .sort((a, b) => b.people - a.people || b.ideaIds.length - a.ideaIds.length || a.title.localeCompare(b.title))
  return { strengths: consensus('positive'), blockers: consensus('negative'), divided, proposals: nonPolar('suggestion'), questions: nonPolar('question') }
}

/** Une ligne lisible pour le modèle : « Réservation en ligne : 4 des 5 participants qui donnent un avis ». */
export function highlightLine(h: Highlight, kind: keyof Highlights, lang: 'fr' | 'en' = 'fr'): string {
  if (lang === 'en') {
    if (kind === 'proposals') return `${h.title}: ${h.people} ${h.people > 1 ? 'people' : 'person'} make proposals`
    if (kind === 'questions') return `${h.title}: ${h.people} ${h.people > 1 ? 'people' : 'person'} raise questions`
    if (kind === 'divided' && h.opposed) return `${h.title}: shared finding, opposite proposals on ${h.opposed.about}`
    if (kind === 'divided') return `${h.title}: opinions divided among ${h.of} people`
    return `${h.title}: ${h.people} of the ${h.of} people who give an opinion`
  }
  if (kind === 'proposals') return `${h.title} : ${h.people} participant${h.people > 1 ? 's' : ''} ${h.people > 1 ? 'font' : 'fait'} des propositions`
  if (kind === 'questions') return `${h.title} : ${h.people} participant${h.people > 1 ? 's' : ''} ${h.people > 1 ? 'se posent' : 'se pose'} des questions`
  if (kind === 'divided' && h.opposed) return `${h.title} : constat partagé, propositions opposées (${h.opposed.about})`
  if (kind === 'divided') return `${h.title} : avis partagés entre ${h.of} participants`
  return `${h.title} : ${h.people} des ${h.of} participants qui donnent un avis`
}
