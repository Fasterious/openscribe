/** Identifiant aléatoire court, pour les objets créés par l'utilisateur. */
export function randomId(prefix = ''): string {
  const bytes = new Uint8Array(9)
  crypto.getRandomValues(bytes)
  const s = Array.from(bytes, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 12)
  return prefix ? `${prefix}_${s}` : s
}

/** Empreinte SHA-256 hexadécimale d'un texte (navigateur et Node 20+). */
export async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Sérialisation JSON stable (clés triées), pour que deux objets égaux
 * produisent toujours la même empreinte.
 */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort()
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`
}
