/**
 * Vérification des citations.
 *
 * Une citation proposée par l'IA n'est acceptée que si elle existe dans le
 * texte source. On tolère seulement les écarts sans effet sur le sens : casse,
 * espaces, apostrophes et guillemets typographiques, ponctuation en bord de
 * citation, accents, et quelques fautes de frappe corrigées par le modèle (le texte
 * montré reste alors celui du participant). Tout le reste est rejeté : aucune
 * citation inventée ou reformulée ne peut entrer dans le rapport.
 */

export interface VerbatimMatch {
  start: number
  end: number
  /** Retrouvée avec de légers écarts plutôt qu'à l'identique. */
  approximate: boolean
  /** Citation coupée par « […] » : les fragments, dans l'ordre du texte. Absent pour une citation d'un seul tenant. */
  parts?: { start: number; end: number }[]
}

/** La coupure explicite d'une citation : « […] » ou « [...] », jamais des points de suspension seuls. */
export const CUT = /\s*\[(?:…|\.\.\.)\]\s*/
export const CUT_MARK = ' […] '

const QUOTES: Record<string, string> = {
  '‘': "'",
  '’': "'",
  '‚': "'",
  '′': "'",
  '`': "'",
  '´': "'",
  '“': '"',
  '”': '"',
  '„': '"',
  '«': '"',
  '»': '"',
  '–': '-',
  '—': '-',
  '…': '...',
  ' ': ' ',
  ' ': ' ',
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

export function locateVerbatim(source: string, verbatim: string, opts: { typos?: boolean } = {}): VerbatimMatch | null {
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
  return opts.typos ? locateNearMatch(source, candidate) : null
}

/**
 * 4. Fautes de frappe corrigées par le modèle (« contributins » → « contributions »).
 * On retrouve le passage d'origine et c'est lui qui est montré, fautes comprises.
 * Garde-fous : citation d'au moins 25 caractères, au plus un écart pour 25 caractères
 * (4 au total), et aucun mot qui change le sens ajouté ou retiré.
 */
const NEAR_MIN = 25
/** Mots de degré ou de restriction, en plus de SENSE_CHANGERS (« peu » devenu « un peu » inverse le sens). */
const NEAR_SENSE = /^(moins|peu|un|trop|tres|seul|seule|seuls|seules|seulement|guere|presque)$/
function locateNearMatch(source: string, candidate: string): VerbatimMatch | null {
  const src = normalizeWithMap(source, true)
  const needle = trimEdges(normalizeWithMap(candidate, true).norm)
  if (needle.length < NEAR_MIN) return null
  const budget = Math.min(4, Math.floor(needle.length / 25))
  const head = needle.slice(0, 10)
  let best: { at: number; len: number; d: number } | null = null
  for (let at = src.norm.indexOf(head); at >= 0; at = src.norm.indexOf(head, at + 1)) {
    for (let len = needle.length - budget; len <= needle.length + budget; len++) {
      if (at + len > src.norm.length) break
      const d = editDistance(needle, src.norm.slice(at, at + len), budget)
      if (d <= budget && (!best || d < best.d)) best = { at, len, d }
    }
  }
  if (!best) return null
  const found = src.norm.slice(best.at, best.at + best.len)
  const words = (t: string) => new Set(t.split(/[^\p{L}]+/u).filter(Boolean).map((w) => (w === 'n' ? 'ne' : w)))
  const a = words(found)
  const b = words(needle)
  const changed = [...a].filter((w) => !b.has(w)).concat([...b].filter((w) => !a.has(w)))
  if (changed.some((w) => SENSE_CHANGERS.test(w) || NEAR_SENSE.test(w))) return null
  // Un chiffre ne se corrige pas : « 3 » devenu « 8 » change le sens.
  if ((found.match(/\d+/g) ?? []).join(' ') !== (needle.match(/\d+/g) ?? []).join(' ')) return null
  const start = src.map[best.at]
  const end = src.map[best.at + best.len - 1] + 1
  return { start, end, approximate: true }
}

/** Distance d'édition, arrêtée dès qu'elle dépasse `max`. */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    let rowMin = i
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      rowMin = Math.min(rowMin, cur[j])
    }
    if (rowMin > max) return max + 1
    prev = cur
  }
  return prev[b.length]
}

/**
 * Une citation peut sauter un passage sans rapport inséré au milieu, marqué
 * « […] ». Garde-fous (validés par le `methodologue`) : une seule coupure ;
 * chaque fragment existe tel quel, dans l'ordre, dans le même texte, et compte
 * au moins 4 mots ; le passage retiré ne contient ni négation ni contraste,
 * sinon la coupure pourrait inverser le sens.
 */
