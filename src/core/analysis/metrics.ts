import type { CategoryCounts, Idea, Metrics, MinorityPosition } from './types'

/**
 * Indicateurs calculés par le code. Règles :
 *
 * 1. On compte des PERSONNES, pas seulement des mentions : une personne qui
 *    écrit huit fois la même critique pèse une voix dans le consensus.
 * 2. La polarité d'une personne est décidée une seule fois par périmètre :
 *    uniquement positive, uniquement négative, ou mitigée (les deux).
 * 3. Les personnes mitigées comptent au dénominateur mais dans aucun camp :
 *    elles ne sont pas négatives (ni positives), et le font savoir.
 * 4. Constat, suggestion et question ne sont pas des polarités : comptés à part.
 * 5. Échelle d'avis (v2, validée avec le `methodologue`), sur P positifs seuls,
 *    N négatifs seuls, M mitigés, T = P + N + M, D le camp dominant :
 *    - T < 4 : peu d'avis ;
 *    - M ≥ le camp le plus fort : avis mitigés ;
 *    - P ≥ 2, N ≥ 2 et le plus petit camp vaut au moins la moitié du plus
 *      grand, ou P = N : avis partagés ;
 *    - sinon D/T ≥ 0,8 : consensus ; D/T > 0,5 : majoritairement ; sinon : plutôt.
 *    Les chiffres sont toujours affichés à côté de l'étiquette.
 * 6. Les indicateurs d'un groupe ou d'un thème sont calculés sur l'union de
 *    ses idées, jamais en additionnant ceux de ses sous-groupes.
 * 7. Une position minoritaire est un camp d'au moins 2 personnes, représentant
 *    au plus 25 % des personnes polarisées, et sans personne mitigée en son sein.
 */

export const METRICS_VERSION = 4
export const THIN_THRESHOLD = 4
export const CONSENSUS_THRESHOLD = 0.8
export const MAJORITY_THRESHOLD = 0.5
/** Avis partagés : le plus petit camp vaut au moins cette part du plus grand. */
export const DIVIDED_RATIO = 0.5
export const MINORITY_MAX_SHARE = 0.25
export const MINORITY_MIN_SIZE = 2

const emptyCounts = (): CategoryCounts => ({ positive: 0, negative: 0, neutral: 0, suggestion: 0, question: 0 })

export function computeMetrics(ideas: Idea[]): Metrics {
  // Une idée ne compte qu'une fois, même si elle est référencée deux fois.
  const unique = [...new Map(ideas.map((i) => [i.id, i])).values()]
  const mentionsByCategory = emptyCounts()
  const byCategory: Record<keyof CategoryCounts, Set<string>> = {
    positive: new Set(),
    negative: new Set(),
    neutral: new Set(),
    suggestion: new Set(),
    question: new Set(),
  }
  const all = new Set<string>()
  for (const idea of unique) {
    mentionsByCategory[idea.category]++
    byCategory[idea.category].add(idea.participantId)
    all.add(idea.participantId)
  }
  const P = byCategory.positive
  const N = byCategory.negative
  const mixed = [...P].filter((p) => N.has(p))
  const positiveOnly = [...P].filter((p) => !N.has(p))
  const negativeOnly = [...N].filter((p) => !P.has(p))
  const polarised = positiveOnly.length + negativeOnly.length + mixed.length

  let consensusRate: number | null = null
  let majority: Metrics['majority'] = null
  if (polarised > 0) {
    const top = Math.max(positiveOnly.length, negativeOnly.length)
    consensusRate = top / polarised
    if (positiveOnly.length !== negativeOnly.length) {
      majority = positiveOnly.length > negativeOnly.length ? 'positive' : 'negative'
    }
  }

  const stance = stanceOf(positiveOnly.length, negativeOnly.length, mixed.length)

  const participantsByCategory: CategoryCounts = {
    positive: P.size,
    negative: N.size,
    neutral: byCategory.neutral.size,
    suggestion: byCategory.suggestion.size,
    question: byCategory.question.size,
  }

  return {
    mentions: unique.length,
    participants: all.size,
    participantIds: sortIds([...all]),
    mentionsByCategory,
    participantsByCategory,
    positiveOnly: sortIds(positiveOnly),
    negativeOnly: sortIds(negativeOnly),
    mixed: sortIds(mixed),
    consensusRate,
    majority,
    stance,
    fragile: isFragile(positiveOnly.length, negativeOnly.length, mixed.length),
    // Pas de « contre-courant » sans courant : quand les avis sont partagés ou mitigés, aucune minorité.
    minority: stance === 'divided' ? null : findMinority(unique, positiveOnly, negativeOnly, mixed, polarised),
  }
}

