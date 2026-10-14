/**
 * Pont de test : lance une vraie analyse en remplaçant le fournisseur d'IA
 * distant par des fichiers.
 *
 * Chaque demande que l'application enverrait à un fournisseur est écrite dans
 * `<dossier>/requests/<id>.json`. Un modèle (par exemple un sous-agent Claude
 * jouant le rôle « modele-simule ») y répond en écrivant
 * `<dossier>/responses/<id>.json`. Le script attend la réponse et continue,
 * exactement comme avec une API. Les réponses sont gardées en cache : une
 * relance est gratuite et donne le même résultat.
 *
 * Usage :
 *   npx tsx scripts/bridge.ts <fichier.csv> <dossier> [--question "objectif"] [--concurrency 10]
 *     [--export etude.openscribe.json --name "Nom de l'étude" --description "…"]
 *
 * Le script écrit `<dossier>/state.json` à chaque étape, puis
 * `<dossier>/rapport.md` et `<dossier>/rapport.html` à la fin.
 */
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { exportProject, newProject } from '../src/core/project'
import { newAnalysis, runAnalysis } from '../src/core/analysis/pipeline'
import { reportToHtml, reportToMarkdown } from '../src/core/analysis/report'
import type { ResponseCache } from '../src/core/analysis/runner'
import { stableStringify } from '../src/core/ids'
import { DEFAULT_SETTINGS } from '../src/core/analysis/types'
import type { MethodId } from '../src/core/analysis/methods'
import { analyzeCsv, csvToCorpus, type ColumnRole } from '../src/core/import/csv'
import type { ChatRequest, LlmProvider } from '../src/core/providers/types'

const [csvPath, dir, ...rest] = process.argv.slice(2)
if (!csvPath || !dir) {
  console.error('Usage : npx tsx scripts/bridge.ts <fichier.csv> <dossier> [--question "..."] [--concurrency N] [--model nom]')
  process.exit(1)
}
const opt = (name: string) => {
  const i = rest.indexOf(`--${name}`)
  return i >= 0 ? rest[i + 1] : undefined
}

for (const d of ['requests', 'responses']) mkdirSync(join(dir, d), { recursive: true })

const cacheFile = join(dir, 'cache.json')
const cacheData: Record<string, string> = existsSync(cacheFile) ? JSON.parse(readFileSync(cacheFile, 'utf8')) : {}
const cache: ResponseCache = {
  async get(k) {
    return cacheData[k]
  },
  async set(k, v) {
    cacheData[k] = v
    writeFileSync(cacheFile, JSON.stringify(cacheData))
  },
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Identifiant d'une demande indépendant de la mise en forme des données :
 * on hache les consignes et le contenu du bloc <donnees> une fois relu.
 * Ainsi, une réponse déjà obtenue reste valable si seule la présentation change.
 */
function requestId(task: string, system: string, user: string): string {
  const m = user.match(/<donnees>\n([\s\S]*)\n<\/donnees>/)
  // Ce qui suit le bloc de données (ex. demande de correction après une réponse invalide) fait partie de la demande.
  const instructions = m ? user.slice(0, m.index) + user.slice(m.index! + m[0].length) : user
  const data = m ? stableStringify(JSON.parse(m[1])) : ''
  return createHash('sha256').update(`${task}\n${system}\n${instructions}\n${data}`).digest('hex').slice(0, 16)
}

// Migration : rattache les réponses existantes au nouvel identifiant.
for (const f of readdirSync(join(dir, 'requests'))) {
  const r = JSON.parse(readFileSync(join(dir, 'requests', f), 'utf8'))
  const oldRes = join(dir, 'responses', f)
  const newRes = join(dir, 'responses', `${r.task}-${requestId(r.task, r.system, r.user)}.json`)
  if (existsSync(oldRes) && !existsSync(newRes)) copyFileSync(oldRes, newRes)
}

const bridge: LlmProvider = {
  label: `Pont de test · ${opt('model') ?? 'claude'}`,
  fingerprint: { presetId: 'bridge', model: opt('model') ?? 'claude', baseUrl: 'files' },
  async complete(req: ChatRequest) {
    const id = requestId(req.task, req.system, req.user)
    const reqFile = join(dir, 'requests', `${req.task}-${id}.json`)
    const resFile = join(dir, 'responses', `${req.task}-${id}.json`)
    writeFileSync(reqFile, JSON.stringify({ task: req.task, system: req.system, user: req.user, responseFile: resolve(resFile) }, null, 1))
    const deadline = Date.now() + 90 * 60_000
    while (Date.now() < deadline) {
      if (existsSync(resFile)) {
        const text = readFileSync(resFile, 'utf8').trim()
        if (text) return { text }
      }
      await sleep(2000)
    }
    throw new Error(`Pas de réponse pour ${basename(reqFile)}`)
  },
}

const csv = analyzeCsv(readFileSync(csvPath, 'utf8'))
const roles: Record<number, ColumnRole> = Object.fromEntries(csv.columns.map((c) => [c.index, c.suggestedRole]))
console.log('Colonnes :', csv.columns.map((c) => `${c.header.slice(0, 40)} → ${c.suggestedRole}`).join(' | '))
const corpus = csvToCorpus(csv.table, { roles, sourceName: basename(csvPath) })
// --method lots : essai d'une méthode (voir src/core/analysis/methods.ts) ; par défaut, la référence.
const settings = { ...DEFAULT_SETTINGS, researchQuestion: opt('question') ?? '', ...(opt('method') ? { method: opt('method') as MethodId } : {}) }

const statePath = join(dir, 'state.json')
const initial = existsSync(statePath)
  ? JSON.parse(readFileSync(statePath, 'utf8'))
  : await newAnalysis(corpus, settings, bridge)

const state = await runAnalysis(corpus, initial, {
  provider: bridge,
  cache,
  concurrency: Number(opt('concurrency') ?? 10),
  onUpdate: (s) => {
    writeFileSync(statePath, JSON.stringify(s, null, 1))
    const st = s.steps.map((x) => `${x.id}:${x.state}${x.total ? ` ${x.done}/${x.total}` : ''}`).join(' ')
    console.log(new Date().toISOString().slice(11, 19), st)
  },
})
writeFileSync(statePath, JSON.stringify(state, null, 1))
const title = opt('name') ?? `Analyse — ${basename(csvPath)}`
writeFileSync(join(dir, 'rapport.md'), reportToMarkdown(state, corpus, title))
writeFileSync(join(dir, 'rapport.html'), reportToHtml(state, corpus, title))
console.log('Terminé :', state.status, state.error ?? '', `${state.ideas.length} idées, ${state.groups.length} groupes, ${state.themes.length} thèmes, ${state.rejected.length} citations écartées`)
const pending = readdirSync(join(dir, 'requests')).filter((f) => !existsSync(join(dir, 'responses', f)))
console.log('Demandes sans réponse :', pending.length)

// Export d'une étude complète (corpus, analyse, réponses), ouvrable dans l'application.
const exportPath = opt('export')
if (exportPath && state.status === 'done') {
  const project = newProject(opt('name') ?? title)
  project.description = opt('description') ?? ''
  project.corpus = corpus
  project.analyses = [state]
  const responses = Object.fromEntries(state.cacheKeys.filter((k) => k in cacheData).map((k) => [k, cacheData[k]]))
  writeFileSync(exportPath, exportProject(project, responses))
  console.log('Étude exportée :', exportPath)
}
