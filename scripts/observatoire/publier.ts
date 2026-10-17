/**
 * Observatoire : publie une étude sur le site (dossier `public/observatoire/`).
 *
 * L'étude se lit dans l'application (`#/observatoire/<slug>`), à partir de `<slug>/etude.json` : rapport et réponses
 * entières, prénoms de particuliers masqués à la source. À l'adresse `/observatoire/<slug>/`, une page légère porte le
 * titre, le résumé et l'aperçu pour les moteurs de recherche et les réseaux, puis ouvre l'étude dans l'application.
 * Les réponses du moteur et la liste des prénoms restent hors du dépôt.
 *
 * Usage :
 *   npx tsx scripts/observatoire/publier.ts <etude.openscribe.json> <fiche.json>
 *
 * Écrit `public/observatoire/<slug>/etude.json` et `index.html`, puis refait la liste
 * `public/observatoire/index.json` et sa page `public/observatoire/index.html`.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { remainingNames } from '../../src/core/analysis/names'
import { publishedStudy } from '../../src/core/observatoire'
import { importProject } from '../../src/core/project'

interface Fiche {
  slug: string
  title: string
  publishedAt: string
  news: string
  question: string
  source: { name: string; url: string; license: string; period: string }
  population: number
  sample: number
  margin: number
  summary: string
  sampling: string
  warnings: string[]
}

const [studyPath, fichePath] = process.argv.slice(2)
if (!studyPath || !fichePath) {
  console.error('Usage : npx tsx scripts/observatoire/publier.ts <etude.openscribe.json> <fiche.json>')
  process.exit(1)
}

const fiche = JSON.parse(readFileSync(fichePath, 'utf8')) as Fiche
if (!/^[a-z0-9-]+$/.test(fiche.slug)) throw new Error(`Identifiant de fiche invalide : ${fiche.slug}`)
const { project } = importProject(readFileSync(studyPath, 'utf8'))
const analysis = project.analyses.find((a) => a.status === 'done')
if (!analysis) throw new Error("L'étude n'a pas d'analyse terminée.")

const e = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const paras = (s: string) =>
  s
    .split(/\n+/)
    .map((p) => `<p>${e(p.trim())}</p>`)
    .join('')
const n = (x: number) => x.toLocaleString('fr-FR')
const date = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })


// 378 réponses tirées, 366 participants dans le rapport : l'écart se dit (remarque d'Arnaud, 17/10).
const speakers = new Set(analysis.ideas.map((i) => i.participantId)).size
const silent = fiche.sample - speakers
const sampleLine = `${n(fiche.sample)} réponses tirées au sort parmi ${n(fiche.population)} (marge de ± ${fiche.margin} points à 95 %).${silent > 0 ? ` ${n(silent)} d'entre elles, trop brèves ou sans avis sur la question, ne donnent aucune idée : le rapport porte sur ${n(speakers)} participants.` : ''} Un avis partagé par 1 % des contributeurs a ${Math.round((1 - 0.99 ** fiche.sample) * 100)} % de chances d'apparaître au moins une fois dans l'échantillon ; un avis plus rare peut manquer.`
// Publication grand public : l'étude masquée une fois (prénoms, réponses entières comprises), source des deux versions.
const study = publishedStudy(project, analysis, {
  slug: fiche.slug,
  title: fiche.title,
  publishedAt: fiche.publishedAt,
  news: fiche.news,
  fiche: { summary: fiche.summary, question: fiche.question, source: fiche.source, sample: sampleLine, sampling: fiche.sampling, warnings: fiche.warnings },
})
const root = join('public', 'observatoire')
mkdirSync(join(root, fiche.slug), { recursive: true })
// publishedStudy refuse déjà une étude où subsiste un prénom ; la page légère est contrôlée à son tour.
writeFileSync(join(root, fiche.slug, 'etude.json'), JSON.stringify(study))

/**
 * Une adresse lisible sans application : titre, description et aperçu (moteurs de recherche, réseaux), le résumé en
 * clair, puis l'ouverture immédiate de l'étude dans l'application. Les anciens liens vers l'article y mènent aussi.
 */
const SITE = 'https://openscribe.fr'
const landing = (o: { path: string; app: string; title: string; description: string; body: string }) => `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(o.title)}</title>
<meta name="description" content="${e(o.description)}">
<link rel="canonical" href="${SITE}${o.path}">
<meta property="og:type" content="article"><meta property="og:site_name" content="OpenScribe">
<meta property="og:title" content="${e(o.title)}"><meta property="og:description" content="${e(o.description)}"><meta property="og:url" content="${SITE}${o.path}">
<link rel="icon" href="/favicon.svg">
<meta http-equiv="refresh" content="0; url=${o.app}">
<script>location.replace(${JSON.stringify(o.app)})</script>
<style>body{font-family:Geist,system-ui,sans-serif;max-width:46rem;margin:2rem auto;padding:0 1rem;line-height:1.6;color:#1d1f2b}a{color:#2F40C2}</style>
</head><body>
${o.body}
</body></html>
`
const firstPara = (t: string) => t.split(/\n+/).find((p) => p.trim())?.trim() ?? ''
const studyPage = landing({
  path: `/observatoire/${fiche.slug}/`,
  app: `/#/observatoire/${fiche.slug}`,
  title: `${study.title} — L'Observatoire OpenScribe`,
  description: firstPara(study.fiche.summary),
  body: `<h1>${e(study.title)}</h1>
<p>Publiée le ${e(date(fiche.publishedAt))} · ${e(fiche.news)}</p>
${paras(study.fiche.summary)}
<p><a href="/#/observatoire/${e(fiche.slug)}">Lire l'étude dans OpenScribe</a></p>`,
})
if (remainingNames(studyPage, analysis.names).length) throw new Error('Prénom encore présent dans la page publiée : publication refusée.')
writeFileSync(join(root, fiche.slug, 'index.html'), studyPage)

// La liste des études publiées, la plus récente d'abord.
const listPath = join(root, 'index.json')
type Entry = { slug: string; title: string; publishedAt: string; news: string; summary: string }
const list: Entry[] = existsSync(listPath) ? JSON.parse(readFileSync(listPath, 'utf8')) : []
const entry: Entry = { slug: fiche.slug, title: fiche.title, publishedAt: fiche.publishedAt, news: fiche.news, summary: fiche.summary }
const studies = [entry, ...list.filter((x) => x.slug !== fiche.slug)].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
writeFileSync(listPath, `${JSON.stringify(studies, null, 1)}\n`)

writeFileSync(
  join(root, 'index.html'),
  landing({
    path: '/observatoire/',
    app: '/#/observatoire',
    title: "L'Observatoire OpenScribe",
    description: "L'analyse publique de consultations citoyennes en données ouvertes : chaque chiffre se recompte, chaque citation renvoie à la réponse d'origine.",
    body: `<h1>L'Observatoire</h1>
<ul>${studies.map((x) => `<li><a href="/#/observatoire/${e(x.slug)}">${e(x.title)}</a> · publiée le ${e(date(x.publishedAt))}</li>`).join('')}</ul>`,
  }),
)
console.log(`Publié : ${join(root, fiche.slug, 'etude.json')} (${studies.length} étude${studies.length > 1 ? 's' : ''} dans l'Observatoire)`)
