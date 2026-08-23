// Baselines for the harness (§5.1): if the new engine cannot beat the v1
// module and a naive k-modes, it is not worth its complexity. The §2.6 test
// also gives a qualitative baseline ("at k=5 the v1 engine reconstructs the
// personas") — the new engine should match it WITHOUT a manually forced k.

import type { PersonaRespondent, ClusteringAlgorithm } from '@/types/persona';
import { runPersonaClustering } from '@/lib/persona/clustering';

export function valuesToRespondents(values: number[][]): PersonaRespondent[] {
  return values.map((v, i) => ({ id: `R${i}`, values: v }));
}

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

function hamming(a: number[], b: number[]): number {
  let d = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
  return d;
}

/** Naive k-modes (categorical k-means) — the "placebo" baseline. */
export function kModesLabels(values: number[][], k: number, seed = 7): number[] {
  const n = values.length;
  if (n === 0) return [];
  const p = values[0].length;
  const rand = mulberry32(seed);

  // Init modes from distinct random rows.
  const modeIdx = new Set<number>();
  while (modeIdx.size < Math.min(k, n)) modeIdx.add(Math.floor(rand() * n));
  let modes = [...modeIdx].map((i) => [...values[i]]);

  const labels = new Array(n).fill(0);
  for (let iter = 0; iter < 50; iter++) {
    let changed = false;
    for (let i = 0; i < n; i++) {
      let best = 0;
      let bestD = Infinity;
      for (let g = 0; g < modes.length; g++) {
        const d = hamming(values[i], modes[g]);
        if (d < bestD) { bestD = d; best = g; }
      }
      if (labels[i] !== best) { labels[i] = best; changed = true; }
    }
    // Recompute modes (per-column most frequent value).
    const newModes = modes.map(() => new Array(p).fill(0));
    for (let g = 0; g < modes.length; g++) {
      const members = values.filter((_, i) => labels[i] === g);
      if (members.length === 0) { newModes[g] = [...values[Math.floor(rand() * n)]]; continue; }
      for (let v = 0; v < p; v++) {
        const counts = new Map<number, number>();
        for (const m of members) counts.set(m[v], (counts.get(m[v]) ?? 0) + 1);
        let bestVal = members[0][v];
        let bestC = -1;
        for (const [val, c] of counts) if (c > bestC) { bestC = c; bestVal = val; }
        newModes[g][v] = bestVal;
      }
    }
    modes = newModes;
    if (!changed && iter > 0) break;
  }
  return labels;
}

/** Run the v1 engine and return a hard label per respondent. */
export function v1Labels(
  values: number[][],
  columnNames: string[],
  algorithm: ClusteringAlgorithm,
  k?: number
): number[] {
  const respondents = valuesToRespondents(values);
  const res = runPersonaClustering(respondents, columnNames, k, algorithm);
  const active = (k !== undefined && res.allResults[k]) ? res.allResults[k] : res;
  const clusters = active.clusters;
  const map = new Map<string, number>();
  clusters.forEach((c, ci) => c.members.forEach((m) => map.set(m.id, ci)));
  return respondents.map((r) => map.get(r.id) ?? -1);
}
