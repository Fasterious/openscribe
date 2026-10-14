import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { analyzeCsv } from './import/csv'

/**
 * Données de participants réelles : jamais dans le dépôt, pas même comme
 * exemple dans une consigne. Ce test lit les corpus privés présents sur la
 * machine (fixtures/private, ignoré par git) et refuse toute suite de six mots
 * d'une réponse qui se retrouverait dans le code, les tests ou la
 * documentation. Sans corpus privé, il ne vérifie rien.
 */

const PRIVATE = 'fixtures/private'
const N = 6

const words = (t: string) =>
  t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, ' ')
    .match(/[a-z0-9]+/g) ?? []

/** Une suite faite de mots outils (« il n'y a pas de ») n'est pas une citation : il faut au moins deux mots pleins. */
const meaningful = (g: string[]) => g.filter((w) => w.length >= 5).length >= 2

const walk = (d: string): string[] =>
  existsSync(d) ? readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)])) : []

/** Les réponses des corpus privés, sans les en-têtes : les questions d'un questionnaire ne sont pas des données de participants. */
// Au-delà, un export brut (ex. une consultation publique de plusieurs centaines de Mo) dépasse ce que le test peut indexer :
// il est écarté et nommé, pour qu'on sache ce qui n'est pas contrôlé.
const MAX_BYTES = 20 * 1024 * 1024

function privateAnswers(): string[] {
  const csv = walk(PRIVATE).filter((f) => f.endsWith('.csv'))
  const tooBig = csv.filter((f) => statSync(f).size > MAX_BYTES)
  if (tooBig.length) console.warn(`Confidentialité : fichiers trop gros, non contrôlés : ${tooBig.join(', ')}`)
  return csv
    .filter((f) => !tooBig.includes(f))
    .flatMap((f) => analyzeCsv(readFileSync(f, 'utf8')).table.rows.flat())
    .filter((cell) => words(cell).length >= N)
}

describe('confidentialité', () => {
  const answers = privateAnswers()
  it.skipIf(!answers.length)('aucune suite de six mots d’une réponse réelle dans le dépôt', () => {
    const grams = new Set<string>()
    for (const a of answers) {
      const w = words(a)
      for (let i = 0; i + N <= w.length; i++) if (meaningful(w.slice(i, i + N))) grams.add(w.slice(i, i + N).join(' '))
    }
    const files = [...walk('src'), ...walk('e2e'), ...walk('docs'), ...walk('public'), ...walk('scripts'), 'CLAUDE.md'].filter((f) =>
      /\.(ts|tsx|md|json|css|html)$/.test(f),
    )
    const leaks: string[] = []
    for (const f of files) {
      const w = words(readFileSync(f, 'utf8'))
      for (let i = 0; i + N <= w.length; i++) {
        const g = w.slice(i, i + N).join(' ')
        if (grams.has(g)) leaks.push(`${f} : « ${g} »`)
      }
    }
    expect(leaks).toEqual([])
  })
})
