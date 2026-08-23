// Subspace-aware cohesion — the fix for faille n°1 (§2.5, §4.5).
//
// The v1 silhouette judged clusters on ALL variables, penalising precisely the
// off-subspace divergence that defines a projected cluster. Here we evaluate
// each persona ONLY on its own subspace S_g:
//
//   a_g = mean GRADED agreement of members with the persona's profile on S_g
//   b_g = mean STRICT agreement of NON-members with that same profile
//   cohesion_g = a_g − b_g       (range −1..1)
//
// The asymmetry is deliberate and is what lets coarse, ordinal (Likert) groups
// survive next to their neighbours:
//   - cohesion (a) is ordinal-tolerant: a member sitting one notch off the
//     profile (4 vs 5) still belongs — that is response noise, not dissent.
//   - separation (b) is strict: a neighbouring group at "4" must count as a
//     DIFFERENT group from the "5" profile, otherwise graded credit would make
//     every adjacent persona look identical and collapse the silhouette (which
//     is exactly why co-agreement candidates used to score artificially low and
//     the engine over-segmented into tiny crisp fragments).
// Divergence on irrelevant (off-subspace) variables is simply ignored.

import type { PersonaV2, SubspaceVar } from '@/types/persona-v2';
import type { PreparedData } from './prep';
import { bandMatch } from './agreement';

function gradedAgreementWithProfile(
  prep: PreparedData,
  i: number,
  subspace: SubspaceVar[]
): number {
  if (subspace.length === 0) return 0;
  let sum = 0;
  for (const sv of subspace) sum += bandMatch(prep.levels[i][sv.varIdx], sv.band);
  return sum / subspace.length;
}

function strictAgreementWithProfile(
  prep: PreparedData,
  i: number,
  subspace: SubspaceVar[]
): number {
  if (subspace.length === 0) return 0;
  let sum = 0;
  for (const sv of subspace) sum += prep.levels[i][sv.varIdx] === sv.band ? 1 : 0;
  return sum / subspace.length;
}

/** Mutates each persona's `cohesion`, returns the size-weighted mean. */
export function computeSubspaceCohesion(
  personas: PersonaV2[],
  prep: PreparedData,
  n: number
): number {
  if (personas.length === 0) return 0;

  for (const per of personas) {
    const memberSet = new Set(per.memberIndices);
    let aSum = 0;
    let bSum = 0;
    let bCount = 0;
    for (let i = 0; i < n; i++) {
      if (memberSet.has(i)) aSum += gradedAgreementWithProfile(prep, i, per.subspace);
      else {
        bSum += strictAgreementWithProfile(prep, i, per.subspace);
        bCount++;
      }
    }
    const a = per.memberIndices.length ? aSum / per.memberIndices.length : 0;
    const b = bCount ? bSum / bCount : 0;
    per.cohesion = parseFloat((a - b).toFixed(3));
  }

  const totalMembers = personas.reduce((s, p) => s + p.memberIndices.length, 0) || 1;
  const weighted = personas.reduce(
    (s, p) => s + p.cohesion * p.memberIndices.length,
    0
  );
  return parseFloat((weighted / totalMembers).toFixed(3));
}
