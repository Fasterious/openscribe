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
/**
 * L'Observatoire analyse des consultations en données ouvertes (Licence Ouverte), telles que leur source les publie :
 * ses corpus et ses analyses vivent dans `observatoire/`, ses pages publiées (prénoms masqués) dans
 * `public/observatoire/`, et nulle part ailleurs. Les corpus des autres études (ÉcoSol…) n'y figurent jamais : ils
 * restent contrôlés partout, `observatoire/` compris.
 */
const OBSERVATOIRE = 'observatoire'
const OPEN_DATA = [OBSERVATOIRE, join(PRIVATE, 'observatoire')]
const OPEN_PLACES = [OBSERVATOIRE, join('public', 'observatoire')]
const isOpen = (f: string) => OPEN_DATA.some((d) => f.startsWith(d))

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

function privateAnswers(): { open: boolean; text: string }[] {
  const csv = [...walk(PRIVATE), ...walk(OBSERVATOIRE)].filter((f) => f.endsWith('.csv'))
  const tooBig = csv.filter((f) => statSync(f).size > MAX_BYTES)
  if (tooBig.length) console.warn(`Confidentialité : fichiers trop gros, non contrôlés : ${tooBig.join(', ')}`)
  return csv
    .filter((f) => !tooBig.includes(f))
    .flatMap((f) => analyzeCsv(readFileSync(f, 'utf8')).table.rows.flat().map((text) => ({ open: isOpen(f), text })))
    .filter((cell) => words(cell.text).length >= N)
}

describe('confidentialité', () => {
  const answers = privateAnswers()
  it.skipIf(!answers.length)('aucune suite de six mots d’une réponse réelle dans le dépôt', () => {
    // Suites de six mots, avec leur provenance : `true` si elles ne viennent que de données ouvertes de l'Observatoire.
    const grams = new Map<string, boolean>()
    for (const a of answers) {
      const w = words(a.text)
      for (let i = 0; i + N <= w.length; i++) {
        if (!meaningful(w.slice(i, i + N))) continue
        const g = w.slice(i, i + N).join(' ')
        grams.set(g, (grams.get(g) ?? true) && a.open)
      }
    }
    const files = [...walk('src'), ...walk('e2e'), ...walk('docs'), ...walk('public'), ...walk('scripts'), ...walk('essais'), ...walk(OBSERVATOIRE), 'CLAUDE.md'].filter((f) =>
      /\.(ts|tsx|md|json|css|html)$/.test(f),
    )
    const leaks: string[] = []
    for (const f of files) {
      const published = OPEN_PLACES.some((d) => f.startsWith(d))
      const w = words(readFileSync(f, 'utf8'))
      for (let i = 0; i + N <= w.length; i++) {
        const g = w.slice(i, i + N).join(' ')
        const openOnly = grams.get(g)
        if (openOnly === undefined || (published && openOnly)) continue
        leaks.push(`${f} : « ${g} »`)
      }
    }
    expect(leaks).toEqual([])
  })

  /**
   * Un exemple de consigne qui reprend un motif du corpus de certification (« la carte scolaire, par 24 sur 29 ») souffle
   * la réponse au moteur : le test perd son indépendance. Les titres de motifs des analyses privées (deux mots pleins au
   * moins) ne figurent donc jamais dans les consignes.
   */
  const titles = [
    ...new Set(
      [...walk(PRIVATE), ...walk(OBSERVATOIRE)]
        .filter((f) => f.endsWith('.openscribe.json'))
        .flatMap((f): string[] => {
          const d = JSON.parse(readFileSync(f, 'utf8'))
          return ((d.project ?? d).analyses ?? []).flatMap((a: { groups?: { title: string }[] }) => (a.groups ?? []).map((g) => words(g.title).join(' ')))
        })
        .filter((t: string) => t.split(' ').filter((w) => w.length >= 5).length >= 2),
    ),
  ]
  it.skipIf(!titles.length)('aucun motif d’un corpus réel dans les exemples des consignes', () => {
    const prompts = ['src/core/analysis/prompts.ts', 'src/core/analysis/methods.ts'].map((f) => ` ${words(readFileSync(f, 'utf8')).join(' ')} `)
    const found = titles.filter((t) => prompts.some((p) => p.includes(` ${t} `)))
    expect(found).toEqual([])
  })
})
