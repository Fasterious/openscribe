// Ordinal-tolerant matching — keep the "gold" of the v1 ±1 co-agreement.
//
// Hard banding (low/mid/high) throws away the ordinal adjacency of Likert
// scales: a respondent who answers 3 ("neutre") is treated as totally unlike a
// group that answers 4 ("haut"), even though they are one step apart. That
// brittleness is exactly what made the surprise-on-hard-bands approach split
// the (clean, ±1-built) demo groups.
//
// We keep hard bands for the surprise NULL MODEL (clean disjoint marginals), but
// use a graded, adjacency-aware agreement everywhere a respondent is COMPARED to
// a profile (assignment, cohesion, consolidation): exact band = 1, adjacent band
// = 0.5, else 0. This is the v1 gold reintroduced into the v2 framework.

import type { Predicate } from '@/types/persona-v2';
import type { PreparedData } from './prep';

/** 1 if the level equals the band, 0.5 if adjacent, else 0. */
export function bandMatch(level: number, band: number): number {
  const d = Math.abs(level - band);
  return d === 0 ? 1 : d === 1 ? 0.5 : 0;
}

/** Mean tolerant agreement of respondent i with a profile (list of predicates). */
export function gradedAgreement(
  prep: PreparedData,
  i: number,
  predicates: Predicate[]
): number {
  if (predicates.length === 0) return 0;
  let sum = 0;
  for (const pr of predicates) sum += bandMatch(prep.levels[i][pr.varIdx], pr.band);
  return sum / predicates.length;
}
