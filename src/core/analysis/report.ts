import type { Corpus } from '../corpus'
import { activeParticipants, duplicateContributions, promptsOf } from '../corpus'
import { presetById } from '../providers/presets'
import { DOUBT_HELP, FRAGILE_HELP, helpText, labelled, LIMITS_HELP, MINORITY_HELP, STANCE_HELP } from './glossary'
import { dividedFragile, fragileShown, highlights, labelDoubt, type Highlight, type Highlights } from './highlights'
import { withCurrentMetrics } from './metrics'
import { maskNames, maskWithOffsets } from './names'
import { ARTICLE_SCRIPT, scriptJson } from './article'
import { describeTheme, frenchNumber } from './pipeline'
import type { AnalysisState, Group, GroupDefinition, Idea, IdeaCategory, Metrics } from './types'

/**
 * Export du rapport en Markdown et en HTML autonome.
 *
 * Le HTML est construit directement (jamais en convertissant le Markdown), et
 * chaque texte venant des participants ou du modèle est échappé : un verbatim
 * ne peut pas injecter de code dans le rapport.
 */

const CATEGORY_LABEL: Record<IdeaCategory, string> = {
  positive: 'Avis positifs',
  negative: 'Avis négatifs',
  neutral: 'Constats',
  suggestion: 'Suggestions',
  question: 'Questions',
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

/** Un rapport exporté alors que les données ont changé le dit en tête. */
const STALE_NOTE =
  "Attention : les données de la synthèse ont changé depuis ce rapport (source ajoutée, retirée ou questions modifiées). Relancez l'analyse pour qu'il en tienne compte."

/** Nom lisible du moteur d'une analyse, pour la Méthode (écran et exports). */
export function engineName(presetId: string, model?: string): string {
  if (presetId === 'simulation') return 'Simulation (démonstration, contenu fictif)'
  if (presetId === 'bridge') return `Claude${model ? ` (${model.replace(/^claude-/, '')})` : ''}`
  return presetById(presetId)?.label ?? presetId
}

/** Codage en double : sous chaque exemplaire d'une citation, le titre de l'autre motif où elle compte (copie comme original). */
export function alsoInOf(state: AnalysisState): (i: Idea) => string | undefined {
  const titleOfIdea = new Map(state.groups.flatMap((g) => g.ideaIds.map((id) => [id, g.title] as const)))
  const copyOf = new Map(state.ideas.filter((i) => i.copyOf).map((i) => [i.copyOf!, i.id]))
  return (i) => {
    const other = i.copyOf ?? copyOf.get(i.id)
    return other ? titleOfIdea.get(other) : undefined
  }
}

/** L'infobulle d'une ligne de chiffres : ce que veut dire son étiquette, et « fragile » s'il y a lieu. */
export const stanceTitle = (m: Metrics): string =>
  [
    helpText(STANCE_HELP[m.stance]),
    fragileShown(m) && labelled('Fragile', FRAGILE_HELP),
    m.minority && m.stance !== 'divided' && labelled('Minorité constante', MINORITY_HELP),
  ]
    .filter(Boolean)
    .join(' ')

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)

/** Le livre de codes d'un motif, en une ligne sous son titre : ce qui y compte comme positif, négatif ou pas comme un avis. */
export function definitionLine(d: GroupDefinition): string {
  // Une phrase française, pas une consigne de codage (plume, passe 8) : minuscule après les deux-points, pas de « hors camp ».
  const dot = (s: string) => {
    const t = s.trim().replace(/[.;]+$/, '')
    return t.charAt(0).toLowerCase() + t.slice(1)
  }
  return `${[`Compte comme positif : ${dot(d.positive)}`, `comme négatif : ${dot(d.negative)}`, ...(d.neutral ? [`ne compte pas comme un avis : ${dot(d.neutral)}`] : [])].join(' · ')}.`
}

