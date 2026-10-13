import type { Metrics } from './types'

/**
 * Contrôle des chiffres cités dans les synthèses.
 *
 * Le modèle rédige, le code compte. Chaque nombre d'une synthèse, écrit en
 * chiffres (« 6 », « 82 % ») ou en lettres devant un nom de personnes
 * (« trois personnes »), doit correspondre à un chiffre calculé par le code ou
 * figurer dans les citations du périmètre (une date, un montant cité…).
 * Sinon il est signalé « à vérifier » dans le rapport.
 */

const WORDS: Record<string, number> = {
  un: 1,
  une: 1,
  deux: 2,
  trois: 3,
  quatre: 4,
  cinq: 5,
  six: 6,
  sept: 7,
  huit: 8,
  neuf: 9,
  dix: 10,
  onze: 11,
  douze: 12,
  treize: 13,
  quatorze: 14,
  quinze: 15,
  seize: 16,
  vingt: 20,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  twenty: 20,
}
// "six" est commun aux deux langues.

const PEOPLE = '(?:personnes?|participant(?:e|s|es)?|répondant(?:e|s|es)?|membres?|mentions?|people|persons?|respondents?|members?|participants?)'
const WORD_RE = new RegExp(`\\b(${Object.keys(WORDS).join('|')})\\s+(?:autres?\\s+|other\\s+)?${PEOPLE}\\b`, 'gi')
const SUR_RE = new RegExp(`\\b(${Object.keys(WORDS).join('|')})\\s+(?:sur|out of)\\s+`, 'gi')
const SUR_AFTER_RE = new RegExp(`\\b(?:sur|out of)\\s+(${Object.keys(WORDS).join('|')})\\b`, 'gi')

export interface FoundNumber {
  raw: string
  value: number
}

export function numbersIn(text: string): FoundNumber[] {
  const clean = text.replace(/\[[^\]]*\]/g, ' ').replace(/\bI\d{4,}\b/g, ' ')
  const found: FoundNumber[] = []
  for (const m of clean.matchAll(/\d+(?:[.,]\d+)?/g)) found.push({ raw: m[0], value: Number(m[0].replace(',', '.')) })
  for (const re of [WORD_RE, SUR_RE, SUR_AFTER_RE]) for (const m of clean.matchAll(re)) found.push({ raw: m[0].trim(), value: WORDS[m[1].toLowerCase()] })
  return found
}

/** Les nombres qu'une synthèse a le droit de citer pour ces indicateurs. */
export function allowedNumbers(metrics: Metrics[], quotes: string[]): Set<number> {
  // « Une personne estime que… » : une idée citée vient toujours d'au moins une personne.
  const ok = new Set<number>([1])
  for (const m of metrics) {
    const pos = m.positiveOnly.length
    const neg = m.negativeOnly.length
    const mix = m.mixed.length
    for (const n of [
      m.participants,
      m.mentions,
      pos,
      neg,
      mix,
      pos + neg + mix,
      pos + mix,
      neg + mix,
      ...Object.values(m.participantsByCategory),
      ...Object.values(m.mentionsByCategory),
    ])
      ok.add(n)
    if (m.consensusRate !== null) ok.add(Math.round(m.consensusRate * 100))
    if (m.minority) ok.add(m.minority.participantIds.length)
  }
  for (const q of quotes) for (const n of numbersIn(q)) ok.add(n.value)
  return ok
}

/** Les nombres cités qui ne correspondent à rien de calculé ni de cité. */
export function unverifiedNumbers(text: string, allowed: Set<number>): string[] {
  return [
    ...new Set(
      numbersIn(text)
        .filter((n) => !allowed.has(n.value))
        .map((n) => n.raw),
    ),
  ]
}

/** Les mêmes nombres, en chiffres ou en lettres (pour la relecture). */
export function sameNumbers(a: string, b: string): boolean {
  const key = (t: string) => [...new Set(numbersIn(t).map((n) => n.value))].sort((x, y) => x - y).join(',')
  return key(a) === key(b)
}

