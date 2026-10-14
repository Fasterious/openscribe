import { z } from 'zod'

/**
 * L'Observatoire : des synthèses publiques de consultations citoyennes en
 * données ouvertes, choisies pour faire écho à l'actualité. Chaque synthèse est
 * publiée deux fois : une page statique lisible et indexable (`page`) et le
 * fichier de synthèse (`file`) qu'on ouvre dans l'application pour remonter
 * de chaque phrase jusqu'aux verbatims.
 *
 * Règles de méthode : docs/OBSERVATOIRE.md.
 */
const PublicStudySchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** Pourquoi ce sujet cette semaine : l'actualité choisit le sujet, jamais la réponse. */
  news: z.string().min(1),
  question: z.string().min(1),
  source: z.object({ name: z.string(), url: z.string().url(), license: z.string(), period: z.string() }),
  /** Réponses retenues après retrait du vide et des copier-coller, et taille de l'échantillon tiré au sort. */
  population: z.number().int().positive(),
  sample: z.number().int().positive(),
  /** Marge d'erreur à 95 % en points (0 quand toute la population est analysée). */
  margin: z.number().min(0),
  summary: z.string().min(1),
  /** Comment l'échantillon a été tiré et pourquoi cette taille suffit, en langage simple (chiffres compris). */
  sampling: z.string().optional(),
  warnings: z.array(z.string()).min(1),
  file: z.string().regex(/^[a-z0-9-]+\.openscribe\.json$/),
  page: z.string().regex(/^[a-z0-9-]+\.html$/),
})
export type PublicStudy = z.infer<typeof PublicStudySchema>

const IndexSchema = z.object({ studies: z.array(PublicStudySchema) })

/** Lit l'index publié ; la plus récente d'abord. Un index invalide lève une erreur plutôt que d'afficher n'importe quoi. */
export function parseObservatoryIndex(json: unknown): PublicStudy[] {
  return [...IndexSchema.parse(json).studies].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}

/** « 378 réponses tirées au sort parmi 21 868 (marge ± 5 points) » ou « les 120 réponses ». */
export function sampleLine(s: Pick<PublicStudy, 'population' | 'sample' | 'margin'>): string {
  const fr = (n: number) => n.toLocaleString('fr-FR').replace(/ /g, ' ')
  if (s.sample >= s.population) return `Les ${fr(s.population)} réponses, toutes analysées`
  return `${fr(s.sample)} réponses tirées au sort parmi ${fr(s.population)} (marge d'erreur ± ${String(s.margin).replace('.', ',')} points)`
}
