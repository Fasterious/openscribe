import type {
  PersonaRespondent,
  PersonaCluster,
  CorrelationData,
  PersonaAnalysisResult,
  SignatureVariable,
  KResult,
  ClusteringAlgorithm,
  Direction,
  DirectionPattern,
  DirectionPatternItem,
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
      const dir: 'high' | 'low' | 'mid' = avg >= 3.5 ? 'high' : avg <= 2.5 ? 'low' : 'mid';
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
): {
  optimalK: number;
  scores: { k: number; score: number }[];
  groupsByK: Map<number, number[][]>;
} {
  const n = respondents.length;
  const nQ = respondents[0].values.length;
  const upper = maxK ?? Math.min(Math.ceil(Math.sqrt(n)), 10);
  const lower = 2;

  const scores: { k: number; score: number }[] = [];
  const groupsByK = new Map<number, number[][]>();

  for (let k = lower; k <= upper; k++) {
    const groups = greedyGrouping(respondents, totalMatrix, k);
    const score = computeSilhouetteScore(groups, totalMatrix, nQ);
    scores.push({ k, score });
    groupsByK.set(k, groups);
  }

  scores.sort((a, b) => b.score - a.score);
  return { optimalK: scores[0]?.k ?? 3, scores, groupsByK };
}

// --- Multi-Threshold Subspace Cohesion Algorithm ---

function satisfiesThreshold(value: number, dir: Direction): boolean {
  switch (dir) {
    case 'H': return value >= 4;
    case 'MH': return value >= 3;
    case 'L': return value <= 2;
    case 'ML': return value <= 3;
    default: return false;
  }
}

function thresholdMargin(value: number, dir: Direction): number {
  switch (dir) {
    case 'H': return value - 4;
    case 'MH': return (value - 3) / 2;
    case 'L': return 2 - value;
    case 'ML': return (3 - value) / 2;
    default: return 0;
  }
}

function mineMultiThresholdPatterns(
  respondents: PersonaRespondent[],
  minSupport: number,
  minLength: number = 3
): DirectionPattern[] {
  const n = respondents.length;
  const nVars = respondents[0].values.length;
  const dirs: Direction[] = ['H', 'L'];

  const singleItems: { item: DirectionPatternItem; members: Set<number> }[] = [];
  for (let v = 0; v < nVars; v++) {
    for (const dir of dirs) {
      const members = new Set<number>();
      for (let i = 0; i < n; i++) {
        if (satisfiesThreshold(respondents[i].values[v], dir)) {
          members.add(i);
        }
      }
      if (members.size >= minSupport && members.size <= n * 0.85) {
        singleItems.push({ item: { varIdx: v, direction: dir }, members });
      }
    }
  }

  type Itemset = { items: DirectionPatternItem[]; members: Set<number> };
  let currentLevel: Itemset[] = singleItems.map((si) => ({
    items: [si.item],
    members: si.members,
  }));
  const allPatterns: DirectionPattern[] = [];

  while (currentLevel.length > 0) {
    if (currentLevel[0]?.items.length >= minLength) {
      for (const set of currentLevel) {
        allPatterns.push({
          items: [...set.items],
          support: set.members.size,
          memberIndices: Array.from(set.members),
        });
      }
    }

    const nextLevel: Itemset[] = [];
    const seenKeys = new Set<string>();

    for (const setA of currentLevel) {
      const maxVar = Math.max(...setA.items.map((it) => it.varIdx));
      const varsInSet = new Set(setA.items.map((it) => it.varIdx));

      for (const si of singleItems) {
        if (si.item.varIdx <= maxVar) continue;
        if (varsInSet.has(si.item.varIdx)) continue;

        const newMembers = new Set<number>();
        for (const m of setA.members) {
          if (si.members.has(m)) newMembers.add(m);
        }
        if (newMembers.size < minSupport) continue;

        const newItems = [...setA.items, si.item];
        const key = newItems.map((it) => `${it.varIdx}:${it.direction}`).sort().join('|');
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);

        nextLevel.push({ items: newItems, members: newMembers });
      }
    }

    currentLevel = nextLevel;
  }

  return allPatterns;
}

