import type { Contribution, Corpus } from '../corpus'
import { activeParticipants, contributionsOf } from '../corpus'
import { randomId, sha256, stableStringify } from '../ids'
import type { LlmProvider } from '../providers/types'
import { computeMetrics, sortIds } from './metrics'
import {
  assignPrompt,
  assignSchema,
  extractionPrompt,
  extractionSchema,
  fixPrompt,
  fixSchema,
  globalPrompt,
  globalSchema,
  polishPrompt,
  polishSchema,
  groupingPrompt,
  groupingSchema,
  groupSummaryPrompt,
  groupSummarySchema,
  themePrompt,
  themeSchema,
  type ExtractionOutput,
  type SummaryGroupInput,
} from './prompts'
import { LlmRunner, type ResponseCache } from './runner'
import { DEFAULT_SETTINGS } from './types'
import { allowedNumbers, sameNumbers, unverifiedNumbers } from './numbers'
import type {
  AnalysisSettings,
  AnalysisState,
  Group,
  Idea,
  IdeaCategory,
  Metrics,
  RejectedIdea,
  StepId,
  Theme,
} from './types'
import { explainMiss, locateVerbatim } from './verbatim'

/** Au-delà, le regroupement se fait par lots : un premier lot fonde les groupes, les suivants s'y rangent. */
export const GROUPING_BATCH = 350
export const ASSIGN_BATCH = 200
/** Nombre maximal d'idées envoyées dans une même demande de synthèse. */
export const SUMMARY_BATCH_IDEAS = 90
/** Au-delà de ce nombre de groupes, on ajoute un niveau de thèmes (le rapprochement des sujets voisins). */
export const THEME_LEVEL_FROM = 4

export interface PipelineOptions {
  provider: LlmProvider
  cache: ResponseCache
  signal?: AbortSignal
  /** Appelé à chaque étape franchie, avec une copie de l'état : de quoi sauvegarder et afficher. */
  onUpdate?: (state: AnalysisState) => void | Promise<void>
  /** Extractions menées en parallèle (le débit reste borné par le fournisseur). */
  concurrency?: number
}

const STEPS: StepId[] = ['extract', 'group', 'summarize', 'themes', 'report', 'polish']
export const POLISH_BATCH = 12

export async function corpusHash(corpus: Corpus): Promise<string> {
  return sha256(
    stableStringify(
      corpus.contributions.map((c) => ({ id: c.id, p: c.participantId, q: c.prompt ?? '', t: c.text })),
    ),
  )
}

export async function newAnalysis(corpus: Corpus, settings: AnalysisSettings, provider: LlmProvider): Promise<AnalysisState> {
  const now = new Date().toISOString()
  return {
    id: randomId('an'),
    createdAt: now,
    updatedAt: now,
    settings,
    engine: provider.fingerprint,
    corpusHash: await corpusHash(corpus),
    extractedParticipants: [],
    ideas: [],
    rejected: [],
    groups: [],
    themes: [],
    globalSummary: '',
    steps: STEPS.map((id) => ({ id, state: 'pending', done: 0, total: 0 })),
    calls: { total: 0, cached: 0, inputTokens: 0, outputTokens: 0 },
    cacheKeys: [],
    status: 'idle',
  }
}

function clone<T>(v: T): T {
  return structuredClone(v)
}

/**
 * Lance (ou reprend) une analyse. L'état est sauvegardé après chaque personne
 * traitée : une coupure, une erreur ou une annulation ne fait perdre que la
 * demande en cours. Les étapes suivantes sont recalculées à partir des idées.
 */
