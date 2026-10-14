/**
 * Observatoire : publie une synthèse terminée sur le site.
 *
 * Entrées : le fichier de synthèse exporté par le pont (`--export`) et une fiche
 * JSON (titre, actualité, source, échantillon, résumé, avertissements). Sorties,
 * dans `public/observatoire/` :
 *   - `<slug>.openscribe.json` : la synthèse, à ouvrir dans l'application ;
 *   - `<slug>.html` : le rapport en page statique, lisible sans JavaScript,
 *     indexable par les moteurs de recherche, partageable par un lien ;
 *   - `index.json` : la liste des synthèses publiées, mise à jour.
 *
 * Usage : npx tsx scripts/observatoire/publier.ts <synthese.openscribe.json> <fiche.json>
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { reportToHtml } from '../../src/core/analysis/report'
import { parseObservatoryIndex, sampleLine, type PublicStudy } from '../../src/core/observatory'
import { corpusForAnalysis, exportProject, importProject } from '../../src/core/project'

const [studyPath, fichePath] = process.argv.slice(2)
if (!studyPath || !fichePath) {
  console.error('Usage : npx tsx scripts/observatoire/publier.ts <synthese.openscribe.json> <fiche.json>')
  process.exit(1)
}

const SITE = 'https://openscribe.fr'
const OUT = 'public/observatoire'
mkdirSync(OUT, { recursive: true })

const fiche = JSON.parse(readFileSync(fichePath, 'utf8')) as Omit<PublicStudy, 'file' | 'page'>
const study: PublicStudy = { ...fiche, file: `${fiche.slug}.openscribe.json`, page: `${fiche.slug}.html` }

const { project, responses } = importProject(readFileSync(studyPath, 'utf8'))
// Publication : le titre de la fiche partout, et les prénoms de particuliers toujours masqués.
project.name = study.title
for (const a of project.analyses) a.settings = { ...a.settings, maskNames: true }
const analysis = project.analyses.find((a) => a.status === 'done')
if (!analysis) throw new Error("La synthèse n'a pas d'analyse terminée.")
const text = exportProject(project, responses)

const e = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const description = `${study.summary.split('\n')[0].slice(0, 155)}`
const head = `<meta name="description" content="${e(description)}">
<link rel="canonical" href="${SITE}/observatoire/${study.page}">
<meta property="og:type" content="article"><meta property="og:title" content="${e(study.title)}">
<meta property="og:description" content="${e(description)}"><meta property="og:url" content="${SITE}/observatoire/${study.page}">
<meta property="og:image" content="${SITE}/og-image.png"><meta name="twitter:card" content="summary_large_image">
<style>.obs{background:#f7f8fd;border:1px solid #e3e5f5;border-radius:.75rem;padding:1rem 1.2rem;margin:0 0 2rem}.obs p{margin:.4rem 0}.obs .kicker{color:#2F40C2;font-weight:600;font-size:.9rem}.obs ul{margin:.4rem 0}.obs li{list-style:disc;margin-left:1.2rem;color:#5b6078;font-size:.92rem}.obs .cta{display:inline-block;margin-top:.6rem;background:#2F40C2;color:#fff;padding:.5rem .9rem;border-radius:.5rem;text-decoration:none;font-weight:600}.obs a{color:#2F40C2}</style>`
const nav = `<nav class="obs-nav" style="margin-bottom:1rem;font-size:.9rem"><a href="/#/observatoire" style="color:#2F40C2">← Observatoire OpenScribe</a></nav>`
const banner = `<aside class="obs">
<p class="kicker">Observatoire OpenScribe · ${e(study.news)}</p>
<p><strong>Question posée :</strong> « ${e(study.question)} »</p>
<p><strong>Source :</strong> <a href="${e(study.source.url)}">${e(study.source.name)}</a>, ${e(study.source.period)} (${e(study.source.license)}). ${e(sampleLine(study))}.</p>
<p><strong>À lire avant :</strong></p>
<ul>${study.warnings.map((w) => `<li>${e(w)}</li>`).join('')}</ul>
${study.sampling ? `<details><summary>Comment l'échantillon a été tiré au sort, et pourquoi il suffit</summary>${study.sampling.split('\n').filter(Boolean).map((l) => `<p>${e(l)}</p>`).join('')}</details>` : ''}
<p><a href="/observatoire/methode.html">Méthode détaillée, formules comprises</a></p>
<a class="cta" href="/#/observatoire/${study.slug}">Explorer chaque verbatim dans OpenScribe →</a>
</aside>`
const footer = `<footer style="margin-top:3rem;border-top:1px solid #e3e5f5;padding-top:1rem;color:#5b6078;font-size:.9rem">Analysé avec <a href="/" style="color:#2F40C2">OpenScribe</a>, logiciel libre de recherche utilisateur (AGPL-3.0) : l'IA lit et regroupe, le code vérifie chaque citation et calcule chaque chiffre. <a href="https://github.com/Fasterious/openscribe" style="color:#2F40C2">Code source</a>.</footer>`

let html = reportToHtml(analysis, corpusForAnalysis(project), study.title)
html = html.replace('</head>', `${head}\n</head>`).replace(/<body([^>]*)>/, `<body$1>\n${nav}`).replace(/<\/h1>/, `</h1>\n${banner}`).replace('</body>', `${footer}\n</body>`)

writeFileSync(join(OUT, study.file), text)
writeFileSync(join(OUT, study.page), html)

const indexPath = join(OUT, 'index.json')
const current = existsSync(indexPath) ? parseObservatoryIndex(JSON.parse(readFileSync(indexPath, 'utf8'))) : []
const studies = parseObservatoryIndex({ studies: [study, ...current.filter((s) => s.slug !== study.slug)] })
writeFileSync(indexPath, JSON.stringify({ studies }, null, 2) + '\n')
console.log(`Publié : ${OUT}/${study.page} (${studies.length} synthèse(s) dans l'index)`)
