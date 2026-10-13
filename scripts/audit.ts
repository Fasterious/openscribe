/**
 * Audit d'une étude analysée : les défauts qu'un relecteur trouverait à la
 * main, comptés par le code. Sert de première passe de certification, avant
 * les relecteurs humains ou simulés.
 *
 *   npx tsx scripts/audit.ts <etude.openscribe.json>
 *
 * N'affiche que des identifiants et des titres de motifs, jamais un verbatim :
 * la sortie peut être partagée même quand le corpus est privé.
 */
import { readFileSync } from 'node:fs'
import { highlights } from '../src/core/analysis/highlights'
import { allClaims, clauseCounts, impliedOthers, overcountedPeople } from '../src/core/analysis/numbers'
import { withCurrentMetrics } from '../src/core/analysis/metrics'
import { missingCamps, sentencesOf } from '../src/core/analysis/pipeline'
import { refsToPeople } from '../src/core/analysis/report'
import { corpusForAnalysis, importProject } from '../src/core/project'

const file = process.argv[2]
if (!file) {
  console.error('Usage : npx tsx scripts/audit.ts <etude.openscribe.json>')
  process.exit(1)
}
const { project } = importProject(readFileSync(file, 'utf8'))
const state = withCurrentMetrics(project.analyses[0])
const corpus = corpusForAnalysis(project)
const byId = new Map(state.ideas.map((i) => [i.id, i]))
const groupOf = new Map(state.groups.flatMap((g) => g.ideaIds.map((id) => [id, g] as const)))

const texts = [
  ...state.groups.map((g) => ({ id: `motif « ${g.title} »`, text: g.summary })),
  ...state.themes.map((t) => ({ id: `thème « ${t.title} »`, text: t.summary })),
  { id: 'résumé', text: state.globalSummary },
].filter((t) => t.text)

const problems: string[] = []
const words = (x: string) =>
  new Set(
    x
      .toLowerCase()
      .replace(/\[[^\]]*\]/g, '')
      .match(/\p{L}{4,}/gu) ?? [],
  )
const similar = (a: string, b: string) => {
  const x = words(a)
  const y = words(b)
  const common = [...x].filter((w) => y.has(w)).length
  return common / Math.max(1, Math.min(x.size, y.size))
}
let sentences = 0
for (const t of texts) {
  const rendered = refsToPeople(t.text, byId)
  if (/\s[,.;:](?!\d)/.test(rendered.replace(/\s[;:!?]/g, ''))) problems.push(`${t.id} : espace orpheline avant une ponctuation`)
  const all = sentencesOf(t.text).flat()
  for (let a = 0; a < all.length; a++)
    for (let b = a + 1; b < all.length; b++)
      if (similar(all[a], all[b]) > 0.7 && words(all[a]).size > 5) problems.push(`${t.id} : deux phrases presque identiques`)
  for (const s of all) {
    sentences++
    if (!/I\d{4,}/.test(s) && t.id !== 'résumé') problems.push(`${t.id} : phrase sans renvoi`)
    const personOf = (id: string) => byId.get(id)?.participantId
    for (const w of [...impliedOthers(s, personOf), ...overcountedPeople(s, personOf), ...(t.id === 'résumé' ? [] : clauseCounts(s, personOf))])
      problems.push(`${t.id} : « ${w} » annonce plus de personnes que les renvois n'en citent`)
    const shown = refsToPeople(s, byId)
    // « par ex. » quand la phrase ne compte qu'une personne : le lecteur croirait qu'il y en a d'autres.
    if (/\(par ex\. P\d+\)/.test(shown) && /^(Une personne|Une autre|L['’]une|Elle|Cette personne)\b/i.test(s.trim()))
      problems.push(`${t.id} : « par ex. » sur une seule personne`)
  }
}
for (const g of state.groups) {
  if (!g.summary) continue
  for (const c of missingCamps(g, byId))
    problems.push(`motif « ${g.title} » : camp ${c.side === 'positive' ? 'positif' : 'négatif'} (${c.people.length}) absent de la synthèse`)
}
// Deux idées d'une même réponse qui se chevauchent : la même phrase serait affichée deux fois.
const byContribution = new Map<string, typeof state.ideas>()
for (const i of state.ideas) byContribution.set(i.contributionId, [...(byContribution.get(i.contributionId) ?? []), i])
for (const list of byContribution.values())
  for (let a = 0; a < list.length; a++)
    for (let b = a + 1; b < list.length; b++) {
      const x = list[a].span
      const y = list[b].span
      const overlap = Math.min(x.end, y.end) - Math.max(x.start, y.start)
      if (overlap > 20 && list[a].category !== list[b].category)
        problems.push(`idées ${list[a].id} et ${list[b].id} : citations qui se chevauchent (${overlap} caractères)`)
    }
for (const g of state.groups)
  if (g.metrics.minority && (g.metrics.stance === 'divided' || g.metrics.stance === 'mixed'))
    problems.push(`motif « ${g.title} » : « à contre-courant » avec des avis partagés`)
for (const g of state.groups) {
  const opinions = g.metrics.positiveOnly.length + g.metrics.negativeOnly.length + g.metrics.mixed.length
  for (const w of allClaims(g.summary, (id) => byId.get(id)?.participantId, opinions))
    problems.push(`motif « ${g.title} » : « ${w} » ne couvre pas toutes les personnes qui donnent un avis`)
}
const cited = new Set((state.globalSummary.match(/I\d{4,}/g) ?? []).map((id) => groupOf.get(id)?.id))
// Les sujets qui divisent sont nommés (par leur titre) dans le résumé.
for (const d of highlights(state.groups).divided)
  if (!cited.has(d.groupId) && !state.globalSummary.toLowerCase().includes(d.title.toLowerCase())) problems.push(`résumé : « ${d.title} » (ce qui divise) n'est pas nommé`)

const mixed = state.groups.reduce((n, g) => n + g.metrics.mixed.length, 0)
console.log(
  `Étude : ${project.name} — ${corpus.participants.length} participants, ${state.ideas.length} idées, ${state.groups.length} motifs, ${state.themes.length} thèmes`,
)
console.log(`Phrases de synthèse : ${sentences} ; mitigés (personne × motif) : ${mixed}`)
console.log(
  `Relecture des motifs : ${state.moved?.length ?? 0} déplacées, ${state.retoned?.length ?? 0} reclassées ; renvois : ${JSON.stringify(state.support ?? {})} ; phrases retirées : ${state.removedSentences ?? 0} ; camps ajoutés par le code : ${state.campsAdded ?? 0}`,
)
console.log(problems.length ? `Défauts (${problems.length}) :\n- ${problems.join('\n- ')}` : 'Aucun défaut relevé.')
