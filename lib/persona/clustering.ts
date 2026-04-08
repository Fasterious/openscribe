import type {
  PersonaRespondent,
  PersonaCluster,
  CorrelationData,
  PersonaAnalysisResult,
  SignatureVariable,
} from '@/types/persona';
import { CLUSTER_COLORS } from '@/types/persona';

// --- Correlation matrices ---

export function buildCorrelationMatrices(
  respondents: PersonaRespondent[]
): Omit<CorrelationData, 'sortedIndices'> {
  const n = respondents.length;
  const nQ = respondents[0].values.length;

  const perQuestion: number[][][] = [];
  const totalMatrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

  for (let q = 0; q < nQ; q++) {
    const qm: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      qm[i][i] = 1;
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(respondents[i].values[q] - respondents[j].values[q]) <= 1) {
          qm[i][j] = 1;
          qm[j][i] = 1;
          totalMatrix[i][j]++;
          totalMatrix[j][i]++;
        }
      }
    }
    for (let i = 0; i < n; i++) totalMatrix[i][i] = nQ;
    perQuestion.push(qm);
  }

  return { perQuestion, totalMatrix };
}

// --- Dynamic threshold ---

function computeThreshold(totalMatrix: number[][], n: number): number {
  const vals: number[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      vals.push(totalMatrix[i][j]);
    }
  }
  const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
  const std = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length);
  return mean + std;
}

// --- Greedy grouping ---

function greedyGrouping(
  respondents: PersonaRespondent[],
  totalMatrix: number[][],
  k: number
): number[][] {
  const n = respondents.length;
  const threshold = computeThreshold(totalMatrix, n);
  const expectedSize = Math.round(n / k);
  const maxSize = Math.ceil(expectedSize * 1.5);

  const assigned = new Set<number>();
  const groups: number[][] = [];

  for (let g = 0; g < k; g++) {
    let bestI = -1, bestJ = -1, bestScore = -1;
    for (let i = 0; i < n; i++) {
      if (assigned.has(i)) continue;
      for (let j = i + 1; j < n; j++) {
        if (assigned.has(j)) continue;
        if (totalMatrix[i][j] > bestScore) {
          bestScore = totalMatrix[i][j];
          bestI = i;
          bestJ = j;
        }
      }
    }
    if (bestI === -1) break;

    const group = [bestI, bestJ];
    assigned.add(bestI);
    assigned.add(bestJ);

    let growing = true;
    while (growing && group.length < maxSize) {
      growing = false;
      let bestCandidate = -1;
      let bestMinCorr = -1;

      for (let c = 0; c < n; c++) {
        if (assigned.has(c)) continue;
        const minCorr = Math.min(...group.map((gi) => totalMatrix[c][gi]));
        const avgCorr = group.reduce((s, gi) => s + totalMatrix[c][gi], 0) / group.length;
        if (minCorr >= threshold - 1 && avgCorr > bestMinCorr) {
          bestMinCorr = avgCorr;
          bestCandidate = c;
        }
      }

      if (bestCandidate !== -1 && bestMinCorr >= threshold) {
        group.push(bestCandidate);
        assigned.add(bestCandidate);
        growing = true;
      }
    }

    groups.push(group);
  }

  while (groups.length < k) {
    const unassigned: number[] = [];
    for (let i = 0; i < n; i++) if (!assigned.has(i)) unassigned.push(i);

    if (unassigned.length >= 2) {
      let bestI = -1, bestJ = -1, bestS = -1;
      for (let a = 0; a < unassigned.length; a++) {
        for (let b = a + 1; b < unassigned.length; b++) {
          const s = totalMatrix[unassigned[a]][unassigned[b]];
          if (s > bestS) { bestS = s; bestI = unassigned[a]; bestJ = unassigned[b]; }
        }
      }
      if (bestI !== -1) {
        const newGroup = [bestI, bestJ];
        assigned.add(bestI);
        assigned.add(bestJ);
        for (const u of unassigned) {
          if (assigned.has(u)) continue;
          const avgCorr = newGroup.reduce((s, gi) => s + totalMatrix[u][gi], 0) / newGroup.length;
          if (avgCorr >= threshold - 2 && newGroup.length < maxSize) {
            newGroup.push(u);
            assigned.add(u);
          }
        }
        groups.push(newGroup);
        continue;
      }
    }
    break;
  }

  for (let c = 0; c < n; c++) {
    if (assigned.has(c)) continue;
    let bestGroup = 0;
    let bestAvg = -Infinity;
    groups.forEach((group, gi) => {
      const avg = group.reduce((s, gi2) => s + totalMatrix[c][gi2], 0) / group.length;
      if (avg > bestAvg) { bestAvg = avg; bestGroup = gi; }
    });
    groups[bestGroup].push(c);
    assigned.add(c);
  }

  return groups;
}

// --- Signature variable detection ---

