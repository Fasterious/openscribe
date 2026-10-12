import type { Corpus } from '../corpus'
import { activeParticipants } from '../corpus'
import { presetById } from '../providers/presets'
import { METRICS_VERSION } from './metrics'
import { describeMetrics, describeTheme } from './pipeline'
import type { AnalysisState, Group, Idea, IdeaCategory } from './types'

/**
 * Export du rapport en Markdown et en HTML autonome.
 *
 * Le HTML est construit directement (jamais en convertissant le Markdown), et
 * chaque texte venant des participants ou du modèle est échappé : un verbatim
 * ne peut pas injecter de code dans le rapport.
 */

const CATEGORY_LABEL: Record<IdeaCategory, string> = {
  positive: 'Positif',
  negative: 'Négatif',
  neutral: 'Neutre',
  suggestion: 'Suggestion',
}
const CATEGORY_MARK: Record<IdeaCategory, string> = { positive: '+', negative: '−', neutral: '·', suggestion: '→' }

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

function engineName(presetId: string): string {
  if (presetId === 'simulation') return 'Simulation (démonstration, contenu fictif)'
  if (presetId === 'bridge') return 'moteur de test'
  return presetById(presetId)?.label ?? presetId
}

function methodNote(state: AnalysisState, corpus: Corpus): string[] {
  const respondents = activeParticipants(corpus).length
  const withIdeas = new Set(state.ideas.map((i) => i.participantId)).size
  return [
    `Participants ayant répondu : ${respondents} ; participants dont au moins une idée a été retenue : ${withIdeas}.`,
    `Idées retenues : ${state.ideas.length} (verbatims vérifiés mot pour mot dans les réponses). Verbatims écartés car introuvables tels quels : ${state.rejected.length}.`,
    `Moteur d'IA : ${engineName(state.engine.presetId)} · modèle ${state.engine.model} · température ${state.settings.temperature} · graine ${state.settings.seed}.`,
    "Partage des rôles : le moteur d'IA découpe les réponses en idées, propose les motifs et les thèmes, et rédige les synthèses ; le code vérifie chaque verbatim, range chaque idée exactement une fois et calcule tous les chiffres.",
    `Indicateurs v${METRICS_VERSION} : on compte des participants. Consensus = part du plus grand camp parmi les participants ayant exprimé un avis positif ou négatif sur un même motif ; les participants mitigés comptent au dénominateur mais dans aucun camp ; les suggestions et constats neutres sont exclus du calcul. En dessous de 4 participants, on parle de « peu d'avis ». Un thème réunit des motifs différents : on n'y calcule ni consensus ni désaccord.`,
  ]
}

function ideasOf(group: Group, byId: Map<string, Idea>): Idea[] {
  return group.ideaIds.map((id) => byId.get(id)!).filter(Boolean)
}


export function reportToMarkdown(state: AnalysisState, corpus: Corpus, title: string): string {
  const byId = new Map(state.ideas.map((i) => [i.id, i]))
  const groupById = new Map(state.groups.map((g) => [g.id, g]))
  const out: string[] = [`# ${title}`, '']
  const warn = (items?: string[]) => {
    if (items?.length) out.push(`> À vérifier : ${items.map((x) => `« ${x} »`).join(', ')} ne correspond à aucun chiffre calculé ni cité.`, '')
  }
  if (state.globalSummary) out.push('## Résumé', '', state.globalSummary, '')
  warn(state.globalUnverified)

  const writeGroup = (g: Group, level: string) => {
    out.push(`${level} ${g.title}`, '', `*${describeMetrics(g.metrics)}*`, '')
    if (g.summary) out.push(g.summary, '')
    warn(g.unverified)
    for (const cat of ['positive', 'negative', 'suggestion', 'neutral'] as IdeaCategory[]) {
      const items = ideasOf(g, byId).filter((i) => i.category === cat)
      if (!items.length) continue
      out.push(`**${CATEGORY_LABEL[cat]}**`, '')
      for (const i of items) out.push(`- ${CATEGORY_MARK[cat]} « ${i.verbatim} » — ${i.participantId} [${i.id}]`)
      out.push('')
    }
  }

  if (state.themes.length) {
    for (const t of state.themes) {
      out.push(`## ${t.title}`, '', `*${describeTheme(t, t.groupIds.map((id) => groupById.get(id)!))}*`, '')
      if (t.summary) out.push(t.summary, '')
      warn(t.unverified)
      for (const gid of t.groupIds) writeGroup(groupById.get(gid)!, '###')
    }
  } else {
    for (const g of state.groups) writeGroup(g, '##')
  }
  out.push('## Méthode', '', ...methodNote(state, corpus).map((l) => `- ${l}`), '')
  return out.join('\n')
}

