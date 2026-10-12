import type { CategoryCounts, Idea, Metrics, MinorityPosition } from './types'

/**
 * Indicateurs calculés par le code. Règles :
 *
 * 1. On compte des PERSONNES, pas seulement des mentions : une personne qui
 *    écrit huit fois la même critique pèse une voix dans le consensus.
 * 2. La polarité d'une personne est décidée une seule fois par périmètre :
 *    uniquement positive, uniquement négative, ou mitigée (les deux).
 * 3. Les personnes mitigées comptent au dénominateur du consensus mais dans
 *    aucun camp : elles le font baisser sans grossir un camp.
 * 4. Neutre et suggestion ne sont pas des polarités : ils sont comptés à part.
 * 5. En dessous de 4 personnes ayant exprimé une polarité, on n'annonce pas
 *    de consensus (« peu d'avis »).
 * 6. Les indicateurs d'un groupe ou d'un thème sont calculés sur l'union de
 *    ses idées, jamais en additionnant ceux de ses sous-groupes.
 * 7. Une position minoritaire est un camp d'au moins 2 personnes, représentant
 *    au plus 25 % des personnes polarisées, et sans personne mitigée en son sein.
 */

export const METRICS_VERSION = 1
export const THIN_THRESHOLD = 4
export const CONSENSUS_THRESHOLD = 0.7
export const MINORITY_MAX_SHARE = 0.25
export const MINORITY_MIN_SIZE = 2

const emptyCounts = (): CategoryCounts => ({ positive: 0, negative: 0, neutral: 0, suggestion: 0 })

export function computeMetrics(ideas: Idea[]): Metrics {
  // Une idée ne compte qu'une fois, même si elle est référencée deux fois.
  const unique = [...new Map(ideas.map((i) => [i.id, i])).values()]
  const mentionsByCategory = emptyCounts()
  const byCategory: Record<keyof CategoryCounts, Set<string>> = {
    positive: new Set(),
    negative: new Set(),
    neutral: new Set(),
    suggestion: new Set(),
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

  let stance: Metrics['stance'] = 'none'
  if (polarised > 0 && polarised < THIN_THRESHOLD) stance = 'thin'
  else if (consensusRate !== null) stance = consensusRate >= CONSENSUS_THRESHOLD && majority ? 'consensus' : 'divided'

  const participantsByCategory: CategoryCounts = {
    positive: P.size,
    negative: N.size,
    neutral: byCategory.neutral.size,
    suggestion: byCategory.suggestion.size,
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
    minority: findMinority(unique, positiveOnly, negativeOnly, mixed, polarised),
  }
}

function findMinority(
  ideas: Idea[],
  positiveOnly: string[],
  negativeOnly: string[],
  mixed: string[],
  polarised: number,
): MinorityPosition | null {
  if (polarised < THIN_THRESHOLD) return null
  const candidates: { side: 'positive' | 'negative'; ids: string[] }[] = [
    { side: 'positive', ids: positiveOnly },
    { side: 'negative', ids: negativeOnly },
  ]
  const mixedSet = new Set(mixed)
  for (const { side, ids } of candidates) {
    const other = side === 'positive' ? negativeOnly : positiveOnly
    if (
      ids.length >= MINORITY_MIN_SIZE &&
      ids.length / polarised <= MINORITY_MAX_SHARE &&
      ids.length < other.length &&
      ids.every((p) => !mixedSet.has(p))
    ) {
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