const MIN_FRAGMENT_WORDS = 4
const SENSE_CHANGERS =
  /(?<![\p{L}])(ne|n'|n’|pas|plus|jamais|aucune?|rien|sauf|mais|sinon|sans|pourtant|cependant|toutefois|not|no|never|but|except|without)(?![\p{L}])/iu

export function locateQuote(source: string, verbatim: string, opts: { typos?: boolean } = {}): VerbatimMatch | null {
  const fragments = verbatim
    .split(CUT)
    .map((f) => f.trim())
    .filter(Boolean)
  if (fragments.length <= 1) return locateVerbatim(source, fragments[0] ?? '', opts)
  if (fragments.length > 2) return null
  const parts: { start: number; end: number }[] = []
  let from = 0
  let approximate = false
  for (const f of fragments) {
    if (f.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length < MIN_FRAGMENT_WORDS) return null
    const m = locateVerbatim(source.slice(from), f, opts)
    if (!m) return null
    parts.push({ start: from + m.start, end: from + m.end })
    approximate ||= m.approximate
    from += m.end
  }
  if (SENSE_CHANGERS.test(source.slice(parts[0].end, parts[1].start))) return null
  return { start: parts[0].start, end: parts[1].end, approximate, parts }
}

/** Le texte d'une citation tel qu'il est montré : ses fragments exacts, reliés par « […] ». */
export function quoteText(source: string, m: VerbatimMatch): string {
  return m.parts ? m.parts.map((p) => source.slice(p.start, p.end)).join(CUT_MARK) : source.slice(m.start, m.end)
}

/**
 * Pour une citation introuvable : la citation est-elle une suite de fragments
 * du texte reliés par « … » ? On ne l'accepte pas, mais on renvoie le premier
 * fragment trouvé pour proposer une correction.
 */
export function explainMiss(source: string, verbatim: string): string {
  if (CUT.test(verbatim)) return 'citation coupée dont un fragment est introuvable'
  if (/\.\.\.|…/.test(verbatim)) return 'citation coupée par des points de suspension'
  const words = verbatim
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3)
  const present = words.filter((w) => source.toLowerCase().includes(w)).length
  if (words.length && present / words.length > 0.6) return 'citation reformulée'
  return 'citation absente du texte'
}

/** Un début de citation qui renvoie à ce qui précède : seul, il ne se comprend pas. */
// « Il faut », « il y a », « il est » sont impersonnels : ils ne renvoient à rien.
const REPRISE =
  /^(?:elle|elles|il(?!\s+(?:faut|faudra|faudrait|fallait|y a|y avait|est|était|serait|aurait))|ils|cela|ça|ceci|ce sont|c['’]est|en partie|mais|et|car|donc|sinon|malgré (?:cela|ça)|pour (?:cela|ça)|qui|dont|ce qui)(?![\p{L}])/iu

/**
 * Une citation qui commence par une reprise (« Malgré cela, tout est arrivé
 * à temps », « En partie parce que… ») est étendue au début de la phrase
 * précédente de la même réponse : le passage reste exact, et il se comprend
 * seul. Rien ne change si la phrase d'avant est trop longue ou absente.
 */
export function withAntecedent(source: string, m: VerbatimMatch, max = 260, taken: { start: number; end: number }[] = []): VerbatimMatch {
  const quote = source.slice(m.start, m.end).trim()
  // Une reprise (« Malgré cela… ») ou une question de deux mots (« comment ? ») ne se comprend pas seule.
  const tiny = /[?]$/.test(quote) && quote.split(/\s+/).length <= 2
  if (m.parts || m.start <= 0 || !(REPRISE.test(quote) || tiny)) return m
  const before = source.slice(0, m.start).replace(/\s+$/, '')
  if (!before) return m
  // Début de la phrase précédente : juste après la fin de phrase qui la précède, ou le début du texte.
  const ends = [...before.slice(0, -1).matchAll(/[.!?…\n](?=\s|$)/g)]
  const start = ends.length ? (ends[ends.length - 1].index ?? 0) + 1 : 0
  const from = start + (source.slice(start).length - source.slice(start).trimStart().length)
  if (m.start - from > max || from >= m.start) return m
  // Jamais par-dessus une autre idée de la même réponse : la phrase d'avant serait affichée deux fois.
  // (Sauf pour une question de deux mots : « comment ? » sans sa phrase ne veut rien dire.)
  if (!tiny && taken.some((t) => t.start < m.start && t.end > from)) return m
  return { ...m, start: from }
}