export async function runAnalysis(corpus: Corpus, initial: AnalysisState, options: PipelineOptions): Promise<AnalysisState> {
  const state = clone(initial)
  // Analyses créées avant l'ajout d'une étape : on complète la liste.
  for (const id of STEPS) if (!state.steps.some((s) => s.id === id)) state.steps.push({ id, state: 'pending', done: 0, total: 0 })
  state.steps.sort((a, b) => STEPS.indexOf(a.id) - STEPS.indexOf(b.id))
  state.settings = { ...DEFAULT_SETTINGS, ...state.settings }
  const runner = new LlmRunner(options.provider, options.cache, state.settings, options.signal)
  const baseCalls = { ...state.calls }
  const emit = async () => {
    state.updatedAt = new Date().toISOString()
    state.calls = {
      total: baseCalls.total + runner.stats.total,
      cached: baseCalls.cached + runner.stats.cached,
      inputTokens: baseCalls.inputTokens + runner.stats.inputTokens,
      outputTokens: baseCalls.outputTokens + runner.stats.outputTokens,
    }
    state.cacheKeys = [...new Set([...(initial.cacheKeys ?? []), ...runner.usedKeys])]
    await options.onUpdate?.(clone(state))
  }
  const step = (id: StepId) => state.steps.find((s) => s.id === id)!

  state.status = 'running'
  state.error = undefined
  let current: StepId = 'extract'
  try {
    current = 'extract'
    await extractAll(corpus, state, runner, options, emit)
    current = 'group'
    await groupIdeas(state, runner, emit)
    current = 'summarize'
    await summarizeGroups(corpus, state, runner, emit)
    current = 'themes'
    await buildThemes(state, runner, emit)
    current = 'report'
    step('report').state = 'running'
    await emit()
    await writeGlobalSummary(corpus, state, runner)
    step('report').state = 'done'
    current = 'polish'
    await polishTexts(state, runner, emit)
    verifyNumbers(corpus, state)
    state.status = 'done'
    await emit()
    return state
  } catch (e) {
    const aborted = options.signal?.aborted || (e instanceof DOMException && e.name === 'AbortError')
    state.status = aborted ? 'cancelled' : 'error'
    state.error = aborted ? undefined : e instanceof Error ? e.message : String(e)
    const s = step(current)
    if (s.state === 'running') s.state = aborted ? 'pending' : 'error'
    if (!aborted) s.message = state.error
    await emit()
    return state
  }
}

// ─── Étape 1 ─────────────────────────────────────────────────────────────────

interface ParticipantResult {
  participantId: string
  ideas: Omit<Idea, 'id'>[]
  rejected: RejectedIdea[]
}

async function extractAll(
  corpus: Corpus,
  state: AnalysisState,
  runner: LlmRunner,
  options: PipelineOptions,
  emit: () => Promise<void>,
) {
  const s = state.steps.find((x) => x.id === 'extract')!
  const people = activeParticipants(corpus)
  const done = new Set(state.extractedParticipants)
  const pending = people.filter((p) => !done.has(p.id))
  s.state = 'running'
  s.total = people.length
  s.done = people.length - pending.length
  await emit()

  const concurrency = Math.max(1, options.concurrency ?? 2)
  for (let i = 0; i < pending.length; i += concurrency) {
    const batch = pending.slice(i, i + concurrency)
    const results = await Promise.all(
      batch.map((p) => extractParticipant(contributionsOf(corpus, p.id).filter((c) => c.text.trim()), p.id, state.settings, runner)),
    )
    // On enregistre dans l'ordre du corpus : les identifiants restent stables quelle que soit la vitesse des réponses.
    for (const r of results) {
      for (const idea of r.ideas) {
        state.ideas.push({ ...idea, id: `I${String(state.ideas.length + 1).padStart(4, '0')}` })
      }
      state.rejected.push(...r.rejected)
      state.extractedParticipants.push(r.participantId)
      s.done++
    }
    // Les étapes suivantes dépendent des idées : elles seront recalculées.
    resetAfter(state, 'extract')
    await emit()
  }
  s.state = 'done'
  await emit()
}

function resetAfter(state: AnalysisState, id: StepId) {
  const idx = STEPS.indexOf(id)
  for (const st of state.steps.slice(idx + 1)) {
    st.state = 'pending'
    st.done = 0
    st.total = 0
    st.message = undefined
  }
  state.groups = []
  state.themes = []
  state.globalSummary = ''
  state.polish = undefined
}

