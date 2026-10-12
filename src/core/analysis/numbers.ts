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
  un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9, dix: 10,
  onze: 11, douze: 12, treize: 13, quatorze: 14, quinze: 15, seize: 16, vingt: 20,
  one: 1, two: 2, three: 3, four: 4, five: 5, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, twenty: 20,
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
  for (const re of [WORD_RE, SUR_RE, SUR_AFTER_RE])
    for (const m of clean.matchAll(re)) found.push({ raw: m[0].trim(), value: WORDS[m[1].toLowerCase()] })
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
    for (const n of [m.participants, m.mentions, pos, neg, mix, pos + neg + mix, pos + mix, neg + mix, ...Object.values(m.participantsByCategory), ...Object.values(m.mentionsByCategory)])
      ok.add(n)
    if (m.consensusRate !== null) ok.add(Math.round(m.consensusRate * 100))
    if (m.minority) ok.add(m.minority.participantIds.length)
  }
  for (const q of quotes) for (const n of numbersIn(q)) ok.add(n.value)
  return ok
}

/** Les nombres cités qui ne correspondent à rien de calculé ni de cité. */
export function unverifiedNumbers(text: string, allowed: Set<number>): string[] {
  return [...new Set(numbersIn(text).filter((n) => !allowed.has(n.value)).map((n) => n.raw))]
}

/** Les mêmes nombres, en chiffres ou en lettres (pour la relecture). */
export function sameNumbers(a: string, b: string): boolean {
  const key = (t: string) => [...new Set(numbersIn(t).map((n) => n.value))].sort((x, y) => x - y).join(',')
  return key(a) === key(b)
}
