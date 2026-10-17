import { z } from 'zod'

/**
 * Lecture robuste d'une réponse JSON de modèle : tolère les balises de code,
 * un texte avant ou après, et vérifie la forme attendue.
 */
export function extractJsonText(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const text = (fenced ? fenced[1] : raw).trim()
  if (text.startsWith('{') || text.startsWith('[')) return text
  const firstObj = text.indexOf('{')
  const firstArr = text.indexOf('[')
  const first = [firstObj, firstArr].filter((i) => i >= 0).sort((a, b) => a - b)[0]
  if (first === undefined) return text
  const closing = text[first] === '{' ? '}' : ']'
  const last = text.lastIndexOf(closing)
  return last > first ? text.slice(first, last + 1) : text.slice(first)
}

export class JsonShapeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'JsonShapeError'
  }
}

export function parseJson<T>(raw: string, schema: z.ZodType<T>): T {
  let value: unknown
  try {
    value = JSON.parse(extractJsonText(raw))
  } catch {
    throw new JsonShapeError("La réponse du modèle n'est pas un JSON valide.")
  }
  const result = schema.safeParse(value)
  if (!result.success) {
    const issue = result.error.issues[0]
    throw new JsonShapeError(`La réponse du modèle n'a pas la forme attendue (${issue?.path.join('.') || 'racine'} : ${issue?.message}).`)
  }
  return result.data
}

/**
 * Un texte rédigé que certains modèles légers renvoient emballé (`{"text": "…"}`)
 * ou en liste de phrases : on en garde le texte. Les contrôles qui suivent
 * (citations, comptes) s'appliquent ensuite comme d'habitude.
 */
export function asText(value: unknown): unknown {
  if (typeof value === 'string' || value == null) return value
  if (Array.isArray(value)) return value.map(asText).filter((v): v is string => typeof v === 'string' && v.trim() !== '').join(' ')
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>
    for (const k of ['text', 'summary', 'content', 'paragraph', 'texte', 'résumé']) if (typeof o[k] === 'string') return o[k]
    const parts = Object.values(o).map(asText).filter((v): v is string => typeof v === 'string' && v.trim() !== '')
    return parts.length ? parts.join(' ') : value
  }
  return value
}

/** Champ de texte rédigé, tolérant à l'emballage (voir `asText`). */
export const prose = () => z.preprocess(asText, z.string())

/**
 * Liste dont les éléments mal formés sont ignorés au lieu de faire échouer toute
 * la réponse : pour les champs annexes (pistes opposées, prénoms, corrections),
 * qu'un modèle léger remplit parfois de travers.
 */
export function lenientArray<T extends z.ZodTypeAny>(item: T) {
  return z.preprocess((v) => (Array.isArray(v) ? v.filter((x) => item.safeParse(x).success) : []), z.array(item))
}