export async function extractParticipant(
  contributions: Contribution[],
  participantId: string,
  settings: AnalysisSettings,
  runner: LlmRunner,
): Promise<ParticipantResult> {
  const refs = contributions.map((c, i) => ({ ref: `C${i + 1}`, c }))
  const byRef = new Map(refs.map((r) => [r.ref, r.c]))
  const out: ExtractionOutput = await runner.json(
    extractionPrompt({ contributions: refs.map((r) => ({ ref: r.ref, question: r.c.prompt, text: r.c.text })) }, settings),
    extractionSchema,
  )

  const ideas: Omit<Idea, 'id'>[] = []
  const misses: { ref: string; label: string; verbatim: string; category: IdeaCategory }[] = []
  const seen = new Set<string>()

  const accept = (ref: string, label: string, verbatim: string, category: IdeaCategory): boolean => {
    // On cherche d'abord dans la contribution indiquée, puis dans les autres
    // textes de la même personne (le modèle se trompe parfois de référence).
    const ordered = [byRef.get(ref), ...contributions].filter((c): c is Contribution => Boolean(c))
    for (const c of ordered) {
      const m = locateVerbatim(c.text, verbatim)
      if (!m) continue
      const key = `${c.id}:${m.start}:${m.end}:${category}`
      if (seen.has(key)) return true
      seen.add(key)
      ideas.push({
        participantId,
        contributionId: c.id,
        label: label.trim(),
        verbatim: c.text.slice(m.start, m.end),
        category,
        span: { start: m.start, end: m.end },
        approximate: m.approximate,
      })
      return true
    }
    return false
  }

  for (const item of out.ideas) {
    if (!accept(item.ref, item.label, item.verbatim, item.category)) misses.push(item)
  }

  const rejected: RejectedIdea[] = []
  if (misses.length) {
    const fixed = await runner.json(
      fixPrompt({ contributions: refs.map((r) => ({ ref: r.ref, text: r.c.text })), attempts: misses }, settings),
      fixSchema,
    )
    misses.forEach((miss, i) => {
      const f = fixed.ideas[i]
      if (f && f.verbatim.trim() && accept(f.ref, f.label || miss.label, f.verbatim, f.category)) return
      const source = byRef.get(miss.ref)?.text ?? contributions.map((c) => c.text).join('\n')
      rejected.push({ participantId, label: miss.label, verbatim: miss.verbatim, reason: explainMiss(source, miss.verbatim) })
    })
  }

  // Ordre de lecture : par contribution, puis par position dans le texte.
  const order = new Map(contributions.map((c, i) => [c.id, i]))
  ideas.sort((a, b) => order.get(a.contributionId)! - order.get(b.contributionId)! || a.span.start - b.span.start)
  return { participantId, ideas, rejected }
}

// ─── Étape 2 ─────────────────────────────────────────────────────────────────

function normLabel(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.!?;:]+$/, '')
}

/**
 * Nombre de groupes visé pour n libellés distincts. Un groupe est un motif
 * précis (un seul sujet) : on vise large, le rapprochement des sujets voisins
 * se fait à l'étape des thèmes. Une fourchette trop basse obligeait le modèle
 * à fusionner des sujets différents.
 */
export function groupTarget(n: number): { min: number; max: number } {
  const min = Math.max(3, Math.min(60, Math.round(n / 5)))
  const max = Math.max(min + 3, Math.min(120, Math.round(n / 2.5)))
  return { min, max }
}

