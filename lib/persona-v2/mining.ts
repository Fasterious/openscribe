// Pattern mining (Apriori-style) over directional predicates, scored by surprise.
//
// Improvements over the v1 subspace-cohesion miner:
//  - all bands participate (low/mid/high), so "moderate" personas are no longer
//    inert (the v1 miner only seeded from H/L extremes — §4.2);
//  - patterns are ranked by statistical surprise, not a hidden fixed formula;
//  - near-universal predicates are auto-filtered (consensus is not segmenting);
//  - closed patterns only (collapse nested patterns with identical members) to
//    fight combinatorial explosion and redundancy (§6);
//  - depth + width caps keep it tractable as p grows.

import type {
  MinedPattern,
  MiningReport,
  PersonaV2Config,
  Predicate,
} from '@/types/persona-v2';
import { scoreSurprise } from './surprise';
import type { PreparedData } from './prep';

interface SingleItem {
  pred: Predicate;
  members: number[];
  memberSet: Set<number>;
  marginal: number;
}

interface Itemset {
  preds: Predicate[];
  members: number[];
  marginals: number[];
}

/** Predicates so common they cannot segment anyone are filtered out. */
const MAX_MARGINAL = 0.9;
/** Keep at most this many itemsets per Apriori level (bounded growth). */
const LEVEL_WIDTH_CAP = 6000;

function intersectSorted(parent: number[], childSet: Set<number>): number[] {
  const out: number[] = [];
  for (const m of parent) if (childSet.has(m)) out.push(m);
  return out;
}

export interface MiningOutput {
  report: MiningReport;
  /** All kept (closed, significant) patterns — input to selection. */
  patterns: MinedPattern[];
}

export function minePatterns(prep: PreparedData, config: PersonaV2Config): MiningOutput {
  const { levels, marginals } = prep;
  const n = levels.length;
  const p = levels[0]?.length ?? 0;
  const nBands = prep.bandInfo.labels.length;

  const minSupport = Math.max(
    config.minSizeAbs,
    Math.round(config.minSizeFrac * n)
  );

  // --- Level 1: single predicates -----------------------------------------
  const singles: SingleItem[] = [];
  for (let v = 0; v < p; v++) {
    for (let b = 0; b < nBands; b++) {
      const members: number[] = [];
      for (let i = 0; i < n; i++) if (levels[i][v] === b) members.push(i);
      const marginal = members.length / (n || 1);
      if (members.length >= minSupport && marginal <= MAX_MARGINAL) {
        singles.push({
          pred: { varIdx: v, band: b },
          members,
          memberSet: new Set(members),
          marginal,
        });
      }
    }
  }
  // Stable order by item then band keeps the prefix-extension enumeration unique.
  singles.sort((a, b) =>
    a.pred.varIdx - b.pred.varIdx || a.pred.band - b.pred.band
  );

  let candidatesEvaluated = 0;
  let maxDepthReached = 1;

  // Keyed by member-set signature → keep the most specific (closed) pattern.
  const closedByMembers = new Map<string, Itemset>();

  const registerClosed = (set: Itemset) => {
    const key = set.members.join(',');
    const prev = closedByMembers.get(key);
    if (!prev || set.preds.length > prev.preds.length) {
      closedByMembers.set(key, set);
    }
  };

  // --- Apriori levels via prefix extension --------------------------------
  let current: Itemset[] = singles.map((s) => ({
    preds: [s.pred],
    members: s.members,
    marginals: [s.marginal],
  }));
  current.forEach(registerClosed);

  for (let depth = 1; depth < config.maxPatternLen; depth++) {
    const next: Itemset[] = [];
    for (const set of current) {
      const maxVar = set.preds[set.preds.length - 1].varIdx;
      for (const s of singles) {
        if (s.pred.varIdx <= maxVar) continue; // strictly increasing item index
        candidatesEvaluated++;
        const members = intersectSorted(set.members, s.memberSet);
        if (members.length < minSupport) continue;
        next.push({
          preds: [...set.preds, s.pred],
          members,
          marginals: [...set.marginals, s.marginal],
        });
      }
    }
    if (next.length === 0) break;
    maxDepthReached = depth + 1;

    // Width cap: keep the most promising candidates (highest support) per level.
    next.sort((a, b) => b.members.length - a.members.length);
    const capped = next.slice(0, LEVEL_WIDTH_CAP);
    capped.forEach(registerClosed);
    current = capped;
  }

  // --- Score + significance filter ----------------------------------------
  const kept: MinedPattern[] = [];
  for (const set of closedByMembers.values()) {
    const s = scoreSurprise(n, set.members.length, set.marginals);
    const passSurprise =
      config.scoreMode === 'support'
        ? true
        : s.lift >= config.minLift && s.tailProb <= config.alpha;
    if (!passSurprise) continue;
    kept.push({
      predicates: set.preds,
      members: set.members,
      support: set.members.length,
      expected: s.expected,
      lift: s.lift,
      surprise: s.surprise,
      tailProb: s.tailProb,
    });
  }

  const sortKey = (m: MinedPattern) =>
    config.scoreMode === 'support' ? m.support * 100 + m.predicates.length : m.surprise;
  kept.sort((a, b) => sortKey(b) - sortKey(a) || b.support - a.support);

  const report: MiningReport = {
    candidatesEvaluated,
    patternsKept: kept.length,
    top: kept.slice(0, 14),
    maxDepthReached,
  };

  return { report, patterns: kept };
}
