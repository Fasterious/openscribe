// Step 0 — Core target (cœur de cible), the dual-regime answer (A1, §4.0).
//
// Before searching for sub-personas, describe the global majority profile:
// on which questions a large majority converges, and in which direction.
// This is a plain count that works even when everyone answers alike — so the
// tool never returns an empty screen. If no sub-personas detach from this core,
// the core target IS the answer ("a single archetype = your product-market fit").

import type { CoreTarget, CoreTargetItem } from '@/types/persona-v2';
import type { PreparedData } from './prep';

export function computeCoreTarget(
  prep: PreparedData,
  columnNames: string[],
  consensusThreshold = 0.7
): CoreTarget {
  const { levels, raw, marginals, bandInfo } = prep;
  const n = levels.length;
  const p = levels[0]?.length ?? 0;

  const allItems: CoreTargetItem[] = [];
  for (let v = 0; v < p; v++) {
    // Dominant band = the band most respondents fall into.
    let bestBand = 0;
    let bestFrac = -1;
    for (let b = 0; b < marginals[v].length; b++) {
      if (marginals[v][b] > bestFrac) {
        bestFrac = marginals[v][b];
        bestBand = b;
      }
    }
    const meanValue = n > 0 ? raw.reduce((s, r) => s + r[v], 0) / n : 0;
    allItems.push({
      varIdx: v,
      columnName: columnNames[v] ?? `C${v + 1}`,
      band: bestBand,
      direction: bandInfo.directions[bestBand] ?? 'mid',
      consensus: bestFrac,
      meanValue: parseFloat(meanValue.toFixed(2)),
    });
  }

  const consensusItems = allItems
    .filter((it) => it.consensus >= consensusThreshold)
    .sort((a, b) => b.consensus - a.consensus);

  return {
    consensusItems,
    allItems: [...allItems].sort((a, b) => b.consensus - a.consensus),
    consensusThreshold,
    isSingleArchetype: false, // finalized by the engine once personas are known
    verdict: '',
  };
}

/** Once selection is done, turn persona count into a plain-language verdict. */
export function coreTargetVerdict(
  core: CoreTarget,
  personaCount: number
): { isSingleArchetype: boolean; verdict: string } {
  const isSingleArchetype = personaCount <= 1;
  const strong = core.consensusItems.length;

  if (personaCount === 0) {
    return {
      isSingleArchetype: true,
      verdict:
        strong > 0
          ? `Aucun sous-persona ne se détache : ta population forme un seul archétype, défini par ${strong} question(s) consensuelle(s). C'est ton cœur de cible.`
          : "Aucun sous-persona net et peu de consensus fort : les réponses sont dispersées, sans structure de groupe claire.",
    };
  }
  if (personaCount === 1) {
    return {
      isSingleArchetype: true,
      verdict:
        "Un seul persona se détache du cœur de cible : ta population est largement homogène autour d'un profil dominant.",
    };
  }
  return {
    isSingleArchetype: false,
    verdict: `${personaCount} sous-personas se détachent du cœur de cible (${strong} question(s) de consensus global).`,
  };
}
