/**
 * Rend le rapport d'un état d'analyse avec le code actuel, pour comparer deux analyses sous la même mise en forme.
 * Usage : npx tsx essais/boucle-unique/kit/rendre.ts <fichier.csv> <state.json> <sortie.md> [--titre "…"]
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { analyzeCsv, csvToCorpus, type ColumnRole } from '../../../src/core/import/csv'
import { reportToMarkdown } from '../../../src/core/analysis/report'

const [csvPath, statePath, out, ...rest] = process.argv.slice(2)
const i = rest.indexOf('--titre')
const csv = analyzeCsv(readFileSync(csvPath, 'utf8'))
const roles: Record<number, ColumnRole> = Object.fromEntries(csv.columns.map((c) => [c.index, c.suggestedRole]))
const corpus = csvToCorpus(csv.table, { roles, sourceName: csvPath.split('/').pop() ?? 'corpus.csv' })
writeFileSync(out, reportToMarkdown(JSON.parse(readFileSync(statePath, 'utf8')), corpus, i >= 0 ? rest[i + 1] : 'Synthèse'))