function selectSeedPatterns(
  patterns: DirectionPattern[],
  k: number,
  n: number
): DirectionPattern[] {
  if (patterns.length === 0) return [];

  const selected: DirectionPattern[] = [];
  const covered = new Set<number>();
  const targetSize = Math.round(n / k);

  while (selected.length < k) {
    let bestIdx = -1;
    let bestScore = -Infinity;
    let bestRemaining: number[] = [];

    for (let i = 0; i < patterns.length; i++) {
      const p = patterns[i];
      const remaining = p.memberIndices.filter((m) => !covered.has(m));
      if (remaining.length < 2) continue;

      const sizePenalty = 1 / (1 + Math.abs(remaining.length - targetSize) / targetSize * 0.5);
      const score = (p.items.length ** 2) * remaining.length * sizePenalty;

      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
        bestRemaining = remaining;
      }
    }

    if (bestIdx === -1) break;

    selected.push({
      items: patterns[bestIdx].items,
      support: bestRemaining.length,
      memberIndices: bestRemaining,
    });
    for (const m of bestRemaining) covered.add(m);
  }

  return selected;
}

function computeGroupPattern(
  respondents: PersonaRespondent[],
  groupIndices: number[]
): DirectionPatternItem[] {
  if (groupIndices.length === 0) return [];
  const members = groupIndices.map((i) => respondents[i]);
  const nVars = members[0].values.length;
  const constraints: DirectionPatternItem[] = [];

  for (let v = 0; v < nVars; v++) {
    const values = members.map((m) => m.values[v]);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const avg = values.reduce((s, x) => s + x, 0) / values.length;

    if (minVal >= 4) {
      constraints.push({ varIdx: v, direction: 'H' });
    } else if (minVal >= 3 && avg >= 3.3) {
      constraints.push({ varIdx: v, direction: 'MH' });
    } else if (maxVal <= 2) {
      constraints.push({ varIdx: v, direction: 'L' });
    } else if (maxVal <= 3 && avg <= 2.7) {
      constraints.push({ varIdx: v, direction: 'ML' });
    }
  }

  return constraints;
}

function computeMatchScore(
  values: number[],
  pattern: DirectionPatternItem[],
): number {
  if (pattern.length === 0) return -Infinity;

  let score = 0;
  for (const c of pattern) {
    if (satisfiesThreshold(values[c.varIdx], c.direction)) {
      score += 1 + thresholdMargin(values[c.varIdx], c.direction) * 0.25;
    } else {
      score -= 2;
    }
  }
  return score;
}

function cohesionGrouping(
  respondents: PersonaRespondent[],
  totalMatrix: number[][],
  k: number
): number[][] {
  const n = respondents.length;

  // Phase 1: Mine seed patterns with multi-threshold
  let minSupport = Math.max(3, Math.floor(n / (k * 1.3)));
  let patterns = mineMultiThresholdPatterns(respondents, minSupport);

  while (patterns.length < k && minSupport > 2) {
    minSupport--;
    patterns = mineMultiThresholdPatterns(respondents, minSupport);
  }

  const seeds = selectSeedPatterns(patterns, k, n);

  let groups: number[][] = seeds.map((p) => [...p.memberIndices]);
  let groupPatterns: DirectionPatternItem[][] = seeds.map((p) => [...p.items]);

  // Assign initially uncovered respondents
  const initialCovered = new Set<number>(groups.flat());
  for (let i = 0; i < n; i++) {
    if (initialCovered.has(i)) continue;
    if (groups.length === 0) {
      groups.push([i]);
      groupPatterns.push([]);
      continue;
    }
    let bestG = 0;
    let bestS = -Infinity;
    for (let g = 0; g < groups.length; g++) {
      const s = computeMatchScore(respondents[i].values, groupPatterns[g]);
      if (s > bestS) { bestS = s; bestG = g; }
    }
    groups[bestG].push(i);
  }

  // Phase 2: Iterative refinement (Pattern-KMeans)
  for (let iter = 0; iter < 50; iter++) {
    const newPatterns = groups.map((group) =>
      computeGroupPattern(respondents, group)
    );

    const newGroups: number[][] = Array.from({ length: groups.length }, () => []);

    for (let i = 0; i < n; i++) {
      let bestG = 0;
      let bestS = -Infinity;

      for (let g = 0; g < newPatterns.length; g++) {
        const ps = computeMatchScore(respondents[i].values, newPatterns[g]);
        const cs = groups[g].length > 0
          ? groups[g].reduce((s, j) => s + totalMatrix[i][j], 0) / groups[g].length
          : 0;
        const s = ps * 1000 + cs;
        if (s > bestS) { bestS = s; bestG = g; }
      }

      newGroups[bestG].push(i);
    }

    // Handle empty groups by moving worst-fit member from largest group
    for (let g = 0; g < newGroups.length; g++) {
      if (newGroups[g].length > 0) continue;
      let largestIdx = 0;
      for (let h = 1; h < newGroups.length; h++) {
        if (newGroups[h].length > newGroups[largestIdx].length) largestIdx = h;
      }
      if (newGroups[largestIdx].length < 2) continue;
      let worstMi = 0;
      let worstScore = Infinity;
      for (let mi = 0; mi < newGroups[largestIdx].length; mi++) {
        const sc = computeMatchScore(
          respondents[newGroups[largestIdx][mi]].values,
          newPatterns[largestIdx]
        );
        if (sc < worstScore) { worstScore = sc; worstMi = mi; }
      }
      newGroups[g].push(...newGroups[largestIdx].splice(worstMi, 1));
    }

    const converged = groups.every((group, g) => {
      const oldSet = new Set(group);
      const newSet = new Set(newGroups[g]);
      return oldSet.size === newSet.size && [...oldSet].every((x) => newSet.has(x));
    });

    groups = newGroups;
    groupPatterns = newPatterns;
    if (converged) break;
  }

  // Ensure k groups
  while (groups.length < k) {
    let largestIdx = 0;
    for (let g = 1; g < groups.length; g++) {
      if (groups[g].length > groups[largestIdx].length) largestIdx = g;
    }
    if (groups[largestIdx].length < 2) break;
    const half = Math.ceil(groups[largestIdx].length / 2);
    const splitOff = groups[largestIdx].splice(half);
    groups.push(splitOff);
  }

  return groups;
}