const DIGIT_PEOPLE_RE = new RegExp(`\\b(\\d+)\\s+(?:autres?\\s+|other\\s+)?${PEOPLE}\\b`, 'gi')

/**
 * « Deux personnes suggèrent… [I0252, I0253] » quand les deux idées citées
 * viennent de la même personne : le modèle a compté des idées comme des
 * personnes. On le repère quand une phrase cite au moins autant d'idées que de
 * personnes annoncées, mais qu'elles viennent de moins de personnes. (Une phrase
 * qui cite moins d'idées que de personnes donne seulement des exemples.)
 */
export function overcountedPeople(text: string, personOf: (ideaId: string) => string | undefined): string[] {
  const out: string[] = []
  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    const ids = [...new Set(sentence.match(/I\d{4,}/g) ?? [])]
    if (!ids.length) continue
    const people = new Set(ids.map(personOf).filter(Boolean)).size
    const clean = sentence.replace(/\[[^\]]*\]/g, ' ')
    const claims = [
      ...[...clean.matchAll(WORD_RE)].map((m) => ({ raw: m[0].trim(), value: WORDS[m[1].toLowerCase()] })),
      ...[...clean.matchAll(DIGIT_PEOPLE_RE)].map((m) => ({ raw: m[0].trim(), value: Number(m[1]) })),
    ]
    for (const c of claims) if (c.value > 1 && ids.length >= c.value && people < c.value) out.push(c.raw)
  }
  return [...new Set(out)]
}

/**
 * Plus strict, pour les synthèses de thème et le résumé : une phrase qui annonce
 * « trois personnes » doit citer les idées d'au moins trois personnes. Les
 * ratios repris des listes (« 10 des 12 participants », « 4 sur 6 ») sont
 * exemptés : ils viennent du code et citent une preuve d'exemple.
 */
export function undercitedPeople(text: string, personOf: (ideaId: string) => string | undefined, motifSize?: (ideaId: string) => number): string[] {
  const out: string[] = []
  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    const ids = [...new Set(sentence.match(/I\d{4,}/g) ?? [])]
    // Résumé : la référence d'une ligne de liste représente son motif entier.
    const people = Math.max(new Set(ids.map(personOf).filter(Boolean)).size, ...(motifSize ? ids.map(motifSize) : [0]))
    const clean = sentence.replace(/\[[^\]]*\]/g, ' ')
    const claims = [
      ...[...clean.matchAll(WORD_RE)].map((m) => ({ raw: m[0].trim(), value: WORDS[m[1].toLowerCase()], end: (m.index ?? 0) + m[0].length })),
      ...[...clean.matchAll(DIGIT_PEOPLE_RE)].map((m) => ({ raw: m[0].trim(), value: Number(m[1]), end: (m.index ?? 0) + m[0].length })),
    ]
    for (const c of claims) {
      const before = clean.slice(Math.max(0, clean.indexOf(c.raw) - 8), clean.indexOf(c.raw))
      const after = clean.slice(c.end, c.end + 12)
      if (/\b(sur|des|out of|of the)\s/i.test(after) || /\b(sur|des|of)\s*$/i.test(before)) continue
      if (c.value > 1 && people < c.value) out.push(c.raw)
    }
  }
  return [...new Set(out)]
}

/**
 * « Certains », « d'autres », « plusieurs », « la plupart » annoncent plusieurs
 * personnes sans les compter : le passage qui précède un crochet doit citer au
 * moins deux personnes (trois pour « plusieurs » et « la plupart »). Sinon une
 * seule personne nuancée devient deux camps.
 */
