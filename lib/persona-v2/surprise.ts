// Statistical surprise: judge a pattern by how far it departs from chance,
// not by raw support (§2.3, §4.2).
//
// Under an independence null, a pattern of predicates with marginals p_1..p_m
// is satisfied by e = n · ∏ p_k respondents in expectation. We compare the
// observed count o to e via:
//   - lift = o / e               ("how many times more than chance")
//   - tailProb = P(Binomial(n, e/n) ≥ o)   (rigorous, size-aware)
//   - surprise = -log10(tailProb)          (bigger = more surprising)
//
// The binomial tail is computed exactly in log-space (stable), with a normal
// approximation fallback for very large n (speed).

const LANCZOS_G = 7;
const LANCZOS_C = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028,
  771.32342877765313, -176.61502916214059, 12.507343278686905,
  -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
];

function lgamma(x: number): number {
  if (x < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
  }
  x -= 1;
  let a = LANCZOS_C[0];
  const t = x + LANCZOS_G + 0.5;
  for (let i = 1; i < LANCZOS_G + 2; i++) a += LANCZOS_C[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

function logChoose(n: number, k: number): number {
  if (k < 0 || k > n) return -Infinity;
  return lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1);
}

function logSumExp(a: number, b: number): number {
  if (a === -Infinity) return b;
  if (b === -Infinity) return a;
  const m = Math.max(a, b);
  return m + Math.log(Math.exp(a - m) + Math.exp(b - m));
}

function logBinomPmf(n: number, k: number, p: number): number {
  if (p <= 0) return k === 0 ? 0 : -Infinity;
  if (p >= 1) return k === n ? 0 : -Infinity;
  return logChoose(n, k) + k * Math.log(p) + (n - k) * Math.log(1 - p);
}

// Standard normal CDF (Abramowitz–Stegun 7.1.26 via erf).
function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t *
      Math.exp(-ax * ax);
  return sign * y;
}

function normalUpperTail(z: number): number {
  return 0.5 * (1 - erf(z / Math.SQRT2));
}

/** P(X ≥ k) for X ~ Binomial(n, p). Returns a probability in [0,1]. */
export function binomUpperTail(n: number, k: number, p: number): number {
  if (k <= 0) return 1;
  if (k > n) return 0;
  if (p <= 0) return 0;
  if (p >= 1) return 1;

  // Normal approximation for large n (continuity-corrected) — keeps mining fast.
  if (n > 1500) {
    const mu = n * p;
    const sigma = Math.sqrt(n * p * (1 - p)) || 1e-9;
    const z = (k - 0.5 - mu) / sigma;
    return Math.min(1, Math.max(0, normalUpperTail(z)));
  }

  // Exact: sum pmf from k to n in log space, terminating once terms vanish.
  let logAcc = -Infinity;
  let logTerm = logBinomPmf(n, k, p);
  const mode = (n + 1) * p;
  for (let j = k; j <= n; j++) {
    logAcc = logSumExp(logAcc, logTerm);
    // ratio pmf(j+1)/pmf(j) = (n-j)/(j+1) * p/(1-p)
    if (j < n) {
      logTerm += Math.log((n - j) / (j + 1)) + Math.log(p / (1 - p));
    }
    if (j > mode && logTerm < logAcc - 36) break; // negligible remainder
  }
  return Math.min(1, Math.exp(logAcc));
}

export interface SurpriseResult {
  expected: number;
  lift: number;
  tailProb: number;
  surprise: number;
}

/**
 * Score an observed count against the independence null.
 * @param n          total respondents
 * @param observed   respondents satisfying the pattern
 * @param marginals  per-predicate marginal satisfaction rates p_k
 */
export function scoreSurprise(
  n: number,
  observed: number,
  marginals: number[]
): SurpriseResult {
  const pProd = marginals.reduce((acc, p) => acc * p, 1);
  const expected = n * pProd;
  const lift = expected > 0 ? observed / expected : observed > 0 ? Infinity : 1;
  const tailProb = binomUpperTail(n, observed, pProd);
  // Clamp tiny probabilities to avoid Infinity; cap surprise for stable sorting.
  const safeTail = Math.max(tailProb, 1e-300);
  const surprise = Math.min(300, -Math.log10(safeTail));
  return { expected, lift, tailProb, surprise };
}