function findOptimalKCohesion(
  respondents: PersonaRespondent[],
  totalMatrix: number[][],
  maxK?: number
): {
  optimalK: number;
  scores: { k: number; score: number }[];
  groupsByK: Map<number, number[][]>;
} {
  const n = respondents.length;
  const nQ = respondents[0].values.length;
  const upper = maxK ?? Math.min(Math.ceil(Math.sqrt(n)), 10);
  const lower = 2;

  const scores: { k: number; score: number }[] = [];
  const groupsByK = new Map<number, number[][]>();

  for (let k = lower; k <= upper; k++) {
    const groups = cohesionGrouping(respondents, totalMatrix, k);
    const score = computeSilhouetteScore(groups, totalMatrix, nQ);
    scores.push({ k, score });
    groupsByK.set(k, groups);
  }

  scores.sort((a, b) => b.score - a.score);
  return { optimalK: scores[0]?.k ?? 3, scores, groupsByK };
}

function buildClustersFromGroups(
  groups: number[][],
  respondents: PersonaRespondent[],
  columnNames: string[],
): PersonaCluster[] {
  return groups.map((group, i) => {
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
}

function buildSortedIndices(groups: number[][], totalRespondents: number): number[] {
  const sortedIndices = groups.flat();
  for (let i = 0; i < totalRespondents; i++) {
    if (!sortedIndices.includes(i)) sortedIndices.push(i);
  }
  return sortedIndices;
}

// --- Main clustering ---

export function runPersonaClustering(
  respondents: PersonaRespondent[],
  columnNames: string[],
  k?: number,
  algorithm: ClusteringAlgorithm = 'greedy-correlation'
): PersonaAnalysisResult {
  const { perQuestion, totalMatrix } = buildCorrelationMatrices(respondents);

  const useCohesion = algorithm === 'subspace-cohesion';
  const findK = useCohesion ? findOptimalKCohesion : findOptimalK;
  const groupFn = useCohesion ? cohesionGrouping : greedyGrouping;

  const { optimalK, scores: silhouetteScores, groupsByK } = findK(respondents, totalMatrix);
  const effectiveK = k ?? optimalK;

  const allResults: Record<number, KResult> = {};
  for (const [kVal, groups] of groupsByK) {
    const clusters = buildClustersFromGroups(groups, respondents, columnNames);
    const sortedIndices = buildSortedIndices(groups, respondents.length);
    allResults[kVal] = {
      clusters,
      correlationData: { perQuestion, totalMatrix, sortedIndices },
    };
  }

  const primary = allResults[effectiveK];
  if (!primary) {
    const groups = groupFn(respondents, totalMatrix, effectiveK);
    const clusters = buildClustersFromGroups(groups, respondents, columnNames);
    const sortedIndices = buildSortedIndices(groups, respondents.length);
    allResults[effectiveK] = {
      clusters,
      correlationData: { perQuestion, totalMatrix, sortedIndices },
    };
  }

  const active = allResults[effectiveK];
  return {
    clusters: active.clusters,
    correlationData: active.correlationData,
    optimalK,
    silhouetteScores,
    columnNames,
    allResults,
    algorithm,
  };
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
