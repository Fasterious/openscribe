import type { Corpus } from '../corpus'
import { activeParticipants, duplicateContributions, promptsOf } from '../corpus'
import { presetById } from '../providers/presets'
import { highlights, type Highlight, type Highlights } from './highlights'
import { withCurrentMetrics } from './metrics'
import { maskNames } from './names'
import { describeTheme } from './pipeline'
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

/** Le livre de codes d'un motif, en une ligne sous son titre : ce qui y compte comme favorable, défavorable ou hors camp. */
export function definitionLine(d: GroupDefinition): string {
  const dot = (s: string) => s.trim().replace(/[.;]+$/, '')
  return `${[`Favorable : ${dot(d.positive)}`, `Défavorable : ${dot(d.negative)}`, ...(d.neutral ? [`Hors camp : ${dot(d.neutral)}`] : [])].join(' · ')}.`
}

function methodNote(state: AnalysisState, corpus: Corpus): string[] {
  const respondents = activeParticipants(corpus).length
  const withIdeas = new Set(state.ideas.map((i) => i.participantId)).size
  const single = state.groups.filter((g) => g.metrics.participants === 1).length
  // Part des idées venues des trois participants les plus prolixes : un rapport peut être tiré par quelques voix.
  const perPerson = [...state.ideas.reduce((m, i) => m.set(i.participantId, (m.get(i.participantId) ?? 0) + 1), new Map<string, number>()).values()].sort(
    (a, b) => b - a,
  )
  const top3 = perPerson.slice(0, 3).reduce((a, b) => a + b, 0)
  const lines = [
    `Participants ayant répondu : ${respondents} ; participants dont au moins une idée a été retenue : ${withIdeas}.`,
    `Idées retenues : ${state.ideas.length} (verbatims vérifiés mot pour mot dans les réponses). Verbatims écartés car introuvables tels quels : ${state.rejected.length || 'aucun'}.`,
    `Motifs : ${state.groups.length}${state.themes.length ? `, regroupés en ${state.themes.length} thèmes` : ''} ; ${single ? `${single} ${single > 1 ? 'reposent' : 'repose'} sur un seul participant (signaux isolés, pas des tendances)` : 'aucun ne repose sur un seul participant'}.${state.merges?.length ? ` La passe de consolidation a fusionné ${state.merges.length} ensembles de motifs qui traitaient le même objet.` : ''}`,
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
        `Relecture des motifs par le moteur d'IA : ${[moved && pl(moved, 'idée déplacée vers le motif dont elle parle vraiment', 'idées déplacées vers le motif dont elles parlent vraiment'), retoned && pl(retoned, "idée changée de camp après un nouvel examen de son ton au regard de l'objet du motif", "idées changées de camp après un nouvel examen de leur ton au regard de l'objet du motif")].filter(Boolean).join(' ; ')}. Une personne n'est « mitigée » que si elle dit du bien et du mal du même objet.`,
      )
  }
  if (state.groups.some((g) => g.definition))
    lines.push(
      "Livre de codes : avant de juger les idées de chaque motif, le moteur d'IA a écrit ce qui y compte comme favorable, défavorable ou hors camp. Cette définition figure sous le titre du motif ; les camps d'avis s'y conforment, et le lecteur peut la contester.",
    )
  if (state.support)
    lines.push(
      `Renvois vérifiés : chaque phrase des synthèses a été confrontée par le moteur d'IA aux verbatims qu'elle cite (${state.support.checked} phrases) ; ${state.support.fixed || 'aucune'} corrigée${state.support.fixed > 1 ? 's' : ''}, ${state.support.dropped || 'aucune'} retirée${state.support.dropped > 1 ? 's' : ''} faute d'appui${state.support.added ? ` ; le moteur d'IA en a ajouté ${state.support.added} pour un sujet ou un camp d'avis qui manquait` : ''}.${state.campsAdded ? ` Le code en a écrit ${state.campsAdded} pour un camp d'avis encore absent de la synthèse de son motif.` : ''}`,
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
function offTopicLines(state: AnalysisState): { ideas: number; people: number; lines: { participantId: string; ideas: Idea[] }[] } {
  const byId = new Map(state.ideas.map((i) => [i.id, i]))
  const ideas = (state.offTopic ?? []).map((id) => byId.get(id)).filter((i): i is Idea => !!i)
  const lines = personLines(ideas)
  return { ideas: ideas.length, people: lines.length, lines }
}

const OFF_TOPIC_INTRO = 'Ces idées ne répondent pas à la question posée : gardées pour la transparence, elles ne comptent dans aucun motif.'

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
      `à contre-courant : ${n(k, m.minority.side === 'positive' ? 'avis positif' : 'avis négatif')}`,
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
  if (m.fragile) out.push('fragile')
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
  link?: (who: string, idea: Idea) => string,
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
        const tag = Math.max(claimedPeople(sentence), universal) > cited ? 'notamment ' : ''
        return sentence.replace(REFS, (_, ids: string) => {
          const seen = new Map<string, Idea>()
          for (const id of ids.split(/\s*,\s*/)) {
            const idea = byId.get(id)
            if (idea && !seen.has(idea.participantId)) seen.set(idea.participantId, idea)
          }
          if (!seen.size) return ''
          const people = [...seen].sort(([a], [b]) => a.localeCompare(b, 'fr', { numeric: true }))
          return `(${tag}${people.map(([who, idea]) => (link ? link(who, idea) : who)).join(', ')})`
        })
      })
      .join('')
      .replace(/\s+([.,])/g, '$1')
      // Deux renvois identiques dans la même phrase : on ne garde que le dernier.
      .replace(/\s*\(((?:notamment )?)([^()]*P\d+[^()]*)\)(?=[^.!?]*\(\1\2\))/g, '')
      // Un renvoi qui suit un chiffre entre parenthèses entre dans la même parenthèse : « (29 des 34 participants ; notamment P13) ».
      .replace(/\(([^()]*\d[^()]*)\)\s*\(((?:notamment )?[^()]*P\d+[^()]*)\)/g, (all, figure: string, refs: string) =>
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
 * Une case par participant : vert, jaune (mitigé) ou rouge pour ceux qui donnent
 * un avis, blanc pour ceux qui proposent, questionnent ou constatent sans juger.
 * Trois critiques parmi neuf participants ne se lisent pas comme un motif tout rouge.
 */
export function opinionSquares(m: Metrics, max = 30): string {
  const pos = m.positiveOnly.length
  const mix = m.mixed.length
  const neg = m.negativeOnly.length
  const none = Math.max(0, m.participants - pos - mix - neg)
  if (!(pos + mix + neg) || m.participants > max) return ''
  return '🟩'.repeat(pos) + '🟨'.repeat(mix) + '🟥'.repeat(neg) + '⬜'.repeat(none)
}

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
function categoryOrder(m: Metrics): IdeaCategory[] {
  return m.majority === 'negative' ? ['negative', 'positive', 'suggestion', 'question', 'neutral'] : CATEGORY_ORDER
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
  /** Verbatims montrés sous une ligne, avec leur auteur. */
  items: { title: string; detail: string; quotes: { who: string; text: string }[] }[]
  /** Motifs au-delà des premiers, nommés sans détail : une liste n'est jamais coupée en silence. */
  more: string[]
}

/** Les sections calculées du rapport, prêtes à afficher : mêmes chiffres dans l'écran et dans les exports. */
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
    return { shown: list.slice(0, k), more: list.slice(k).map((x) => x.title) }
  }
  const s1 = cut(h.strengths)
  const s2 = cut(h.blockers)
  // Une critique partagée aux remèdes opposés reste toujours visible dans « Ce qui divise ».
  const s3 = cut(h.divided, SHOWN + h.divided.filter((x) => x.opposed).length)
  const s4 = cut(h.proposals, 8)
  const s5 = cut(h.questions, 6)
  const sections: HighlightSection[] = [
    {
      key: 'strengths',
      heading: 'Ce qui a marché',
      intro: INTRO,
      items: s1.shown.map((x) => ({
        title: x.title,
        detail: opinion(x, 'positif'),
        quotes: [],
      })),
      more: s1.more,
    },
    {
      key: 'blockers',
      heading: 'Ce qui bloque',
      intro: INTRO,
      items: s2.shown.map((x) => ({
        title: x.title,
        detail: opinion(x, 'négatif'),
        quotes: [],
      })),
      more: s2.more,
    },
    {
      key: 'divided',
      heading: 'Ce qui divise',
      items: s3.shown.map((x) => {
        const g = state.groups.find((y) => y.id === x.groupId)!
        // Constat partagé, pistes opposées : on montre les deux propositions, chacune avec son auteur.
        if (x.opposed && g.metrics.stance !== 'divided') {
          const quote = (id: string) => ({ who: byId.get(id)!.participantId, text: mask(byId.get(id)!.verbatim) })
          const side = g.metrics.majority === 'positive' ? 'positif' : 'négatif'
          const n = Math.max(g.metrics.positiveOnly.length, g.metrics.negativeOnly.length)
          const total = g.metrics.positiveOnly.length + g.metrics.negativeOnly.length + g.metrics.mixed.length
          return {
            title: x.title,
            detail: `${n} avis ${side}${n > 1 ? 's' : ''} sur ${total}, mais deux propositions s'opposent sur ${x.opposed.about}`,
            quotes: [quote(x.opposed.a), quote(x.opposed.b)],
          }
        }
        return { title: x.title, detail: describeOpinions(g) + (x.opposed ? ` ; pistes opposées : ${x.opposed.about}` : ''), quotes: [] }
      }),
      more: s3.more,
    },
    {
      key: 'proposals',
      heading: 'Ce que proposent les participants',
      items: s4.shown.map((x) => ({
        title: x.title,
        detail: `${x.people} participant${pl(x.people)}`,
        // Deux propositions au plus, de deux personnes différentes si possible, les plus parlantes (les plus longues).
        quotes: pickQuotes(
          x.ideaIds.map((id) => byId.get(id)!),
          2,
        ).map((i) => ({ who: i.participantId, text: mask(i.verbatim) })),
      })),
      more: s4.more,
    },
    {
      key: 'questions',
      heading: 'Questions soulevées',
      items: s5.shown.map((x) => ({
        title: x.title,
        detail: `${x.people} participant${pl(x.people)}`,
        quotes: pickQuotes(
          x.ideaIds.map((id) => byId.get(id)!),
          2,
        ).map((i) => ({ who: i.participantId, text: mask(i.verbatim) })),
      })),
      more: s5.more,
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
  if (state.globalSummary) out.push('## Résumé', '', prose(state.globalSummary), '')
  warn(state.globalUnverified)

  for (const sec of highlightSections(state)) {
    out.push(`## ${SECTION_MARK[sec.key]} ${sec.heading}`, '')
    if (sec.intro) out.push(`*${sec.intro}*`, '')
    for (const x of sec.items) {
      out.push(`- **${x.title}** — ${x.detail}`)
      for (const q of x.quotes) out.push(`  - « ${q.text} » — ${q.who}`)
    }
    if (sec.more.length) out.push(`- Et aussi : ${sec.more.join(' · ')}`)
    out.push('')
  }

  const writeGroup = (g: Group, level: string) => {
    const squares = opinionSquares(g.metrics)
    out.push(`${level} ${g.title}`, '', `${squares ? `${squares}  ` : ''}*${metricsLine(g.metrics)}*`, '')
    if (g.definition) out.push(`*${definitionLine(g.definition)}*`, '')
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
          const origin = [q, ctx && `en réponse à « ${ctx} »`].filter(Boolean).join(', ')
          // Un retour à la ligne dans une citation casserait la liste : il devient « / », les mots restent les mêmes.
          return `« ${v.text(i.verbatim).replace(/\s*\n+\s*/g, ' / ')} »${origin ? ` *(${origin})*` : ''}`
        })
        const star = (cat === 'positive' || cat === 'negative') && both.has(line.participantId)
        out.push(`- ${CATEGORY_MARK[cat]} **${line.participantId}${star ? '\\*' : ''}** — ${quotes.join(' ; ')}`)
      }
      out.push('')
    }
    if (both.size) out.push(`\\* s'exprime aussi dans l'autre sens sur ce motif.`, '')
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
  // Chaque référence d'une synthèse devient le code du participant, relié à son verbatim (survol : la citation).
  const link = (who: string, i: Idea) => `<a href="#${e(i.id)}" title="« ${e(v.text(i.verbatim))} »">${e(who)}</a>`
  const para = (text: string) =>
    v
      .text(text)
      .split(/\n\s*\n/)
      .map((p) => `<p>${refsToPeople(e(p.trim()), byId, link, sizeOf)}</p>`)
      .join('')
  // La barre d'avis : une part par camp, à la largeur de son nombre de participants.
  const bar = (m: Metrics) => {
    const pos = m.positiveOnly.length
    const mix = m.mixed.length
    const neg = m.negativeOnly.length
    const total = pos + mix + neg
    if (!total) return ''
    const none = Math.max(0, m.participants - total)
    const seg = (k: number, cls: string) => (k ? `<span class="${cls}" style="flex:${k}"></span>` : '')
    return `<div class="bar" role="img" aria-label="${pos} positifs, ${mix} mitigés, ${neg} négatifs, ${none} sans avis">${seg(pos, 'b-pos')}${seg(mix, 'b-mix')}${seg(neg, 'b-neg')}${seg(none, 'b-none')}</div>`
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
                  const origin = [q, ctx && `en réponse à « ${ctx} »`].filter(Boolean).join(', ')
                  return `<span id="${e(i.id)}">« ${e(v.text(i.verbatim))} »</span>${origin ? ` <span class="origin">${e(origin)}</span>` : ''}`
                })
                .join(' ; ')}</li>`,
          )
          .join('')}</ul></details>`
      })
      .join('')
    const note = both.size ? `<p class="facts">* s'exprime aussi dans l'autre sens sur ce motif.</p>` : ''
    const dominant = dominantVoice(ideasOf(g, byId))
    return `<section class="group"><${h}>${e(g.title)}</${h}>${bar(g.metrics)}<p class="facts">${e(metricsLine(g.metrics))}</p>${g.definition ? `<p class="facts">${e(definitionLine(g.definition))}</p>` : ''}${dominant ? `<p class="facts">${e(dominant)}</p>` : ''}${g.summary ? `<div class="summary">${para(g.summary)}</div>` : ''}${blocks}${note}</section>`
  }

  if (opts.stale) parts.push(`<p class="facts"><strong>${e(STALE_NOTE)}</strong></p>`)
  if (state.globalSummary) parts.push(`<h2>Résumé</h2>${para(state.globalSummary)}`)
  for (const sec of highlightSections(state)) {
    const items = sec.items
      .map(
        (x) =>
          `<li class="${SECTION_CLASS[sec.key]}"><strong>${e(x.title)}</strong> — ${e(x.detail)}${x.quotes.length ? `<ul>${x.quotes.map((q) => `<li class="quote">« ${e(q.text)} » <span class="who">${e(q.who)}</span></li>`).join('')}</ul>` : ''}</li>`,
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
        .map((l) => `<li class="neutral"><span class="who">${e(l.participantId)}</span> ${l.ideas.map((i) => `<span id="${e(i.id)}">« ${e(v.text(i.verbatim))} »</span>`).join(' ; ')}</li>`)
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
:root{--ink:#1d1f2b;--muted:#5b6078;--line:#e3e5f5;--brand:#2F40C2;--pos:#2e9d6a;--neg:#d1495b;--mix:#e0a526;--sug:#2F40C2;--que:#2a8fb0;--neu:#9aa0b5;--card:#f7f8fd}
body{font-family:Geist,system-ui,-apple-system,"Segoe UI",sans-serif;max-width:52rem;margin:2rem auto;padding:0 1rem;line-height:1.6;color:var(--ink);background:#fff}
h1{color:var(--brand);font-size:2rem;margin-bottom:.5rem}h2{margin-top:2.6rem;border-bottom:2px solid var(--line);padding-bottom:.3rem}
h3{margin-top:2rem;padding-top:1rem;border-top:1px solid var(--line)}h4{margin-top:1.4rem}
.sec{border-bottom:0;border-left:5px solid var(--neu);padding:.1rem 0 .1rem .6rem}.sec-positive{border-color:var(--pos)}.sec-negative{border-color:var(--neg)}.sec-suggestion{border-color:var(--sug)}.sec-question{border-color:var(--que)}
.theme>h2{color:var(--brand)}
.facts{color:var(--muted);font-size:.9rem;margin:.3rem 0}
.bar{display:flex;height:.55rem;max-width:16rem;border-radius:99px;overflow:hidden;background:var(--line);margin:.4rem 0 .2rem;gap:2px}
.b-none{background:var(--line)}[id]{scroll-margin-top:5rem}.b-pos{background:var(--pos)}.b-mix{background:var(--mix)}.b-neg{background:var(--neg)}
.summary{background:var(--card);border-radius:.5rem;padding:.2rem 1rem;margin:.6rem 0}
details{margin:.6rem 0}summary{cursor:pointer;font-weight:600;font-size:.95rem}
.cat-positive>summary{color:var(--pos)}.cat-negative>summary{color:var(--neg)}.cat-suggestion>summary{color:var(--sug)}.cat-question>summary{color:var(--que)}.cat-neutral>summary{color:var(--muted)}
ul{padding-left:0}li{margin:.35rem 0;list-style:none}
li.positive,li.negative,li.suggestion,li.neutral,li.question,li.quote{border-left:3px solid var(--neu);padding-left:.6rem}
li.positive{border-color:var(--pos)}li.negative{border-color:var(--neg)}li.suggestion,li.quote{border-color:var(--sug)}li.question{border-color:var(--que)}
li.quote{font-style:italic;margin-left:.8rem;border-color:var(--line)}li.more{color:var(--muted)}
.who{display:inline-block;min-width:2.2rem;font-weight:600;color:var(--muted);font-size:.8rem}.origin{color:var(--muted);font-size:.8rem}
a{color:var(--brand);text-decoration:none;border-bottom:1px dotted var(--brand)}:target{background:#fff3c4}
@media print{details{display:block}details>summary{list-style:none}a{color:inherit;border:0}.bar,li,.summary{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<h1>${e(title)}</h1>
${parts.join('\n')}
<footer><p class="facts">Rapport produit avec OpenScribe, outil libre de recherche utilisateur.</p></footer>
</body></html>`
}
