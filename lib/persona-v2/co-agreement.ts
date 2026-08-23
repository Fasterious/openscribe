// Co-agreement backend — keep the v1 "gold", remove its two handcuffs (§2.6).
//
// The v1 engine clusters on a ±1 co-agreement matrix and, at the RIGHT k,
// reconstructs the planted personas perfectly (the §2.6 test: k=5 → ARI 1.0).
// Its handcuffs were: (1) a full-space silhouette that picks the wrong k, and
// (2) forced full assignment (no noise class). Here we reuse v1's clustering as
// a SEED generator, then for each k:
//   - re-describe each group with a surprise-scored subspace profile,
//   - re-assign with confidence → a real noise class U (fixes faille n°2),
//   - re-judge with the subspace-aware silhouette (fixes faille n°1).
// The engine then picks the k by stability, not by raw silhouette (which would
// over-segment), so the number of personas falls out of resampling evidence.

import type { PersonaV2Config, PersonaRespondent } from '@/types/persona-v2';
import type { PersonaAnalysisResult } from '@/types/persona';
import { runPersonaClustering } from '@/lib/persona/clustering';
import type { PreparedData } from './prep';
import { profileFromMembers, patternFromPredicates } from './consolidate';
import { assignRespondents, type SelectionOutput } from './selection';
import { computeSubspaceCohesion } from './subspace';

export interface CoAgreementCandidate {
  k: number;
  sel: SelectionOutput;
  silhouette: number;
}

export interface CoAgreementOutput {
  best: SelectionOutput;
  silhouette: number;
  perK: { k: number; silhouette: number; coverage: number }[];
  chosenK: number;
  /** Every viable per-k solution, for stability-aware model selection upstream. */
  candidates: CoAgreementCandidate[];
}

const EMPTY: SelectionOutput = {
  personas: [],
  noise: { memberIndices: [], members: [], reasons: [], fraction: 0 },
  soft: [],
  coverage: 0,
};

/** Run v1 co-agreement clustering (all k at once). Null on failure. */
export function clusterCoAgreement(
  respondents: PersonaRespondent[],
  columnNames: string[]
): PersonaAnalysisResult | null {
  try {
    return runPersonaClustering(respondents, columnNames, undefined, 'subspace-cohesion');
  } catch {
    return null;
  }
}

/** Sorted list of k values available in a clustering result. */
export function availableKs(res: PersonaAnalysisResult): number[] {
  return Object.keys(res.allResults)
    .map(Number)
    .filter((k) => Number.isFinite(k))
    .sort((a, b) => a - b);
}

/**
 * Turn the v1 groups at a given k into a V2 solution: subspace profiles +
 * confidence assignment + noise class U. Returns EMPTY if no group survives the
 * minimum-size / minimum-dimension floors.
 */
export function solutionAtK(
  res: PersonaAnalysisResult,
  k: number,
  respondents: PersonaRespondent[],
  columnNames: string[],
  prep: PreparedData,
  config: PersonaV2Config
): SelectionOutput {
  const idToIndex = new Map(respondents.map((r, i) => [r.id, i]));
  const clusters = res.allResults[k]?.clusters ?? [];
  const profiles = clusters
    .map((c) =>
      c.members
        .map((m) => idToIndex.get(m.id))
        .filter((idx): idx is number => idx !== undefined)
    )
    .filter((members) => members.length >= config.minSizeAbs)
    .map((members) => profileFromMembers(members, prep, config))
    .filter((preds) => preds.length >= config.minDims)
    .map((preds) => patternFromPredicates(preds, prep));

  if (profiles.length === 0) return EMPTY;
  return assignRespondents(profiles, prep, respondents, columnNames, config);
}

export function coAgreementBackend(
  respondents: PersonaRespondent[],
  columnNames: string[],
  prep: PreparedData,
  config: PersonaV2Config
): CoAgreementOutput {
  const n = respondents.length;
  if (n === 0) return { best: EMPTY, silhouette: 0, perK: [], chosenK: 0, candidates: [] };

  const res = clusterCoAgreement(respondents, columnNames);
  if (!res) return { best: EMPTY, silhouette: 0, perK: [], chosenK: 0, candidates: [] };

  let best: SelectionOutput | null = null;
  let bestSil = -Infinity;
  let chosenK = 0;
  const perK: { k: number; silhouette: number; coverage: number }[] = [];
  const candidates: CoAgreementCandidate[] = [];

  for (const k of availableKs(res)) {
    const sol = solutionAtK(res, k, respondents, columnNames, prep, config);
    if (sol.personas.length === 0) continue;
    const sil = computeSubspaceCohesion(sol.personas, prep, n);
    perK.push({ k, silhouette: sil, coverage: parseFloat(sol.coverage.toFixed(2)) });
    candidates.push({ k, sel: sol, silhouette: sil });
    // Default "best" by silhouette; the engine re-judges with stability.
    if (
      sil > bestSil + 1e-6 ||
      (Math.abs(sil - bestSil) <= 1e-6 && best && sol.personas.length > best.personas.length)
    ) {
      bestSil = sil;
      best = sol;
      chosenK = k;
    }
  }

  if (!best) return { best: EMPTY, silhouette: 0, perK, chosenK: 0, candidates };
  return { best, silhouette: bestSil, perK, chosenK, candidates };
}