async function groupIdeas(state: AnalysisState, runner: LlmRunner, emit: () => Promise<void>) {
  const s = state.steps.find((x) => x.id === 'group')!
  s.state = 'running'
  s.done = 0
  await emit()

  // Les libellés identiques sont envoyés une seule fois, avec leur nombre de mentions.
  const items: { id: string; label: string; ideaIds: string[] }[] = []
  const byLabel = new Map<string, (typeof items)[number]>()
  for (const idea of state.ideas) {
    const k = normLabel(idea.label)
    let item = byLabel.get(k)
    if (!item) {
      item = { id: `L${items.length + 1}`, label: idea.label.trim(), ideaIds: [] }
      byLabel.set(k, item)
      items.push(item)
    }
    item.ideaIds.push(idea.id)
  }
  s.total = items.length
  if (items.length === 0) {
    state.groups = []
    s.state = 'done'
    await emit()
    return
  }

  const grid = state.settings.mode === 'grid' ? state.settings.grid.map((g) => g.trim()).filter(Boolean) : []
  const OUTSIDE = 'Hors grille'
  const known = new Set(items.map((i) => i.id))
  const assigned = new Map<string, string>() // item → titre
  const titles: string[] = []
  const titleKey = (t: string) => t.trim().toLowerCase()
  const canonical = new Map<string, string>()
  const addTitle = (t: string) => {
    const k = titleKey(t)
    if (!canonical.has(k)) {
      canonical.set(k, t.trim())
      titles.push(t.trim())
    }
    return canonical.get(k)!
  }
  grid.forEach(addTitle)

  const allowedTitle = (t: string): string | null => {
    if (!grid.length) return addTitle(t)
    const k = titleKey(t)
    if (canonical.has(k)) return canonical.get(k)!
    if (k === titleKey(OUTSIDE)) return addTitle(OUTSIDE)
    return null
  }

  // Premier lot : fonde les groupes.
  const first = items.slice(0, GROUPING_BATCH)
  const grouped = await runner.json(
    groupingPrompt(
      { items: first.map((i) => ({ id: i.id, label: i.label, count: i.ideaIds.length })), grid: grid.length ? grid : undefined },
      state.settings,
      groupTarget(first.length),
    ),
    groupingSchema,
  )
  for (const g of grouped.groups) {
    const title = allowedTitle(g.title)
    if (!title) continue
    for (const id of g.items) {
      if (known.has(id) && !assigned.has(id)) assigned.set(id, title)
    }
  }
  s.done = assigned.size
  await emit()

  // Lots suivants et oubliés : rangés dans les groupes existants (ou de nouveaux en mode libre).
  for (let round = 0; round < 2; round++) {
    const left = items.filter((i) => !assigned.has(i.id))
    if (!left.length) break
    for (let i = 0; i < left.length; i += ASSIGN_BATCH) {
      const batch = left.slice(i, i + ASSIGN_BATCH)
      const res = await runner.json(
        assignPrompt(
          { groups: [...titles], items: batch.map((b) => ({ id: b.id, label: b.label })), allowNew: !grid.length },
          state.settings,
        ),
        assignSchema,
      )
      for (const a of res.assignments) {
        const title = allowedTitle(a.group) ?? (grid.length ? addTitle(OUTSIDE) : null)
        if (title && known.has(a.item) && !assigned.has(a.item)) assigned.set(a.item, title)
      }
      s.done = assigned.size
      await emit()
    }
  }
  // Filet de sécurité : rien ne se perd, même si le modèle oublie encore des idées.
  const fallback = grid.length ? OUTSIDE : 'Autres sujets'
  for (const i of items) if (!assigned.has(i.id)) assigned.set(i.id, addTitle(fallback))

  const ideaById = new Map(state.ideas.map((i) => [i.id, i]))
  const groups: Omit<Group, 'id'>[] = titles
    .map((title) => {
      const ideaIds = items.filter((i) => assigned.get(i.id) === title).flatMap((i) => i.ideaIds)
      const ideas = ideaIds.map((id) => ideaById.get(id)!)
      return { title, ideaIds: ideaIds.sort(), summary: '', metrics: computeMetrics(ideas) }
    })
    .filter((g) => g.ideaIds.length > 0)
    .sort((a, b) => b.metrics.participants - a.metrics.participants || b.metrics.mentions - a.metrics.mentions || a.title.localeCompare(b.title))

  state.groups = groups.map((g, i) => ({ ...g, id: `G${i + 1}` }))
  s.done = items.length
  s.state = 'done'
  await emit()
}

