// Persona V2 — types for the refactored engine.
//
// Design goals (see docs/persona/THESE-PERSONA-V3.md):
//  - explicit, inspectable pipeline (every intermediate result is reported);
//  - surprise-based scoring instead of a hidden fixed formula;
//  - a real "noise" class U (the right to exclude respondents);
//  - subspace-aware quality + bootstrap stability;
//  - dual regime: always describe the global "core target" first, then sub-personas;
//  - optional, reversible normalization (ipsatisation OFF by default).
//
// The engine is pure TypeScript (no LLM, no network) so it stays auditable and
// testable — aligned with OpenScribe's "no single black box" value.

import type { PersonaCluster, PersonaRespondent } from './persona';

export type { PersonaRespondent } from './persona';

// --- Configuration --------------------------------------------------------

/** How raw Likert values are transformed before mining. */
export type PrepMode = 'raw' | 'ipsative' | 'item-z';

/** How prepared values are bucketed into directional predicates. */
export type Granularity = 'lmh' | 'fine';

/** Which statistic drives pattern ranking. */
export type ScoreMode = 'surprise' | 'support';

/** Hard (one persona per respondent) vs soft (membership weights) reporting. */
export type MembershipMode = 'hard' | 'soft';

/**
 * Clustering backend.
 *  - 'surprise'     : surprise-scored subspace pattern mining (robust to noise/high-p);
 *  - 'co-agreement' : the v1 ±1 co-agreement "gold", re-judged subspace-aware (great on clean Likert);
 *  - 'auto'         : run both, keep the one with the better subspace silhouette.
 */
export type Backend = 'surprise' | 'co-agreement' | 'auto';

export interface PersonaV2Config {
  /** Which clustering backend to use. Default 'auto'. */
  backend: Backend;
  /** Optional normalization applied before mining. Default 'raw' (A2: OFF by default). */
  prep: PrepMode;
  /** Predicate granularity: 3 bands (low/mid/high) or per-value. */
  granularity: Granularity;
  /** Score patterns by statistical surprise or by raw support. */
  scoreMode: ScoreMode;
  /** Enable the noise class U (confidence-based exclusion). */
  useNoiseClass: boolean;
  /** Membership reporting mode for the UI. */
  membership: MembershipMode;
  /** Minimum group size as a fraction of n (relative actionability threshold). */
  minSizeFrac: number;
  /** Absolute floor for group size (never below this many members). */
  minSizeAbs: number;
  /** Minimum number of discriminating variables for a describable persona (τ_dim). */
  minDims: number;
  /** Coverage↔specificity trade-off. 0 = specific/pure, 1 = broad/coverage. */
  lambda: number;
  /** Significance threshold on the binomial tail probability. */
  alpha: number;
  /** Minimum lift (observed / expected) for a pattern to count as surprising. */
  minLift: number;
  /** Max predicates combined in a pattern (depth cap, anti-explosion). */
  maxPatternLen: number;
  /** Max personas to surface. */
  maxPersonas: number;
  /** Confidence threshold (0..1) below which a respondent falls into U. */
  assignConfidence: number;
  /** Bootstrap runs for stability (0 disables). */
  stabilityRuns: number;
  /** Maximum Jaccard overlap allowed between two selected personas. */
  maxOverlap: number;
}

export const DEFAULT_V2_CONFIG: PersonaV2Config = {
  backend: 'auto',
  prep: 'raw',
  granularity: 'lmh',
  scoreMode: 'surprise',
  useNoiseClass: true,
  membership: 'hard',
  minSizeFrac: 0.07,
  minSizeAbs: 3,
  minDims: 2,
  lambda: 0.5,
  alpha: 0.05,
  minLift: 1.25,
  maxPatternLen: 6,
  maxPersonas: 8,
  assignConfidence: 0.5,
  stabilityRuns: 12,
  maxOverlap: 0.6,
};

// --- Predicates & bands ---------------------------------------------------

/** A single directional predicate: "item v is in band b". */
export interface Predicate {
  varIdx: number;
  /** Band index into the band labels (e.g. 0=low,1=mid,2=high for 'lmh'). */
  band: number;
}

export interface BandInfo {
  /** Short labels for each band (e.g. ['bas','neutre','haut']). */
  labels: string[];
  /** Human direction per band for the UI (↓ ~ ↑). */
  directions: ('low' | 'mid' | 'high')[];
}

// --- Step 0: core target (cœur de cible) ----------------------------------

export interface CoreTargetItem {
  varIdx: number;
  columnName: string;
  /** Dominant band index. */
  band: number;
  direction: 'low' | 'mid' | 'high';
  /** Fraction of respondents in the dominant band (0..1). */
  consensus: number;
  meanValue: number;
}

export interface CoreTarget {
  /** Items where a majority converges (consensus ≥ threshold), sorted by consensus. */
  consensusItems: CoreTargetItem[];
  /** Every item's dominant band (for a full descriptive profile). */
  allItems: CoreTargetItem[];
  /** Mean number of distinct sub-behaviours detected (informational). */
  consensusThreshold: number;
  /** True when no meaningful sub-personas exist beyond the core profile. */
  isSingleArchetype: boolean;
  /** One-line plain-language verdict. */
  verdict: string;
}

// --- Step 1: mined patterns -----------------------------------------------

