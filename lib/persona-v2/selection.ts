// Step 2 — Selection under an explicit multi-criteria objective + noise class U.
//
// quality(g) = surprise(g) · f_size(|g|)   subject to |g| ≥ τ_size and |S_g| ≥ τ_dim
// objective : maximise Σ quality over a low-redundancy set of personas, while
//             reporting coverage = |∪ M_g| / n and the unassigned set U.
//
// The λ control blends coverage (broad groups) vs specificity (precise groups),
// so the trade-off the audio describes ("20×4 vs 2×9") is exposed, not frozen.
//
// Assignment is confidence-based: a respondent only joins a persona if its match
// score clears a threshold; otherwise it falls into U (the right to exclude).
// Soft membership weights are also reported (LCA-style) for the optional view.

import type {
  MinedPattern,
  NoiseClass,
  PersonaV2,
  PersonaV2Config,
  SoftAssignment,
  SubspaceVar,
  PersonaRespondent,
} from '@/types/persona-v2';
import { CLUSTER_COLORS } from '@/types/persona';
import type { PreparedData } from './prep';
import { bandMatch } from './agreement';

export interface SelectionOutput {
  personas: PersonaV2[];
  noise: NoiseClass;
  soft: SoftAssignment[];
  coverage: number;
}

function jaccard(a: Set<number>, b: number[]): number {
  let inter = 0;
  for (const x of b) if (a.has(x)) inter++;
  const union = a.size + b.length - inter;
  return union > 0 ? inter / union : 0;
}

function tauSize(n: number, config: PersonaV2Config): number {
  return Math.max(config.minSizeAbs, Math.round(config.minSizeFrac * n));
}

/** Greedy selection of defining patterns under the λ-weighted objective. */
export function selectPersonaPatterns(
  patterns: MinedPattern[],
  n: number,
  p: number,
  config: PersonaV2Config
): MinedPattern[] {
  const tau = tauSize(n, config);
  const candidates = patterns.filter(
    (pt) => pt.support >= tau && pt.predicates.length >= config.minDims
  );

  const selected: MinedPattern[] = [];
  const selectedSets: Set<number>[] = [];
  const covered = new Set<number>();
  const specCap = Math.max(2, config.maxPatternLen);

  while (selected.length < config.maxPersonas) {
    let best: MinedPattern | null = null;
    let bestScore = 0;
    let bestNew: number[] = [];

    for (const pt of candidates) {
      if (selected.includes(pt)) continue;

      // Redundancy guard.
      let redundant = false;
      for (const s of selectedSets) {
        if (jaccard(s, pt.members) > config.maxOverlap) {
          redundant = true;
          break;
        }
      }
      if (redundant) continue;

      const newMembers = pt.members.filter((m) => !covered.has(m));
      if (newMembers.length < Math.max(2, Math.floor(tau / 2))) continue;

      const coverageGain = newMembers.length / n;
      const specificity = Math.min(1, pt.predicates.length / specCap);
      const blend = config.lambda * coverageGain + (1 - config.lambda) * specificity;
      // Quality weight: surprise (or support) × size saturation on the NEW members.
      const sizeFactor = Math.min(1, newMembers.length / tau);
      const qualityWeight =
        config.scoreMode === 'support' ? Math.log1p(pt.support) : Math.log1p(pt.surprise);
      const score = qualityWeight * blend * (0.5 + 0.5 * sizeFactor);

      if (score > bestScore) {
        bestScore = score;
        best = pt;
        bestNew = newMembers;
      }
    }

    if (!best || bestScore <= 0) break;
    selected.push(best);
    selectedSets.push(new Set(best.members));
    for (const m of bestNew) covered.add(m);
  }

  return selected;
}

function buildSubspace(
  pattern: MinedPattern,
  memberIndices: number[],
  prep: PreparedData,
  columnNames: string[]
): SubspaceVar[] {
  return pattern.predicates.map((pred) => {
    const members = memberIndices.length ? memberIndices : pattern.members;
    let agree = 0;
    let sumRaw = 0;
    for (const i of members) {
      if (prep.levels[i][pred.varIdx] === pred.band) agree++;
      sumRaw += prep.raw[i][pred.varIdx];
    }
    return {
      varIdx: pred.varIdx,
      columnName: columnNames[pred.varIdx] ?? `C${pred.varIdx + 1}`,
      band: pred.band,
      direction: prep.bandInfo.directions[pred.band] ?? 'mid',
      agreement: members.length ? agree / members.length : 0,
      meanValue: members.length ? parseFloat((sumRaw / members.length).toFixed(2)) : 0,
    };
  });
}

/** Tolerant match score of respondent i to a pattern (ordinal adjacency aware). */
function matchScore(prep: PreparedData, i: number, pattern: MinedPattern): number {
  if (pattern.predicates.length === 0) return 0;
  let sum = 0;
  for (const pred of pattern.predicates) {
    sum += bandMatch(prep.levels[i][pred.varIdx], pred.band);
  }
  return sum / pattern.predicates.length;
}

