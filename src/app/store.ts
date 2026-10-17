import { useCallback, useEffect, useState } from 'react'
import { observedSecondsPerCall } from '@/core/analysis/estimate'
import { newAnalysis, runAnalysis } from '@/core/analysis/pipeline'
import type { AnalysisSettings, AnalysisState } from '@/core/analysis/types'
import { corpusForAnalysis, type Project } from '@/core/project'
import { runsLocally } from '@/core/providers/location'
import { methodForModel } from '@/core/providers/presets'
import { getProject, listProjects, responseCache, saveProject } from './db'
import { providerFor, recordSpeed, type EngineConfig } from './engines'

/**
 * Petit magasin d'état : les écrans s'abonnent aux changements d'un projet.
 * Les analyses en cours continuent même si l'on change d'écran.
 */

type Listener = () => void
const listeners = new Map<string, Set<Listener>>()

function emit(key: string) {
  listeners.get(key)?.forEach((l) => l())
  listeners.get('*')?.forEach((l) => l())
}

function subscribe(key: string, l: Listener) {
  if (!listeners.has(key)) listeners.set(key, new Set())
  listeners.get(key)!.add(l)
  return () => {
    listeners.get(key)!.delete(l)
  }
}

// Les écritures d'un même projet sont mises en file : jamais deux écritures concurrentes.
const queues = new Map<string, Promise<unknown>>()
function serial<T>(id: string, fn: () => Promise<T>): Promise<T> {
  const prev = queues.get(id) ?? Promise.resolve()
  const next = prev.then(fn, fn)
  queues.set(id, next.catch(() => undefined))
  return next
}

export async function updateProject(id: string, change: (p: Project) => Project): Promise<Project | undefined> {
  return serial(id, async () => {
    const current = await getProject(id)
    if (!current) return undefined
    const next = change(current)
    await saveProject(next)
    emit(id)
    return next
  })
}

export async function createProject(project: Project): Promise<void> {
  await saveProject(project)
  emit(project.id)
}

export function notifyProjectsChanged() {
  emit('*')
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[] | null>(null)
  useEffect(() => {
    let alive = true
    // Deux lectures peuvent se croiser (dupliquer puis supprimer) : seule la dernière demandée s'affiche, sinon une
    // lecture d'avant la suppression, arrivée après, ferait réapparaître l'étude supprimée.
    let latest = 0
    const refresh = () => {
      const n = ++latest
      return listProjects().then((p) => alive && n === latest && setProjects(p))
    }
    refresh()
    const off = subscribe('*', refresh)
    return () => {
      alive = false
      off()
    }
  }, [])
  return projects
}

export function useProject(id: string) {
  const [project, setProject] = useState<Project | null | undefined>(undefined)
  useEffect(() => {
    let alive = true
    let latest = 0
    const refresh = () => {
      const n = ++latest
      return getProject(id).then((p) => alive && n === latest && setProject(p ?? null))
    }
    refresh()
    const off = subscribe(id, refresh)
    return () => {
      alive = false
      off()
    }
  }, [id])
  const update = useCallback((change: (p: Project) => Project) => updateProject(id, change), [id])
  return { project, update }
}

// ─── Analyses en cours ───────────────────────────────────────────────────────

const running = new Map<string, AbortController>()

export function isRunning(projectId: string): boolean {
  return running.has(projectId)
}

// Message passager pendant une analyse (fournisseur saturé ou injoignable).
const notices = new Map<string, string>()

export function useRunNotice(projectId: string): string | undefined {
  const [value, setValue] = useState(notices.get(projectId))
  useEffect(() => subscribe(`run:${projectId}`, () => setValue(notices.get(projectId))), [projectId])
  return value
}

export function useIsRunning(projectId: string): boolean {
  const [value, setValue] = useState(isRunning(projectId))
  useEffect(() => subscribe(`run:${projectId}`, () => setValue(isRunning(projectId))), [projectId])
  return value
}

/**
 * Lance une nouvelle analyse, ou reprend `resume` là où elle s'était arrêtée.
 * L'état est enregistré à chaque étape : fermer l'onglet ne fait perdre que la demande en cours.
 */
export async function startAnalysis(
  projectId: string,
  engine: EngineConfig,
  settings: AnalysisSettings,
  resume?: AnalysisState,
): Promise<void> {
  if (running.has(projectId)) return
  // Mode Confidentiel : le code refuse tout moteur en ligne, quoi qu'affiche l'écran.
  if ((resume?.settings.confidential ?? settings.confidential) && !runsLocally(engine.baseUrl)) return
  const project = await getProject(projectId)
  if (!project) return
  const corpus = corpusForAnalysis(project)
  const provider = providerFor(engine, 4, ({ waitMs, error }) => {
    notices.set(projectId, `${error.message} Nouvel essai dans ${Math.round(waitMs / 1000)} s…`)
    emit(`run:${projectId}`)
  })
  // Garde-fou : on ne reprend jamais une analyse avec un autre moteur que le sien.
  const sameEngine = resume && resume.engine.presetId === provider.fingerprint.presetId && resume.engine.model === provider.fingerprint.model
  const initial = sameEngine ? resume : await newAnalysis(corpus, { ...settings, method: methodForModel(engine.presetId, engine.model) }, provider)
  const controller = new AbortController()
  running.set(projectId, controller)
  emit(`run:${projectId}`)

  const store = (state: AnalysisState) => {
    if (notices.delete(projectId)) emit(`run:${projectId}`)
    return updateProject(projectId, (p) => {
      const all = [state, ...p.analyses.filter((a) => a.id !== state.id)]
      const kept = all.slice(0, 5)
      // On ne perd jamais le dernier rapport terminé, même après plusieurs relances ratées.
      const lastDone = all.find((a) => a.status === 'done')
      if (lastDone && !kept.includes(lastDone)) kept[kept.length - 1] = lastDone
      return { ...p, analyses: kept }
    })
  }

  const sentBefore = initial.calls.total - initial.calls.cached
  const startedAt = Date.now()
  try {
    await store({ ...initial, status: 'running' })
    const final = await runAnalysis(corpus, initial, {
      provider,
      cache: responseCache,
      signal: controller.signal,
      concurrency: engine.concurrency,
      onUpdate: (s) => store(s).then(() => undefined),
    })
    // Vitesse réelle de ce moteur, pour estimer la durée des prochaines synthèses.
    const perCall = final.status === 'done' ? observedSecondsPerCall(Date.now() - startedAt, final.calls.total - final.calls.cached - sentBefore) : undefined
    if (perCall !== undefined) await recordSpeed(engine.id, engine.model, perCall)
  } finally {
    running.delete(projectId)
    notices.delete(projectId)
    emit(`run:${projectId}`)
  }
}

export function cancelAnalysis(projectId: string) {
  running.get(projectId)?.abort()
}

/**
 * Au démarrage : une analyse marquée « en cours » alors que rien ne tourne a
 * été interrompue (onglet fermé). On la marque comme interrompue pour proposer de la reprendre.
 */
export async function markInterrupted(project: Project): Promise<void> {
  if (isRunning(project.id)) return
  if (!project.analyses.some((a) => a.status === 'running')) return
  await updateProject(project.id, (p) => ({
    ...p,
    analyses: p.analyses.map((a) => (a.status === 'running' ? { ...a, status: 'cancelled' } : a)),
  }))
}