/** L'échelle d'avis d'un motif (règle 5). */
export function stanceOf(P: number, N: number, M: number): Metrics['stance'] {
  const T = P + N + M
  if (T === 0) return 'none'
  if (T < THIN_THRESHOLD) return 'thin'
  // Autant de personnes partagées que de camp le plus fort, ou deux camps proches : les avis sont partagés.
  if (M >= Math.max(P, N)) return 'divided'
  if (P === N || (P >= 2 && N >= 2 && Math.min(P, N) / Math.max(P, N) >= DIVIDED_RATIO)) return 'divided'
  const D = Math.max(P, N)
  if (D === T) return 'unanimous'
  const share = D / T
  if (share >= CONSENSUS_THRESHOLD) return 'consensus'
  if (share > MAJORITY_THRESHOLD) return 'majority'
  return 'lean'
}

/**
 * Sur de petits effectifs, une seule voix peut faire basculer l'étiquette
 * (« 4 sur 5 » large majorité, « 3 sur 5 » majorité). Le code le vérifie en
 * faisant passer une personne du camp dominant à l'autre camp, ou parmi les
 * mitigés : si l'étiquette change, elle est fragile. Aucun tirage aléatoire
 * n'est supposé, contrairement à un intervalle de confiance.
 */
export function isFragile(P: number, N: number, M: number): boolean {
  const label = stanceOf(P, N, M)
  if (label === 'none' || label === 'thin' || label === 'divided' || P === N) return false
  const moved = P > N ? [stanceOf(P - 1, N + 1, M), stanceOf(P - 1, N, M + 1)] : [stanceOf(P + 1, N - 1, M), stanceOf(P, N - 1, M + 1)]
  return moved.some((x) => x !== label)
}

function findMinority(ideas: Idea[], positiveOnly: string[], negativeOnly: string[], mixed: string[], polarised: number): MinorityPosition | null {
  if (polarised < THIN_THRESHOLD) return null
  const candidates: { side: 'positive' | 'negative'; ids: string[] }[] = [
    { side: 'positive', ids: positiveOnly },
    { side: 'negative', ids: negativeOnly },
  ]
  const mixedSet = new Set(mixed)
  for (const { side, ids } of candidates) {
    const other = side === 'positive' ? negativeOnly : positiveOnly
    if (ids.length >= MINORITY_MIN_SIZE && ids.length / polarised <= MINORITY_MAX_SHARE && ids.length < other.length && ids.every((p) => !mixedSet.has(p))) {
      const members = new Set(ids)
      return {
        side,
        participantIds: sortIds(ids),
        ideaIds: ideas.filter((i) => i.category === side && members.has(i.participantId)).map((i) => i.id),
      }
    }
  }
  return null
}

/** Trie P2 avant P10. */
export function sortIds(ids: string[]): string[] {
  return [...ids].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}

/**
 * Un rapport produit avec une version antérieure des indicateurs (l'exemple
 * livré, une étude ancienne) est recalculé à l'affichage : les chiffres et les
 * étiquettes suivent toujours l'échelle en vigueur. Seuls les comptages
 * changent ; les idées, motifs et synthèses restent ceux de l'analyse.
 */
export function withCurrentMetrics<
  T extends { ideas: Idea[]; groups: { ideaIds: string[]; metrics: Metrics }[]; themes: { groupIds: string[]; metrics: Metrics }[] },
>(state: T): T {
  // Toujours recalculé : les chiffres sont déterministes, et une règle d'affichage corrigée vaut aussitôt pour les rapports déjà enregistrés.
  const byId = new Map(state.ideas.map((i) => [i.id, i]))
  const groups = state.groups.map((g) => ({ ...g, metrics: computeMetrics(g.ideaIds.map((id) => byId.get(id)!).filter(Boolean)) }))
  const groupIdeas = new Map(groups.map((g, k) => [(state.groups[k] as { id?: string }).id, g.ideaIds]))
  const themes = state.themes.map((t) => ({
    ...t,
    metrics: computeMetrics(
      t.groupIds
        .flatMap((id) => groupIdeas.get(id) ?? [])
        .map((id) => byId.get(id)!)
        .filter(Boolean),
    ),
  }))
  return { ...state, groups, themes }
}