export interface MinedPattern {
  predicates: Predicate[];
  /** Respondent indices satisfying all predicates. */
  members: number[];
  support: number;
  /** Expected count under the independence null. */
  expected: number;
  /** observed / expected. */
  lift: number;
  /** -log10(P(X ≥ observed)) under the binomial null; higher = more surprising. */
  surprise: number;
  /** Upper-tail probability (for display / thresholding). */
  tailProb: number;
}

export interface MiningReport {
  candidatesEvaluated: number;
  patternsKept: number;
  /** Top patterns by score (capped for display). */
  top: MinedPattern[];
  maxDepthReached: number;
}

// --- Persona (V2) ---------------------------------------------------------

export interface SubspaceVar {
  varIdx: number;
  columnName: string;
  band: number;
  direction: 'low' | 'mid' | 'high';
  /** Within-group agreement on this variable (0..1, 1 = unanimous). */
  agreement: number;
  meanValue: number;
}

export interface PersonaV2 {
  id: number;
  label: string;
  color: string;
  /** Member respondent indices (into the prepared respondent array). */
  memberIndices: number[];
  members: PersonaRespondent[];
  /** Centroid over ALL items (raw scale) — for radar/heatmap compatibility. */
  centroid: number[];
  /** The discriminating subspace S_g with directions d_g. */
  subspace: SubspaceVar[];
  size: number;
  /** Statistical surprise of the defining pattern. */
  surprise: number;
  lift: number;
  /** Subspace-aware silhouette of this persona (−1..1). */
  cohesion: number;
  /** Fraction of bootstrap runs in which this persona reappears (0..1). */
  stability: number;
  /** Signature vars in the legacy shape, so existing viz components work. */
  signatureVars: PersonaCluster['signatureVars'];
}

// --- Soft membership ------------------------------------------------------

export interface SoftAssignment {
  respondentIndex: number;
  respondentId: string;
  /** Membership weight per persona id (sums ≤ 1; remainder = noise). */
  weights: { personaId: number; weight: number }[];
  /** Hard assignment: persona id, or -1 for the noise class U. */
  hard: number;
  /** Confidence of the hard assignment (0..1). */
  confidence: number;
}

// --- Noise class U --------------------------------------------------------

export interface NoiseClass {
  memberIndices: number[];
  members: PersonaRespondent[];
  /** Plain reason hints per respondent (e.g. "ne matche aucun motif"). */
  reasons: { respondentId: string; reason: string }[];
  fraction: number;
}

// --- Model selection ------------------------------------------------------

export interface ParetoSolution {
  lambda: number;
  personaCount: number;
  coverage: number;
  avgSpecificity: number;
  avgSurprise: number;
  subspaceSilhouette: number;
  /** Composite score used to suggest a default. */
  score: number;
  label: string; // 'fin' | 'moyen' | 'large'
}

export interface ModelSelection {
  /** Mean subspace-aware silhouette across personas (−1..1). */
  subspaceSilhouette: number;
  /** Mean bootstrap stability across personas (0..1). */
  stability: number;
  coverage: number;
  paretoFront: ParetoSolution[];
  /** Per-k subspace silhouette (co-agreement backend model selection). */
  perK?: { k: number; silhouette: number; coverage: number }[];
  /** Subspace silhouette of the backend that was NOT chosen (auto comparison). */
  alternativeBackend?: { backend: Backend; subspaceSilhouette: number; personaCount: number };
}

// --- External validation (when ground truth is available) -----------------

export interface ValidationScores {
  ari: number;
  purity: number;
  nmi: number;
  /** Number of clusters compared. */
  foundK: number;
  trueK: number;
}

export interface BaselineResult {
  name: string;
  scores: ValidationScores;
}

export interface ValidationReport {
  /** Ground-truth labels per respondent (aligned to respondent order). */
  truthLabels: string[];
  /** Scores of THIS V2 run vs ground truth. */
  v2: ValidationScores;
  /** Comparable baselines (v1 engine, k-modes…). */
  baselines: BaselineResult[];
}

// --- Pipeline steps (for the transparent stepper) -------------------------

export type V2StepId =
  | 'prep'
  | 'core-target'
  | 'mining'
  | 'selection'
  | 'assignment'
  | 'model-selection'
  | 'validation';

export interface PipelineStep {
  id: V2StepId;
  title: string;
  /** One-sentence "why this step exists". */
  why: string;
  /** Short status line summarising the outcome. */
  summary: string;
}

// --- Full result ----------------------------------------------------------

export interface PersonaV2Result {
  config: PersonaV2Config;
  /** Backend actually used to produce these personas. */
  backendUsed: Exclude<Backend, 'auto'>;
  columnNames: string[];
  respondents: PersonaRespondent[];
  bandInfo: BandInfo;
  scale: { min: number; max: number };

  coreTarget: CoreTarget;
  mining: MiningReport;
  personas: PersonaV2[];
  noise: NoiseClass;
  soft: SoftAssignment[];
  modelSelection: ModelSelection;
  validation: ValidationReport | null;

  steps: PipelineStep[];
  /** Wall-clock compute time (ms). */
  elapsedMs: number;
  warnings: string[];
}

// --- Input to the engine --------------------------------------------------

export interface PersonaV2Input {
  /** Respondents with raw Likert values (already numeric). */
  respondents: PersonaRespondent[];
  columnNames: string[];
  /** Optional ground-truth labels (e.g. the demo Persona column) — never used
   *  by the engine, only by validation. */
  truthLabels?: (string | null)[];
  /** Likert scale bounds; inferred from data when omitted. */
  scaleMin?: number;
  scaleMax?: number;
}