/** La méthode, ligne par ligne : la même dans le rapport de l'application et dans ses exports. */
export function methodNote(state: AnalysisState, corpus: Corpus): string[] {
  const respondents = activeParticipants(corpus).length
  const withIdeas = new Set(state.ideas.map((i) => i.participantId)).size
  const single = state.groups.filter((g) => g.metrics.participants === 1).length
  // Les fusions de la réconciliation du livre de codes sont annoncées avec lui, pas deux fois.
  const consolidated = (state.merges?.length ?? 0) - (state.reconciled?.merges ?? 0)
  // Part des idées venues des trois participants les plus prolixes : un rapport peut être tiré par quelques voix.
  const perPerson = [...state.ideas.reduce((m, i) => m.set(i.participantId, (m.get(i.participantId) ?? 0) + 1), new Map<string, number>()).values()].sort(
    (a, b) => b - a,
  )
  const top3 = perPerson.slice(0, 3).reduce((a, b) => a + b, 0)
  const lines = [
    `Participants ayant répondu : ${respondents} ; participants dont au moins une idée a été retenue : ${withIdeas}.`,
    `Idées retenues : ${state.ideas.length} (verbatims vérifiés mot pour mot dans les réponses). Verbatims écartés car introuvables tels quels : ${state.rejected.length || 'aucun'}.`,
    `Motifs : ${state.groups.length}${state.themes.length ? `, regroupés en ${state.themes.length} thèmes` : ''} ; ${single ? `${single} ${single > 1 ? 'reposent' : 'repose'} sur un seul participant (signaux isolés, pas des tendances)` : 'aucun ne repose sur un seul participant'}.${consolidated ? ` La passe de consolidation a fusionné ${consolidated} ensemble${consolidated > 1 ? 's' : ''} de motifs qui traitaient le même objet.` : ''}`,
  ]
  const off = offTopicLines(state)
  if (off.ideas)
    lines.push(
      `Hors question : ${off.ideas} idée${off.ideas > 1 ? 's' : ''} de ${off.people} participant${off.people > 1 ? 's' : ''} ne répond${off.ideas > 1 ? 'ent' : ''} pas à la question posée. Elles sont listées en fin de rapport, mais ne comptent dans aucun motif et ne sont pas résumées.`,
    )
  if (state.ideas.length >= 30 && perPerson.length > 5)
    lines.push(
      `Les trois participants les plus prolixes portent ${Math.round((top3 / state.ideas.length) * 100)} % des idées : les chiffres comptent des personnes, mais les synthèses citent davantage ceux qui ont beaucoup écrit.`,
    )
  {
    const dup = duplicateContributions(corpus)
    const people = dup.reduce((n, ids) => n + ids.length, 0)
    if (dup.length)
      lines.push(
        `Réponses identiques entre personnes : ${dup.length} texte${dup.length > 1 ? 's' : ''} envoyé${dup.length > 1 ? 's' : ''} à l'identique par ${people} participants (réponses copiées ou campagnes groupées). Chaque personne compte une fois : un texte repris par dix personnes pèse dix personnes, ni plus ni moins.`,
      )
  }
  if (state.settings.maskNames && state.names?.length)
    lines.push(`Prénoms de particuliers masqués dans les verbatims : ${state.names.length}. Les citations exactes restent dans OpenScribe.`)
  {
    // Relecture des motifs : ce que le moteur a proposé et que le code a appliqué, compté.
    const moved = state.moved?.length ?? 0
    const retoned = state.retoned?.length ?? 0
    const pl = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`
    if (moved || retoned)
      lines.push(
        `Relecture des motifs par le moteur d'IA : ${[moved && pl(moved, 'idée déplacée vers le motif dont elle parle vraiment', 'idées déplacées vers le motif dont elles parlent vraiment'), retoned && pl(retoned, "idée qui a changé de ton une fois jugée par rapport à l'objet du motif", "idées qui ont changé de ton une fois jugées par rapport à l'objet du motif")].filter(Boolean).join(' ; ')}. Une personne n'est « mitigée » que si elle dit du bien et du mal du même objet.`,
      )
  }
  if (state.copied?.length)
    lines.push(
      `Codage en double, à la demande du chercheur : ${state.copied.length} idée${state.copied.length > 1 ? 's' : ''} qui répond${state.copied.length > 1 ? 'ent' : ''} à la définition de deux motifs ${state.copied.length > 1 ? 'comptent' : 'compte'} dans les deux (la citation figure sous chacun, avec la mention « aussi dans » et le nom de l'autre motif). Chaque motif compte des personnes, aucune deux fois.`,
    )
  if (state.groups.some((g) => g.definition))
    lines.push(
      `Livre de codes : avant de juger les idées de chaque motif, le moteur d'IA a écrit ce qui y compte comme positif, comme négatif, et ce qui ne compte pas comme un avis. Cette définition figure sous le titre du motif ; le positif et le négatif y obéissent, et le lecteur peut la contester.${state.reconciled?.pairs || state.reconciled?.merges ? ` Le livre de codes a ensuite été relu d'un bloc : ${[state.reconciled.pairs && `${state.reconciled.pairs} paire${state.reconciled.pairs > 1 ? 's' : ''} de motifs voisins relue${state.reconciled.pairs > 1 ? 's' : ''} ensemble avec une règle de partage`, state.reconciled.merges && `${state.reconciled.merges} fusion${state.reconciled.merges > 1 ? 's' : ''} de motifs qui traitaient le même objet`].filter(Boolean).join(' ; ')}.` : ''}`,
    )
  if (state.swept?.motifs) {
    const w = state.swept
    const pl = (n: number) => (n > 1 ? 's' : '')
    const done = [
      w.copied && `${w.copied} y compte${w.copied > 1 ? 'nt' : ''} aussi${state.copied?.length ? ` (elle${pl(w.copied)} ${w.copied > 1 ? 'font' : 'fait'} partie des ${state.copied.length} idées du codage en double)` : ''}`,
      w.moved && `${w.moved} y ${w.moved > 1 ? 'ont' : 'a'} été déplacée${pl(w.moved)}`,
      w.retoned && `${w.retoned} ${w.retoned > 1 ? 'ont' : 'a'} changé de ton`,
    ].filter(Boolean)
    lines.push(
      `Balayage par définition : les idées rangées dans les autres motifs ont été relues au regard de la définition de${w.motifs > 1 ? 's' : ''} ${w.motifs} motif${pl(w.motifs)} du résumé ; ${done.length ? done.join(', ') : 'aucune n’y manquait'}.`,
    )
  }
  const doubtful = state.groups.filter((g) => labelDoubt(g, new Map(state.ideas.map((i) => [i.id, i]))))
  if (doubtful.length)
    lines.push(
      `Étiquettes à vérifier : ${doubtful.length} motif${doubtful.length > 1 ? 's' : ''} ${doubtful.length > 1 ? 'portent' : 'porte'} la mention « à vérifier », parce que ${doubtful.length > 1 ? 'leur étiquette dépend' : 'son étiquette dépend'} d'avis comptés aussi dans un autre motif. Le code mesure cet écart ; c'est au lecteur de trancher, en relisant les citations.`,
    )
  if (state.groups.some((g) => g.metrics.minority)) lines.push(labelled('« Minorité constante »', MINORITY_HELP))
  if (state.support)
    lines.push(
      `Renvois vérifiés : chaque phrase des synthèses a été confrontée par le moteur d'IA aux verbatims qu'elle cite (${state.support.checked} phrases) ; ${state.support.fixed || 'aucune'} corrigée${state.support.fixed > 1 ? 's' : ''}, ${state.support.dropped || 'aucune'} retirée${state.support.dropped > 1 ? 's' : ''} faute d'appui${state.support.added ? ` ; le moteur d'IA en a ajouté ${state.support.added} pour un sujet ou un camp d'avis qui manquait` : ''}.${state.campsAdded ? ` Le code en a écrit ${state.campsAdded} pour un camp d'avis encore absent de la synthèse de son motif.` : ''}`,
    )
  if (state.polish?.changed)
    lines.push(
      `Relecture de la langue : ${state.polish.changed} synthèse${state.polish.changed > 1 ? 's' : ''} récrite${state.polish.changed > 1 ? 's' : ''} ; le code a vérifié qu'aucun verbatim ni aucun chiffre n'avait changé${state.polish.refused ? ` et a écarté ${state.polish.refused} réécriture${state.polish.refused > 1 ? 's' : ''} qui ne ${state.polish.refused > 1 ? 'respectaient' : 'respectait'} pas cette règle` : ''}.`,
    )
  if (state.removedSentences)
    lines.push(
      state.removedSentences > 1
        ? `${state.removedSentences} phrases retirées des synthèses parce qu'un nombre, un compte ou un renvoi n'y était pas appuyé.`
        : `1 phrase retirée des synthèses parce qu'un nombre, un compte ou un renvoi n'y était pas appuyé.`,
    )
  const kinds = corpus.sources.map((src) => {
    const people = new Set(corpus.contributions.filter((c) => c.sourceId === src.id).map((c) => c.participantId)).size
    return `${src.name} (${people} participant${people > 1 ? 's' : ''})`
  })
  if (corpus.sources.length > 1)
    lines.push(
      `Sources : ${kinds.join(' ; ')}. Un entretien compte pour une personne, comme une ligne de questionnaire : on compte des personnes, pas la longueur de ce qu'elles disent.`,
    )
  lines.push(labelled('Limites', LIMITS_HELP))
  lines.push(
    'Principe : restituer ce que les participants ont dit, avec le moins de déformation possible. Les verbatims sont recopiés tels quels, sans correction ; seule une coupure « […] » peut sauter un passage sans rapport, jamais une négation ou une réserve. Le texte complet reste consultable dans OpenScribe.',
  )
  if (!state.settings.maskNames && state.names?.length)
    lines.push(
      state.names.length > 1
        ? `Ce rapport contient ${state.names.length} prénoms de personnes citées dans les réponses : à anonymiser avant une diffusion si besoin (OpenScribe permet de les masquer).`
        : "Ce rapport contient le prénom d'une personne citée dans les réponses : à anonymiser avant une diffusion si besoin (OpenScribe permet de le masquer).",
    )
  const questions = questionCodes(corpus)
  if (questions.size > 1)
    lines.push(`Questions : ${[...questions].map(([q, code]) => `${code} = « ${q.replace(/^[^\p{L}\p{N}]+/u, '').trim()} »`).join(' ; ')}.`)
  const engine = engineName(state.engine.presetId, state.engine.model)
  lines.push(
    `Moteur d'IA : ${state.engine.presetId === 'bridge' || state.engine.presetId === 'simulation' ? engine : `${engine}, modèle ${state.engine.model}`} · température ${state.settings.temperature} · graine ${state.settings.seed}.`,
    "Partage des rôles : le moteur d'IA découpe les réponses en idées (positif, négatif, suggestion, question ou constat), propose les motifs et les thèmes, et rédige les synthèses ; le code vérifie chaque verbatim, range chaque idée exactement une fois et calcule tous les chiffres, y compris les listes « Ce qui a marché », « Ce qui bloque », « Ce qui divise », « Ce que proposent les participants » et « Questions soulevées ». « Ce qui divise » réunit les motifs aux avis opposés et ceux où tous font la même critique mais proposent des remèdes opposés (repérés par le moteur d'IA ; le code vérifie qu'il s'agit de deux propositions de deux personnes différentes).",
    `Indicateurs : on compte des participants. Dans « 4 avis négatifs sur 5 », le total (5) compte les participants qui disent du bien du motif, du mal, ou les deux (mitigés, comptés dans le total mais dans aucun camp ; dans les listes de verbatims, un mitigé figure dans les deux camps) ; suggestions, questions et constats ne sont pas des avis. Le chiffre vient toujours avec le mot de l'échelle : « unanime » quand toutes les personnes qui donnent un avis sont du même côté ; « large majorité » à partir de 80 % ; « majorité » au-dessus de la moitié ; « pas de majorité » quand le camp en tête reste sous la moitié ; « avis partagés » quand les deux camps sont proches (chacun au moins deux personnes, le plus petit au moins la moitié du plus grand) ou quand les mitigés sont au moins aussi nombreux que le camp le plus fort ; en dessous de 4 avis, « peu d'avis ». « Fragile » signale qu'une seule voix changeant de camp changerait l'étiquette. Se taire n'est ni approuver ni désapprouver : la base est celle des personnes qui ont donné un avis spontanément. Ces proportions décrivent les personnes interrogées, pas une population. Un thème réunit des motifs différents : on n'y additionne pas les avis.`,
    'Dans les synthèses, « (P2, P14) » renvoie aux participants dont un verbatim appuie la phrase ; « (notamment P2) » signale un exemple quand la phrase compte davantage de personnes.',
    'Une réponse de quelques mots est suivie de sa question, qui en donne le sens (en entier la première fois dans un motif, puis par son code).',
    "Les questions orientent les réponses (« qu'est-ce qui a bien marché ? ») : un motif où personne ne critique n'est pas pour autant un accord de tous, les autres participants n'en ont simplement pas parlé.",
  )
  return lines
}

/** Les idées « hors question », par participant : gardées et montrées, jamais comptées dans un motif. */
export function offTopicLines(state: AnalysisState): { ideas: number; people: number; lines: { participantId: string; ideas: Idea[] }[] } {
  const byId = new Map(state.ideas.map((i) => [i.id, i]))
  const ideas = (state.offTopic ?? []).map((id) => byId.get(id)).filter((i): i is Idea => !!i)
  const lines = personLines(ideas)
  return { ideas: ideas.length, people: lines.length, lines }
}

export const OFF_TOPIC_INTRO = 'Ces idées ne répondent pas à la question posée : gardées pour la transparence, elles ne comptent dans aucun motif.'

function ideasOf(group: Group, byId: Map<string, Idea>): Idea[] {
  return group.ideaIds.map((id) => byId.get(id)!).filter(Boolean)
}

/**
 * Code court de chaque question (Q1, Q2…), dans l'ordre du questionnaire. La
 * question entière, répétée sous chaque verbatim, noyait la lecture : elle est
 * donnée une fois dans la Méthode.
 */
export function questionCodes(corpus: Corpus): Map<string, string> {
  return new Map(promptsOf(corpus).map((q, i) => [q, `Q${i + 1}`]))
}

/**
 * La ligne de chiffres d'un motif, telle que le lecteur la voit. Distincte des
 * « faits » envoyés au modèle (`describeMetrics`) : retoucher l'affichage ne doit
 * pas invalider les réponses déjà obtenues. Fraction sans pourcentage (la
 * fraction suffit), constats comptés, « peu d'avis » affiché comme la Méthode
 * l'annonce.
 */
export function metricsLine(m: Metrics): string {
  const n = (k: number, one: string, many = `${one}s`) => `${k} ${k > 1 ? many : one}`
  const pos = m.positiveOnly.length
  const neg = m.negativeOnly.length
  const mix = m.mixed.length
  const parts = [n(m.participants, 'participant')]
  const opinions = [pos && n(pos, 'positif'), neg && n(neg, 'négatif'), mix && n(mix, 'mitigé')].filter(Boolean)
  if (opinions.length) parts.push(`avis : ${opinions.join(', ')}`)
  const by = m.participantsByCategory
  const one = (cat: 'suggestion' | 'question') => m.mentionsByCategory[cat] === 1
  if (by.suggestion)
    parts.push(
      `${n(by.suggestion, 'participant')} ${by.suggestion > 1 ? 'font des suggestions' : one('suggestion') ? 'fait une suggestion' : 'fait des suggestions'}`,
    )
  if (by.question)
    parts.push(
      `${n(by.question, 'participant')} ${by.question > 1 ? 'se posent des questions' : one('question') ? 'pose une question' : 'se pose des questions'}`,
    )
  if (by.neutral) parts.push(`${n(by.neutral, 'participant')} ${by.neutral > 1 ? 'font' : 'fait'} un constat`)
  const ratio = `(${Math.max(pos, neg)} sur ${pos + neg + mix} qui donnent un avis)`
  parts.push(...scaleWords(m, ratio))
  if (m.stance === 'thin' && m.participants > 1) parts.push("peu d'avis")
  // Quand les avis sont partagés, il n'y a pas de courant dominant : pas de « contre-courant ».
  if (m.minority && m.stance !== 'divided') {
    const k = m.minority.participantIds.length
    parts.push(
      // « l'apprécient » se lisait à contresens quand l'objet du motif est déjà négatif (« Fermetures de classes ») : on dit le camp.
      `minorité constante : ${n(k, m.minority.side === 'positive' ? 'avis positif' : 'avis négatif')}`,
    )
  }
  return parts.join(' · ')
}

/** L'étiquette d'échelle d'un motif, avec ses chiffres, telle que le lecteur la voit. Les chiffres viennent toujours avec le mot. */
export function scaleWords(m: Metrics, ratio: string): string[] {
  const neg = m.majority === 'negative'
  const fem = neg ? 'négative' : 'positive'
  const out: string[] = []
  if (m.stance === 'unanimous') out.push(`avis ${neg ? 'négatif' : 'positif'} unanime ${ratio}`)
  else if (m.stance === 'consensus') out.push(`large majorité ${fem} ${ratio}`)
  else if (m.stance === 'majority') out.push(`majorité ${fem} ${ratio}`)
  else if (m.stance === 'lean') out.push(`pas de majorité, penche ${neg ? 'vers le négatif' : 'vers le positif'} ${ratio}`)
  else if (m.stance === 'divided') out.push('avis partagés')
  // Le mot seul : la Méthode du rapport l'explique (plume, 15/10 : la définition répétée sur chaque motif alourdissait).
  if (fragileShown(m)) out.push('fragile')
  return out
}

/** « 12:04 » ou « 1:02:30 » : le moment d'un passage dans un enregistrement. */
export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const two = (n: number) => String(n).padStart(2, '0')
  return h ? `${h}:${two(m)}:${two(s)}` : `${m}:${two(s)}`
}

