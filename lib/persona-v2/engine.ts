// Persona V2 engine — orchestrates the transparent pipeline end to end.
//
//   prepare → core target → mine (surprise) → select (λ) → assign (+U)
//           → subspace cohesion → bootstrap stability → Pareto → validation
//
// Every intermediate result is returned so the UI can render each step as an
// inspectable card (A3). The engine is pure (no LLM, no network).

import type {
  ParetoSolution,
  PersonaV2,
  PersonaV2Config,
  PersonaV2Input,
  PersonaV2Result,
  PipelineStep,
  ValidationReport,
} from '@/types/persona-v2';
import { DEFAULT_V2_CONFIG } from '@/types/persona-v2';
import type { PersonaRespondent } from '@/types/persona';
import { prepare } from './prep';
import { computeCoreTarget, coreTargetVerdict } from './core-target';
import { minePatterns } from './mining';
import { selectPersonaPatterns, assignRespondents, type SelectionOutput } from './selection';
import { consolidatePersonas } from './consolidate';
import { coAgreementBackend, clusterCoAgreement, solutionAtK } from './co-agreement';
import type { PersonaAnalysisResult } from '@/types/persona';
import { computeSubspaceCohesion } from './subspace';
import { makeResamples, clusteringStability, type ResampleClustering } from './stability';
import { scorePartition } from './validation/metrics';
import type { Backend, MinedPattern, ModelSelection } from '@/types/persona-v2';
import type { PreparedData } from './prep';

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

/** Full decision path: select seeds → consolidate (auto-k) → assign (+U). */
function computeSolution(
  patterns: MinedPattern[],
  prep: PreparedData,
  respondents: PersonaRespondent[],
  columnNames: string[],
  config: PersonaV2Config
): SelectionOutput {
  const n = respondents.length;
  const p = prep.levels[0]?.length ?? 0;
  const seeds = selectPersonaPatterns(patterns, n, p, config);
  const profiles = consolidatePersonas(seeds, prep, respondents, columnNames, config);
  return assignRespondents(profiles, prep, respondents, columnNames, config);
}

type ConcreteBackend = Exclude<Backend, 'auto'>;

interface Candidate {
  sel: SelectionOutput;
  backend: ConcreteBackend;
  /** Subspace-aware silhouette (descriptive quality). */
  cohesion: number;
  /** Co-agreement seed k, when applicable (reporting only). */
  k?: number;
}

// Model-selection blend. The subspace silhouette CANNOT pick the right k on its
// own — every over-segmented fragment is internally tight, so cohesion keeps
// rising with k. Bootstrap stability is the signal that collapses with
// over-segmentation (a fragment born of within-persona noise does not reappear
// under resampling). We therefore gate cohesion by stability: an unstable
// solution keeps only STAB_FLOOR of its cohesion credit.
const STAB_FLOOR = 0.25;

function combinedScore(cohesion: number, stability: number): number {
  return Math.max(0, cohesion) * (STAB_FLOOR + (1 - STAB_FLOOR) * stability);
}

const PARETO_LAMBDAS: { lambda: number; label: string }[] = [
  { lambda: 0.15, label: 'fin' },
  { lambda: 0.5, label: 'moyen' },
  { lambda: 0.85, label: 'large' },
];

function hardLabels(personas: PersonaV2[], n: number): string[] {
  const labels = new Array<string>(n).fill('U');
  for (const per of personas) {
    for (const i of per.memberIndices) labels[i] = `P${per.id + 1}`;
  }
  return labels;
}