export function vaguePlurals(text: string, personOf: (ideaId: string) => string | undefined, motifSize?: (ideaId: string) => number): string[] {
  const out: string[] = []
  const VAGUE = /(?<![\p{L}])(certains|certaines|d'autres|d’autres|plusieurs|la plupart|les uns)(?![\p{L}])(?:\s+(?:d'entre eux\s+|des\s+)?([\p{L}'’]+))?/giu
  // Le pluriel annonce un compte quand il est sujet (« d'autres regrettent », « selon plusieurs personnes ») ;
  // « reprises par d'autres » ou « a vu plusieurs personnes partir » rapportent ce qu'une personne a dit.
  const asSubject = (before: string) => /(^|[,;:(]|\b(et|mais|que|qu['’]|selon|pour|chez|dont))\s*$/i.test(before)
  // « Certains points » ne parle pas de personnes : il faut un nom de personne, un pronom ou un verbe ensuite.
  const aboutPeople = (next?: string) =>
    !!next &&
    (/^(membres?|participants?|personnes?|colistiers?|militants?|bénévoles|répondants?|y|le|la|les|en|ne|se|lui|leur|ont|sont|font|vont)$/i.test(next) ||
      /^[nsl]['’]/i.test(next) ||
      /ent$/i.test(next))
  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    let start = 0
    const brackets = [...sentence.matchAll(/\[([^\]]*)\]/g)]
    brackets.forEach((m, k) => {
      const clause = sentence.slice(start, m.index)
      start = (m.index ?? 0) + m[0].length
      // Une énumération qui suit le pluriel (« d'autres reprochent X [a], Y [b] ou Z [c] ») compte tous ses renvois.
      const ids = brackets.slice(k).flatMap((b) => b[1].match(/I\d{4,}/g) ?? [])
      const people = new Set(ids.map(personOf).filter(Boolean)).size
      // Résumé : une seule référence par ligne de liste ; le motif cité porte alors le compte.
      const backing = Math.max(people, ...(motifSize ? ids.map(motifSize) : [0]))
      for (const v of clause.matchAll(VAGUE)) {
        const isSubject = asSubject(clause.slice(0, v.index)) || /^(selon|pour|chez)$/i.test(clause.slice(0, v.index).trim().split(/\s+/).pop() ?? '')
        if (!isSubject || !aboutPeople(v[2])) continue
        const need = /plusieurs|plupart/i.test(v[1]) ? 3 : 2
        if (people > 0 && backing < need) out.push(v[1])
      }
    })
  }
  return [...new Set(out)]
}

/**
 * « Une autre », « l'autre », « une troisième », « deux autres » annoncent des
 * personnes différentes de celles dont on vient de parler. Le renvoi qui suit
 * le mot doit donc citer quelqu'un d'autre que le renvoi précédent ; si une
 * seule référence couvre « une personne…, une autre… », elle doit citer assez
 * de personnes distinctes. Sinon une seule personne devient deux voix.
 */
export function impliedOthers(text: string, personOf: (ideaId: string) => string | undefined): string[] {
  const out: string[] = []
  const WORD =
    /(?<![\p{L}])(une autre|un autre|l['’]autre|la seconde|le second|une deuxième|un deuxième|une troisième|un troisième|deux autres|une quatrième|trois autres)(?![\p{L}])/giu
  const need = (w: string) => (/troisième|deux autres/i.test(w) ? 3 : /quatrième|trois autres/i.test(w) ? 4 : 2)
  const people = (ids: string) => new Set((ids.match(/I\d{4,}/g) ?? []).map(personOf).filter(Boolean) as string[])
  for (const paragraph of text.split(/\n\s*\n/)) {
    const brackets = [...paragraph.matchAll(/\[([^\]]*)\]/g)].map((m) => ({ at: m.index ?? 0, who: people(m[1]) }))
    for (const m of paragraph.matchAll(WORD)) {
      const at = m.index ?? 0
      const next = brackets.find((b) => b.at > at)
      if (!next || !next.who.size) continue
      const prev = [...brackets].reverse().find((b) => b.at < at)
      const sentenceStart = Math.max(paragraph.lastIndexOf('. ', at), paragraph.lastIndexOf('! ', at), paragraph.lastIndexOf('? ', at)) + 1
      const shared = !prev || prev.at < sentenceStart
      if (shared && /(?<![\p{L}])(une personne|un participant|une participante|l['’]une|l['’]un)(?![\p{L}])/iu.test(paragraph.slice(sentenceStart, at))) {
        // « Une personne…, une autre… [a, b] » : une seule référence pour plusieurs personnes annoncées.
        if (next.who.size < need(m[1])) out.push(m[1])
      } else if (prev && [...next.who].every((p) => prev.who.has(p))) out.push(m[1])
    }
  }
  return [...new Set(out)]
}

const COUNT_WORDS: Record<string, number> = { deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9, dix: 10, onze: 11, douze: 12 }
/** Ce qui ouvre une autre voix dans la phrase : le compte qui précède s'arrête là. */
const NEXT_VOICE =
  /(?<![\p{L}])(une autre|un autre|l['’]autre|une troisième|un troisième|deux autres|trois autres|tandis que|alors que|à l['’]inverse)(?![\p{L}])|;/iu

/** Les personnes citées dans les renvois d'un passage. */
function peopleIn(passage: string, personOf: (ideaId: string) => string | undefined): number {
  return new Set((passage.match(/I\d{4,}/g) ?? []).map(personOf).filter(Boolean)).size
}

/** Le passage qu'un compte annonce : du nombre jusqu'à la voix suivante (« une autre… ») ou la fin de la phrase. */
export function countSpan(sentence: string, at: number): string {
  const rest = sentence.slice(at)
  const m = rest.slice(1).match(NEXT_VOICE)
  return m ? rest.slice(0, (m.index ?? 0) + 1) : rest
}

/**
 * « Deux personnes proposent de filmer [P4], et une troisième… [P7] » : le
 * compte vaut pour son propre passage, pas pour toute la phrase. Un compte de
 * personnes doit être couvert par les renvois de ce passage. Les rapports
 * (« 4 des 5 », « 3 sur 4 ») viennent des listes du code et en sont exemptés.
 */
export function clauseCounts(text: string, personOf: (ideaId: string) => string | undefined): string[] {
  const out: string[] = []
  const RE = new RegExp(
    String.raw`(?<![\p{L}\d])(\d+|${Object.keys(COUNT_WORDS).join('|')})\s+(?:autres\s+)?(personnes|participants|participantes)(?![\p{L}])`,
    'giu',
  )
  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    if (!/I\d{4,}/.test(sentence)) continue
    for (const m of sentence.matchAll(RE)) {
      const n = /^\d+$/.test(m[1]) ? Number(m[1]) : COUNT_WORDS[m[1].toLowerCase()]
      const at = m.index ?? 0
      if (/\b(des|sur)\s+$/i.test(sentence.slice(Math.max(0, at - 5), at)) || /^\s*(des|sur)\s/i.test(sentence.slice(at + m[0].length))) continue
      const span = countSpan(sentence, at)
      const people = peopleIn(span, personOf)
      if (people > 0 && people < n) out.push(m[0])
    }
  }
  return [...new Set(out)]
}

/**
 * « Toutes les personnes qui en parlent [3 renvois] » dans un motif où 7
 * personnes donnent un avis : « toutes » doit couvrir tout le monde.
 */
export function allClaims(text: string, personOf: (ideaId: string) => string | undefined, everyone: number): string[] {
  const out: string[] = []
  const RE = /(?<![\p{L}])(toutes les personnes|tous les participants|toutes celles|tous ceux|toutes les participantes)(?![\p{L}])/giu
  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    for (const m of sentence.matchAll(RE)) {
      const people = peopleIn(countSpan(sentence, m.index ?? 0), personOf)
      if (people > 0 && people < everyone) out.push(m[1])
    }
  }
  return [...new Set(out)]
}
