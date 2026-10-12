import { openDB, type IDBPDatabase } from 'idb'
import type { ResponseCache } from '@/core/analysis/runner'
import type { Project } from '@/core/project'

/**
 * Stockage local, dans le navigateur (IndexedDB). Rien ne part sur un serveur.
 *
 * - projects : les études ;
 * - responses : les réponses déjà obtenues du modèle (reproductibilité) ;
 * - settings : réglages, dont les moteurs configurés et leurs clés.
 */

const DB_NAME = 'openscribe'
const DB_VERSION = 1

interface Schema {
  projects: { key: string; value: Project }
  responses: { key: string; value: string }
  settings: { key: string; value: unknown }
}

let dbPromise: Promise<IDBPDatabase<Schema>> | null = null

export function db(): Promise<IDBPDatabase<Schema>> {
  dbPromise ??= openDB<Schema>(DB_NAME, DB_VERSION, {
    upgrade(database) {
      database.createObjectStore('projects', { keyPath: 'id' })
      database.createObjectStore('responses')
      database.createObjectStore('settings')
    },
  })
  return dbPromise
}

export async function listProjects(): Promise<Project[]> {
  const all = await (await db()).getAll('projects')
  return all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function getProject(id: string): Promise<Project | undefined> {
  return (await db()).get('projects', id)
}

export async function saveProject(project: Project): Promise<void> {
  await (await db()).put('projects', { ...project, updatedAt: new Date().toISOString() })
}

export async function deleteProject(id: string): Promise<void> {
  await (await db()).delete('projects', id)
}

export const responseCache: ResponseCache = {
  async get(key) {
    return (await db()).get('responses', key)
  },
  async set(key, value) {
    await (await db()).put('responses', value, key)
  },
}

export async function getResponses(keys: string[]): Promise<Record<string, string>> {
  const d = await db()
  const out: Record<string, string> = {}
  for (const k of keys) {
    const v = await d.get('responses', k)
    if (v !== undefined) out[k] = v
  }
  return out
}

export async function putResponses(entries: Record<string, string>): Promise<void> {
  const tx = (await db()).transaction('responses', 'readwrite')
  await Promise.all([...Object.entries(entries).map(([k, v]) => tx.store.put(v, k)), tx.done])
}

export async function getSetting<T>(key: string): Promise<T | undefined> {
  return (await db()).get('settings', key) as Promise<T | undefined>
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  await (await db()).put('settings', value, key)
}

/** Demande au navigateur de ne pas effacer ces données en cas de manque de place. */
export async function requestPersistence(): Promise<boolean> {
  try {
    return (await navigator.storage?.persist?.()) ?? false
  } catch {
    return false
  }
}
