/**
 * Lecture à l'aveugle : le `methodologue` et la `plume` notent une synthèse sans savoir quel moteur l'a écrite
 * (un évaluateur Opus pourrait favoriser sa famille). Chaque synthèse est copiée sous un code tiré au hasard, sans le
 * nom du moteur ni son réglage ; la correspondance reste à part et ne s'ouvre qu'une fois toutes les notes rendues.
 *
 * Usage :
 *   npx tsx scripts/aveugle.ts masquer <dossier du corpus> <run-a> <run-b>…   copie chaque synthèse, dans un ordre mêlé
 *   npx tsx scripts/aveugle.ts lever <dossier du corpus>                     table code → moteur → notes
 *
 * `<dossier du corpus>/aveugle/<code>/` : ce que lit l'évaluateur (rapport.md, state.json, cache.json), plus
 * notation-*.md qu'il y écrit ; chaque notation commence par une ligne « NOTE : 6,5 · ERREURS : 2 ».
 * `<dossier du corpus>/.correspondance-aveugle.json` : la correspondance, à ne donner à aucun évaluateur.
 */
import { randomBytes, randomInt } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const [action, dir, ...runs] = process.argv.slice(2)
if (!dir || (action !== 'masquer' && action !== 'lever')) {
  console.error('Usage : npx tsx scripts/aveugle.ts masquer <dossier> <run…> | lever <dossier>')
  process.exit(1)
}

const blindDir = join(dir, 'aveugle')
const mapFile = join(dir, '.correspondance-aveugle.json')
const map: Record<string, { run: string; model: string }> = existsSync(mapFile) ? JSON.parse(readFileSync(mapFile, 'utf8')) : {}

/** Tout ce qui nommerait le moteur. ÉcoSol ne contient aucun de ces mots : un reste trahit un oubli du masquage. */
const REVEALS = /ministral|mistral|magistral|gemini|gemma|google|anthropic|claude|sonnet|opus|haiku|openai|gpt/i

if (action === 'masquer') {
  mkdirSync(blindDir, { recursive: true })
  const shuffled = [...runs]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  for (const run of shuffled) {
    const code = randomBytes(3).toString('hex').toUpperCase()
    const out = join(blindDir, code)
    mkdirSync(out)
    const state = JSON.parse(readFileSync(join(dir, run, 'state.json'), 'utf8'))
    map[code] = { run, model: state.engine.model }
    state.engine = { presetId: 'masque', model: 'masque', baseUrl: 'masque' }
    state.settings.method = 'masquee'
    delete state.calls
    const report = readFileSync(join(dir, run, 'rapport.md'), 'utf8')
      .replace(/^# .*/, `# Synthèse ${code}`)
      .replace(/^- Moteur d'IA : .*$/m, "- Moteur d'IA : masqué pour la lecture à l'aveugle.")
      .replace(/^- Méthode : .*$/m, '- Méthode : méthode commune (réglage masqué).')
    const files = { 'state.json': JSON.stringify(state), 'rapport.md': report, 'cache.json': readFileSync(join(dir, run, 'cache.json'), 'utf8') }
    for (const [name, text] of Object.entries(files)) {
      const leak = text.match(REVEALS)
      if (leak) throw new Error(`Masquage incomplet : « ${leak[0]} » reste dans ${name} (${run}).`)
      writeFileSync(join(out, name), text)
    }
    copyFileSync(join(dir, 'reponses.csv'), join(out, 'reponses.csv'))
    console.log(code)
  }
  writeFileSync(mapFile, JSON.stringify(map, null, 1))
} else {
  for (const [code, { model }] of Object.entries(map)) {
    const notes = readdirSync(join(blindDir, code))
      .filter((f) => f.startsWith('notation-'))
      .map((f) => `${f.replace(/^notation-|\.md$/g, '')} : ${readFileSync(join(blindDir, code, f), 'utf8').split('\n')[0]}`)
    console.log(`${code} · ${model}\n  ${notes.join('\n  ') || 'pas encore noté'}`)
  }
}