export function runPersonaV2(
  input: PersonaV2Input,
  configOverride: Partial<PersonaV2Config> = {}
): PersonaV2Result {
  const t0 = now();
  const config: PersonaV2Config = { ...DEFAULT_V2_CONFIG, ...configOverride };
  const warnings: string[] = [];

  const respondents = input.respondents;
  const columnNames = input.columnNames;
  const n = respondents.length;
  const p = columnNames.length;
  const raw = respondents.map((r) => r.values);

  // --- Step: prepare ------------------------------------------------------
  const prep = prepare(raw, config.prep, config.granularity, {
    min: input.scaleMin ?? Math.min(...raw.flat()),
    max: input.scaleMax ?? Math.max(...raw.flat()),
  });

  // --- Step 0: core target ------------------------------------------------
  const coreTarget = computeCoreTarget(prep, columnNames);

  // --- Step 1: mining -----------------------------------------------------
  const { report: mining, patterns } = minePatterns(prep, config);
  if (patterns.length === 0) {
    warnings.push(
      "Aucun motif surprenant détecté : soit la population est très homogène (voir le cœur de cible), soit les seuils sont trop stricts."
    );
  }

  // --- Step 2/3: backend candidates + assignment + U ----------------------
  // Each backend proposes one or more candidate solutions; we re-judge them all
  // with the same stability-aware criterion (see combinedScore) so the winner is
  // chosen on equal footing rather than by raw silhouette (which over-segments).
  const wantSurprise = config.backend === 'surprise' || config.backend === 'auto';
  const wantCo = config.backend === 'co-agreement' || config.backend === 'auto';

  const candidates: Candidate[] = [];
  let coPerK: ModelSelection['perK'];

  if (wantSurprise) {
    const s = computeSolution(patterns, prep, respondents, columnNames, config);
    if (s.personas.length > 0) {
      candidates.push({ sel: s, backend: 'surprise', cohesion: computeSubspaceCohesion(s.personas, prep, n) });
    }
  }
  if (wantCo) {
    const co = coAgreementBackend(respondents, columnNames, prep, config);
    coPerK = co.perK;
    for (const c of co.candidates) {
      if (c.sel.personas.length > 0) {
        candidates.push({ sel: c.sel, backend: 'co-agreement', cohesion: c.silhouette, k: c.k });
      }
    }
  }

  // --- Step 4b: bootstrap resamples (shared, cached) ----------------------
  // The expensive part (re-mining / re-clustering a resample) is amortised:
  //   - surprise: one re-mined solution per resample, cached once;
  //   - co-agreement: v1 clusters every k at once per resample, cached once,
  //     then any candidate k is extracted cheaply.
  // Crucially, each co-agreement candidate is judged against resample clusterings
  // AT THE SAME k, so an over-segmented k is not unfairly compared to the auto
  // best — its fragments simply fail to reappear, which is exactly the signal.
  const resamples = config.stabilityRuns > 0 ? makeResamples(n, config.stabilityRuns) : [];

  const toOrig = (clusterPersonas: PersonaV2[], sampleIdx: number[]): Set<number> [] =>
    clusterPersonas.map((per) => {
      const orig = new Set<number>();
      for (const subPos of per.memberIndices) orig.add(sampleIdx[subPos]);
      return orig;
    });

  let surpriseClusterings: ResampleClustering[] | null = null;
  const getSurpriseClusterings = (): ResampleClustering[] => {
    if (surpriseClusterings) return surpriseClusterings;
    surpriseClusterings = [];
    for (const sample of resamples) {
      try {
        const subRaw = sample.map((i) => raw[i]);
        const subResp: PersonaRespondent[] = sample.map((orig, pos) => ({ id: `s${pos}`, values: raw[orig] }));
        const subPrep = prepare(subRaw, config.prep, config.granularity, prep.scale);
        const subMining = minePatterns(subPrep, config);
        const subPersonas = computeSolution(subMining.patterns, subPrep, subResp, columnNames, config).personas;
        surpriseClusterings.push({ universe: new Set(sample), clusters: toOrig(subPersonas, sample) });
      } catch {
        // skip a failed resample
      }
    }
    return surpriseClusterings;
  };

  interface CoResample {
    res: PersonaAnalysisResult;
    subResp: PersonaRespondent[];
    subPrep: PreparedData;
    sampleIdx: number[];
  }
  let coResamples: CoResample[] | null = null;
  const getCoResamples = (): CoResample[] => {
    if (coResamples) return coResamples;
    coResamples = [];
    for (const sample of resamples) {
      try {
        const subRaw = sample.map((i) => raw[i]);
        const subResp: PersonaRespondent[] = sample.map((orig, pos) => ({ id: `s${pos}`, values: raw[orig] }));
        const subPrep = prepare(subRaw, config.prep, config.granularity, prep.scale);
        const res = clusterCoAgreement(subResp, columnNames);
        if (res) coResamples.push({ res, subResp, subPrep, sampleIdx: sample });
      } catch {
        // skip a failed resample
      }
    }
    return coResamples;
  };

  const coKCache = new Map<number, ResampleClustering[]>();
  const getCoClusteringsAtK = (k: number): ResampleClustering[] => {
    const cached = coKCache.get(k);
    if (cached) return cached;
    const out: ResampleClustering[] = [];
    for (const cr of getCoResamples()) {
      try {
        const sol = solutionAtK(cr.res, k, cr.subResp, columnNames, cr.subPrep, config);
        out.push({ universe: new Set(cr.sampleIdx), clusters: toOrig(sol.personas, cr.sampleIdx) });
      } catch {
        // skip
      }
    }
    coKCache.set(k, out);
    return out;
  };

  // --- Model selection: cohesion gated by stability -----------------------
  let chosen: Candidate | null = null;
  let chosenStab: { perPersona: number[]; overall: number } = { perPersona: [], overall: 0 };
  let chosenScore = -Infinity;
  let alternative: ModelSelection['alternativeBackend'];

  if (candidates.length === 0) {
    warnings.push("Aucune solution exploitable : tous les répondants seraient en classe U.");
  }

  const scored = candidates.map((c) => {
    let clusterings: ResampleClustering[] = [];
    if (resamples.length) {
      clusterings =
        c.backend === 'co-agreement' && c.k != null
          ? getCoClusteringsAtK(c.k)
          : getSurpriseClusterings();
    }
    const stab = clusterings.length
      ? clusteringStability(c.sel.personas, clusterings)
      : { perPersona: c.sel.personas.map(() => 0), overall: 0 };
    // With stability disabled, fall back to cohesion with a light parsimony tilt.
    const score = clusterings.length
      ? combinedScore(c.cohesion, stab.overall)
      : Math.max(0, c.cohesion) - 0.01 * c.sel.personas.length;
    return { c, stab, score };
  });

  // A single all-encompassing persona is not a segmentation — it is the core
  // target's job. We exclude k<2 solutions from the primary contest (they are
  // trivially stable and would otherwise win on noisy data), keeping them only
  // as a last-resort fallback.
  const segmenting = scored.filter((e) => e.c.sel.personas.length >= 2);
  const pool = segmenting.length > 0 ? segmenting : scored;

  // Pick the winner. The combined score already crushes over-segmented, unstable
  // solutions (their stability collapses). Among solutions that are statistically
  // comparable (within NEAR_TIE of the top score), we prefer the FINER one (more
  // personas) — finer personas are more actionable and this matches the data's
  // true granularity when several k are equally well-supported.
  const NEAR_TIE = 0.05;
  const topScore = pool.reduce((m, e) => Math.max(m, e.score), -Infinity);
  if (topScore > 0) {
    const contenders = pool
      .filter((e) => e.score >= topScore * (1 - NEAR_TIE))
      .sort(
        (a, b) =>
          b.c.sel.personas.length - a.c.sel.personas.length ||
          b.score - a.score ||
          b.stab.overall - a.stab.overall
      );
    chosen = contenders[0]?.c ?? null;
    chosenStab = contenders[0]?.stab ?? chosenStab;
    chosenScore = contenders[0]?.score ?? chosenScore;
  } else {
    // Nothing reproducible — fall back to the single best score (parsimony tiebreak).
    for (const entry of pool) {
      const better =
        entry.score > chosenScore + 1e-9 ||
        (Math.abs(entry.score - chosenScore) <= 1e-9 &&
          chosen !== null &&
          entry.c.sel.personas.length < chosen.sel.personas.length);
      if (better) {
        chosen = entry.c;
        chosenStab = entry.stab;
        chosenScore = entry.score;
      }
    }
  }

  // Best candidate from the OTHER backend, for the auto comparison panel.
  if (config.backend === 'auto' && chosen) {
    let altScore = -Infinity;
    for (const entry of scored) {
      if (entry.c.backend === chosen.backend) continue;
      if (entry.score > altScore) {
        altScore = entry.score;
        alternative = {
          backend: entry.c.backend,
          subspaceSilhouette: entry.c.cohesion,
          personaCount: entry.c.sel.personas.length,
        };
      }
    }
  }

  const sel: SelectionOutput = chosen?.sel ?? { personas: [], noise: { memberIndices: [], members: [], reasons: [], fraction: 0 }, soft: [], coverage: 0 };
  const personas = sel.personas;
  const backendUsed: ConcreteBackend = chosen?.backend ?? 'surprise';
  const subspaceSilhouette = chosen?.cohesion ?? 0;
  const overallStability = chosenStab.overall;
  personas.forEach((per, g) => {
    per.stability = chosenStab.perPersona[g] ?? 0;
  });

  // --- Step 5: Pareto front (reuse mined patterns; cheap) -----------------
  const paretoFront: ParetoSolution[] = PARETO_LAMBDAS.map(({ lambda, label }) => {
    const cfg = { ...config, lambda, stabilityRuns: 0 };
    const s = computeSolution(patterns, prep, respondents, columnNames, cfg);
    const sil = computeSubspaceCohesion(s.personas, prep, n);
    const avgSpec =
      s.personas.length > 0
        ? s.personas.reduce((acc, per) => acc + per.subspace.length / Math.max(1, p), 0) /
          s.personas.length
        : 0;
    const avgSurprise =
      s.personas.length > 0
        ? s.personas.reduce((acc, per) => acc + per.surprise, 0) / s.personas.length
        : 0;
    const score = 0.6 * Math.max(0, sil) + 0.4 * s.coverage;
    return {
      lambda,
      label,
      personaCount: s.personas.length,
      coverage: parseFloat(s.coverage.toFixed(2)),
      avgSpecificity: parseFloat(avgSpec.toFixed(2)),
      avgSurprise: parseFloat(avgSurprise.toFixed(2)),
      subspaceSilhouette: sil,
      score: parseFloat(score.toFixed(3)),
    };
  });

  // --- Finalize core-target verdict ---------------------------------------
  const verdict = coreTargetVerdict(coreTarget, personas.length);
  coreTarget.isSingleArchetype = verdict.isSingleArchetype;
  coreTarget.verdict = verdict.verdict;

  // --- Validation (only if ground truth is present) -----------------------
  let validation: ValidationReport | null = null;
  if (input.truthLabels && input.truthLabels.some((t) => t != null)) {
    const found = hardLabels(personas, n);
    const idx: number[] = [];
    input.truthLabels.forEach((t, i) => {
      if (t != null) idx.push(i);
    });
    const truthFiltered = idx.map((i) => input.truthLabels![i] as string);
    const foundFiltered = idx.map((i) => found[i]);
    const scores = scorePartition(foundFiltered, truthFiltered);
    validation = {
      truthLabels: input.truthLabels.map((t) => t ?? 'U'),
      v2: scores,
      baselines: [], // filled on demand by runHarness (keeps the main run fast)
    };
  }

  // --- Pipeline step summaries (transparency) -----------------------------
  const steps: PipelineStep[] = [
    {
      id: 'prep',
      title: 'Préparation',
      why: "Mettre les réponses sur une base comparable avant de chercher des groupes.",
      summary:
        config.prep === 'raw'
          ? `Données brutes (aucune normalisation). ${p} questions, ${n} répondants.`
          : config.prep === 'ipsative'
            ? `Ipsatisation active : chaque répondant centré sur sa moyenne.`
            : `Standardisation par item active.`,
    },
    {
      id: 'core-target',
      title: 'Cœur de cible',
      why: "Décrire le profil global majoritaire — l'outil ne renvoie jamais un écran vide.",
      summary: `${coreTarget.consensusItems.length} question(s) consensuelle(s) (≥ ${Math.round(
        coreTarget.consensusThreshold * 100
      )} %).`,
    },
    {
      id: 'mining',
      title: 'Motifs surprenants',
      why: "Repérer les combinaisons de réponses bien plus fréquentes que le hasard.",
      summary: `${mining.patternsKept} motifs retenus sur ${mining.candidatesEvaluated} candidats (profondeur max ${mining.maxDepthReached}).`,
    },
    {
      id: 'selection',
      title: 'Sélection (curseur λ)',
      why: "Arbitrer couverture ↔ spécificité, sans figer le compromis dans le code.",
      summary: `${personas.length} persona(s) retenu(s) · λ = ${config.lambda.toFixed(2)}.`,
    },
    {
      id: 'assignment',
      title: 'Assignation + classe U',
      why: "Droit d'exclure : un répondant qui ne matche rien va dans U, pas de force.",
      summary: `${Math.round(sel.coverage * 100)} % assignés · ${sel.noise.memberIndices.length} en classe U.`,
    },
    {
      id: 'model-selection',
      title: 'Qualité & stabilité',
      why: "Juger les personas sur leur propre sous-espace, et vérifier qu'ils résistent au rééchantillonnage.",
      summary:
        `Moteur « ${backendUsed === 'co-agreement' ? 'co-accord' : 'surprise'} »` +
        (config.backend === 'auto' && alternative
          ? ` (auto : silhouette ${subspaceSilhouette} vs ${alternative.subspaceSilhouette})`
          : '') +
        ` · silhouette subspace ${subspaceSilhouette} · stabilité ${overallStability}.`,
    },
  ];
  if (validation) {
    steps.push({
      id: 'validation',
      title: 'Validation (vérité terrain)',
      why: "Mesurer l'écart aux personas réels — ce que le module actuel ne fait pas.",
      summary: `ARI ${validation.v2.ari} · pureté ${validation.v2.purity} · NMI ${validation.v2.nmi}.`,
    });
  }

  return {
    config,
    backendUsed,
    columnNames,
    respondents,
    bandInfo: prep.bandInfo,
    scale: prep.scale,
    coreTarget,
    mining,
    personas,
    noise: sel.noise,
    soft: sel.soft,
    modelSelection: {
      subspaceSilhouette,
      stability: overallStability,
      coverage: parseFloat(sel.coverage.toFixed(2)),
      paretoFront,
      perK: coPerK,
      alternativeBackend: alternative,
    },
    validation,
    steps,
    elapsedMs: Math.round(now() - t0),
    warnings,
  };
}