// ─── Étape 3 ─────────────────────────────────────────────────────────────────

const pct = (x: number) => `${Math.round(x * 100)} %`

/**
 * Les chiffres d'un groupe, en une phrase lisible. Ce texte est affiché dans le
 * rapport ET recopié par le modèle dans ses synthèses : sa langue compte autant
 * que celle du modèle (un défaut ici se répète dans tout le rapport).
 */
export function describeMetrics(m: Metrics, lang: 'fr' | 'en' = 'fr'): string {
  const pos = m.positiveOnly.length
  const neg = m.negativeOnly.length
  const mix = m.mixed.length
  const polarised = pos + neg + mix
  const top = Math.max(pos, neg)
  // Un pourcentage n'a de sens qu'à partir d'une dizaine de participants.
  const share = (n: number, of: number, sep: string) => `${n} ${sep} ${of}${of >= 10 ? ` (${pct(n / of)})` : ''}`

  if (lang === 'en') {
    const n = (k: number, one: string, many = `${one}s`) => `${k} ${k > 1 ? many : one}`
    const parts = [`${n(m.participants, 'person', 'people')} (${n(m.mentions, 'idea')})`]
    const opinions = [pos && `${pos} positive`, neg && `${neg} negative`, mix && `${mix} mixed`].filter(Boolean)
    if (opinions.length) parts.push(`opinions: ${opinions.join(', ')}`)
    if (m.participantsByCategory.suggestion) parts.push(`${n(m.participantsByCategory.suggestion, 'person', 'people')} made suggestions`)
    if (m.participantsByCategory.neutral) parts.push(`neutral remarks from ${n(m.participantsByCategory.neutral, 'person', 'people')}`)
    if (m.stance === 'thin') parts.push('few opinions')
    else if (m.stance === 'consensus') parts.push(`${m.majority} consensus: ${share(top, polarised, 'out of')}`)
    else if (m.stance === 'divided') parts.push('divided opinions')
    if (m.minority) parts.push(`consistent ${m.minority.side} minority: ${n(m.minority.participantIds.length, 'person', 'people')}`)
    return parts.join('; ')
  }

  const n = (k: number, one: string, many = `${one}s`) => `${k} ${k > 1 ? many : one}`
  const parts = [`${n(m.participants, 'participant')} (${n(m.mentions, 'idée')})`]
  // « avis » est masculin : 3 positifs, 1 négatif.
  const opinions = [pos && n(pos, 'positif'), neg && n(neg, 'négatif'), mix && n(mix, 'mitigé')].filter(Boolean)
  if (opinions.length) parts.push(`avis : ${opinions.join(', ')}`)
  const sug = m.participantsByCategory.suggestion
  if (sug) parts.push(`${n(sug, 'participant')} ${sug > 1 ? 'font' : 'fait'} des suggestions`)
  const neu = m.participantsByCategory.neutral
  if (neu) parts.push(`${n(neu, 'participant')} ${neu > 1 ? 'font des constats neutres' : 'fait un constat neutre'}`)
  if (m.stance === 'thin') parts.push("peu d'avis")
  else if (m.stance === 'consensus') parts.push(`consensus ${m.majority === 'positive' ? 'positif' : 'négatif'} : ${share(top, polarised, 'sur')}`)
  else if (m.stance === 'divided') parts.push('avis partagés')
  if (m.minority)
    parts.push(`minorité constante ${m.minority.side === 'positive' ? 'positive' : 'négative'} : ${n(m.minority.participantIds.length, 'participant')}`)
  return parts.join(' ; ')
}

