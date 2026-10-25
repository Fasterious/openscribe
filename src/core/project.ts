import { z } from 'zod'
import type { AnalysisState } from './analysis/types'
import { CORPUS_FORMAT_VERSION, emptyCorpus, type Corpus } from './corpus'
import { randomId } from './ids'
import type { PublishedStudy } from './observatoire'

/**
 * Un projet = une étude : son corpus, ses analyses, ses réglages.
 *
 * Il vit d'abord sur l'appareil. Il s'exporte en un seul fichier
 * (.openscribe.json) qui contient tout, y compris les réponses du modèle
 * utilisées : ouvert sur un autre ordinateur, il redonne exactement les mêmes
 * résultats sans rappeler le moindre service.
 */

export const PROJECT_FORMAT_VERSION = 1

export interface Project {
  formatVersion: typeof PROJECT_FORMAT_VERSION
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  corpus: Corpus
  /** Questions retenues pour l'analyse (toutes si vide). */
  selectedPrompts: string[]
  analyses: AnalysisState[]
  /** La fiche d'une étude publiée (question, collecte, échantillon, limites), quand la synthèse en vient : l'exemple. */
  brief?: PublishedStudy['fiche']
}

export function newProject(name: string): Project {
  const now = new Date().toISOString()
  return {
    formatVersion: PROJECT_FORMAT_VERSION,
    id: randomId('prj'),
    name: name.trim() || 'Nouvelle étude',
    description: '',
    createdAt: now,
    updatedAt: now,
    corpus: emptyCorpus(),
    selectedPrompts: [],
    analyses: [],
  }
}

/** Le corpus restreint aux questions retenues ; le choix ne porte que sur les questionnaires, jamais sur les entretiens. */
export function corpusForAnalysis(project: Project): Corpus {
  if (!project.selectedPrompts.length) return project.corpus
  const keep = new Set(project.selectedPrompts)
  const surveys = new Set(project.corpus.sources.filter((s) => s.kind === 'survey').map((s) => s.id))
  return {
    ...project.corpus,
    contributions: project.corpus.contributions.filter((c) => !c.prompt || !surveys.has(c.sourceId) || keep.has(c.prompt)),
  }
}

export interface ProjectFile {
  kind: 'openscribe-project'
  formatVersion: typeof PROJECT_FORMAT_VERSION
  exportedAt: string
  project: Project
  /** Réponses du modèle (clé → réponse), pour rejouer l'analyse à l'identique. */
  responses: Record<string, string>
}

export function exportProject(project: Project, responses: Record<string, string>): string {
  const file: ProjectFile = {
    kind: 'openscribe-project',
    formatVersion: PROJECT_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    project,
    responses,
  }
  return JSON.stringify(file, null, 1)
}

const fileSchema = z.object({
  kind: z.literal('openscribe-project'),
  formatVersion: z.number(),
  project: z.object({
    id: z.string(),
    name: z.string(),
    corpus: z.object({
      formatVersion: z.number(),
      sources: z.array(z.any()),
      participants: z.array(z.object({ id: z.string(), label: z.string() }).passthrough()),
      contributions: z.array(
        z.object({ id: z.string(), participantId: z.string(), sourceId: z.string(), text: z.string() }).passthrough(),
      ),
    }),
    analyses: z.array(z.any()),
  }).passthrough(),
  responses: z.record(z.string(), z.string()).optional(),
})

export class ProjectFileError extends Error {}

const NOT_A_STUDY =
  "Ce fichier n'est pas une étude OpenScribe, ou il est abîmé. Choisissez le fichier .openscribe.json sauvegardé avec « Sauvegarder l'étude »."

/**
 * Lit un fichier de projet. Un projet importé reçoit un nouvel identifiant
 * pour ne jamais écraser un projet existant.
 */
export function importProject(text: string): { project: Project; responses: Record<string, string> } {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new ProjectFileError(NOT_A_STUDY)
  }
  const parsed = fileSchema.safeParse(raw)
  if (!parsed.success) throw new ProjectFileError(NOT_A_STUDY)
  if (parsed.data.formatVersion > PROJECT_FORMAT_VERSION || parsed.data.project.corpus.formatVersion > CORPUS_FORMAT_VERSION) {
    throw new ProjectFileError("Cette étude a été créée avec une version plus récente d'OpenScribe. Mettez l'application à jour.")
  }
  const p = parsed.data.project as unknown as Project
  const now = new Date().toISOString()
  return {
    project: {
      ...p,
      formatVersion: PROJECT_FORMAT_VERSION,
      id: randomId('prj'),
      description: p.description ?? '',
      selectedPrompts: p.selectedPrompts ?? [],
      updatedAt: now,
    },
    responses: parsed.data.responses ?? {},
  }
}
