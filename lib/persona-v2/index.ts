// Persona V2 — public API.
//
// A new, separate engine (A4). The v1 module (lib/persona/clustering.ts) is left
// untouched as reference / demo / baseline. Nothing here modifies it.

export { runPersonaV2 } from './engine';
export { prepare, normalize, inferScale } from './prep';
export { minePatterns } from './mining';
export { scoreSurprise, binomUpperTail } from './surprise';
export { selectAndAssign, selectPersonaPatterns, assignRespondents } from './selection';
export { computeCoreTarget, coreTargetVerdict } from './core-target';
export { computeSubspaceCohesion } from './subspace';
export { bootstrapStability, clusteringStability, makeResamples } from './stability';
export { consolidatePersonas, patternFromPredicates, profileFromMembers } from './consolidate';
export { coAgreementBackend } from './co-agreement';
export { GLOSSARY, getGlossary } from './glossary';

// Validation
export { scorePartition, adjustedRandIndex, purity, nmi } from './validation/metrics';
export { runHarness, computeBaselines } from './validation/harness';
export { generateSynthetic, DEFAULT_SYNTHETIC } from './validation/synthetic';
export { kModesLabels, v1Labels, valuesToRespondents } from './validation/baselines';

export type * from '@/types/persona-v2';