/** Assign every respondent to its best matching pattern, or to U. */
export function assignRespondents(
  selectedPatterns: MinedPattern[],
  prep: PreparedData,
  respondents: PersonaRespondent[],
  columnNames: string[],
  config: PersonaV2Config
): SelectionOutput {
  const n = respondents.length;
  const p = prep.levels[0]?.length ?? 0;

  const assignment = new Array<number>(n).fill(-1);
  const confidences = new Array<number>(n).fill(0);
  const soft: SoftAssignment[] = [];

  for (let i = 0; i < n; i++) {
    const scores = selectedPatterns.map((pt) => matchScore(prep, i, pt));
    let bestG = -1;
    let bestS = -1;
    let secondS = -1;
    scores.forEach((s, g) => {
      if (s > bestS) {
        secondS = bestS;
        bestS = s;
        bestG = g;
      } else if (s > secondS) {
        secondS = s;
      }
    });

    const sum = scores.reduce((a, b) => a + b, 0);
    const weights = scores
      .map((s, g) => ({ personaId: g, weight: sum > 0 ? s / sum : 0 }))
      .filter((w) => w.weight > 0.001)
      .sort((a, b) => b.weight - a.weight);

    // Confidence blends the best match with its margin over the runner-up.
    const margin = bestS - Math.max(0, secondS);
    const confidence = bestS <= 0 ? 0 : Math.min(1, 0.7 * bestS + 0.3 * margin);

    let hard = bestG;
    if (config.useNoiseClass && (bestS <= 0 || confidence < config.assignConfidence)) {
      hard = -1;
    } else if (!config.useNoiseClass && bestG === -1) {
      hard = -1; // no pattern at all
    }

    assignment[i] = hard;
    confidences[i] = confidence;
    soft.push({
      respondentIndex: i,
      respondentId: respondents[i].id,
      weights,
      hard,
      confidence: parseFloat(confidence.toFixed(2)),
    });
  }

  // Build personas from final assignment.
  let personas: PersonaV2[] = selectedPatterns.map((pattern, g) => {
    const memberIndices: number[] = [];
    for (let i = 0; i < n; i++) if (assignment[i] === g) memberIndices.push(i);
    const members = memberIndices.map((i) => respondents[i]);
    const subspace = buildSubspace(pattern, memberIndices, prep, columnNames);
    const centroid = new Array(p).fill(0);
    for (let v = 0; v < p; v++) {
      centroid[v] = members.length
        ? parseFloat((memberIndices.reduce((s, i) => s + prep.raw[i][v], 0) / members.length).toFixed(2))
        : 3;
    }
    return {
      id: g,
      label: `Persona ${g + 1}`,
      color: CLUSTER_COLORS[g % CLUSTER_COLORS.length],
      memberIndices,
      members,
      centroid,
      subspace,
      size: members.length,
      surprise: parseFloat(pattern.surprise.toFixed(2)),
      lift: parseFloat(pattern.lift.toFixed(2)),
      cohesion: 0,
      stability: 0,
      signatureVars: subspace
        .slice()
        .sort((a, b) => b.agreement - a.agreement)
        .map((sv) => ({
          varIdx: sv.varIdx,
          columnName: sv.columnName,
          direction: sv.direction,
          avgVal: sv.meanValue,
        })),
    };
  });

  // Drop sub-floor personas; their members fall back to U.
  const droppedIndices = new Set<number>();
  personas = personas.filter((per) => {
    if (per.size < config.minSizeAbs) {
      per.memberIndices.forEach((i) => droppedIndices.add(i));
      return false;
    }
    return true;
  });
  if (droppedIndices.size > 0) {
    for (const i of droppedIndices) {
      assignment[i] = -1;
      const s = soft.find((x) => x.respondentIndex === i);
      if (s) s.hard = -1;
    }
  }

  // Relabel + recolor compactly.
  personas.forEach((per, idx) => {
    const oldId = per.id;
    per.id = idx;
    per.label = `Persona ${idx + 1}`;
    per.color = CLUSTER_COLORS[idx % CLUSTER_COLORS.length];
    // remap soft weights persona ids
    if (oldId !== idx) {
      for (const s of soft) {
        for (const w of s.weights) if (w.personaId === oldId) w.personaId = idx;
        if (s.hard === oldId) s.hard = idx;
      }
    }
  });

  // Noise class U.
  const noiseIndices: number[] = [];
  for (let i = 0; i < n; i++) if (assignment[i] === -1) noiseIndices.push(i);
  const reasons = noiseIndices.map((i) => {
    const bestW = soft[i]?.weights[0]?.weight ?? 0;
    return {
      respondentId: respondents[i].id,
      reason:
        bestW <= 0
          ? "ne matche aucun motif de persona"
          : `match trop faible (confiance ${(confidences[i] * 100).toFixed(0)} %)`,
    };
  });

  const noise: NoiseClass = {
    memberIndices: noiseIndices,
    members: noiseIndices.map((i) => respondents[i]),
    reasons,
    fraction: n > 0 ? noiseIndices.length / n : 0,
  };

  const covered = n > 0 ? (n - noiseIndices.length) / n : 0;

  return { personas, noise, soft, coverage: covered };
}

/** Convenience: select + assign in one call (used by the engine and Pareto). */
export function selectAndAssign(
  patterns: MinedPattern[],
  prep: PreparedData,
  respondents: PersonaRespondent[],
  columnNames: string[],
  config: PersonaV2Config
): SelectionOutput {
  const n = respondents.length;
  const p = prep.levels[0]?.length ?? 0;
  const selected = selectPersonaPatterns(patterns, n, p, config);
  return assignRespondents(selected, prep, respondents, columnNames, config);
}