/** Ne garde que les références [I…] qui appartiennent bien au périmètre. */
export function sanitizeCitations(text: string, allowed: Set<string>): string {
  return text
    .replace(/(\s*)\[([^\]]*)\]/g, (whole, space: string, inner: string) => {
      const ids = inner.split(/[\s,;]+/).filter(Boolean)
      if (!ids.length || !ids.every((id) => /^I\d{4,}$/.test(id))) return whole
      const kept = ids.filter((id) => allowed.has(id))
      // Une référence retirée emporte l'espace qui la précède : la ponctuation reste intacte.
      return kept.length ? `${space}[${kept.join(', ')}]` : ''
    })
    .replace(/ {2,}/g, ' ')
    .trim()
}

async function summarizeGroups(corpus: Corpus, state: AnalysisState, runner: LlmRunner, emit: () => Promise<void>) {
  const s = state.steps.find((x) => x.id === 'summarize')!
  s.state = 'running'
  s.total = state.groups.length
  s.done = 0
  await emit()
  const labelOf = new Map(corpus.participants.map((p) => [p.id, p.id]))
  const ideaById = new Map(state.ideas.map((i) => [i.id, i]))

  const inputs: SummaryGroupInput[] = state.groups.map((g) => ({
    id: g.id,
    title: g.title,
    facts: describeMetrics(g.metrics, state.settings.language),
    ideas: g.ideaIds.map((id) => {
      const idea = ideaById.get(id)!
      return { id, participant: labelOf.get(idea.participantId) ?? idea.participantId, category: idea.category, verbatim: idea.verbatim }
    }),
  }))

  // Lots de groupes de taille raisonnable.
  const batches: SummaryGroupInput[][] = []
  let cur: SummaryGroupInput[] = []
  let size = 0
  for (const g of inputs) {
    if (cur.length && size + g.ideas.length > SUMMARY_BATCH_IDEAS) {
      batches.push(cur)
      cur = []
      size = 0
    }
    cur.push(g)
    size += g.ideas.length
  }
  if (cur.length) batches.push(cur)

  const summaries = new Map<string, string>()
  const apply = () => {
    for (const g of state.groups) {
      const raw = summaries.get(g.id)
      if (raw !== undefined) g.summary = sanitizeCitations(raw, new Set(g.ideaIds))
    }
    s.done = summaries.size
  }
  // Les lots partent en parallèle : le débit reste borné par le fournisseur.
  await Promise.all(
    batches.map(async (batch) => {
      let missing = batch
      for (let attempt = 0; attempt < 2 && missing.length; attempt++) {
        const res = await runner.json(groupSummaryPrompt({ groups: missing }, state.settings), groupSummarySchema)
        for (const r of res.groups) {
          if (missing.some((m) => m.id === r.id) && r.summary.trim()) summaries.set(r.id, r.summary)
        }
        missing = missing.filter((m) => !summaries.has(m.id))
      }
      apply()
      await emit()
    }),
  )
  apply()
  s.state = 'done'
  await emit()
}

// ─── Étape 4 ─────────────────────────────────────────────────────────────────

export function themeTarget(groupCount: number): { min: number; max: number } {
  const min = Math.max(3, Math.min(8, Math.round(groupCount / 6)))
  return { min, max: Math.max(min + 1, Math.min(10, Math.round(groupCount / 3))) }
}

