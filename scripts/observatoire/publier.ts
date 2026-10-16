/**
 * Observatoire : publie une étude sur le site (dossier `public/observatoire/`).
 *
 * Seules des pages statiques sont publiées : la fiche de l'étude (actualité,
 * source, question, échantillon, précautions de lecture) suivie du rapport
 * complet, prénoms de particuliers masqués. Le fichier d'étude brut (corpus et
 * réponses du moteur) reste hors du dépôt.
 *
 * Usage :
 *   npx tsx scripts/observatoire/publier.ts <etude.openscribe.json> <fiche.json>
 *
 * Écrit `public/observatoire/<slug>/index.html`, puis refait la liste
 * `public/observatoire/index.json` et la page `public/observatoire/index.html`.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { reportToHtml } from '../../src/core/analysis/report'
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

// Publication grand public : les prénoms de particuliers sont toujours masqués.
const report = reportToHtml({ ...analysis, settings: { ...analysis.settings, maskNames: true } }, project.corpus, fiche.title)

const head = `<nav class="obs-nav"><a href="../">L'Observatoire OpenScribe</a></nav>
<p class="obs-meta">Publié le ${e(date(fiche.publishedAt))} · ${e(fiche.news)}</p>`
const card = `<section class="obs-fiche" aria-label="Fiche de l'étude">
<h2>En bref</h2>
${paras(fiche.summary)}
<h2>La question posée</h2>
<blockquote>${e(fiche.question)}</blockquote>
<h2>Les données</h2>
<p><a href="${e(fiche.source.url)}">${e(fiche.source.name)}</a>, ${e(fiche.source.period)}. ${e(fiche.source.license)}.</p>
<p>${n(fiche.sample)} réponses tirées au sort parmi ${n(fiche.population)} (marge de ± ${fiche.margin} points à 95 %). Un avis partagé par 1 % des contributeurs a ${Math.round((1 - 0.99 ** fiche.sample) * 100)} % de chances d'apparaître au moins une fois dans l'échantillon ; un avis plus rare peut manquer.</p>
${paras(fiche.sampling)}
<h2>Avant de lire</h2>
<ul>${fiche.warnings.map((w) => `<li>${e(w)}</li>`).join('')}</ul>
</section>`
const style = `<style>
.obs-nav{font-size:.9rem;margin-bottom:1rem}.obs-nav a{color:var(--brand);text-decoration:none;font-weight:600}
.obs-meta{color:var(--muted);font-size:.9rem;margin-top:0}
.obs-fiche{background:var(--card);border-radius:.5rem;padding:.4rem 1.2rem 1rem;margin:1.2rem 0 2rem}
.obs-fiche h2{font-size:1.1rem;margin-top:1.4rem;border:0;padding:0}
.obs-fiche blockquote{margin:.4rem 0;padding-left:.8rem;border-left:3px solid var(--brand);font-style:italic}
</style>`

const marker = /<h1>[\s\S]*?<\/h1>/
if (!marker.test(report)) throw new Error('Rapport sans titre : gabarit inattendu.')
const page = report
  .replace('</head>', `${style}</head>`)
  .replace('<body>', `<body>\n${head}`)
  .replace(marker, (h1) => `${h1}\n${card}\n<h2 class="obs-report">Le rapport complet</h2>`)

const root = join('public', 'observatoire')
mkdirSync(join(root, fiche.slug), { recursive: true })
writeFileSync(join(root, fiche.slug, 'index.html'), page)

// La liste des études publiées, la plus récente d'abord.
const listPath = join(root, 'index.json')
type Entry = { slug: string; title: string; publishedAt: string; news: string; summary: string }
const list: Entry[] = existsSync(listPath) ? JSON.parse(readFileSync(listPath, 'utf8')) : []
const entry: Entry = { slug: fiche.slug, title: fiche.title, publishedAt: fiche.publishedAt, news: fiche.news, summary: fiche.summary }
const studies = [entry, ...list.filter((x) => x.slug !== fiche.slug)].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
writeFileSync(listPath, `${JSON.stringify(studies, null, 1)}\n`)

writeFileSync(
  join(root, 'index.html'),
  `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>L'Observatoire OpenScribe</title>
<meta name="description" content="Chaque semaine, l'analyse publique d'une consultation citoyenne en données ouvertes.">
<link rel="icon" href="../favicon.svg">
<style>
:root{--ink:#1d1f2b;--muted:#5b6078;--line:#e3e5f5;--brand:#2F40C2;--card:#f7f8fd}
body{font-family:Geist,system-ui,-apple-system,"Segoe UI",sans-serif;max-width:52rem;margin:2rem auto;padding:0 1rem;line-height:1.6;color:var(--ink);background:#fff}
h1{color:var(--brand);font-size:2rem;margin-bottom:.3rem}.lead{color:var(--muted);margin-top:0}
article{background:var(--card);border-radius:.5rem;padding:.6rem 1.2rem 1rem;margin:1.2rem 0}
article h2{font-size:1.2rem;margin:.6rem 0 .2rem}article h2 a{color:var(--ink)}.meta{color:var(--muted);font-size:.9rem;margin:0 0 .6rem}
footer{color:var(--muted);font-size:.9rem;margin-top:2.5rem;border-top:1px solid var(--line);padding-top:1rem}footer a{color:var(--brand)}
</style></head><body>
<h1>L'Observatoire</h1>
<p class="lead">Chaque semaine, l'analyse publique d'une consultation citoyenne en données ouvertes, réalisée avec OpenScribe. Le moteur d'IA propose, le code vérifie : chaque chiffre se recompte, chaque citation renvoie à la réponse d'origine.</p>
${studies
  .map(
    (s) => `<article>
<h2><a href="${e(s.slug)}/">${e(s.title)}</a></h2>
<p class="meta">Publié le ${e(date(s.publishedAt))} · ${e(s.news)}</p>
${paras(s.summary)}
</article>`,
  )
  .join('\n')}
<footer>OpenScribe, un nouvel outil open source de recherche utilisateur. <a href="../">Analyser vos propres réponses</a>.</footer>
</body></html>
`,
)
console.log(`Publié : ${join(root, fiche.slug, 'index.html')} (${studies.length} étude${studies.length > 1 ? 's' : ''} dans l'Observatoire)`)
