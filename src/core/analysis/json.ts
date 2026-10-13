import type { z } from 'zod'

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
