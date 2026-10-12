import { useEffect, useState } from 'react'
import { randomId } from '@/core/ids'
import { withLimits } from '@/core/providers/limits'
import { createOpenAiCompatibleProvider } from '@/core/providers/openai-compatible'
import { presetById } from '@/core/providers/presets'
import { createSimulationProvider } from '@/core/providers/simulation'
import type { LlmProvider } from '@/core/providers/types'
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
  if (!(await getSetting<string>(DEFAULT_KEY))) await setSetting(DEFAULT_KEY, engine.id)
  notify()
}

export async function removeEngine(id: string): Promise<void> {
  await setSetting(KEY, (await loadEngines()).filter((e) => e.id !== id))
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

export function providerFor(engine: EngineConfig): LlmProvider {
  if (engine.presetId === 'simulation') return createSimulationProvider()
  const preset = presetById(engine.presetId)
  const base = createOpenAiCompatibleProvider({
    presetId: engine.presetId,
    label: engine.name,
    baseUrl: engine.baseUrl,
    apiKey: engine.apiKey || undefined,
    model: engine.model,
    seedParam: preset?.seedParam ?? 'seed',
    supportsJsonMode: preset?.supportsJsonMode ?? true,
  })
  return withLimits(base, { requestsPerMinute: engine.requestsPerMinute, concurrency: engine.concurrency, retries: 4 })
}

/** Vérifie qu'un moteur répond, avec une demande minuscule. */
export async function testEngine(engine: EngineConfig): Promise<{ ok: boolean; message: string }> {
  try {
    const provider = providerFor({ ...engine, requestsPerMinute: 600 })
    const res = await provider.complete({
      task: 'ping',
      system: 'Réponds uniquement en JSON.',
      user: 'Réponds exactement {"ok": true}',
      json: true,
      temperature: 0,
      maxTokens: 20,
    })
    return { ok: true, message: `Connexion réussie. Réponse : ${res.text.slice(0, 60)}` }
  } catch (e) {
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