async function buildThemes(state: AnalysisState, runner: LlmRunner, emit: () => Promise<void>) {
  const s = state.steps.find((x) => x.id === 'themes')!
  if (state.groups.length <= THEME_LEVEL_FROM) {
    state.themes = []
    s.state = 'done'
    s.message = 'Peu de groupes : pas de niveau de thèmes.'
    await emit()
    return
  }
  s.state = 'running'
  s.total = state.groups.length
  await emit()

  const res = await runner.json(
    themePrompt(
      {
        groups: state.groups.map((g) => ({ id: g.id, title: g.title, participants: g.metrics.participants, summary: g.summary })),
      },
      state.settings,
      themeTarget(state.groups.length),
    ),
    themeSchema,
  )
  const groupIds = new Set(state.groups.map((g) => g.id))
  const taken = new Set<string>()
  const themes: Omit<Theme, 'id' | 'metrics'>[] = []
  for (const t of res.themes) {
    const own = t.groups.filter((id) => groupIds.has(id) && !taken.has(id))
    own.forEach((id) => taken.add(id))
    if (own.length) themes.push({ title: t.title.trim(), groupIds: own, summary: t.summary })
  }
  const orphans = state.groups.filter((g) => !taken.has(g.id)).map((g) => g.id)
  if (orphans.length) themes.push({ title: state.settings.language === 'en' ? 'Other topics' : 'Autres sujets', groupIds: orphans, summary: '' })

  const groupById = new Map(state.groups.map((g) => [g.id, g]))
  const ideaById = new Map(state.ideas.map((i) => [i.id, i]))
  state.themes = themes
    .map((t) => {
      const ideaIds = t.groupIds.flatMap((id) => groupById.get(id)!.ideaIds)
      const sortedGroups = [...t.groupIds].sort(
        (a, b) => groupById.get(b)!.metrics.participants - groupById.get(a)!.metrics.participants,
      )
      return {
        ...t,
        groupIds: sortedGroups,
        summary: sanitizeCitations(t.summary, new Set(ideaIds)),
        metrics: computeMetrics(ideaIds.map((id) => ideaById.get(id)!)),
      }
    })
    .sort((a, b) => b.metrics.participants - a.metrics.participants || b.metrics.mentions - a.metrics.mentions)
    .map((t, i) => ({ ...t, id: `T${i + 1}` }))
  s.done = state.groups.length
  s.state = 'done'
  await emit()
}

// ─── Étape 5 ─────────────────────────────────────────────────────────────────

async function writeGlobalSummary(corpus: Corpus, state: AnalysisState, runner: LlmRunner) {
  const all = computeMetrics(state.ideas)
  const respondents = activeParticipants(corpus).length
  const lang = state.settings.language
  const facts =
    lang === 'en'
      ? `${state.ideas.length} ideas from ${all.participants} people (out of ${respondents} who answered), ${state.themes.length || state.groups.length} topics.`
      : `${state.ideas.length} idées exprimées par ${all.participants} participants (sur ${respondents} ayant répondu), ${state.themes.length || state.groups.length} sujets.`
  const sections = (state.themes.length ? state.themes : state.groups.slice(0, 15)).map((x) => ({
    title: x.title,
    facts: describeMetrics(x.metrics, lang),
    summary: x.summary,
  }))
  if (!sections.length) {
    state.globalSummary = ''
    return
  }
  const res = await runner.json(globalPrompt({ facts, sections }, state.settings), globalSchema)
  state.globalSummary = sanitizeCitations(res.summary, new Set(state.ideas.map((i) => i.id)))
}

// ─── Étape 6 : relecture de la langue ────────────────────────────────────────

const citationsOf = (t: string) => (t.match(/I\d{4,}/g) ?? []).sort().join(',')

/**
 * Une réécriture n'est acceptée que si elle garde exactement les mêmes citations
 * et les mêmes chiffres, avec une longueur comparable. Sinon on garde l'original :
 * la relecture peut améliorer la langue, jamais altérer ce qui est démontré.
 */
export function acceptRewrite(original: string, rewrite: string): boolean {
  const r = rewrite.trim()
  if (!r) return false
  if (citationsOf(original) !== citationsOf(r)) return false
  if (!sameNumbers(original, r)) return false
  const ratio = r.length / Math.max(1, original.length)
  return ratio > 0.6 && ratio < 1.5
}

