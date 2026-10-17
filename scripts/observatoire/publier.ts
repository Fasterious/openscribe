/**
 * Observatoire : publie une étude sur le site (dossier `public/observatoire/`).
 *
 * Deux versions de chaque étude, prénoms de particuliers masqués partout :
 * - l'article (`<slug>/index.html`) : la fiche (actualité, source, question,
 *   échantillon, précautions de lecture) suivie du rapport complet, en une page ;
 *   un renvoi ou un verbatim s'y déplie au clic (réponse entière) ;
 * - l'étude lisible dans l'application (`<slug>/etude.json`, ouverte par
 *   `#/observatoire/<slug>`), réponses entières comprises, masquées à la source.
 * Les réponses du moteur et la liste des prénoms restent hors du dépôt.
 *
 * Usage :
 *   npx tsx scripts/observatoire/publier.ts <etude.openscribe.json> <fiche.json>
 *
 * Écrit `public/observatoire/<slug>/index.html` et `etude.json`, puis refait la liste
 * `public/observatoire/index.json` et la page `public/observatoire/index.html`.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { remainingNames } from '../../src/core/analysis/names'
import { reportToHtml } from '../../src/core/analysis/report'
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


// Le menu de l'application, sur chaque page publiée : on revient toujours à l'accueil, à Synthèse ou à la liste.
const menu = (here: 'list' | 'study') => `<header class="obs-menu"><a class="obs-brand" href="/"><img src="/logo.svg" alt="" width="28" height="28"><span>OpenScribe</span></a>
<nav aria-label="Menu"><a href="/">Accueil</a><a href="/#/synthese">Synthèse</a><a href="/observatoire/"${here === 'list' ? ' aria-current="page"' : ''}>Observatoire</a></nav></header>`
const menuStyle = `.obs-menu{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:.5rem 1rem;padding-bottom:.8rem;margin-bottom:1.2rem;border-bottom:1px solid var(--line)}
.obs-menu a,.obs-nav a{border:0;text-decoration:none}
.obs-brand{display:flex;align-items:center;gap:.5rem;font-weight:700;color:var(--ink);text-decoration:none}
.obs-menu nav{display:flex;flex-wrap:wrap;gap:.25rem}.obs-menu nav a{padding:.35rem .6rem;border-radius:.4rem;color:var(--ink);text-decoration:none;font-size:.95rem;font-weight:500}
.obs-menu nav a:hover{background:var(--card)}.obs-menu nav a[aria-current]{background:var(--card);color:var(--brand)}
@media print{.obs-menu,.obs-nav{display:none}}`

const sampleLine = `${n(fiche.sample)} réponses tirées au sort parmi ${n(fiche.population)} (marge de ± ${fiche.margin} points à 95 %). Un avis partagé par 1 % des contributeurs a ${Math.round((1 - 0.99 ** fiche.sample) * 100)} % de chances d'apparaître au moins une fois dans l'échantillon ; un avis plus rare peut manquer.`
// Publication grand public : l'étude masquée une fois (prénoms, réponses entières comprises), source des deux versions.
const study = publishedStudy(project, analysis, {
  slug: fiche.slug,
  title: fiche.title,
  publishedAt: fiche.publishedAt,
  news: fiche.news,
  fiche: { summary: fiche.summary, question: fiche.question, source: fiche.source, sample: sampleLine, sampling: fiche.sampling, warnings: fiche.warnings },
})
const report = reportToHtml(study.project.analyses[0], study.project.corpus, fiche.title)
const head = `${menu('study')}
<nav class="obs-nav"><a href="/observatoire/">← Toutes les études de l'Observatoire</a></nav>
<p class="obs-switch">Touchez un renvoi (P12) pour voir ses verbatims, ou un verbatim pour le relire dans sa réponse complète. Vous préférez parcourir les motifs un à un ? <a href="/#/observatoire/${e(fiche.slug)}">Ouvrir dans l'application</a>.</p>
<p class="obs-meta">Publiée le ${e(date(fiche.publishedAt))} · ${e(fiche.news)}</p>`
const card = `<section class="obs-fiche" aria-label="Fiche de l'étude">
<h2>En bref</h2>
${paras(fiche.summary)}
<h2>La question posée</h2>
<blockquote>${e(fiche.question)}</blockquote>
<h2>Les données</h2>
<p><a href="${e(fiche.source.url)}">${e(fiche.source.name)}</a>, ${e(fiche.source.period)}. ${e(fiche.source.license)}.</p>
<p>${e(sampleLine)}</p>
${paras(fiche.sampling)}
<h2>Avant de lire</h2>
<ul>${fiche.warnings.map((w) => `<li>${e(w)}</li>`).join('')}</ul>
</section>`
const style = `<style>
${menuStyle}
.obs-nav{font-size:.9rem;margin-bottom:1rem}.obs-nav a{color:var(--brand);text-decoration:none;font-weight:600}
.obs-meta{color:var(--muted);font-size:.9rem;margin-top:0}
.obs-switch{background:var(--card);border-radius:.5rem;padding:.6rem .9rem;font-size:.95rem}.obs-switch a{font-weight:600}
@media print{.obs-switch{display:none}}
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
if (remainingNames(page, analysis.names).length) throw new Error('Prénom encore présent dans la page publiée : publication refusée.')
writeFileSync(join(root, fiche.slug, 'index.html'), page)
// La version application : la même étude, ouverte en lecture seule par #/observatoire/<slug>.
writeFileSync(join(root, fiche.slug, 'etude.json'), JSON.stringify(study))


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
<link rel="icon" href="/favicon.svg">
<style>
:root{--ink:#1d1f2b;--muted:#5b6078;--line:#e3e5f5;--brand:#2F40C2;--card:#f7f8fd}
body{font-family:Geist,system-ui,-apple-system,"Segoe UI",sans-serif;max-width:52rem;margin:2rem auto;padding:0 1rem;line-height:1.6;color:var(--ink);background:#fff}
h1{color:var(--brand);font-size:2rem;margin-bottom:.3rem}.lead{color:var(--muted);margin-top:0}
article{background:var(--card);border-radius:.5rem;padding:.6rem 1.2rem 1rem;margin:1.2rem 0}
article h2{font-size:1.2rem;margin:.6rem 0 .2rem}article h2 a{color:var(--ink)}.meta{color:var(--muted);font-size:.9rem;margin:0 0 .6rem}.meta a{color:var(--brand)}
footer{color:var(--muted);font-size:.9rem;margin-top:2.5rem;border-top:1px solid var(--line);padding-top:1rem}footer a{color:var(--brand)}
${menuStyle}
</style></head><body>
${menu('list')}
<h1>L'Observatoire</h1>
<p class="lead">Chaque semaine, l'analyse publique d'une consultation citoyenne en données ouvertes, réalisée avec OpenScribe. Le moteur d'IA propose, le code vérifie : chaque chiffre se recompte, chaque citation renvoie à la réponse d'origine.</p>
${studies
  .map(
    (s) => `<article>
<h2><a href="${e(s.slug)}/">${e(s.title)}</a></h2>
<p class="meta">Publiée le ${e(date(s.publishedAt))} · ${e(s.news)} · <a href="/#/observatoire/${e(s.slug)}">Ouvrir dans l'application</a></p>
${paras(s.summary)}
</article>`,
  )
  .join('\n')}
<footer>OpenScribe, un nouvel outil open source de recherche utilisateur. <a href="/">Analyser vos propres réponses</a>.</footer>
</body></html>
`,
)
console.log(`Publié : ${join(root, fiche.slug, 'index.html')} (${studies.length} étude${studies.length > 1 ? 's' : ''} dans l'Observatoire)`)
