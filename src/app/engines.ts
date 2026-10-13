import { useEffect, useState } from 'react'
import { randomId } from '@/core/ids'
import { withLimits, type LimitOptions } from '@/core/providers/limits'
import { createOpenAiCompatibleProvider } from '@/core/providers/openai-compatible'
import { presetById } from '@/core/providers/presets'
import { createSimulationProvider } from '@/core/providers/simulation'
import { ProviderError, type LlmProvider } from '@/core/providers/types'
import { getSetting, setSetting } from './db'

/** Un moteur configuré par l'utilisateur. La clé reste dans ce navigateur. */
export interface EngineConfig {
  id: string
  presetId: string
  name: string
  baseUrl: string
  apiKey: string
  model: string
  requestsPerMinute: number
  concurrency: number
  /** false : enregistré alors que le test de connexion a échoué. On ne le choisit pas d'office. */
  verified?: boolean
}

export const SIMULATION_ENGINE_ID = 'simulation'

export const SIMULATION_ENGINE: EngineConfig = {
  id: SIMULATION_ENGINE_ID,
  presetId: 'simulation',
  name: 'Simulation (démonstration, hors ligne)',
  baseUrl: 'local',
  apiKey: '',
  model: 'simulation-v1',
  requestsPerMinute: 6000,
  concurrency: 4,
}

const KEY = 'engines'
const DEFAULT_KEY = 'defaultEngine'

type Listener = () => void
const listeners = new Set<Listener>()
const notify = () => listeners.forEach((l) => l())

export async function loadEngines(): Promise<EngineConfig[]> {
  return (await getSetting<EngineConfig[]>(KEY)) ?? []
}

export async function saveEngine(engine: EngineConfig): Promise<void> {
  const all = await loadEngines()
  const i = all.findIndex((e) => e.id === engine.id)
  if (i >= 0) all[i] = engine
  else all.push(engine)
  await setSetting(KEY, all)
  if (engine.verified !== false && !(await getSetting<string>(DEFAULT_KEY))) await setSetting(DEFAULT_KEY, engine.id)
  notify()
}

export async function removeEngine(id: string): Promise<void> {
  await setSetting(
    KEY,
    (await loadEngines()).filter((e) => e.id !== id),
  )
  if ((await getSetting<string>(DEFAULT_KEY)) === id) await setSetting(DEFAULT_KEY, undefined)
  notify()
}

export async function setDefaultEngine(id: string): Promise<void> {
  await setSetting(DEFAULT_KEY, id)
  notify()
}

export function newEngineFromPreset(presetId: string): EngineConfig {
  const p = presetById(presetId)!
  return {
    id: randomId('eng'),
    presetId,
    name: p.label,
    baseUrl: p.baseUrl,
    apiKey: '',
    model: p.defaultModel,
    requestsPerMinute: p.freeRequestsPerMinute,
    concurrency: p.freeRequestsPerMinute <= 5 ? 1 : 3,
  }
}

export function providerFor(engine: EngineConfig, retries = 4, onRetry?: LimitOptions['onRetry']): LlmProvider {
  // La simulation prend un peu de temps, pour que la découverte montre les étapes avancer.
  if (engine.presetId === 'simulation') return createSimulationProvider({ delayMs: 400 })
  const preset = presetById(engine.presetId)
  const base = createOpenAiCompatibleProvider({
    presetId: engine.presetId,
    label: engine.name,
    baseUrl: engine.baseUrl,
    apiKey: engine.apiKey || undefined,
    model: engine.model,
    // Un préréglage connu dit lui-même s'il accepte une graine ; un service inconnu en reçoit une, retirée s'il la refuse.
    seedParam: preset ? preset.seedParam : 'seed',
    supportsJsonMode: preset?.supportsJsonMode ?? true,
    extraHeaders: preset?.extraHeaders,
    omitTemperature: preset?.omitTemperature,
  })
  return withLimits(base, { requestsPerMinute: engine.requestsPerMinute, concurrency: engine.concurrency, retries, onRetry })
}

/** Vérifie qu'un moteur répond, avec une demande minuscule. */
export async function testEngine(engine: EngineConfig): Promise<{ ok: boolean; message: string }> {
  try {
    // Un test doit répondre vite : pas de nouvelle tentative.
    const provider = providerFor({ ...engine, requestsPerMinute: 600 }, 0)
    const res = await provider.complete({
      task: 'ping',
      system: 'Réponds uniquement en JSON.',
      user: 'Réponds exactement {"ok": true}',
      json: true,
      temperature: 0,
      // Assez de place pour un modèle qui « réfléchit » avant de répondre (Gemini) : avec 20, sa réflexion mangeait tout.
      maxTokens: 1024,
    })
    return { ok: true, message: `Connexion réussie. Réponse : ${res.text.slice(0, 60)}` }
  } catch (e) {
    // Une seule demande refusée pour excès de demandes : le modèle n'est sans doute pas inclus dans l'offre (quota nul).
    if (e instanceof ProviderError && e.status === 429)
      return {
        ok: false,
        message: `${engine.name} refuse la demande de test (erreur 429). Au premier essai, cela veut le plus souvent dire que ce modèle n'est pas inclus dans votre offre : choisissez-en un autre dans la liste, ou réessayez dans une minute.`,
      }
    return { ok: false, message: e instanceof Error ? e.message : String(e) }
  }
}

export function useEngines() {
  const [engines, setEngines] = useState<EngineConfig[]>([])
  const [defaultId, setDefaultId] = useState<string | undefined>()
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    let alive = true
    const refresh = async () => {
      const [all, def] = await Promise.all([loadEngines(), getSetting<string>(DEFAULT_KEY)])
      if (!alive) return
      setEngines(all)
      setDefaultId(def)
      setLoaded(true)
    }
    refresh()
    listeners.add(refresh)
    return () => {
      alive = false
      listeners.delete(refresh)
    }
  }, [])
  return { engines, defaultId, loaded }
}

export interface OllamaStatus {
  running: boolean
  models: string[]
}

/**
 * Ollama tourne-t-il sur cet ordinateur, et avec quels modèles ? Répond en
 * moins de deux secondes, sans erreur : c'est ce qui permet de dire à
 * l'utilisateur où il en est plutôt que de lui afficher un échec.
 */
export async function detectOllama(baseUrl = 'http://localhost:11434/v1'): Promise<OllamaStatus> {
  const root = baseUrl.replace(/\/+$/, '').replace(/\/v1$/, '')
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 1500)
  try {
    const res = await fetch(`${root}/api/tags`, { signal: ctrl.signal })
    if (!res.ok) return { running: true, models: [] }
    const data = (await res.json()) as { models?: { name?: string }[] }
    return { running: true, models: (data.models ?? []).map((m) => m.name ?? '').filter(Boolean) }
  } catch {
    return { running: false, models: [] }
  } finally {
    clearTimeout(timer)
  }
}
