import { computeMetrics, stanceOf } from './metrics'
import type { Group, Idea, Metrics } from './types'

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
  /** Échelle d'avis du motif (« Ce qui a marché », « Ce qui bloque ») : le mot qui accompagne le chiffre. */
  stance?: Group['metrics']['stance']
  fragile?: boolean
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
        stance: g.metrics.stance,
        // Le moteur ne reçoit pas « fragile » pour un « unanime » (sinon « unanimes, mais fragiles » dans le résumé).
        fragile: fragileShown(g.metrics),
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

/**
 * Une ligne lisible pour le modèle : « Réservation en ligne : 4 des 5 participants qui donnent un avis ».
 * `scale` (méthodes qui le demandent) : le mot de l'échelle d'avis accompagne le chiffre, et un camp
 * unanime se dit « les 24 participants », pas « 24 des 24 » (le modèle recopie la ligne).
 */
export function highlightLine(h: Highlight, kind: keyof Highlights, lang: 'fr' | 'en' = 'fr', scale = false): string {
  if (lang === 'en') {
    if (kind === 'proposals') return `${h.title}: ${h.people} ${h.people > 1 ? 'people' : 'person'} make proposals`
    if (kind === 'questions') return `${h.title}: ${h.people} ${h.people > 1 ? 'people' : 'person'} raise questions`
    if (kind === 'divided' && h.opposed) return `${h.title}: shared finding, opposite proposals on ${h.opposed.about}`
    if (kind === 'divided') return `${h.title}: opinions divided among ${h.of} people`
    return `${h.title}: ${h.people} of the ${h.of} people who give an opinion`
  }
  if (kind === 'proposals') return `${h.title} : ${h.people} personne${h.people > 1 ? 's' : ''} ${h.people > 1 ? 'font' : 'fait'} des propositions`
  if (kind === 'questions') return `${h.title} : ${h.people} personne${h.people > 1 ? 's' : ''} ${h.people > 1 ? 'se posent' : 'se pose'} des questions`
  if (kind === 'divided' && h.opposed) return `${h.title} : constat partagé, propositions opposées (${h.opposed.about})`
  if (kind === 'divided') return `${h.title} : avis partagés entre ${h.of} personnes`
  if (scale && (kind === 'strengths' || kind === 'blockers')) {
    const word = h.stance === 'unanimous' ? 'unanime' : h.stance === 'consensus' ? 'large majorité' : h.stance === 'majority' ? 'majorité' : ''
    // Le mot de l'échelle dit déjà « de ceux qui en parlent » : le chiffre reste nu (plume, passe 9 : « ceux qui en parlent » et « qui donnent un avis » dans la même phrase).
    const count = h.people === h.of ? `${h.of} sur ${h.of}` : `${h.people} sur ${h.of}`
    return `${h.title} : ${word ? `${word}${h.fragile ? ' (fragile)' : ''}, ` : ''}${count}`
  }
  return `${h.title} : ${h.people} des ${h.of} personnes qui donnent un avis`
}

const STANCE_WORD: Record<Metrics['stance'], string> = {
  unanimous: 'unanime',
  consensus: 'large majorité',
  majority: 'majorité',
  lean: 'pas de majorité',
  divided: 'avis partagés',
  thin: "peu d'avis",
  none: 'aucun avis',
}

/**
 * Étiquette à vérifier : elle tient à des avis comptés aussi dans un autre motif (codage en double, balayage).
 * Le code mesure l'écart, le lecteur tranche en relisant les citations (décision d'Arnaud, 17/10). Un repère,
 * une seule cause : une étiquette qui tient à une voix se dit « fragile » (voir `dividedFragile`).
 */
/** Les marques « à vérifier » sont-elles montrées pour cette analyse ? (Synthèse : oui ; Observatoire : non.) */
export const showsDoubts = (settings: { doubtMarks?: boolean }): boolean => settings.doubtMarks !== false

export function labelDoubt(g: Group, ideas: Map<string, Idea>): string | undefined {
  const own = g.ideaIds.filter((id) => !ideas.get(id)?.copyOf)
  const copies = g.ideaIds.length - own.length
  if (!copies) return undefined
  const without = computeMetrics(own.map((id) => ideas.get(id)!).filter(Boolean)).stance
  // Même quand l'étiquette serait plus nette sans les copies : un motif nourri de copies se relit (passe 13,
  // « École publique face au privé », 16 copies sur 34 avis, dont des positions opposées réunies).
  if (without === g.metrics.stance) return undefined
  return copies > 1
    ? `à vérifier : ${copies} de ces avis comptent aussi dans un autre thème ; sans eux, ce serait « ${STANCE_WORD[without]} »`
    : `à vérifier : 1 de ces avis compte aussi dans un autre thème ; sans lui, ce serait « ${STANCE_WORD[without]} »`
}

/** La conclusion d'une étiquette : un camp l'emporte (unanime, large majorité, majorité), pas de majorité, avis partagés. */
const conclusionOf = (s: Metrics['stance']) => (s === 'unanimous' || s === 'consensus' || s === 'majority' ? 'wins' : s)

/** La bascule d'une seule voix qui change la conclusion, s'il y en a une : la nouvelle répartition et son étiquette. */
export function conclusionMove(m: Metrics): { P: number; N: number; M: number; stance: Metrics['stance']; as: 'positive' | 'negative' | 'mixed' } | undefined {
  if (!m.fragile || m.stance === 'unanimous' || !m.majority) return undefined
  const P = m.positiveOnly.length
  const N = m.negativeOnly.length
  const M = m.mixed.length
  // Un avis contraire d'abord, puis un avis mitigé (`isFragile` teste les mêmes déplacements).
  const moves =
    P > N
      ? [
          { P: P - 1, N: N + 1, M, as: 'negative' as const },
          { P: P - 1, N, M: M + 1, as: 'mixed' as const },
        ]
      : [
          { P: P + 1, N: N - 1, M, as: 'positive' as const },
          { P, N: N - 1, M: M + 1, as: 'mixed' as const },
        ]
  return moves.map((x) => ({ ...x, stance: stanceOf(x.P, x.N, x.M) })).find((x) => conclusionOf(x.stance) !== conclusionOf(m.stance))
}

/**
 * « Fragile », tel que le lecteur le voit : une voix ferait changer la conclusion (un camp perdrait la majorité, ou
 * l'absence de majorité deviendrait des avis partagés), règle de `CLAUDE.md`. Passer de « large majorité » à
 * « majorité » ne change pas la conclusion : « 12 sur 14 » n'est pas fragile (remarque d'Arnaud, 18/10 ;
 * `methodologue`, D2). `metrics.fragile` reste le calcul brut (une voix change l'étiquette).
 */
export const fragileShown = (m: Metrics): boolean => !!conclusionMove(m)

/** Des avis partagés qu'une seule voix ferait basculer : « fragile », comme pour les autres étiquettes (`isFragile` ne les teste pas). */
export function dividedFragile(g: Group): boolean {
  if (g.metrics.stance !== 'divided') return false
  const P = g.metrics.positiveOnly.length
  const N = g.metrics.negativeOnly.length
  const M = g.metrics.mixed.length
  return [
    [P - 1, N + 1, M],
    [P + 1, N - 1, M],
    [P - 1, N, M + 1],
    [P, N - 1, M + 1],
  ]
    .filter(([p, n]) => p >= 0 && n >= 0)
    .some(([p, n, m]) => stanceOf(p, n, m) !== 'divided')
}
