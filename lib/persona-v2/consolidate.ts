// Subspace-aware model selection by agglomerative consolidation (§4.5).
//
// The miner happily returns several surprising sub-patterns of the SAME true
// group (different 4–7 member subsets of a 10-person persona). Greedy selection
// then over-segments. Rather than imposing k, we let the subspace-aware judge
// decide HOW MANY personas: starting from the selected seeds, we repeatedly
// merge the pair whose merge most improves (or least harms) the global
// subspace silhouette, stopping when no merge helps. Two seeds from the same
// true group merge into a stronger, more cohesive profile; seeds from different
// groups don't (the merged profile collapses), so they stay apart.
//
// This is the honest auto-k: the number of personas falls out of the data via a
// metric aligned with the method, not a full-space silhouette fighting it.

import type { MinedPattern, PersonaV2Config, Predicate, PersonaRespondent } from '@/types/persona-v2';
import type { PreparedData } from './prep';
import { scoreSurprise } from './surprise';
import { assignRespondents } from './selection';
import { bandMatch } from './agreement';

/** Members must agree on a band by at least this fraction for it to define them. */
const MERGE_AGREEMENT = 0.5;
/** Merge is accepted if it doesn't cost more than this in silhouette (favours parsimony). */
const MERGE_TOLERANCE = 0.01;

interface Group {
  predicates: Predicate[];
  members: number[];
}

function agreement(prep: PreparedData, i: number, predicates: Predicate[]): number {
  if (predicates.length === 0) return 0;
  let sum = 0;
  for (const pr of predicates) sum += bandMatch(prep.levels[i][pr.varIdx], pr.band);
  return sum / predicates.length;
}

function groupsSilhouette(groups: Group[], prep: PreparedData, n: number): number {
  if (groups.length === 0) return 0;
  let weighted = 0;
  let totalMembers = 0;
  for (const g of groups) {
    if (g.members.length === 0) continue;
    const memberSet = new Set(g.members);
    let aSum = 0;
    let bSum = 0;
    let bCount = 0;
    for (let i = 0; i < n; i++) {
      const ag = agreement(prep, i, g.predicates);
      if (memberSet.has(i)) aSum += ag;
      else {
        bSum += ag;
        bCount++;
      }
    }
    const a = aSum / g.members.length;
    const b = bCount ? bSum / bCount : 0;
    weighted += (a - b) * g.members.length;
    totalMembers += g.members.length;
  }
  return totalMembers ? weighted / totalMembers : 0;
}

export function profileFromMembers(
  members: number[],
  prep: PreparedData,
  config: PersonaV2Config
): Predicate[] {
  const p = prep.levels[0]?.length ?? 0;
  const nBands = prep.bandInfo.labels.length;
  const preds: { pred: Predicate; agree: number }[] = [];
  for (let v = 0; v < p; v++) {
    // Pick the band with the highest tolerant support among members.
    let bestBand = 0;
    let bestSupport = -1;
    for (let b = 0; b < nBands; b++) {
      let support = 0;
      for (const i of members) support += bandMatch(prep.levels[i][v], b);
      if (support > bestSupport) {
        bestSupport = support;
        bestBand = b;
      }
    }
    const agree = members.length ? bestSupport / members.length : 0;
    if (agree >= MERGE_AGREEMENT) preds.push({ pred: { varIdx: v, band: bestBand }, agree });
  }
  preds.sort((a, b) => b.agree - a.agree);
  return preds.map((x) => x.pred);
}

/** Strict-match members of a predicate list (exact band on every predicate). */
function strictMembers(predicates: Predicate[], prep: PreparedData): number[] {
  const n = prep.levels.length;
  const members: number[] = [];
  for (let i = 0; i < n; i++) {
    let ok = true;
    for (const pr of predicates) {
      if (prep.levels[i][pr.varIdx] !== pr.band) {
        ok = false;
        break;
      }
    }
    if (ok) members.push(i);
  }
  return members;
}

