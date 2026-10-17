/**
 * Durée estimée d'une synthèse, avant de la lancer.
 *
 * Le nombre de demandes se prévoit à partir du corpus (calé sur ÉcoSol : 20 participants,
 * 90 réponses, 44 à 54 demandes). La durée vient, par ordre de fiabilité :
 * 1. de la vitesse mesurée lors des synthèses déjà faites avec ce moteur et ce modèle ;
 * 2. d'une mesure de référence sur un corpus réel, enregistrée avec le modèle ;
 * 3. à défaut, d'une estimation grossière (une vingtaine de secondes par demande).
 * Le débit autorisé par le fournisseur (demandes par minute) fixe toujours un plancher.
 */

export type EstimateBasis = 'measured' | 'reference' | 'rough'

export interface Estimate {
  calls: number
  seconds: number
  basis: EstimateBasis
}

/** Demandes prévues pour un corpus : extraction par personne, regroupement et rédaction selon le nombre d'idées. */
export function predictedCalls(people: number, answers: number): number {
  const ideas = Math.round(answers * 2.5)
  return Math.round(people * 1.2 + ideas / 10 + 8)
}

export function estimateDuration(
  calls: number,
  speed: { measured?: number; reference?: number; requestsPerMinute: number; concurrency: number },
): Estimate {
  const perCall = speed.measured ?? speed.reference ?? 20 / Math.max(1, speed.concurrency)
  const basis: EstimateBasis = speed.measured !== undefined ? 'measured' : speed.reference !== undefined ? 'reference' : 'rough'
  const floor = (calls / Math.max(1, speed.requestsPerMinute)) * 60
  return { calls, seconds: Math.max(floor, calls * perCall), basis }
}

/**
 * Vitesse observée sur une synthèse qui vient de se terminer : temps écoulé ÷ demandes réellement envoyées
 * (les réponses mémorisées ne comptent pas). Trop peu de demandes : pas de mesure.
 */
export function observedSecondsPerCall(elapsedMs: number, sentCalls: number): number | undefined {
  if (sentCalls < 10 || elapsedMs <= 0) return undefined
  return elapsedMs / 1000 / sentCalls
}

/** Moyenne courante des vitesses mesurées, chaque synthèse comptant autant (les 5 dernières au plus). */
export function blendSpeed(previous: { secondsPerCall: number; runs: number } | undefined, observed: number): { secondsPerCall: number; runs: number } {
  if (!previous) return { secondsPerCall: observed, runs: 1 }
  const runs = Math.min(previous.runs, 4)
  return { secondsPerCall: (previous.secondsPerCall * runs + observed) / (runs + 1), runs: runs + 1 }
}