/**
 * D'où vient un verbatim : pour un questionnaire, le code de la question (Q1…) ;
 * pour un entretien ou des notes, le nom de la source et le moment. Les
 * questions d'un animateur sont trop nombreuses pour être codées.
 */
export function originOf(corpus: Corpus): (contributionId: string) => string | undefined {
  const codes = questionCodes(corpus)
  const sources = new Map(corpus.sources.map((s) => [s.id, s]))
  const contributions = new Map(corpus.contributions.map((c) => [c.id, c]))
  return (id) => {
    const c = contributions.get(id)
    if (!c) return undefined
    const src = sources.get(c.sourceId)
    if (!src || src.kind === 'survey') return codes.size > 1 && c.prompt ? codes.get(c.prompt) : undefined
    return `${src.name}${c.time ? ` · ${formatTime(c.time.start)}` : ''}`
  }
}

/** Une réponse de quelques mots (« Les tarifs ») ne se comprend qu'avec sa question. */
export const SHORT_ANSWER_WORDS = 6

/**
 * La question qui donne son sens à une réponse courte : seulement quand le
 * verbatim est (presque) toute la réponse, et pour un avis ou une question.
 * Un fragment d'une longue réponse (« pas assez de caisses ouvertes » sous « qu'est-ce qui
 * a bien marché ? ») ferait lire le contraire de ce qu'a dit la personne.
 */
export function shortAnswerContext(corpus: Corpus): (idea: Idea) => string | undefined {
  const prompt = promptOf(corpus)
  const contributions = new Map(corpus.contributions.map((c) => [c.id, c]))
  return (idea) => {
    if (idea.category === 'suggestion' || idea.category === 'neutral') return undefined
    if (idea.verbatim.trim().split(/\s+/).length > SHORT_ANSWER_WORDS) return undefined
    const answer = contributions.get(idea.contributionId)?.text.trim() ?? ''
    if (idea.verbatim.trim().length < answer.length * 0.6) return undefined
    return prompt(idea.contributionId)
  }
}

/** Dans un motif, une question n'est donnée en entier qu'à sa première réponse courte ; ensuite, son code suffit. */
export function fullQuestionIds(ideas: Idea[], context: (idea: Idea) => string | undefined): Set<string> {
  const seen = new Set<string>()
  const out = new Set<string>()
  for (const i of ideas) {
    const q = context(i)
    if (q && !seen.has(q)) {
      seen.add(q)
      out.add(i.id)
    }
  }
  return out
}

/** La question entière d'une contribution de questionnaire, sans l'émoji de tête. */
export function promptOf(corpus: Corpus): (contributionId: string) => string | undefined {
  const sources = new Map(corpus.sources.map((s) => [s.id, s]))
  const contributions = new Map(corpus.contributions.map((c) => [c.id, c]))
  return (id) => {
    const c = contributions.get(id)
    if (!c?.prompt || sources.get(c.sourceId)?.kind !== 'survey') return undefined
    return c.prompt.replace(/^[^\p{L}\p{N}]+/u, '').trim()
  }
}

/**
 * Ce que le rapport affiche d'une idée : verbatim (prénoms masqués si demandé)
 * et son origine. Une réponse courte emporte sa question : « Les tarifs » dit le
 * contraire selon qu'on demandait ce qui a marché ou ce qui a bloqué.
 */
function shown(state: AnalysisState, corpus: Corpus) {
  const names = state.settings.maskNames ? state.names : undefined
  const origin = originOf(corpus)
  return {
    text: (t: string) => maskNames(t, names),
    question: (i: Idea) => origin(i.contributionId),
    context: shortAnswerContext(corpus),
  }
}

const REFS = /\[(I\d{4,}(?:\s*,\s*I\d{4,})*)\]/g

/**
 * Les références [I0008, I0259] des synthèses désignent des idées : utiles à
 * l'écran (un clic montre les verbatims), illisibles sur papier. L'export les
 * remplace par les participants cités, « (P2, P14) », chacun relié en
 * HTML à son verbatim.
 */
