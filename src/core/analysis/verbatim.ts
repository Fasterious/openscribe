/**
 * Vérification des citations.
 *
 * Une citation proposée par l'IA n'est acceptée que si elle existe dans le
 * texte source. On tolère seulement les écarts sans effet sur le sens : casse,
 * espaces, apostrophes et guillemets typographiques, ponctuation en bord de
 * citation, accents. Tout le reste est rejeté : aucune citation inventée ou
 * reformulée ne peut entrer dans le rapport.
 */

export interface VerbatimMatch {
  start: number
  end: number
  /** Retrouvée avec de légers écarts plutôt qu'à l'identique. */
  approximate: boolean
}

const QUOTES: Record<string, string> = {
  '‘': "'", '’': "'", '‚': "'", '′': "'", '`': "'", '´': "'",
  '“': '"', '”': '"', '„': '"', '«': '"', '»': '"',
  '–': '-', '—': '-', '…': '...', ' ': ' ', ' ': ' ',
}

/**
 * Normalise un texte caractère par caractère en gardant la correspondance
 * vers les positions d'origine, pour pouvoir retrouver l'emplacement exact.
 */
function normalizeWithMap(text: string, foldAccents: boolean): { norm: string; map: number[] } {
  let norm = ''
  const map: number[] = []
  let lastWasSpace = true
  for (let i = 0; i < text.length; i++) {
    let ch = QUOTES[text[i]] ?? text[i]
    if (foldAccents) ch = ch.normalize('NFD').replace(/[̀-ͯ]/g, '')
    ch = ch.toLowerCase()
    for (const c of ch) {
      if (/\s/.test(c)) {
        if (lastWasSpace) continue
        norm += ' '
        map.push(i)
        lastWasSpace = true
      } else {
        norm += c
        map.push(i)
        lastWasSpace = false
      }
    }
  }
  return { norm, map }
}

function trimEdges(s: string): string {
  return s.replace(/^[\s"'.,;:!?()[\]-]+|[\s"'.,;:!?()[\]-]+$/g, '')
}

export function locateVerbatim(source: string, verbatim: string): VerbatimMatch | null {
  const candidate = verbatim.trim()
  if (!candidate) return null

  // 1. À l'identique.
  const exact = source.indexOf(candidate)
  if (exact >= 0) return { start: exact, end: exact + candidate.length, approximate: false }

  // 2. Écarts typographiques seulement, puis 3. avec accents ignorés.
  for (const foldAccents of [false, true]) {
    const src = normalizeWithMap(source, foldAccents)
    const needle = trimEdges(normalizeWithMap(candidate, foldAccents).norm)
    if (needle.length < 3) continue
    const at = src.norm.indexOf(needle)
    if (at >= 0) {
      const start = src.map[at]
      const end = src.map[at + needle.length - 1] + 1
      return { start, end, approximate: source.slice(start, end) !== candidate }
    }
  }
  return null
}

/**
 * Pour une citation introuvable : la citation est-elle une suite de fragments
 * du texte reliés par « … » ? On ne l'accepte pas, mais on renvoie le premier
 * fragment trouvé pour proposer une correction.
 */
export function explainMiss(source: string, verbatim: string): string {
  if (/\.\.\.|…|\[\.\.\.\]/.test(verbatim)) return 'citation coupée par des points de suspension'
  const words = verbatim.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
  const present = words.filter((w) => source.toLowerCase().includes(w)).length
  if (words.length && present / words.length > 0.6) return 'citation reformulée'
  return 'citation absente du texte'
}
