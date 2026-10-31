/**
 * Confidentialité de tout l'historique git, avant de le rendre public.
 *
 * Le test de confidentialité (`src/core/privacy.test.ts`) ne contrôle que l'état actuel des fichiers. Ce script lit
 * chaque version de chaque fichier de toutes les branches et étiquettes, et y cherche une suite de six mots d'une
 * réponse des corpus privés (les CSV de `fixtures/private/`, hors données ouvertes de l'Observatoire). Il ne modifie
 * rien ; il nomme le fichier, la suite trouvée et le premier commit qui la contient.
 *
 * Usage (depuis la racine d'une copie du dépôt qui a toutes ses branches) :
 *   npx tsx scripts/confidentialite-historique.ts [--prive fixtures/private]
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { analyzeCsv } from '../src/core/import/csv'

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > 0 ? process.argv[i + 1] : undefined
}
const PRIVATE = arg('prive') ?? 'fixtures/private'
const N = 6

// Mêmes règles que le test de confidentialité : mots sans accents ni casse, au moins deux mots pleins par suite.
const words = (t: string) =>
  t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, ' ')
    .match(/[a-z0-9]+/g) ?? []
const meaningful = (g: string[]) => g.filter((w) => w.length >= 5).length >= 2
const walk = (d: string): string[] =>
  existsSync(d) ? readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)])) : []

const csv = walk(PRIVATE).filter((f) => f.endsWith('.csv') && !f.startsWith(join(PRIVATE, 'observatoire')))
if (!csv.length) {
  console.log(`Aucun corpus privé dans ${PRIVATE} : rien à contrôler.`)
  process.exit(0)
}
const grams = new Set<string>()
for (const f of csv)
  for (const cell of analyzeCsv(readFileSync(f, 'utf8')).table.rows.flat()) {
    const w = words(cell)
    for (let i = 0; i + N <= w.length; i++) if (meaningful(w.slice(i, i + N))) grams.add(w.slice(i, i + N).join(' '))
  }
console.log(`${csv.length} corpus privé(s), ${grams.size} suites de six mots.`)

// Chaque version de chaque fichier texte, une seule fois.
const git = (args: string[], input?: string) => execFileSync('git', args, { input, maxBuffer: 1 << 30 })
const TEXT = /\.(ts|tsx|js|mjs|cjs|md|json|css|html|txt|csv|sql|yml|yaml)$/
const blobs = new Map<string, string>()
for (const line of git(['rev-list', '--all', '--objects']).toString().split('\n')) {
  const [sha, path] = [line.slice(0, 40), line.slice(41)]
  if (path && TEXT.test(path) && !blobs.has(sha)) blobs.set(sha, path)
}
const out = git(['cat-file', '--batch'], [...blobs.keys()].join('\n') + '\n')
const leaks = new Map<string, { path: string; gram: string }>()
for (let at = 0; at < out.length; ) {
  const eol = out.indexOf(10, at)
  const [sha, type, size] = out.subarray(at, eol).toString().split(' ')
  const body = out.subarray(eol + 1, eol + 1 + Number(size))
  at = eol + 1 + Number(size) + 1
  if (type !== 'blob') continue
  const w = words(body.toString('utf8'))
  for (let i = 0; i + N <= w.length; i++) {
    const g = w.slice(i, i + N).join(' ')
    if (grams.has(g)) {
      leaks.set(sha, { path: blobs.get(sha)!, gram: g })
      break
    }
  }
}
console.log(`${blobs.size} versions de fichiers lues.`)
if (!leaks.size) {
  console.log('Aucune citation d’un corpus privé dans l’historique.')
  process.exit(0)
}
// Une ligne par fichier : nombre de versions touchées, une suite trouvée, le commit le plus ancien qui la contient.
const byPath = new Map<string, { gram: string; shas: string[] }>()
for (const [sha, { path, gram }] of leaks) {
  const e = byPath.get(path) ?? { gram, shas: [] }
  e.shas.push(sha)
  byPath.set(path, e)
}
for (const [path, { gram, shas }] of byPath) {
  const commits = shas.flatMap((sha) => git(['log', '--all', '--format=%at %ad %h %s', '--date=short', `--find-object=${sha}`]).toString().split('\n').filter(Boolean))
  const first = commits.sort((a, b) => parseInt(a) - parseInt(b))[0]?.replace(/^\d+ /, '') ?? '?'
  console.log(`- ${path} : ${shas.length} version(s), « ${gram} », dès ${first.slice(0, 100)}`)
}
process.exit(1)