export function refsToPeople(
  text: string,
  byId: Map<string, Idea>,
  /** `ideas` : toutes les idées de cette personne citées par le renvoi (la page HTML les déplie au clic). */
  link?: (who: string, idea: Idea, ideas: Idea[]) => string,
  /** Combien de personnes donnent un avis sur le motif d'une idée : « toutes les personnes » ne se renvoie sans « notamment » que si toutes sont citées. */
  sizeOf?: (ideaId: string) => number,
): string {
  const personOf = (id: string) => byId.get(id)?.participantId
  // Phrase par phrase : « notamment » seulement quand la phrase annonce plus de personnes que tous ses renvois n'en citent.
  // Une seule forme de renvoi, entre parenthèses, sans « cf. » ni « par ex. » (relecture `plume`, 14/10/2026).
  return (
    text
      .split(/(?<=[.!?])(\s+)/)
      .map((sentence) => {
        const ids = sentence.match(/I\d{4,}/g) ?? []
        const cited = new Set(ids.map(personOf).filter(Boolean)).size
        // « Toutes les personnes qui en parlent », « la plupart » : la base est le motif entier.
        const universal = sizeOf && UNIVERSAL.test(sentence) ? Math.max(0, ...ids.map(sizeOf)) : 0
        // Un compte écrit dans la phrase prime sur « tous » : « 3 personnes dénoncent… tous les ans [a, b, c] » cite ses trois personnes.
        const claimed = claimedPeople(sentence)
        const tag = (claimed || universal) > cited ? 'notamment ' : ''
        return sentence.replace(REFS, (_, ids: string) => {
          const seen = new Map<string, Idea[]>()
          for (const id of ids.split(/\s*,\s*/)) {
            const idea = byId.get(id)
            if (idea) seen.set(idea.participantId, [...(seen.get(idea.participantId) ?? []), idea])
          }
          if (!seen.size) return ''
          const people = [...seen].sort(([a], [b]) => a.localeCompare(b, 'fr', { numeric: true }))
          // « notamment » annonce des exemples, pas une liste : trois personnes au plus (plume, passe 8 : jusqu'à douze).
          const shown = tag ? people.slice(0, 3) : people
          return `(${tag}${shown.map(([who, ideas]) => (link ? link(who, ideas[0], ideas) : who)).join(', ')})`
        })
      })
      .join('')
      .replace(/\s+([.,])/g, '$1')
      // Deux renvois identiques dans la même phrase : on ne garde que le dernier.
      .replace(/\s*\(((?:notamment )?)([^()]*P\d+[^()]*)\)(?=[^.!?]*\(\1\2\))/g, '')
      // Un renvoi qui suit un chiffre ou le mot de l'échelle entre parenthèses entre dans la même parenthèse :
      // « (29 des 34 participants ; notamment P13) », « (large majorité, fragile ; notamment P41) ».
      .replace(/\(([^()]*(?:\d|unanime|majorité|fragile|partagés|peu d'avis)[^()]*)\)\s*\(((?:notamment )?[^()]*P\d+[^()]*)\)/g, (all, figure: string, refs: string) =>
        /P\d+/.test(figure) ? all : `(${figure} ; ${refs})`,
      )
  )
}

// « Tous » ne compte des personnes qu'en sujet ou devant elles (« toutes les personnes qui en parlent ») : « pour tous », « par tous les moyens » n'en comptent pas.
const UNIVERSAL =
  /(?<![\p{L}])((?:tous|toutes)\s+(?:les\s+)?(?:\d+\s+)?(?:personnes|participants?|répondants?|ceux|celles)|^\s*(?:tous|toutes)(?![\p{L}])|la plupart|la majorité|les personnes qui|les participants qui|celles et ceux qui)(?![\p{L}])/iu

const NUMBER_WORDS: Record<string, number> = {
  deux: 2,
  trois: 3,
  quatre: 4,
  cinq: 5,
  six: 6,
  sept: 7,
  huit: 8,
  neuf: 9,
  dix: 10,
  onze: 11,
  douze: 12,
  treize: 13,
  quatorze: 14,
  quinze: 15,
  seize: 16,
  vingt: 20,
}
const PEOPLE_NOUN = String.raw`(?:autres\s+)?(?:personnes?|participant(?:e)?s?|répondant(?:e)?s?)`

/**
 * Le nombre de personnes qu'une phrase annonce : « 12 des 13 personnes »,
 * « trois participants », « plusieurs personnes », « la plupart ». Un nombre qui
 * compte autre chose (« trois membres sont partis », « tâches reprises par
 * d'autres ») ne compte pas.
 */
function claimedPeople(sentence: string): number {
  const clean = sentence.replace(/\[[^\]]*\]/g, ' ').toLowerCase()
  const num = String.raw`(\d+|${Object.keys(NUMBER_WORDS).join('|')})`
  const counted = [...clean.matchAll(new RegExp(String.raw`\b${num}(?:\s+(?:des|sur(?:\s+les)?)\s+\d+)?\s+${PEOPLE_NOUN}\b`, 'g'))].map((m) =>
    /^\d+$/.test(m[1]) ? Number(m[1]) : NUMBER_WORDS[m[1]],
  )
  // Un pluriel vague ne compte que comme sujet (« plusieurs personnes regrettent », « selon la plupart ») ; « a vu plusieurs personnes partir » rapporte un propos.
  const vague = new RegExp(String.raw`(?:^|[,;:]\s*|\b(?:et|mais|selon|pour)\s+)(plusieurs\s+${PEOPLE_NOUN}|la plupart|la majorité)\b`).test(clean.trim())
    ? 3
    : 0
  return Math.max(0, ...counted, vague)
}

/** Pour chaque idée, le nombre de personnes qui donnent un avis sur son motif (à défaut, qui s'y expriment). */
function motifSizes(state: AnalysisState): (ideaId: string) => number {
  const size = new Map<string, number>()
  for (const g of state.groups) {
    const m = g.metrics
    const n = m.positiveOnly.length + m.negativeOnly.length + m.mixed.length || m.participants
    for (const id of g.ideaIds) size.set(id, n)
  }
  return (id) => size.get(id) ?? 0
}

/**
 * La barre en Markdown : une case par participant de chaque liste du motif, aux couleurs des listes
 * (vert positif, rouge négatif, violet suggestion, bleu question, blanc constat). Voir `categoryBar`.
 */
export function opinionSquares(m: Metrics, max = 30): string {
  const bar = categoryBar(m)
  if (!bar.length || bar.reduce((a, x) => a + x.people, 0) > max) return ''
  return bar.map(({ cat, people }) => SQUARE[cat].repeat(people)).join('')
}

const SQUARE: Record<IdeaCategory, string> = { positive: '🟩', negative: '🟥', suggestion: '🟪', question: '🟦', neutral: '⬜' }

/** Repère de couleur d'une ligne en Markdown, là où le HTML trace un trait. */
const CATEGORY_MARK: Record<IdeaCategory, string> = {
  positive: '🟢',
  negative: '🔴',
  suggestion: '💡',
  question: '❓',
  neutral: '⚪',
}

const SECTION_MARK: Record<string, string> = {
  strengths: '✅',
  blockers: '⛔',
  divided: '⚖️',
  proposals: '💡',
  questions: '❓',
}

/** La couleur des puces d'une section calculée (HTML). */
const SECTION_CLASS: Record<string, IdeaCategory> = {
  strengths: 'positive',
  blockers: 'negative',
  divided: 'neutral',
  proposals: 'suggestion',
  questions: 'question',
}

/**
 * Une ligne par personne : ses verbatims d'une même catégorie, à la suite.
 * Compter les lignes revient ainsi à compter les personnes. Une personne qui
 * s'exprime aussi dans l'autre sens sur ce motif est signalée (sans juger :
 * elle peut parler de deux aspects différents).
 */
export function personLines(ideas: Idea[]): { participantId: string; ideas: Idea[] }[] {
  const out = new Map<string, Idea[]>()
  for (const i of ideas) out.set(i.participantId, [...(out.get(i.participantId) ?? []), i])
  return [...out].map(([participantId, list]) => ({
    participantId,
    ideas: list,
  }))
}

/**
 * Quand une seule personne porte plus de la moitié des idées d'un motif (au
 * moins 4 idées), on le dit sur le motif : les chiffres comptent des personnes,
 * mais la synthèse cite surtout cette voix.
 */
export function dominantVoice(ideas: Idea[]): string | null {
  if (ideas.length < 4) return null
  const per = new Map<string, number>()
  for (const i of ideas) per.set(i.participantId, (per.get(i.participantId) ?? 0) + 1)
  const [who, n] = [...per].sort((a, b) => b[1] - a[1])[0]
  return n * 2 > ideas.length && per.size > 1 ? `${n} des ${ideas.length} idées de ce motif viennent de ${who}.` : null
}

export function bothSides(ideas: Idea[]): Set<string> {
  const pos = new Set(ideas.filter((i) => i.category === 'positive').map((i) => i.participantId))
  return new Set(ideas.filter((i) => i.category === 'negative' && pos.has(i.participantId)).map((i) => i.participantId))
}

const CATEGORY_ORDER: IdeaCategory[] = ['positive', 'negative', 'suggestion', 'question', 'neutral']

/** Le camp le plus nombreux d'abord : un motif jugé négatif s'ouvre sur ses critiques. */
/** L'ordre des listes d'un motif : le camp le plus nombreux d'abord, puis suggestions, questions, constats. */
export function categoryOrder(m: Metrics): IdeaCategory[] {
  return m.majority === 'negative' ? ['negative', 'positive', 'suggestion', 'question', 'neutral'] : CATEGORY_ORDER
}

/**
 * La barre d'un motif : une part par liste affichée en dessous (avis positifs, négatifs, suggestions,
 * questions, constats), dans le même ordre, aux mêmes couleurs, à la largeur de son nombre de participants.
 * Une personne mitigée figure dans les deux listes d'avis, donc dans les deux parts, comme en dessous
 * (décision d'Arnaud, 17/10 : la barre résume ce qu'on lit plus bas, suggestions comprises).
 */
export function categoryBar(m: Metrics): { cat: IdeaCategory; people: number }[] {
  return categoryOrder(m)
    .map((cat) => ({ cat, people: m.participantsByCategory[cat] ?? 0 }))
    .filter((x) => x.people > 0)
}

const BAR_WORD: Record<IdeaCategory, [string, string]> = {
  positive: ['avis positif', 'avis positifs'],
  negative: ['avis négatif', 'avis négatifs'],
  suggestion: ['suggestion', 'suggestions'],
  question: ['question', 'questions'],
  neutral: ['constat', 'constats'],
}

/** « 3 avis positifs (dont 1 mitigé), 1 suggestion » : ce que dit la barre, pour un lecteur d'écran ou une infobulle. */
export function categoryBarLabel(m: Metrics): string {
  return `Participants par catégorie : ${categoryBar(m)
    .map(({ cat, people }) => {
      const mixed = cat === 'positive' || cat === 'negative' ? m.mixed.length : 0
      return `${people} ${BAR_WORD[cat][people > 1 ? 1 : 0]}${mixed ? ` (dont ${mixed} mitigé${mixed > 1 ? 's' : ''})` : ''}`
    })
    .join(', ')}`
}

/** Les idées d'un motif dans l'ordre où le rapport les affiche : par catégorie, puis par personne. */
export function displayOrder(ideas: Idea[], m: Metrics, order: IdeaCategory[] = categoryOrder(m)): Idea[] {
  return order.flatMap((cat) => personLines(ideas.filter((i) => i.category === cat)).flatMap((l) => l.ideas))
}

/** « Avis positifs — 14 participants (dont 2 mitigés) » : le même compte que la ligne de chiffres du motif. */
export function categoryHeading(cat: IdeaCategory, people: string[], both: Set<string>): string {
  const n = people.length
  const mixed = cat === 'positive' || cat === 'negative' ? people.filter((p) => both.has(p)).length : 0
  if (mixed && mixed === n)
    return `${CATEGORY_LABEL[cat]} — ${n} participant${n > 1 ? 's' : ''}, ${n > 2 ? 'tous mitigés' : n === 2 ? 'tous deux mitigés' : 'mitigé'}`
  return `${CATEGORY_LABEL[cat]} — ${n} participant${n > 1 ? 's' : ''}${mixed ? ` (dont ${mixed} mitigé${mixed > 1 ? 's' : ''})` : ''}`
}

export interface HighlightSection {
  key: keyof Highlights
  heading: string
  /** Ce que comptent les chiffres de la liste, dit une seule fois. */
  intro?: string
  /** Verbatims montrés sous une ligne, avec leur auteur ; `fragile` et `doubt` : les marques de méthode, que l'affichage explique. */
  /** `groupId` : le motif de la ligne (l'application déroule ses verbatims au clic). */
  items: { groupId: string; title: string; detail: string; quotes: { who: string; text: string }[]; fragile?: boolean; doubt?: string }[]
  /** Les mêmes lignes pour les motifs au-delà des premiers : « Et aussi » se déplie sur place (demande d'Arnaud, 18/10). */
  moreItems: HighlightSection['items']
  /** Motifs au-delà des premiers, nommés sans détail : une liste n'est jamais coupée en silence. */
  more: string[]
}

/** Les sections calculées du rapport, prêtes à afficher : mêmes chiffres dans l'écran et dans les exports. */
/**
 * Sous le résumé, les étiquettes à vérifier avant de le citer : le résumé est rédigé par le moteur d'IA, qui ne
 * les reprend pas (deux lectures `methodologue`, passe 13) ; le code les rappelle, le détail reste dans les listes.
 */
export function summaryDoubts(sections: HighlightSection[]): string | undefined {
  const titles = [...new Set(sections.flatMap((sec) => sec.items.filter((x) => x.doubt).map((x) => x.title)))]
  if (!titles.length) return undefined
  const q = titles.map((t) => `« ${t} »`)
  const list = q.length > 1 ? `${q.slice(0, -1).join(', ')} et ${q[q.length - 1]}` : q[0]
  return q.length > 1
    ? `À vérifier avant de citer ces étiquettes : ${list}. Elles dépendent d'avis comptés aussi dans un autre motif ; le détail est dans les listes ci-dessous.`
    : `À vérifier avant de citer cette étiquette : ${list}. Elle dépend d'avis comptés aussi dans un autre motif ; le détail est dans les listes ci-dessous.`
}

/**
 * Une phrase du résumé qui annonce un nombre (« 46 personnes », « 27 sur 28 ») et cite des idées d'un même motif et
 * d'un même camp : sa pastille déroule tout le camp, pas les seuls exemples cités (demande d'Arnaud, 17/10 : « je
 * clique sur 46, les 46 se déroulent »). Sinon, rien : la pastille garde les idées citées.
 */
export function wholeCamp(before: string, ids: string[], groups: Group[], byId: Map<string, Idea>): { ids: string[]; people: number } | undefined {
  const cited = ids.map((id) => byId.get(id)).filter((i): i is Idea => !!i)
  if (!cited.length || cited.some((i) => i.category !== cited[0].category)) return undefined
  const g = groups.find((x) => cited.every((i) => x.ideaIds.includes(i.id)))
  if (!g) return undefined
  const cat = cited[0].category
  const all = g.ideaIds.map((id) => byId.get(id)).filter((i): i is Idea => !!i)
  const camp = all.filter((i) => i.category === cat)
  // Un avis : le camp se compte avec ou sans les mitigés (« 46 personnes » = les seuls positifs, « 48 » = avec eux).
  const other = cat === 'positive' ? 'negative' : cat === 'negative' ? 'positive' : undefined
  const mixed = new Set(other ? all.filter((i) => i.category === other).map((i) => i.participantId) : [])
  const sentence = before.split(/(?<=[.!?])\s+/).pop() ?? ''
  const numbers = [...sentence.matchAll(/(?<![\p{L}\d-])(\d+|\p{L}+(?:-\p{L}+)*)(?![\p{L}\d])/gu)].map((m) => (/^\d+$/.test(m[1]) ? Number(m[1]) : frenchNumber(m[1])))
  const citedPeople = new Set(cited.map((i) => i.participantId)).size
  for (const ideas of [camp, camp.filter((i) => !mixed.has(i.participantId))]) {
    const people = new Set(ideas.map((i) => i.participantId)).size
    if (people > citedPeople && numbers.includes(people)) return { ids: ideas.map((i) => i.id), people }
  }
  return undefined
}

/** Les idées qu'une ligne des listes déroule au clic : le camp que la liste compte (avis positifs pour « Ce qui a marché »…). */
export const SECTION_CAMP: Record<keyof Highlights, IdeaCategory[]> = {
  strengths: ['positive'],
  blockers: ['negative'],
  divided: ['positive', 'negative'],
  proposals: ['suggestion'],
  questions: ['question'],
}

/** La première phrase d'un texte rédigé, sans ses renvois : le résumé d'un motif en une ligne, sous son titre dans les listes. */
export function leadSentence(text: string): string {
  const clean = text.split(/\n\s*\n/)[0].replace(/\s*\[I\d{4,}(?:\s*,\s*I\d{4,})*\]/g, '').trim()
  // Une phrase peut commencer par un chiffre (« 3 personnes… ») ou un guillemet.
  const m = clean.match(/^.+?[.!?](?=\s+[\p{Lu}\d«]|\s*$)/su)
  return (m ? m[0] : clean).replace(/\s+([.,;:])/g, '$1')
}

export function highlightSections(state: AnalysisState): HighlightSection[] {
  const byId = new Map(state.ideas.map((i) => [i.id, i]))
  const h = highlights(state.groups, byId)
  const mask = (t: string) => maskNames(t, state.settings.maskNames ? state.names : undefined)
  const pl = (n: number) => (n > 1 ? 's' : '')
  // Le chiffre d'abord : aucun accord à faire avec le titre du motif (« Délais de livraison — 5 avis négatifs sur 6 »).
  const opinion = (x: Highlight, kind: string) => `${x.people} avis ${kind}${x.people > 1 ? 's' : ''} sur ${x.of}`
  const INTRO = 'Chiffres : participants qui donnent un avis sur le motif.'
  const SHOWN = 6
  // Une liste n'est jamais coupée au milieu d'ex aequo : les motifs à égalité avec le dernier montré restent visibles.
  const cut = (list: Highlight[], n = SHOWN) => {
    let k = Math.min(n, list.length)
    while (k > 0 && k < list.length && list[k].people === list[k - 1].people && list[k].of === list[k - 1].of) k++
    return { shown: list.slice(0, k), rest: list.slice(k), more: list.slice(k).map((x) => x.title) }
  }
  // Une étiquette discutable le dit à côté de son chiffre : le lecteur sait où relire les citations.
  const groupOf = new Map(state.groups.map((g) => [g.id, g]))
  const marks = (groupId: string) => {
    const g = groupOf.get(groupId)!
    const doubt = labelDoubt(g, byId)
    const fragile = fragileShown(g.metrics) || dividedFragile(g)
    return { ...(fragile ? { fragile: true } : {}), ...(doubt ? { doubt } : {}) }
  }
  const s1 = cut(h.strengths)
  const s2 = cut(h.blockers)
  // Une critique partagée aux remèdes opposés reste toujours visible dans « Ce qui divise ».
  const s3 = cut(h.divided, SHOWN + h.divided.filter((x) => x.opposed).length)
  const s4 = cut(h.proposals, 8)
  const s5 = cut(h.questions, 6)
  const build1 = (x: Highlight): HighlightSection['items'][number] => ({
    groupId: x.groupId,
    title: x.title,
    detail: opinion(x, 'positif'),
    ...marks(x.groupId),
    quotes: [],
  })
  const build2 = (x: Highlight): HighlightSection['items'][number] => ({
    groupId: x.groupId,
    title: x.title,
    detail: opinion(x, 'négatif'),
    ...marks(x.groupId),
    quotes: [],
  })
  const build3 = (x: Highlight): HighlightSection['items'][number] => {
    const g = state.groups.find((y) => y.id === x.groupId)!
    // Constat partagé, pistes opposées : on montre les deux propositions, chacune avec son auteur.
    if (x.opposed && g.metrics.stance !== 'divided') {
      const quote = (id: string) => ({ who: byId.get(id)!.participantId, text: mask(byId.get(id)!.verbatim) })
      const side = g.metrics.majority === 'positive' ? 'positif' : 'négatif'
      const n = Math.max(g.metrics.positiveOnly.length, g.metrics.negativeOnly.length)
      const total = g.metrics.positiveOnly.length + g.metrics.negativeOnly.length + g.metrics.mixed.length
      return {
        groupId: x.groupId,
        title: x.title,
        detail: `${n} avis ${side}${n > 1 ? 's' : ''} sur ${total}, mais deux propositions s'opposent sur ${x.opposed.about}`,
        quotes: [quote(x.opposed.a), quote(x.opposed.b)],
      }
    }
    return { groupId: x.groupId, title: x.title, detail: describeOpinions(g) + (x.opposed ? ` ; pistes opposées : ${x.opposed.about}` : ''), quotes: [], ...marks(x.groupId) }
  }
  const build4 = (x: Highlight): HighlightSection['items'][number] => ({
    groupId: x.groupId,
    title: x.title,
    detail: `${x.people} participant${pl(x.people)}`,
    // Deux propositions au plus, de deux personnes différentes si possible, les plus parlantes (les plus longues).
    quotes: pickQuotes(
      x.ideaIds.map((id) => byId.get(id)!),
      2,
    ).map((i) => ({ who: i.participantId, text: mask(i.verbatim) })),
  })
  const build5 = (x: Highlight): HighlightSection['items'][number] => ({
    groupId: x.groupId,
    title: x.title,
    detail: `${x.people} participant${pl(x.people)}`,
    quotes: pickQuotes(
      x.ideaIds.map((id) => byId.get(id)!),
      2,
    ).map((i) => ({ who: i.participantId, text: mask(i.verbatim) })),
  })
  const sections: HighlightSection[] = [
    {
      key: 'strengths',
      heading: 'Ce qui a marché',
      intro: INTRO,
      items: s1.shown.map(build1),
      more: s1.more,
      moreItems: s1.rest.map(build1),
    },
    {
      key: 'blockers',
      heading: 'Ce qui bloque',
      intro: INTRO,
      items: s2.shown.map(build2),
      more: s2.more,
      moreItems: s2.rest.map(build2),
    },
    {
      key: 'divided',
      heading: 'Ce qui divise',
      items: s3.shown.map(build3),
      more: s3.more,
      moreItems: s3.rest.map(build3),
    },
    {
      key: 'proposals',
      heading: 'Ce que proposent les participants',
      items: s4.shown.map(build4),
      more: s4.more,
      moreItems: s4.rest.map(build4),
    },
    {
      key: 'questions',
      heading: 'Questions soulevées',
      items: s5.shown.map(build5),
      more: s5.more,
      moreItems: s5.rest.map(build5),
    },
  ]
  return sections.filter((s) => s.items.length)
}

/** « 3 positifs, 4 négatifs, 2 mitigés » : les chiffres qui justifient l'étiquette. */
function describeOpinions(g: Group): string {
  const m = g.metrics
  const n = (k: number, w: string) => `${k} ${w}${k > 1 ? 's' : ''}`
  return [
    m.positiveOnly.length && n(m.positiveOnly.length, 'positif'),
    m.negativeOnly.length && n(m.negativeOnly.length, 'négatif'),
    m.mixed.length && n(m.mixed.length, 'mitigé'),
  ]
    .filter(Boolean)
    .join(', ')
}

function pickQuotes(all: Idea[], n: number): Idea[] {
  // Une citation de quelques mots (« Oui, merci ») ne dit rien seule, un pavé non plus : d'abord celles de 40 à 250 caractères,
  // les plus longues en premier, à égalité dans l'ordre du corpus.
  // Une phrase complète (majuscule au début, ponctuation finale) se lit seule ; un bout de phrase, moins.
  const readable = (i: Idea) =>
    (i.verbatim.length >= 40 && i.verbatim.length <= 250 ? 2 : 0) + (/^[\p{Lu}«"]/u.test(i.verbatim.trim()) && /[.!?»"]$/.test(i.verbatim.trim()) ? 1 : 0)
  const ideas = [...all].sort((a, b) => readable(b) - readable(a) || b.verbatim.length - a.verbatim.length || a.id.localeCompare(b.id))
  const out: Idea[] = []
  const seen = new Set<string>()
  for (const i of ideas) if (out.length < n && !seen.has(i.participantId)) (out.push(i), seen.add(i.participantId))
  for (const i of ideas) if (out.length < n && !out.includes(i)) out.push(i)
  return out
}

/** Les motifs d'un thème : d'abord ceux qui reposent sur plusieurs participants, puis les signaux isolés. */
function splitIsolated(groups: Group[]) {
  return {
    main: groups.filter((g) => g.metrics.participants > 1),
    isolated: groups.filter((g) => g.metrics.participants <= 1),
  }
}

export function reportToMarkdown(saved: AnalysisState, corpus: Corpus, title: string, opts: { stale?: boolean } = {}): string {
  const state = withCurrentMetrics(saved)
  const byId = new Map(state.ideas.map((i) => [i.id, i]))
  const groupById = new Map(state.groups.map((g) => [g.id, g]))
  const v = shown(state, corpus)
  const out: string[] = [`# ${title}`, '']
  if (opts.stale) out.push(`> ${STALE_NOTE}`, '')
  const warn = (items?: string[]) => {
    if (items?.length) out.push(`> À vérifier : ${items.map((x) => `« ${x} »`).join(', ')} ne correspond à aucun chiffre calculé ni cité.`, '')
  }
  const sizeOf = motifSizes(state)
  const prose = (t: string) => refsToPeople(v.text(t), byId, undefined, sizeOf)
  const alsoIn = alsoInOf(state)
  const sections = highlightSections(state)
  const doubts = summaryDoubts(sections)
  if (state.globalSummary) out.push('## Résumé', '', prose(state.globalSummary), '', ...(doubts ? [`*${doubts}*`, ''] : []))
  warn(state.globalUnverified)

  for (const sec of sections) {
    out.push(`## ${SECTION_MARK[sec.key]} ${sec.heading}`, '')
    if (sec.intro) out.push(`*${sec.intro}*`, '')
    for (const x of sec.items) {
      out.push(`- **${x.title}** — ${[x.detail, x.fragile && 'fragile', x.doubt].filter(Boolean).join(' · ')}`)
      for (const q of x.quotes) out.push(`  - « ${q.text} » — ${q.who}`)
    }
    if (sec.more.length) out.push(`- Et aussi : ${sec.more.join(' · ')}`)
    out.push('')
  }

  const writeGroup = (g: Group, level: string) => {
    const squares = opinionSquares(g.metrics)
    out.push(`${level} ${g.title}`, '', `${squares ? `${squares}  ` : ''}*${metricsLine(g.metrics)}*`, '')
    if (g.definition) out.push(`*${definitionLine(g.definition)}*`, '')
    const doubt = labelDoubt(g, byId)
    if (doubt) out.push(`**${cap(doubt)}.**`, '')
    const dominant = dominantVoice(ideasOf(g, byId))
    if (dominant) out.push(`*${dominant}*`, '')
    if (g.summary) out.push(`> ${prose(g.summary).replace(/\n\s*\n/g, '\n>\n> ')}`, '')
    warn(g.unverified)
    const both = bothSides(ideasOf(g, byId))
    const full = fullQuestionIds(displayOrder(ideasOf(g, byId), g.metrics), v.context)
    for (const cat of categoryOrder(g.metrics)) {
      const items = ideasOf(g, byId).filter((i) => i.category === cat)
      if (!items.length) continue
      const lines = personLines(items)
      out.push(
        `**${categoryHeading(
          cat,
          lines.map((l) => l.participantId),
          both,
        )}**`,
        '',
      )
      for (const line of lines) {
        const quotes = line.ideas.map((i) => {
          const q = v.question(i)
          const ctx = full.has(i.id) ? v.context(i) : undefined
          const origin = [q, ctx && `en réponse à « ${ctx} »`, alsoIn(i) && `aussi dans « ${alsoIn(i)} »`].filter(Boolean).join(', ')
          // Un retour à la ligne dans une citation casserait la liste : il devient « / », les mots restent les mêmes.
          return `« ${v.text(i.verbatim).replace(/\s*\n+\s*/g, ' / ')} »${origin ? ` *(${origin})*` : ''}`
        })
        const star = (cat === 'positive' || cat === 'negative') && both.has(line.participantId)
        out.push(`- ${CATEGORY_MARK[cat]} **${line.participantId}${star ? '\\*' : ''}** — ${quotes.join(' ; ')}`)
      }
      out.push('')
    }
    if (both.size) out.push(`\\* Personne qui s'exprime aussi dans l'autre sens sur ce motif.`, '')
  }

  if (state.themes.length) {
    for (const t of state.themes) {
      const groups = t.groupIds.map((id) => groupById.get(id)!)
      out.push(`## ${t.title}`, '', `*${describeTheme(t, groups)}*`, '')
      if (t.summary) out.push(prose(t.summary), '')
      warn(t.unverified)
      const { main, isolated } = splitIsolated(groups)
      // Un motif qui porte le nom de son thème répéterait la synthèse du thème : on n'en garde que les chiffres et les verbatims.
      for (const g of main) writeGroup(g, '###')
      if (isolated.length) {
        out.push('### Signaux isolés', '', '*Un seul participant chacun : à lire comme des pistes, pas comme des tendances.*', '')
        for (const g of isolated) writeGroup(g, '####')
      }
    }
  } else {
    for (const g of state.groups) writeGroup(g, '##')
  }
  const off = offTopicLines(state)
  if (off.ideas) {
    out.push('## Hors question', '', `*${OFF_TOPIC_INTRO}*`, '')
    for (const line of off.lines) out.push(`- **${line.participantId}** — ${line.ideas.map((i) => `« ${v.text(i.verbatim).replace(/\s*\n+\s*/g, ' / ')} »`).join(' ; ')}`)
    out.push('')
  }
  out.push('## Méthode', '', ...methodNote(state, corpus).map((l) => `- ${l}`), '')
  return out.join('\n')
}

export function reportToHtml(saved: AnalysisState, corpus: Corpus, title: string, opts: { stale?: boolean } = {}): string {
  const state = withCurrentMetrics(saved)
  const e = escapeHtml
  const byId = new Map(state.ideas.map((i) => [i.id, i]))
  const groupById = new Map(state.groups.map((g) => [g.id, g]))
  const v = shown(state, corpus)
  const parts: string[] = []
  // Un texte rédigé peut compter plusieurs paragraphes (le résumé en trois temps).
  const sizeOf = motifSizes(state)
  const alsoIn = alsoInOf(state)
  // Chaque référence d'une synthèse devient le code du participant, relié à son verbatim (survol : la citation).
  // Un clic sur le renvoi déplie les verbatims de cette personne sous le paragraphe (sans script : saut vers le verbatim).
  const link = (who: string, i: Idea, all: Idea[]) =>
    `<a class="ref" href="#${e(i.id)}" data-i="${e(all.map((x) => x.id).join(','))}" title="« ${e(v.text(i.verbatim))} »" aria-expanded="false">${e(who)}</a>`
  // Les réponses entières autour des verbatims affichés, prénoms masqués comme le reste (positions recalculées).
  const names = state.settings.maskNames ? state.names : undefined
  const contributionById = new Map(corpus.contributions.map((c) => [c.id, c]))
  const questions: string[] = []
  const context: { q: string[]; c: Record<string, [number, string]>; i: Record<string, [string, [number, number][]]> } = { q: questions, c: {}, i: {} }
  const offsets = new Map<string, (pos: number) => number>()
  const withContext = (i: Idea) => {
    const c = contributionById.get(i.contributionId)
    if (!c) return
    if (!offsets.has(c.id)) {
      const m = maskWithOffsets(c.text, names)
      offsets.set(c.id, m.at)
      const prompt = c.prompt?.replace(/^[^\p{L}\p{N}]+/u, '')
      let q = prompt ? questions.indexOf(prompt) : -1
      if (prompt && q < 0) q = questions.push(prompt) - 1
      context.c[c.id] = [q, m.text]
    }
    const at = offsets.get(c.id)!
    context.i[i.id] = [c.id, (i.parts ?? [i.span]).map((p) => [at(p.start), at(p.end)])]
  }
  // Un verbatim : cliquable, il déplie sa réponse entière.
  const quote = (i: Idea) => {
    withContext(i)
    return `<span id="${e(i.id)}" class="q" role="button" tabindex="0" aria-expanded="false">« ${e(v.text(i.verbatim))} »</span>`
  }
  // Une explication : au survol (title) et au toucher (bouton « ? »).
  const help = (text: string) => ` <button type="button" class="help" data-help="${e(text)}" title="${e(text)}" aria-label="Explication">?</button>`
  const para = (text: string) =>
    v
      .text(text)
      .split(/\n\s*\n/)
      .map((p) => `<p>${refsToPeople(e(p.trim()), byId, link, sizeOf)}</p>`)
      .join('')
  // La barre d'avis : une part par camp, à la largeur de son nombre de participants.
  const bar = (m: Metrics) => {
    const parts = categoryBar(m)
    if (!parts.length) return ''
    const label = e(categoryBarLabel(m))
    return `<div class="bar" role="img" aria-label="${label}" title="${label}">${parts.map(({ cat, people }) => `<span class="b-${cat}" style="flex:${people}"></span>`).join('')}</div>`
  }

  const groupHtml = (g: Group, h: 'h2' | 'h3' | 'h4') => {
    const both = bothSides(ideasOf(g, byId))
    const full = fullQuestionIds(displayOrder(ideasOf(g, byId), g.metrics), v.context)
    const blocks = categoryOrder(g.metrics)
      .map((cat) => {
        const items = ideasOf(g, byId).filter((i) => i.category === cat)
        if (!items.length) return ''
        const lines = personLines(items)
        const polar = cat === 'positive' || cat === 'negative'
        return `<details open class="cat-${cat}"><summary>${e(
          categoryHeading(
            cat,
            lines.map((l) => l.participantId),
            both,
          ),
        )}</summary><ul>${lines
          .map(
            (l) =>
              `<li class="${cat}"><span class="who">${e(l.participantId)}${polar && both.has(l.participantId) ? ' *' : ''}</span> ${l.ideas
                .map((i) => {
                  const q = v.question(i)
                  const ctx = full.has(i.id) ? v.context(i) : undefined
                  const origin = [q, ctx && `en réponse à « ${ctx} »`, alsoIn(i) && `aussi dans « ${alsoIn(i)} »`].filter(Boolean).join(', ')
                  return `${quote(i)}${origin ? ` <span class="origin">${e(origin)}</span>` : ''}`
                })
                .join(' ; ')}</li>`,
          )
          .join('')}</ul></details>`
      })
      .join('')
    const note = both.size ? `<p class="facts">* Personne qui s'exprime aussi dans l'autre sens sur ce motif.</p>` : ''
    const dominant = dominantVoice(ideasOf(g, byId))
    // La synthèse se lit en premier ; la définition du motif, explication secondaire, reste pliée (remarque d'Arnaud, 17/10).
    const doubt = labelDoubt(g, byId)
    return `<section class="group"><${h}>${e(g.title)}</${h}>${bar(g.metrics)}<p class="facts">${e(metricsLine(g.metrics))}${help(stanceTitle(g.metrics))}</p>${doubt ? `<p class="facts"><strong>${e(cap(doubt))}.</strong>${help(helpText({ ...DOUBT_HELP, what: '' }))}</p>` : ''}${dominant ? `<p class="facts">${e(dominant)}</p>` : ''}${g.summary ? `<div class="synth">${para(g.summary)}</div>` : ''}${g.definition ? `<details class="def"><summary>Ce qui compte comme positif ou négatif dans ce motif</summary><p>${e(definitionLine(g.definition))}</p></details>` : ''}${blocks}${note}</section>`
  }

  if (opts.stale) parts.push(`<p class="facts"><strong>${e(STALE_NOTE)}</strong></p>`)
  const sections = highlightSections(state)
  const doubts = summaryDoubts(sections)
  if (state.globalSummary) parts.push(`<h2>Résumé</h2>${para(state.globalSummary)}${doubts ? `<p class="facts">${e(doubts)}${help(helpText({ ...DOUBT_HELP, what: '' }))}</p>` : ''}`)
  for (const sec of sections) {
    const items = sec.items
      .map(
        (x) =>
          `<li class="${SECTION_CLASS[sec.key]}"><strong>${e(x.title)}</strong> — ${e(x.detail)}${x.fragile ? ` · <button type="button" class="mark" data-help="${e(helpText(FRAGILE_HELP))}" title="${e(helpText(FRAGILE_HELP))}">fragile</button>` : ''}${x.doubt ? ` · <button type="button" class="mark" data-help="${e(helpText(DOUBT_HELP))}" title="${e(helpText(DOUBT_HELP))}">${e(x.doubt)}</button>` : ''}${x.quotes.length ? `<ul>${x.quotes.map((q) => `<li class="quote">« ${e(q.text)} » <span class="who">${e(q.who)}</span></li>`).join('')}</ul>` : ''}</li>`,
      )
      .join('')
    const more = sec.more.length ? `<li class="more">Et aussi : ${e(sec.more.join(' · '))}</li>` : ''
    parts.push(
      `<h2 class="sec sec-${SECTION_CLASS[sec.key]}">${sec.heading}</h2>${sec.intro ? `<p class="facts">${e(sec.intro)}</p>` : ''}<ul class="highlights">${items}${more}</ul>`,
    )
  }
  if (state.themes.length) {
    for (const t of state.themes) {
      const groups = t.groupIds.map((id) => groupById.get(id)!)
      const { main, isolated } = splitIsolated(groups)
      const iso = isolated.length
        ? `<h3>Signaux isolés</h3><p class="facts">Un seul participant chacun : à lire comme des pistes, pas comme des tendances.</p>${isolated.map((g) => groupHtml(g, 'h4')).join('')}`
        : ''
      parts.push(
        `<section class="theme"><h2>${e(t.title)}</h2><p class="facts">${e(describeTheme(t, groups))}</p>${t.summary ? para(t.summary) : ''}${main
          .map((g) => groupHtml(g, 'h3'))
          .join('')}${iso}</section>`,
      )
    }
  } else {
    parts.push(...state.groups.map((g) => groupHtml(g, 'h2')))
  }
  const off = offTopicLines(state)
  if (off.ideas)
    parts.push(
      `<section class="group"><h2>Hors question</h2><p class="facts">${e(OFF_TOPIC_INTRO)}</p><ul>${off.lines
        .map((l) => `<li class="neutral"><span class="who">${e(l.participantId)}</span> ${l.ideas.map(quote).join(' ; ')}</li>`)
        .join('')}</ul></section>`,
    )
  parts.push(
    `<h2>Méthode</h2><ul>${methodNote(state, corpus)
      .map((l) => `<li>${e(l)}</li>`)
      .join('')}</ul>`,
  )

  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(title)}</title>
<style>
:root{--ink:#1d1f2b;--muted:#5b6078;--line:#e3e5f5;--brand:#2F40C2;--pos:#2e9d6a;--neg:#d1495b;--sug:#2F40C2;--que:#2a8fb0;--neu:#9aa0b5;--card:#f7f8fd}
body{font-family:Geist,system-ui,-apple-system,"Segoe UI",sans-serif;max-width:52rem;margin:2rem auto;padding:0 1rem;line-height:1.6;color:var(--ink);background:#fff}
h1{color:var(--brand);font-size:2rem;margin-bottom:.5rem}h2{margin-top:2.6rem;border-bottom:2px solid var(--line);padding-bottom:.3rem}
h3{margin-top:2rem;padding-top:1rem;border-top:1px solid var(--line)}h4{margin-top:1.4rem}
.sec{border-bottom:0;border-left:5px solid var(--neu);padding:.1rem 0 .1rem .6rem}.sec-positive{border-color:var(--pos)}.sec-negative{border-color:var(--neg)}.sec-suggestion{border-color:var(--sug)}.sec-question{border-color:var(--que)}
.theme>h2{color:var(--brand)}
.facts{color:var(--muted);font-size:.9rem;margin:.3rem 0}
.bar{display:flex;height:.55rem;max-width:16rem;border-radius:99px;overflow:hidden;background:var(--line);margin:.4rem 0 .2rem;gap:2px}
[id]{scroll-margin-top:5rem}.b-positive{background:var(--pos)}.b-negative{background:var(--neg)}.b-suggestion{background:var(--sug)}.b-question{background:var(--que)}.b-neutral{background:var(--neu)}
.synth{margin:.6rem 0}
.def{margin:.2rem 0 .6rem}.def>summary{font-weight:500;font-size:.85rem;color:var(--muted)}.def>p{background:var(--card);border-radius:.4rem;padding:.5rem .8rem;margin:.3rem 0;font-size:.9rem;color:var(--muted)}
.ref,.q{cursor:pointer}.q{border-bottom:1px dotted var(--line)}.q:hover,.q[aria-expanded=true]{border-bottom-color:var(--brand)}
.help,.mark{font:inherit;color:var(--brand);background:none;border:0;padding:0;cursor:pointer}.help{display:inline-flex;align-items:center;justify-content:center;width:1.15rem;height:1.15rem;border:1px solid var(--line);border-radius:99px;font-size:.75rem;vertical-align:.05rem}.mark{border-bottom:1px dotted var(--brand)}
.panel{margin:.4rem 0 .6rem;padding-left:.8rem;border-left:2px solid var(--brand)}.panel p{margin:.25rem 0}
.ctx-q{color:var(--muted);font-size:.85rem;font-style:italic}.ctx-t{white-space:pre-wrap;color:var(--muted)}.ctx-t strong{color:var(--ink)}.tip{color:var(--muted);font-size:.9rem}
.fold{font:inherit;font-size:.85rem;color:var(--muted);background:none;border:0;padding:0;cursor:pointer;text-decoration:underline}
details{margin:.6rem 0}summary{cursor:pointer;font-weight:600;font-size:.95rem}
.cat-positive>summary{color:var(--pos)}.cat-negative>summary{color:var(--neg)}.cat-suggestion>summary{color:var(--sug)}.cat-question>summary{color:var(--que)}.cat-neutral>summary{color:var(--muted)}
ul{padding-left:0}li{margin:.35rem 0;list-style:none}
li.positive,li.negative,li.suggestion,li.neutral,li.question,li.quote{border-left:3px solid var(--neu);padding-left:.6rem}
li.positive{border-color:var(--pos)}li.negative{border-color:var(--neg)}li.suggestion,li.quote{border-color:var(--sug)}li.question{border-color:var(--que)}
li.quote{font-style:italic;margin-left:.8rem;border-color:var(--line)}li.more{color:var(--muted)}
.who{display:inline-block;min-width:2.2rem;font-weight:600;color:var(--muted);font-size:.8rem}.origin{color:var(--muted);font-size:.8rem}
a{color:var(--brand);text-decoration:none;border-bottom:1px dotted var(--brand)}:target{background:#fff3c4}
@media print{details{display:block}details>summary{list-style:none}a{color:inherit;border:0}.panel,.help,.fold{display:none}.bar,li,.def>p{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<h1>${e(title)}</h1>
${parts.join('\n')}
<footer><p class="facts">Rapport produit avec OpenScribe, outil libre de recherche utilisateur.</p></footer>
<script type="application/json" id="os-data">${scriptJson(context)}</script>
<script>${ARTICLE_SCRIPT}</script>
</body></html>`
}
