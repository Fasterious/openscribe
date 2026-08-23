// External validation metrics (§5.1): compare a found partition to a known
// ground truth, corrected for chance. This is what the v1 module threw away —
// without it, "is the result good?" cannot be answered.

function comb2(x: number): number {
  return (x * (x - 1)) / 2;
}

function contingency(
  found: (number | string)[],
  truth: (number | string)[]
): {
  table: number[][];
  rowSums: number[];
  colSums: number[];
  n: number;
} {
  const foundLabels = Array.from(new Set(found));
  const truthLabels = Array.from(new Set(truth));
  const fIdx = new Map(foundLabels.map((l, i) => [l, i]));
  const tIdx = new Map(truthLabels.map((l, i) => [l, i]));

  const table = Array.from({ length: foundLabels.length }, () =>
    new Array(truthLabels.length).fill(0)
  );
  for (let i = 0; i < found.length; i++) {
    table[fIdx.get(found[i])!][tIdx.get(truth[i])!]++;
  }
  const rowSums = table.map((r) => r.reduce((a, b) => a + b, 0));
  const colSums = truthLabels.map((_, j) => table.reduce((s, r) => s + r[j], 0));
  return { table, rowSums, colSums, n: found.length };
}

/** Adjusted Rand Index in [−1, 1]; 1 = identical partitions, 0 = chance. */
export function adjustedRandIndex(
  found: (number | string)[],
  truth: (number | string)[]
): number {
  if (found.length === 0) return 0;
  const { table, rowSums, colSums, n } = contingency(found, truth);

  let index = 0;
  for (const row of table) for (const c of row) index += comb2(c);
  const a = rowSums.reduce((s, r) => s + comb2(r), 0);
  const b = colSums.reduce((s, c) => s + comb2(c), 0);
  const totalPairs = comb2(n);
  if (totalPairs === 0) return 0;
  const expected = (a * b) / totalPairs;
  const max = (a + b) / 2;
  if (max - expected === 0) return 1;
  return (index - expected) / (max - expected);
}

/** Purity: fraction of respondents that land in their cluster's majority class. */
export function purity(
  found: (number | string)[],
  truth: (number | string)[]
): number {
  if (found.length === 0) return 0;
  const { table, n } = contingency(found, truth);
  let correct = 0;
  for (const row of table) correct += Math.max(0, ...row);
  return correct / n;
}

/** Normalized Mutual Information in [0, 1] (sqrt normalization). */
export function nmi(
  found: (number | string)[],
  truth: (number | string)[]
): number {
  if (found.length === 0) return 0;
  const { table, rowSums, colSums, n } = contingency(found, truth);

  let mi = 0;
  for (let i = 0; i < table.length; i++) {
    for (let j = 0; j < table[i].length; j++) {
      const nij = table[i][j];
      if (nij === 0) continue;
      mi += (nij / n) * Math.log((nij * n) / (rowSums[i] * colSums[j]));
    }
  }
  const entropy = (sums: number[]) =>
    -sums.reduce((s, c) => (c > 0 ? s + (c / n) * Math.log(c / n) : s), 0);
  const hFound = entropy(rowSums);
  const hTruth = entropy(colSums);
  const denom = Math.sqrt(hFound * hTruth);
  if (denom === 0) return hFound === 0 && hTruth === 0 ? 1 : 0;
  return Math.max(0, Math.min(1, mi / denom));
}

export interface PartitionScores {
  ari: number;
  purity: number;
  nmi: number;
  foundK: number;
  trueK: number;
}

export function scorePartition(
  found: (number | string)[],
  truth: (number | string)[]
): PartitionScores {
  return {
    ari: parseFloat(adjustedRandIndex(found, truth).toFixed(3)),
    purity: parseFloat(purity(found, truth).toFixed(3)),
    nmi: parseFloat(nmi(found, truth).toFixed(3)),
    foundK: new Set(found).size,
    trueK: new Set(truth).size,
  };
}
