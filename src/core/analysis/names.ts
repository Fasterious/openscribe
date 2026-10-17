/**
 * Prénoms des particuliers cités dans les réponses.
 *
 * Le modèle signale les noms ; le code ne garde que ceux qui figurent
 * réellement dans le texte, puis les masque à l'affichage et dans les exports.
 * La citation exacte reste intacte dans l'analyse : seul ce qui est montré change.
 */

export const NAME_MASK = '[prénom]'

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Un nom isolé dans le texte (pas un morceau de mot), sensible à la casse. */
function nameRegex(name: string): RegExp {
  return new RegExp(`(?<![\\p{L}\\p{N}])${escape(name)}(?![\\p{L}\\p{N}])`, 'gu')
}

/** Garde les noms présents tels quels dans au moins un des textes, sans doublon, du plus long au plus court. */
export function verifiedNames(candidates: string[], texts: string[]): string[] {
  const out = new Set<string>()
  for (const raw of candidates) {
    const name = raw.trim()
    // Un nom d'une ou deux lettres masquerait des mots ordinaires.
    if (name.length < 3) continue
    if (texts.some((t) => nameRegex(name).test(t))) out.add(name)
  }
  return [...out].sort((a, b) => b.length - a.length || a.localeCompare(b))
}

export function maskNames(text: string, names: string[] | undefined): string {
  if (!names?.length) return text
  let out = text
  // Les noms les plus longs d'abord : « Marie-Claire » avant « Marie ».
  for (const name of [...names].sort((a, b) => b.length - a.length)) out = out.replace(nameRegex(name), NAME_MASK)
  return out
}

/**
 * Masque les noms et dit où est passé chaque caractère : une citation repérée par sa position dans le texte
 * d'origine se retrouve dans le texte masqué (publication de l'Observatoire, réponses entières montrées).
 */
export function maskWithOffsets(text: string, names: string[] | undefined): { text: string; at: (pos: number) => number } {
  if (!names?.length) return { text, at: (pos) => pos }
  // Les passages à masquer, du plus long nom au plus court, sans chevauchement.
  const cuts: { start: number; end: number }[] = []
  for (const name of [...names].sort((a, b) => b.length - a.length))
    for (const m of text.matchAll(nameRegex(name))) {
      const start = m.index!
      const end = start + m[0].length
      if (!cuts.some((c) => start < c.end && end > c.start)) cuts.push({ start, end })
    }
  cuts.sort((a, b) => a.start - b.start)
  let out = ''
  let pos = 0
  for (const c of cuts) {
    out += text.slice(pos, c.start) + NAME_MASK
    pos = c.end
  }
  out += text.slice(pos)
  const at = (p: number) => {
    let shift = 0
    for (const c of cuts) {
      if (c.end <= p) shift += NAME_MASK.length - (c.end - c.start)
      // Une position au milieu d'un nom masqué tombe au bord du masque.
      else if (c.start < p) return c.start + shift + (p - c.start >= (c.end - c.start) / 2 ? NAME_MASK.length : 0)
    }
    return p + shift
  }
  return { text: out, at }
}

/** Les noms encore présents dans un texte : vide si le masquage est complet. */
export function remainingNames(text: string, names: string[] | undefined): string[] {
  return (names ?? []).filter((name) => nameRegex(name).test(text))
}
