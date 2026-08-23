// Bootstrap / subsample stability (§4.5), Hennig-style clusterwise Jaccard.
//
// A real persona reappears when the analysis is re-run on a slightly different
// sample. We draw repeated SUBSAMPLES (without replacement), re-run the core
// pipeline on each, and measure how often each baseline persona reappears
// (member-set Jaccard ≥ matchThreshold). Two details matter:
//   - subsampling WITHOUT replacement avoids the ~37 % out-of-bag loss of the
//     classic bootstrap, which otherwise caps the Jaccard of even a perfectly
//     stable cluster well below 1 and makes everything look unstable;
//   - the Jaccard is computed in the SUBSAMPLE universe (the baseline cluster is
//     restricted to the indices that were actually drawn), so absent members
//     are not counted as disagreement.
// Stability is the signal that separates a real k from an over-segmented one
// (the subspace silhouette can't — every fragment is internally tight), so model
// selection leans on it, and we expose the resample clusterings for reuse across
// the candidate solutions being compared.

import type { PersonaV2 } from '@/types/persona-v2';

const MATCH_THRESHOLD = 0.5;
const DEFAULT_FRACTION = 0.8;

/** One re-clustered subsample: which originals were drawn + the clusters found. */
export interface ResampleClustering {
  universe: Set<number>;
  clusters: Set<number>[];
}

/** A seeded PRNG (mulberry32) for reproducible runs. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function jaccardSets(a: Set<number>, b: Set<number>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter || 1);
}

/**
 * Reproducible subsamples (each an array of DISTINCT original indices, drawn
 * without replacement at the given fraction).
 */
export function makeResamples(
  n: number,
  runs: number,
  fraction = DEFAULT_FRACTION,
  seed = 0x9e3779b1 ^ n
): number[][] {
  const rand = mulberry32(seed);
  const m = Math.max(2, Math.round(fraction * n));
  const out: number[][] = [];
  for (let r = 0; r < runs; r++) {
    const idx = Array.from({ length: n }, (_, i) => i);
    // Fisher–Yates partial shuffle for the first m positions.
    for (let i = 0; i < m; i++) {
      const j = i + Math.floor(rand() * (n - i));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    out.push(idx.slice(0, m));
  }
  return out;
}

/**
 * Score how often each baseline persona reappears across already-computed
 * resample clusterings. The baseline cluster is restricted to each resample's
 * universe before the Jaccard, so out-of-sample members don't count against it.
 */
export function clusteringStability(
  baseline: PersonaV2[],
  resampleClusterings: ResampleClustering[],
  matchThreshold = MATCH_THRESHOLD
): { perPersona: number[]; overall: number } {
  const runs = resampleClusterings.length;
  if (runs === 0 || baseline.length === 0) {
    return { perPersona: baseline.map(() => 0), overall: 0 };
  }
  const reproduced = new Array(baseline.length).fill(0);
  const tested = new Array(baseline.length).fill(0);
  const baseSets = baseline.map((p) => new Set(p.memberIndices));

  for (const rc of resampleClusterings) {
    baseSets.forEach((bs, g) => {
      const inU = new Set<number>();
      for (const x of bs) if (rc.universe.has(x)) inU.add(x);
      if (inU.size === 0) return; // persona untested in this subsample
      tested[g]++;
      let bestJ = 0;
      for (const rs of rc.clusters) {
        const j = jaccardSets(inU, rs);
        if (j > bestJ) bestJ = j;
      }
      if (bestJ >= matchThreshold) reproduced[g]++;
    });
  }

  const perPersona = reproduced.map((c, g) =>
    tested[g] ? parseFloat((c / tested[g]).toFixed(2)) : 0
  );
  const totalMembers = baseline.reduce((s, p) => s + p.memberIndices.length, 0) || 1;
  const overall = parseFloat(
    (
      baseline.reduce((s, p, g) => s + perPersona[g] * p.memberIndices.length, 0) /
      totalMembers
    ).toFixed(2)
  );
  return { perPersona, overall };
}

/**
 * Convenience wrapper: subsample → re-cluster → score, in one call.
 *
 * @param baseline   personas from the main run (member indices in original space)
 * @param n          number of respondents
 * @param runs       resample iterations
 * @param runCore    given subsample ORIGINAL indices, returns persona member sets
 *                   (each a set of ORIGINAL indices)
 */
export function bootstrapStability(
  baseline: PersonaV2[],
  n: number,
  runs: number,
  runCore: (sampleIdx: number[]) => Set<number>[]
): { perPersona: number[]; overall: number } {
  if (runs <= 0 || baseline.length === 0 || n === 0) {
    return { perPersona: baseline.map(() => 0), overall: 0 };
  }
  const resamples = makeResamples(n, runs);
  const clusterings: ResampleClustering[] = [];
  for (const sample of resamples) {
    try {
      clusterings.push({ universe: new Set(sample), clusters: runCore(sample) });
    } catch {
      // skip a failed resample
    }
  }
  return clusteringStability(baseline, clusterings);
}