/**
 * Build a MinedPattern from a final profile. Broad co-agreement profiles can
 * carry many bands (incl. weak/common ones) that NOBODY satisfies exactly, which
 * would make a naive lift/surprise collapse to zero. We therefore report the
 * surprise of the most distinctive CORE signature — the prefix of the
 * agreement-sorted predicates that maximises statistical surprise — while still
 * keeping the full profile as the descriptive subspace.
 */
export function patternFromPredicates(
  predicates: Predicate[],
  prep: PreparedData
): MinedPattern {
  const n = prep.levels.length;
  const fullMembers = strictMembers(predicates, prep);

  // Scan prefixes (predicates are pre-sorted strongest-first) for the most
  // surprising describable core.
  let best = { len: predicates.length, surprise: -Infinity, members: fullMembers, lift: 0, expected: 0, tailProb: 1 };
  for (let len = 1; len <= predicates.length; len++) {
    const prefix = predicates.slice(0, len);
    const members = strictMembers(prefix, prep);
    if (members.length === 0) break; // longer prefixes can only be emptier
    const marginals = prefix.map((pr) => prep.marginals[pr.varIdx][pr.band]);
    const s = scoreSurprise(n, members.length, marginals);
    if (s.surprise > best.surprise) {
      best = { len, surprise: s.surprise, members, lift: s.lift, expected: s.expected, tailProb: s.tailProb };
    }
  }

  return {
    predicates,
    members: best.members,
    support: best.members.length,
    expected: best.expected,
    lift: best.lift,
    surprise: best.surprise === -Infinity ? 0 : best.surprise,
    tailProb: best.tailProb,
  };
}

/**
 * Consolidate seed patterns into a parsimonious set of profiles, chosen by the
 * subspace-aware silhouette. Returns final profiles as MinedPatterns ready for
 * a fresh assignment pass.
 */
export function consolidatePersonas(
  seedPatterns: MinedPattern[],
  prep: PreparedData,
  respondents: PersonaRespondent[],
  columnNames: string[],
  config: PersonaV2Config
): MinedPattern[] {
  if (seedPatterns.length <= 1) return seedPatterns;
  const n = respondents.length;

  // Initial assignment → member sets per seed persona.
  const initial = assignRespondents(seedPatterns, prep, respondents, columnNames, {
    ...config,
    // keep tiny groups for now; consolidation decides their fate
    minSizeAbs: 1,
  }).personas;

  let groups: Group[] = initial.map((per) => ({
    predicates: per.subspace.map((sv) => ({ varIdx: sv.varIdx, band: sv.band })),
    members: [...per.memberIndices],
  }));

  let currentSil = groupsSilhouette(groups, prep, n);

  // Agglomerative merging.
  for (let step = 0; step < seedPatterns.length; step++) {
    if (groups.length <= 1) break;
    let bestSil = -Infinity;
    let bestPair: [number, number] | null = null;
    let bestMerged: Group | null = null;

    for (let i = 0; i < groups.length; i++) {
      for (let j = i + 1; j < groups.length; j++) {
        const mergedMembers = Array.from(new Set([...groups[i].members, ...groups[j].members]));
        const mergedPreds = profileFromMembers(mergedMembers, prep, config);
        if (mergedPreds.length < config.minDims) continue; // not describable → bad merge
        const candidate: Group[] = groups
          .filter((_, k) => k !== i && k !== j)
          .concat([{ predicates: mergedPreds, members: mergedMembers }]);
        const sil = groupsSilhouette(candidate, prep, n);
        if (sil > bestSil) {
          bestSil = sil;
          bestPair = [i, j];
          bestMerged = { predicates: mergedPreds, members: mergedMembers };
        }
      }
    }

    if (!bestPair || !bestMerged) break;
    // Accept if it improves, or stays within tolerance (parsimony preference).
    if (bestSil >= currentSil - MERGE_TOLERANCE) {
      const [i, j] = bestPair;
      groups = groups.filter((_, k) => k !== i && k !== j).concat([bestMerged]);
      currentSil = bestSil;
    } else {
      break;
    }
  }

  return groups
    .filter((g) => g.predicates.length >= config.minDims)
    .map((g) => patternFromPredicates(g.predicates, prep));
}
