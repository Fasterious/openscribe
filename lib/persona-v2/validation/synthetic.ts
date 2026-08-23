// Synthetic data generator with known ground truth (§5.2).
//
// Knobs let us turn the audio's open questions into curves (ARI vs each knob):
//   - n, p, number of true personas
//   - UNEQUAL persona sizes (the demo's perfect 10×5 hides this weakness)
//   - discriminating vars per persona, injected NOISE vars
//   - % random respondents (trolls → ground-truth class 'U')
//   - response-style intensity (over/under-estimators) to test ipsatisation

export interface SyntheticParams {
  n: number;
  p: number;
  truePersonas: number;
  scaleMax: number;
  /** Discriminating variables per persona. */
  dimsPerPersona: number;
  /** Variables that are pure noise for everyone. */
  noiseVars: number;
  /** Fraction of respondents that answer at random (outliers → class U). */
  randomFrac: number;
  /** 0..1 intensity of response-style shift (over/under estimation). */
  styleIntensity: number;
  /** Make persona sizes unequal (geometric) when true. */
  unequalSizes: boolean;
  /** Cohesion of members on their subspace (0..1): higher = tighter. */
  cohesion: number;
  seed: number;
}

export const DEFAULT_SYNTHETIC: SyntheticParams = {
  n: 200,
  p: 16,
  truePersonas: 4,
  scaleMax: 5,
  dimsPerPersona: 4,
  noiseVars: 4,
  randomFrac: 0.1,
  styleIntensity: 0,
  unequalSizes: true,
  cohesion: 0.85,
  seed: 42,
};

export interface SyntheticData {
  values: number[][];
  labels: string[];
  columnNames: string[];
  params: SyntheticParams;
  /** Which vars discriminate which persona (for inspection). */
  blueprint: { persona: string; vars: number[]; targetBand: ('low' | 'high')[] }[];
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clampScale(v: number, max: number): number {
  return Math.max(1, Math.min(max, Math.round(v)));
}

export function generateSynthetic(partial: Partial<SyntheticParams> = {}): SyntheticData {
  const params = { ...DEFAULT_SYNTHETIC, ...partial };
  const { n, p, truePersonas, scaleMax, dimsPerPersona, randomFrac, styleIntensity, unequalSizes, cohesion } = params;
  const rand = mulberry32(params.seed);
  const randInt = (max: number) => Math.floor(rand() * max);

  // Persona sizes.
  const nRandom = Math.round(n * randomFrac);
  const nStructured = n - nRandom;
  let sizes: number[] = [];
  if (unequalSizes) {
    const weights = Array.from({ length: truePersonas }, (_, i) => 1 / (i + 1));
    const wsum = weights.reduce((a, b) => a + b, 0);
    sizes = weights.map((w) => Math.max(1, Math.round((w / wsum) * nStructured)));
  } else {
    sizes = Array.from({ length: truePersonas }, () => Math.round(nStructured / truePersonas));
  }
  // Fix rounding drift.
  let drift = nStructured - sizes.reduce((a, b) => a + b, 0);
  for (let i = 0; drift !== 0 && i < sizes.length; i = (i + 1) % sizes.length) {
    if (drift > 0) { sizes[i]++; drift--; } else if (sizes[i] > 1) { sizes[i]--; drift++; }
  }

  // Assign each persona a subspace + target direction.
  const blueprint = Array.from({ length: truePersonas }, (_, g) => {
    const vars: number[] = [];
    const used = new Set<number>();
    while (vars.length < Math.min(dimsPerPersona, p)) {
      const v = randInt(p);
      if (!used.has(v)) { used.add(v); vars.push(v); }
    }
    const targetBand = vars.map(() => (rand() < 0.5 ? 'low' : 'high') as 'low' | 'high');
    return { persona: `P${g + 1}`, vars, targetBand };
  });

  const values: number[][] = [];
  const labels: string[] = [];

  const drawNoise = () => clampScale(1 + rand() * (scaleMax - 1), scaleMax);
  const drawTarget = (dir: 'low' | 'high') => {
    // With probability ~cohesion, answer in the target extreme; else slip.
    const center = dir === 'high' ? scaleMax : 1;
    const off = dir === 'high' ? scaleMax - 1 : 2;
    const v = rand() < cohesion ? center - (dir === 'high' ? rand() * 0.8 : -rand() * 0.8) : off + (rand() - 0.5) * 2;
    return clampScale(v, scaleMax);
  };

  for (let g = 0; g < truePersonas; g++) {
    for (let s = 0; s < sizes[g]; s++) {
      const row = Array.from({ length: p }, () => drawNoise());
      blueprint[g].vars.forEach((v, k) => {
        row[v] = drawTarget(blueprint[g].targetBand[k]);
      });
      // Response style: shift this respondent's whole row up/down.
      if (styleIntensity > 0 && rand() < 0.5) {
        const shift = (rand() < 0.5 ? -1 : 1) * styleIntensity * (scaleMax - 1) * 0.5;
        for (let v = 0; v < p; v++) row[v] = clampScale(row[v] + shift, scaleMax);
      }
      values.push(row);
      labels.push(`P${g + 1}`);
    }
  }

  // Random respondents → ground-truth class U.
  for (let r = 0; r < nRandom; r++) {
    values.push(Array.from({ length: p }, () => drawNoise()));
    labels.push('U');
  }

  // Shuffle rows so order doesn't leak the structure.
  const order = values.map((_, i) => i).sort(() => rand() - 0.5);
  const shuffledValues = order.map((i) => values[i]);
  const shuffledLabels = order.map((i) => labels[i]);

  const columnNames = Array.from({ length: p }, (_, i) => `Q${i + 1}`);
  return { values: shuffledValues, labels: shuffledLabels, columnNames, params, blueprint };
}
