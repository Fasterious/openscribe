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
