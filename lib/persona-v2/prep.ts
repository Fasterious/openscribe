// Data preparation: optional normalization + quantization into directional bands.
//
// A2: normalization (ipsatisation) is OFF by default and fully reversible.
// We always keep the raw values around for display (centroids, means) and
// derive a discretized `levels` matrix used by the mining step.

import type { BandInfo, Granularity, PrepMode, Predicate } from '@/types/persona-v2';

export interface PreparedData {
  /** Raw values (n×p), untouched — used for display. */
  raw: number[][];
  /** Prepared (possibly normalized) values (n×p). */
  prepared: number[][];
  /** Band index per cell (n×p). */
  levels: number[][];
  /** marginals[item][band] = fraction of respondents in that band. */
  marginals: number[][];
  bandInfo: BandInfo;
  scale: { min: number; max: number };
}

const LMH_LABELS = ['bas', 'neutre', 'haut'];
const LMH_DIRECTIONS: ('low' | 'mid' | 'high')[] = ['low', 'mid', 'high'];

function mean(xs: number[]): number {
  return xs.reduce((s, x) => s + x, 0) / (xs.length || 1);
}

function std(xs: number[], mu: number): number {
  if (xs.length <= 1) return 0;
  const v = xs.reduce((s, x) => s + (x - mu) ** 2, 0) / xs.length;
  return Math.sqrt(v);
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

export function inferScale(raw: number[][]): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;
  for (const row of raw) {
    for (const v of row) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  if (!isFinite(min) || !isFinite(max) || min === max) return { min: 1, max: 5 };
  return { min, max };
}

/** Apply the chosen normalization. Raw is the identity. */
export function normalize(raw: number[][], mode: PrepMode): number[][] {
  if (mode === 'raw') return raw.map((r) => [...r]);

  const n = raw.length;
  const p = raw[0]?.length ?? 0;

  if (mode === 'ipsative') {
    // Center each respondent on their own mean (kills response style / level).
    return raw.map((row) => {
      const mu = mean(row);
      return row.map((v) => v - mu);
    });
  }

  // item-z: standardize each column (item) to mean 0, sd 1.
  const out: number[][] = Array.from({ length: n }, () => new Array(p).fill(0));
  for (let j = 0; j < p; j++) {
    const col = raw.map((r) => r[j]);
    const mu = mean(col);
    const sd = std(col, mu) || 1;
    for (let i = 0; i < n; i++) out[i][j] = (raw[i][j] - mu) / sd;
  }
  return out;
}

/**
 * Compute per-item cut points that turn prepared values into band indices.
 * The number of bands = cuts.length + 1.
 */
function computeCuts(
  prepared: number[][],
  mode: PrepMode,
  granularity: Granularity,
  scale: { min: number; max: number }
): { cutsPerItem: number[][]; bandInfo: BandInfo } {
  const p = prepared[0]?.length ?? 0;

  if (mode === 'raw') {
    const range = scale.max - scale.min || 4;
    if (granularity === 'lmh') {
      // L = lower third, M = middle, H = upper third (for 1..5: {1,2},{3},{4,5}).
      const lowCut = scale.min + range / 3;
      const highCut = scale.max - range / 3;
      const cuts = Array.from({ length: p }, () => [lowCut, highCut]);
      return { cutsPerItem: cuts, bandInfo: { labels: LMH_LABELS, directions: LMH_DIRECTIONS } };
    }
    // fine: one band per integer value of the scale.
    const nVals = Math.round(range) + 1;
    const cuts: number[] = [];
    const labels: string[] = [];
    const directions: ('low' | 'mid' | 'high')[] = [];
    for (let v = 0; v < nVals; v++) {
      const val = scale.min + v;
      labels.push(String(val));
      const frac = (val - scale.min) / range;
      directions.push(frac <= 0.34 ? 'low' : frac >= 0.66 ? 'high' : 'mid');
      if (v < nVals - 1) cuts.push(val + 0.5);
    }
    const cutsPerItem = Array.from({ length: p }, () => [...cuts]);
    return { cutsPerItem, bandInfo: { labels, directions } };
  }

  // Normalized modes (centered around 0).
  if (granularity === 'lmh') {
    // Deadzone splits "below own level / neutral / above own level".
    const all = prepared.flat();
    const sd = std(all, mean(all)) || 1;
    const dead = mode === 'item-z' ? 0.43 : 0.4 * sd;
    const cutsPerItem = Array.from({ length: p }, () => [-dead, dead]);
    return {
      cutsPerItem,
      bandInfo: { labels: ['plus bas', 'comme soi', 'plus haut'], directions: LMH_DIRECTIONS },
    };
  }

  // fine + normalized: per-item quintiles → 5 bands.
  const cutsPerItem: number[][] = [];
  for (let j = 0; j < p; j++) {
    const col = prepared.map((r) => r[j]).sort((a, b) => a - b);
    cutsPerItem.push([0.2, 0.4, 0.6, 0.8].map((q) => quantile(col, q)));
  }
  return {
    cutsPerItem,
    bandInfo: {
      labels: ['q1', 'q2', 'q3', 'q4', 'q5'],
      directions: ['low', 'low', 'mid', 'high', 'high'],
    },
  };
}

function bandOf(value: number, cuts: number[]): number {
  let b = 0;
  for (const c of cuts) if (value > c) b++;
  return b;
}

export function prepare(
  raw: number[][],
  mode: PrepMode,
  granularity: Granularity,
  scaleOverride?: { min: number; max: number }
): PreparedData {
  const scale = scaleOverride ?? inferScale(raw);
  const prepared = normalize(raw, mode);
  const { cutsPerItem, bandInfo } = computeCuts(prepared, mode, granularity, scale);

  const n = prepared.length;
  const p = prepared[0]?.length ?? 0;
  const nBands = bandInfo.labels.length;

  const levels: number[][] = Array.from({ length: n }, () => new Array(p).fill(0));
  const counts: number[][] = Array.from({ length: p }, () => new Array(nBands).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < p; j++) {
      const b = bandOf(prepared[i][j], cutsPerItem[j]);
      levels[i][j] = b;
      counts[j][b]++;
    }
  }

  const marginals = counts.map((row) => row.map((c) => c / (n || 1)));

  return { raw: raw.map((r) => [...r]), prepared, levels, marginals, bandInfo, scale };
}

/** True if a respondent's level for an item matches the predicate band. */
export function satisfies(levels: number[][], i: number, pred: Predicate): boolean {
  return levels[i][pred.varIdx] === pred.band;
}