async function polishTexts(state: AnalysisState, runner: LlmRunner, emit: () => Promise<void>) {
  const s = state.steps.find((x) => x.id === 'polish')!
  // Les cibles : synthèses de groupes, de thèmes, résumé global.
  const targets: { id: string; get: () => string; set: (t: string) => void }[] = []
  state.groups.forEach((g) => g.summary && targets.push({ id: `G:${g.id}`, get: () => g.summary, set: (t) => (g.summary = t) }))
  state.themes.forEach((t) => t.summary && targets.push({ id: `T:${t.id}`, get: () => t.summary, set: (x) => (t.summary = x) }))
  if (state.globalSummary) targets.push({ id: 'R', get: () => state.globalSummary, set: (t) => (state.globalSummary = t) })

  if (!state.settings.polish || !targets.length) {
    s.state = 'done'
    s.message = state.settings.polish ? undefined : 'Relecture désactivée.'
    await emit()
    return
  }
  s.state = 'running'
  s.total = targets.length
  s.done = 0
  await emit()

  const stats = { checked: 0, changed: 0, refused: 0 }
  const batches: (typeof targets)[] = []
  for (let i = 0; i < targets.length; i += POLISH_BATCH) batches.push(targets.slice(i, i + POLISH_BATCH))
  await Promise.all(
    batches.map(async (batch) => {
      const res = await runner.json(polishPrompt({ texts: batch.map((t) => ({ id: t.id, text: t.get() })) }, state.settings), polishSchema)
      const out = new Map(res.texts.map((t) => [t.id, t.text]))
      for (const t of batch) {
        stats.checked++
        const original = t.get()
        const rewrite = out.get(t.id)
        if (rewrite === undefined || rewrite.trim() === original.trim()) continue
        if (acceptRewrite(original, rewrite)) {
          t.set(rewrite.trim())
          stats.changed++
        } else stats.refused++
      }
      s.done += batch.length
      state.polish = { ...stats }
      await emit()
    }),
  )
  state.polish = stats
  s.state = 'done'
  await emit()
}

// ─── Contrôle final des chiffres ─────────────────────────────────────────────

function verifyNumbers(corpus: Corpus, state: AnalysisState) {
  const ideaById = new Map(state.ideas.map((i) => [i.id, i]))
  const groupById = new Map(state.groups.map((g) => [g.id, g]))
  const quotes = (ids: string[]) => ids.map((id) => ideaById.get(id)!.verbatim)
  // « Trois personnes jugent l'application lente [I3, I15, I30] » : le nombre de personnes
  // derrière les références citées se vérifie aussi.
  const check = (text: string, allowed: Set<number>) => {
    const people = (part: string) => new Set((part.match(/I\d{4,}/g) ?? []).map((id) => ideaById.get(id)?.participantId).filter(Boolean)).size
    // Par référence et par phrase (« Deux personnes pointent X [I1] et Y [I2]. »).
    const counts = [...[...text.matchAll(/\[[^\]]*\]/g)].map((m) => people(m[0])), ...text.split(/(?<=[.!?])\s+/).map(people)]
    for (const n of counts) if (n > 0) allowed.add(n)
    return unverifiedNumbers(text, allowed)
  }
  for (const g of state.groups) g.unverified = check(g.summary, allowedNumbers([g.metrics], quotes(g.ideaIds)))
  for (const t of state.themes) {
    const groups = t.groupIds.map((id) => groupById.get(id)!)
    const allowed = allowedNumbers([t.metrics, ...groups.map((g) => g.metrics)], quotes(groups.flatMap((g) => g.ideaIds)))
    allowed.add(groups.length) // « ce thème réunit 7 sujets »
    t.unverified = check(t.summary, allowed)
  }
  const all = computeMetrics(state.ideas)
  const allowed = allowedNumbers([all, ...state.themes.map((t) => t.metrics), ...state.groups.map((g) => g.metrics)], quotes(state.ideas.map((i) => i.id)))
  allowed.add(activeParticipants(corpus).length)
  allowed.add(state.ideas.length)
  allowed.add(state.themes.length)
  allowed.add(state.groups.length)
  state.globalUnverified = check(state.globalSummary, allowed)
}

export { sortIds }
