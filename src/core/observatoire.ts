import type { AnalysisState, Idea } from './analysis/types'
import { maskNames, maskWithOffsets, remainingNames } from './analysis/names'
import type { Contribution } from './corpus'
import { randomId } from './ids'
import type { Project } from './project'

/**
 * Une étude de l'Observatoire telle qu'on la publie : lisible dans l'application (rapport interactif, réponse
 * entière autour de chaque verbatim), prénoms masqués dans TOUT le texte publié, réponses entières comprises.
 * Ni la liste des prénoms, ni les réponses du moteur ne sont publiées.
 */
export interface PublishedStudy {
  slug: string
  title: string
  publishedAt: string
  news: string
  /** La fiche : ce qu'on lit avant le rapport (en bref, la question, les données, avant de lire). */
  fiche: {
    summary: string
    question: string
    /** Où se trouvait la question dans le questionnaire (facultatif). */
    questionContext?: string
    /** Toutes les questions du questionnaire, dans l'ordre, et la place de celle qu'on analyse (facultatif). */
    questionnaire?: string[]
    questionIndex?: number
    /** Comment les données ont été recueillies, puis publiées (facultatif). */
    collection?: string
    source: { name: string; url: string; period: string; license: string }
    /** L'échantillon et sa marge, en une phrase. */
    sample: string
    sampling: string
    warnings: string[]
  }
  project: Project
}

/** Remplace chaque texte d'une valeur JSON par sa version masquée. */
function maskDeep<T>(value: T, mask: (t: string) => string): T {
  if (typeof value === 'string') return mask(value) as T
  if (Array.isArray(value)) return value.map((v) => maskDeep(v, mask)) as T
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, maskDeep(v, mask)])) as T
  return value
}

/**
 * Prépare l'étude publiée. Les positions des citations sont recalculées dans les réponses masquées : le clic sur
 * un verbatim montre toujours le bon passage. Lève une erreur si un prénom subsiste où que ce soit.
 */
export function publishedStudy(project: Project, analysis: AnalysisState, meta: Omit<PublishedStudy, 'project'>): PublishedStudy {
  const names = analysis.names ?? []
  const mask = (t: string) => maskNames(t, names)
  const offsets = new Map<string, (pos: number) => number>()
  const contributions: Contribution[] = project.corpus.contributions.map((c) => {
    const m = maskWithOffsets(c.text, names)
    offsets.set(c.id, m.at)
    return { ...maskDeep({ ...c, text: '' }, mask), text: m.text }
  })
  const moved = (i: Idea): Idea => {
    const at = offsets.get(i.contributionId) ?? ((p: number) => p)
    const span = { start: at(i.span.start), end: at(i.span.end) }
    return { ...maskDeep(i, mask), span, ...(i.parts ? { parts: i.parts.map((p) => ({ start: at(p.start), end: at(p.end) })) } : {}) }
  }
  const masked: AnalysisState = {
    ...maskDeep(analysis, mask),
    ideas: analysis.ideas.map(moved),
    // Déjà masqué : la liste des prénoms ne part pas avec l'étude, et l'affichage n'a plus rien à masquer.
    names: [],
    // L'Observatoire montre l'algorithme seul, sans intervention humaine : pas de marque « à vérifier » (Arnaud, 25/10).
    settings: { ...analysis.settings, maskNames: false, doubtMarks: false },
    cacheKeys: [],
  }
  const study: PublishedStudy = {
    ...maskDeep(meta, mask),
    project: {
      ...project,
      // Le titre publié, pas le nom de travail de la synthèse.
      name: meta.title,
      // La source porte son nom public (« Grand débat national »), pas celui du fichier de travail.
      corpus: {
        ...maskDeep({ ...project.corpus, contributions: [] }, mask),
        sources: project.corpus.sources.map((x) => ({ ...x, name: meta.fiche.source.name || x.name })),
        contributions,
      },
      analyses: [masked],
    },
  }
  const left = remainingNames(JSON.stringify(study), names)
  if (left.length) throw new Error(`Prénom encore présent dans l'étude publiée (${left.length}) : publication refusée.`)
  return study
}

/** La marque de l'exemple, en tête de sa description : l'exemple se reconnaît et se remplace quand une étude plus récente paraît. */
export const EXAMPLE_MARK = "Exemple tiré de l'Observatoire"

/**
 * L'exemple de la Synthèse : la dernière étude publiée de l'Observatoire, de vraies données (Arnaud, 25/10), ouverte
 * comme une synthèse. Elle garde sa fiche (« Avant de lire ») ; les marques « à vérifier », coupées à la publication,
 * reviennent : dans la Synthèse, le lecteur reprend la main.
 */
export function exampleProject(study: PublishedStudy): Project {
  return {
    ...study.project,
    id: randomId('prj'),
    name: study.title,
    description: `${EXAMPLE_MARK} : ${study.title}`,
    brief: study.fiche,
    analyses: study.project.analyses.map((a) => {
      const { doubtMarks: _published, ...settings } = a.settings
      return { ...a, settings }
    }),
  }
}