export function reportToHtml(state: AnalysisState, corpus: Corpus, title: string): string {
  const e = escapeHtml
  const byId = new Map(state.ideas.map((i) => [i.id, i]))
  const groupById = new Map(state.groups.map((g) => [g.id, g]))
  const parts: string[] = []
  const para = (text: string) => `<p>${e(text)}</p>`

  const groupHtml = (g: Group, h: 'h2' | 'h3') => {
    const blocks = (['positive', 'negative', 'suggestion', 'neutral'] as IdeaCategory[])
      .map((cat) => {
        const items = ideasOf(g, byId).filter((i) => i.category === cat)
        if (!items.length) return ''
        return `<details open><summary>${CATEGORY_LABEL[cat]} — ${items.length}</summary><ul>${items
          .map((i) => `<li class="${cat}">« ${e(i.verbatim)} » <span class="who">${e(i.participantId)} · ${e(i.id)}</span></li>`)
          .join('')}</ul></details>`
      })
      .join('')
    return `<section class="group"><${h}>${e(g.title)}</${h}><p class="facts">${e(describeMetrics(g.metrics))}</p>${g.summary ? para(g.summary) : ''}${blocks}</section>`
  }

  if (state.globalSummary) parts.push(`<h2>Résumé</h2>${para(state.globalSummary)}`)
  if (state.themes.length) {
    for (const t of state.themes) {
      parts.push(
        `<section class="theme"><h2>${e(t.title)}</h2><p class="facts">${e(describeTheme(t, t.groupIds.map((id) => groupById.get(id)!)))}</p>${
          t.summary ? para(t.summary) : ''
        }${t.groupIds.map((id) => groupHtml(groupById.get(id)!, 'h3')).join('')}</section>`,
      )
    }
  } else {
    parts.push(...state.groups.map((g) => groupHtml(g, 'h2')))
  }
  parts.push(`<h2>Méthode</h2><ul>${methodNote(state, corpus).map((l) => `<li>${e(l)}</li>`).join('')}</ul>`)

  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(title)}</title>
<style>
body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;max-width:52rem;margin:2rem auto;padding:0 1rem;line-height:1.55;color:#1d1f2b;background:#fff}
h1{color:#2F40C2}h2{margin-top:2.2rem;border-bottom:2px solid #e3e5f5;padding-bottom:.3rem}h3{margin-top:1.6rem}
.facts{color:#555a72;font-size:.9rem}details{margin:.4rem 0}summary{cursor:pointer;font-weight:600}
li{margin:.25rem 0}.who{color:#7a7f98;font-size:.8rem}.positive{border-left:3px solid #2e9d6a;padding-left:.5rem;list-style:none}
.negative{border-left:3px solid #d1495b;padding-left:.5rem;list-style:none}.suggestion{border-left:3px solid #2F40C2;padding-left:.5rem;list-style:none}
.neutral{border-left:3px solid #9aa0b5;padding-left:.5rem;list-style:none}
@media print{details{display:block}details>summary{list-style:none}a{color:inherit}}
</style></head><body>
<h1>${e(title)}</h1>
${parts.join('\n')}
<footer><p class="facts">Rapport produit avec OpenScribe, outil libre de recherche utilisateur.</p></footer>
</body></html>`
}