function detectSignatureVars(
  members: PersonaRespondent[],
  columnNames: string[]
): SignatureVariable[] {
  if (members.length === 0) return [];
  const nVars = members[0].values.length;
  const signatures: (SignatureVariable & { consistency: number })[] = [];

  for (let v = 0; v < nVars; v++) {
    const values = members.map((m) => m.values[v]);
    const avg = values.reduce((s, x) => s + x, 0) / values.length;
    const variance = values.reduce((s, x) => s + (x - avg) ** 2, 0) / values.length;

    if (variance <= 0.8) {
      const dir: 'high' | 'low' | 'mid' = avg >= 3.8 ? 'high' : avg <= 2.2 ? 'low' : 'mid';
      signatures.push({
        varIdx: v,
        columnName: columnNames[v] || `C${v + 1}`,
        direction: dir,
        avgVal: parseFloat(avg.toFixed(1)),
        consistency: 1 - variance,
      });
    }
  }

  signatures.sort((a, b) => b.consistency - a.consistency);
  return signatures.map(({ consistency: _, ...rest }) => rest);
}

// --- Silhouette score for auto-k detection ---

function computeSilhouetteScore(
  groups: number[][],
  totalMatrix: number[][],
  nQ: number
): number {
  const n = totalMatrix.length;
  const assignment = new Array(n).fill(-1);
  groups.forEach((group, gi) => group.forEach((idx) => { assignment[idx] = gi; }));

  let totalScore = 0;
  let count = 0;

  for (let i = 0; i < n; i++) {
    const myGroup = assignment[i];
    if (myGroup === -1) continue;

    const inGroup = groups[myGroup];
    if (inGroup.length <= 1) continue;

    // a(i) = avg distance to same cluster (distance = nQ - correlation)
    let sumA = 0;
    for (const j of inGroup) {
      if (j !== i) sumA += nQ - totalMatrix[i][j];
    }
    const a = sumA / (inGroup.length - 1);

    // b(i) = min avg distance to other clusters
    let b = Infinity;
    for (let gi = 0; gi < groups.length; gi++) {
      if (gi === myGroup) continue;
      const otherGroup = groups[gi];
      if (otherGroup.length === 0) continue;
      let sumB = 0;
      for (const j of otherGroup) sumB += nQ - totalMatrix[i][j];
      const avgB = sumB / otherGroup.length;
      if (avgB < b) b = avgB;
    }

    if (b === Infinity) continue;
    const s = (b - a) / Math.max(a, b);
    totalScore += s;
    count++;
  }

  return count > 0 ? totalScore / count : 0;
}

export function findOptimalK(
  respondents: PersonaRespondent[],
  totalMatrix: number[][],
  maxK?: number
): { optimalK: number; scores: { k: number; score: number }[] } {
  const n = respondents.length;
  const nQ = respondents[0].values.length;
  const upper = maxK ?? Math.min(Math.ceil(Math.sqrt(n)), 10);
  const lower = 2;

  const scores: { k: number; score: number }[] = [];

  for (let k = lower; k <= upper; k++) {
    const groups = greedyGrouping(respondents, totalMatrix, k);
    const score = computeSilhouetteScore(groups, totalMatrix, nQ);
    scores.push({ k, score });
  }

  scores.sort((a, b) => b.score - a.score);
  return { optimalK: scores[0]?.k ?? 3, scores };
}

// --- Main clustering ---

export function runPersonaClustering(
  respondents: PersonaRespondent[],
  columnNames: string[],
  k?: number
): PersonaAnalysisResult {
  const { perQuestion, totalMatrix } = buildCorrelationMatrices(respondents);

  const { optimalK, scores: silhouetteScores } = findOptimalK(respondents, totalMatrix);
  const effectiveK = k ?? optimalK;

  const groups = greedyGrouping(respondents, totalMatrix, effectiveK);

  const sortedIndices = groups.flat();
  for (let i = 0; i < respondents.length; i++) {
    if (!sortedIndices.includes(i)) sortedIndices.push(i);
  }

  const correlationData: CorrelationData = { perQuestion, totalMatrix, sortedIndices };

  const clusters: PersonaCluster[] = groups.map((group, i) => {
    const members = group.map((idx) => respondents[idx]);
    const centroid = respondents[0].values.map((_, vi) => {
      if (members.length === 0) return 3;
      return members.reduce((s, m) => s + m.values[vi], 0) / members.length;
    });
    return {
      centroid,
      members,
      color: CLUSTER_COLORS[i % CLUSTER_COLORS.length],
      label: `Persona ${i + 1}`,
      signatureVars: detectSignatureVars(members, columnNames),
    };
  });

  return { clusters, correlationData, optimalK, silhouetteScores, columnNames };
}

// --- CSV generation ---

export function generatePersonaCSV(
  clusters: PersonaCluster[],
  columnNames: string[]
): string {
  const header = ['Respondent', 'Cluster', ...columnNames].join(',');
  const rows: string[] = [];
  clusters.forEach((cluster) => {
    const sorted = [...cluster.members].sort((a, b) => {
      const na = parseInt(a.id.replace(/\D/g, '')) || 0;
      const nb = parseInt(b.id.replace(/\D/g, '')) || 0;
      return na - nb;
    });
    sorted.forEach((m) => {
      rows.push(`${m.id},${cluster.label},${m.values.join(',')}`);
    });
  });
  return [header, ...rows].join('\n');
}
