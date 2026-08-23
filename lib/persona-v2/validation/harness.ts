// Validation harness (§5): a "method × score" table that quantifies, with ARI /
// purity / NMI, where and by how much each approach lands relative to ground
// truth. This is the first deliverable in the doc's sequencing — measure first.

import type { BaselineResult, PersonaV2Config, ValidationScores } from '@/types/persona-v2';
import { runPersonaV2 } from '../engine';
import { scorePartition } from './metrics';
import { kModesLabels, v1Labels } from './baselines';

export interface HarnessInput {
  values: number[][];
  truthLabels: (string | null)[];
  columnNames: string[];
}

export interface HarnessMethod {
  name: string;
  scores: ValidationScores;
  note?: string;
}

export interface HarnessResult {
  trueK: number;
  n: number;
  methods: HarnessMethod[];
}

function trueKOf(truth: (string | null)[]): number {
  return new Set(truth.filter((l) => l != null && l !== 'U')).size;
}

function evalLabels(
  found: (string | number)[],
  truth: (string | null)[]
): ValidationScores {
  const idx: number[] = [];
  truth.forEach((t, i) => {
    if (t != null) idx.push(i);
  });
  const f = idx.map((i) => found[i]);
  const t = idx.map((i) => truth[i] as string);
  return scorePartition(f, t);
}

/** Baselines only (v1 engine + k-modes), for filling ValidationReport.baselines. */
export function computeBaselines(
  input: HarnessInput,
  config: Partial<PersonaV2Config> = {}
): BaselineResult[] {
  const { values, truthLabels, columnNames } = input;
  const trueK = trueKOf(truthLabels) || 5;
  void config;

  const results: BaselineResult[] = [];

  try {
    results.push({
      name: 'V1 subspace-cohesion (auto-k)',
      scores: evalLabels(v1Labels(values, columnNames, 'subspace-cohesion'), truthLabels),
    });
  } catch { /* engine v1 unavailable */ }

  try {
    results.push({
      name: `V1 subspace-cohesion (k=${trueK} forcé)`,
      scores: evalLabels(v1Labels(values, columnNames, 'subspace-cohesion', trueK), truthLabels),
    });
  } catch { /* ignore */ }

  try {
    results.push({
      name: 'V1 greedy-correlation (auto-k)',
      scores: evalLabels(v1Labels(values, columnNames, 'greedy-correlation'), truthLabels),
    });
  } catch { /* ignore */ }

  try {
    results.push({
      name: `k-modes naïf (k=${trueK})`,
      scores: evalLabels(kModesLabels(values, trueK), truthLabels),
    });
  } catch { /* ignore */ }

  return results;
}

export function runHarness(
  input: HarnessInput,
  config: Partial<PersonaV2Config> = {}
): HarnessResult {
  const { values, truthLabels, columnNames } = input;
  const n = values.length;
  const trueK = trueKOf(truthLabels) || 5;

  const respondents = values.map((v, i) => ({ id: `R${i}`, values: v }));
  // Stability drives V2 model selection (it is what rejects over-segmentation),
  // so it must stay ON here — it is cheap thanks to per-resample caching.
  const v2 = runPersonaV2({ respondents, columnNames, truthLabels }, config);
  const v2Scores =
    v2.validation?.v2 ?? scorePartition(
      values.map(() => 'U'),
      truthLabels.map((t) => t ?? 'U')
    );

  const methods: HarnessMethod[] = [
    {
      name: 'Persona V2 (auto)',
      scores: v2Scores,
      note: `${v2.personas.length} personas · ${Math.round(v2.modelSelection.coverage * 100)} % couverts`,
    },
    ...computeBaselines(input, config).map((b) => ({ name: b.name, scores: b.scores })),
  ];

  return { trueK, n, methods };
}
