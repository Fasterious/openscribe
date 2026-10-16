import type { Contribution, Corpus } from '../corpus'
import { activeParticipants, contributionsOf } from '../corpus'
import { randomId, sha256, stableStringify } from '../ids'
import { ProviderError, type LlmProvider } from '../providers/types'
import { computeMetrics, sortIds } from './metrics'
import { uncoveredWithContext } from './coverage'
import { highlightLine, highlights } from './highlights'
import { verifiedNames } from './names'
import {
  assignPrompt,
  assignSchema,
  consolidationPrompt,
  consolidationSchema,
  attachPrompt,
  attachSchema,
  splitPrompt,
  splitSchema,
  coveragePrompt,
  coverageSchema,
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
  reviewPrompt,
  unanimityPrompt,
  type UnanimityInput,
  reviewSchema,
  supportPrompt,
  supportSchema,
  type ExtractionOutput,
  type SummaryGroupInput,
} from './prompts'
import { LlmRunner, type ResponseCache } from './runner'
import { DEFAULT_SETTINGS, IDEA_CATEGORIES } from './types'
import {
  allClaims,
  allowedNumbers,
  clauseCounts,
  countSpan,
  impliedOthers,
  numbersIn,
  overcountedPeople,
  sameNumbers,
  undercitedPeople,
  unverifiedNumbers,
  vaguePlurals,
} from './numbers'
import type { AnalysisSettings, AnalysisState, Group, GroupDefinition, Idea, IdeaCategory, Merge, Metrics, RejectedIdea, StepId, Theme } from './types'
import { methodOf, OFF_TOPIC } from './methods'
import { explainMiss, locateQuote, quoteText, withAntecedent } from './verbatim'

/** Au-delà, le regroupement se fait par lots : un premier lot fonde les groupes, les suivants s'y rangent. */
export const GROUPING_BATCH = 350
export const ASSIGN_BATCH = 200
/** Idées relues par appel lors de la relecture des motifs. */
export const REVIEW_BATCH_IDEAS = 140
/** Idées fournies par appel pour vérifier les renvois. */
export const SUPPORT_BATCH_IDEAS = 220
/** Nombre maximal d'idées envoyées dans une même demande de synthèse. */
export const SUMMARY_BATCH_IDEAS = 90
function batchSizes(settings: AnalysisSettings) {
  return methodOf(settings).batches
}

/** Un premier regroupement est dégénéré quand il rend bien moins de groupes que la cible pour une longue liste. */
export function degenerateGrouping(groups: number, items: number, targetMin: number): boolean {
  return items >= 30 && groups < Math.max(3, Math.floor(targetMin / 2))
}

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
  return sha256(stableStringify(corpus.contributions.map((c) => ({ id: c.id, p: c.participantId, q: c.prompt ?? '', t: c.text }))))
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
  // Une reprise efface l'erreur de l'étape qui avait échoué : elle est retentée.
  for (const st of state.steps)
    if (st.state === 'error') {
      st.state = 'pending'
      st.message = undefined
    }
  let current: StepId = 'extract'
  try {
    current = 'extract'
    await extractAll(corpus, state, runner, options, emit)
    current = 'group'
    await groupIdeas(corpus, state, runner, emit)
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
    markUnverified(corpus, state)
    await checkSupport(state, runner, emit)
    verifyNumbers(corpus, state)
    ensureCamps(state)
    // La phrase du code sur les sujets qui divisent, avec leurs chiffres et un renvoi par camp.
    state.globalSummary = withDivided(
      state.globalSummary ?? '',
      state.groups,
      state.settings.language,
      false,
      new Map(state.ideas.map((i) => [i.id, i])),
      methodOf(state.settings).compactDivided === true,
    )
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
  /** Particuliers nommés, vérifiés dans les textes de la personne. */
  names: string[]
}

async function extractAll(corpus: Corpus, state: AnalysisState, runner: LlmRunner, options: PipelineOptions, emit: () => Promise<void>) {
  const s = state.steps.find((x) => x.id === 'extract')!
  const people = activeParticipants(corpus)
  const done = new Set(state.extractedParticipants)
  const pending = people.filter((p) => !done.has(p.id))
  s.state = 'running'
  s.total = people.length
  s.done = people.length - pending.length
  await emit()

  const concurrency = Math.max(1, options.concurrency ?? 2)
  const perRequest = Math.max(1, methodOf(state.settings).batches.extract ?? 1)
  const textsOf = (id: string) => contributionsOf(corpus, id).filter((c) => c.text.trim())
  for (let i = 0; i < pending.length; i += concurrency * perRequest) {
    const groups: (typeof pending)[] = []
    for (let j = i; j < Math.min(pending.length, i + concurrency * perRequest); j += perRequest) groups.push(pending.slice(j, j + perRequest))
    const results = (
      await Promise.all(
        groups.map((g) =>
          g.length === 1
            ? extractParticipant(textsOf(g[0].id), g[0].id, state.settings, runner).then((r) => [r])
            : extractTogether(
                g.map((p) => ({ participantId: p.id, contributions: textsOf(p.id) })),
                state.settings,
                runner,
              ),
        ),
      )
    ).flat()
    // On enregistre dans l'ordre du corpus : les identifiants restent stables quelle que soit la vitesse des réponses.
    for (const r of results) {
      for (const idea of r.ideas) {
        state.ideas.push({ ...idea, id: `I${String(state.ideas.length + 1).padStart(4, '0')}` })
      }
      state.rejected.push(...r.rejected)
      if (r.names.length) state.names = [...new Set([...(state.names ?? []), ...r.names])].sort((a, b) => b.length - a.length || a.localeCompare(b))
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

/**
 * Plusieurs personnes découpées dans une même demande (méthode à lots) : les références sont
 * propres à chaque personne (P1-C1…), la réponse est répartie par personne, puis chaque personne
 * passe par les mêmes contrôles qu'une demande seule (citations, couverture, doublons).
 */
async function extractTogether(
  people: { participantId: string; contributions: Contribution[] }[],
  settings: AnalysisSettings,
  runner: LlmRunner,
): Promise<ParticipantResult[]> {
  const tag = (k: number) => `P${k + 1}`
  const out: ExtractionOutput = await runner.json(
    extractionPrompt(
      {
        contributions: people.flatMap((p, k) =>
          p.contributions.map((c, i) => ({ ref: `${tag(k)}-C${i + 1}`, person: tag(k), question: c.prompt, text: c.text })),
        ),
      },
      settings,
    ),
    extractionSchema,
  )
  return Promise.all(
    people.map((p, k) => {
      const prefix = `${tag(k)}-`
      const ideas = out.ideas.filter((x) => x.ref.startsWith(prefix)).map((x) => ({ ...x, ref: x.ref.slice(prefix.length) }))
      // Les noms sont vérifiés dans les textes de chaque personne : un nom absent de ses textes est écarté.
      return extractParticipant(p.contributions, p.participantId, settings, runner, { ideas, names: out.names ?? [] })
    }),
  )
}

export async function extractParticipant(
  contributions: Contribution[],
  participantId: string,
  settings: AnalysisSettings,
  runner: LlmRunner,
  /** Réponse déjà obtenue dans une demande à plusieurs personnes. */
  given?: ExtractionOutput,
): Promise<ParticipantResult> {
  const refs = contributions.map((c, i) => ({ ref: `C${i + 1}`, c }))
  const byRef = new Map(refs.map((r) => [r.ref, r.c]))
  const out: ExtractionOutput =
    given ??
    (await runner.json(
      extractionPrompt({ contributions: refs.map((r) => ({ ref: r.ref, question: r.c.prompt, text: r.c.text })) }, settings),
      extractionSchema,
    ))

  const ideas: Omit<Idea, 'id'>[] = []
  const misses: { ref: string; label: string; verbatim: string; category: IdeaCategory }[] = []
  const seen = new Set<string>()

  const accept = (ref: string, label: string, verbatim: string, category: IdeaCategory): boolean => {
    // On cherche d'abord dans la contribution indiquée, puis dans les autres
    // textes de la même personne (le modèle se trompe parfois de référence).
    const ordered = [byRef.get(ref), ...contributions].filter((c): c is Contribution => Boolean(c))
    for (const c of ordered) {
      const found = locateQuote(c.text, verbatim, { typos: methodOf(settings).typoTolerantQuotes })
      if (!found) continue
      // Une citation qui commence par une reprise (« Malgré cela… ») emporte la phrase d'avant.
      const m = withAntecedent(
        c.text,
        found,
        260,
        ideas.filter((i) => i.contributionId === c.id).flatMap((i) => i.parts ?? [i.span]),
      )
      const key = `${c.id}:${m.start}:${m.end}:${category}`
      if (seen.has(key)) return true
      seen.add(key)
      ideas.push({
        participantId,
        contributionId: c.id,
        label: label.trim(),
        verbatim: quoteText(c.text, m),
        category,
        span: { start: m.start, end: m.end },
        ...(m.parts ? { parts: m.parts } : {}),
        approximate: m.approximate,
      })
      return true
    }
    return false
  }

  for (const item of out.ideas) {
    if (!accept(item.ref, item.label, item.verbatim, item.category)) misses.push(item)
  }

  // Couverture : les passages assez longs qu'aucune idée ne couvre sont relus une fois.
  const passages = refs.flatMap((r) =>
    uncoveredWithContext(
      r.c.text,
      ideas.filter((i) => i.contributionId === r.c.id).flatMap((i) => i.parts ?? [i.span]),
    ).map((p) => ({ ref: r.ref, question: r.c.prompt, ...p })),
  )
  if (passages.length) {
    const more = await runner.json(coveragePrompt({ passages }, settings), coverageSchema)
    for (const item of more.ideas) {
      if (!accept(item.ref, item.label, item.verbatim, item.category)) misses.push(item)
    }
  }

  const rejected: RejectedIdea[] = []
  if (misses.length) {
    const fixed = await runner.json(fixPrompt({ contributions: refs.map((r) => ({ ref: r.ref, text: r.c.text })), attempts: misses }, settings), fixSchema)
    misses.forEach((miss, i) => {
      const f = fixed.ideas[i]
      if (f && f.verbatim.trim() && accept(f.ref, f.label || miss.label, f.verbatim, f.category)) return
      const source = byRef.get(miss.ref)?.text ?? contributions.map((c) => c.text).join('\n')
      rejected.push({ participantId, label: miss.label, verbatim: miss.verbatim, reason: explainMiss(source, miss.verbatim) })
    })
  }

  // Deux idées d'une même personne qui se recouvrent dans le même texte (l'une contenue dans l'autre, ou plus de la moitié de la plus
  // courte en commun) disent la même chose : la garder deux fois fabriquerait un faux « mitigé ». On garde la plus longue.
  // Une citation coupée par « […] » ne couvre que ses fragments, pas le passage sauté.
  const segs = (i: Omit<Idea, 'id'>) => i.parts ?? [i.span]
  const len = (i: Omit<Idea, 'id'>) => segs(i).reduce((n, p) => n + p.end - p.start, 0)
  const overlap = (a: Omit<Idea, 'id'>, b: Omit<Idea, 'id'>) =>
    a.contributionId !== b.contributionId
      ? 0
      : segs(a).reduce((n, p) => n + segs(b).reduce((m, q) => m + Math.max(0, Math.min(p.end, q.end) - Math.max(p.start, q.start)), 0), 0)
  const dropped = new Set<Omit<Idea, 'id'>>()
  // Méthode qui le demande : un éloge et une critique qui se recouvrent (« X va bien, sauf Y » cité en entier pour la critique de Y)
  // sont deux avis, pas un doublon. Les retirer faisait disparaître l'éloge des comptes : sur l'école (passe 7), 24 des 188 éloges
  // rendus par le moteur, tous sur les motifs du résumé.
  const keepOpposed = methodOf(settings).keepOpposedOverlaps === true
  const polar = (c: IdeaCategory) => c === 'positive' || c === 'negative'
  const bySize = [...ideas].sort((a, b) => len(b) - len(a) || ideas.indexOf(a) - ideas.indexOf(b))
  for (const [k, a] of bySize.entries()) {
    if (dropped.has(a)) continue
    for (const b of bySize.slice(k + 1)) {
      // Une même citation pour deux objets d'une énumération (« le programme et l'équipe », même ton, libellés différents) : deux idées légitimes.
      const enumeration = a.category === b.category && a.span.start === b.span.start && a.span.end === b.span.end && normLabel(a.label) !== normLabel(b.label)
      // Sauf deux citations presque identiques (la courte couvre 80 % de la longue) : un même objet codé deux fois en sens contraire.
      const opposite = keepOpposed && polar(a.category) && polar(b.category) && a.category !== b.category && overlap(a, b) < 0.8 * len(a)
      if (!dropped.has(b) && !enumeration && !opposite && overlap(a, b) >= 0.5 * len(b)) dropped.add(b)
    }
  }
  const kept = ideas.filter((i) => !dropped.has(i))
  ideas.splice(0, ideas.length, ...kept)

  // Ordre de lecture : par contribution, puis par position dans le texte.
  const order = new Map(contributions.map((c, i) => [c.id, i]))
  ideas.sort((a, b) => order.get(a.contributionId)! - order.get(b.contributionId)! || a.span.start - b.span.start)
  const names = verifiedNames(
    out.names ?? [],
    contributions.map((c) => c.text),
  )
  return { participantId, ideas, rejected, names }
}

// ─── Étape 2 ─────────────────────────────────────────────────────────────────

function normLabel(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.!?;:]+$/, '')
}

/**
 * Nombre de groupes visé pour n idées venues de p participants : environ
 * min(1,5 × √n ; 1,2 × p), validé par le `methodologue` sur un corpus réel.
 * La racine seule grossit avec la prolixité de quelques personnes ; le nombre
 * de participants borne ce qu'un motif peut réunir. La cible n'est qu'une
 * indication donnée au modèle ; ce qui compte est la porte de qualité calculée
 * par le code (`needsConsolidation`).
 */
export function groupTarget(n: number, participants = Infinity): { min: number; max: number } {
  // Plus le corpus grossit, plus les motifs se répètent : le nombre de groupes croît moins vite que les idées.
  const t = Math.min(1.5 * Math.sqrt(n), 1.2 * participants)
  return { min: Math.max(3, Math.round(0.75 * t)), max: Math.max(6, Math.min(60, Math.round(1.25 * t))) }
}

/** Un titre qui porte un jugement plutôt qu'un objet (« Bilan positif », « Points forts ») : le motif est défini par son ton. */
const JUDGMENT_TITLE =
  /\b(positi\w*|négati\w*|bilan|points? forts?|points? faibles?|réussites?|critiques?|satisfactions?|reproches?|positive|negative|strengths?|weakness\w*)\b/iu

/** Un motif dont toutes les idées ont le même ton et dont le titre est un jugement ne pouvait donner que 100 % : faux consensus. */
export function isToneDefined(title: string, categories: string[]): boolean {
  return categories.length >= 3 && new Set(categories).size === 1 && JUDGMENT_TITLE.test(title)
}

/**
 * Porte de qualité du regroupement : trop de motifs portés par une seule
 * personne (plus de 15 %), ou une médiane sous 3 personnes par motif, signale
 * un émiettement. La passe de consolidation se déclenche alors.
 */
export function needsConsolidation(participantsPerGroup: number[], respondents = Infinity): boolean {
  const n = participantsPerGroup.length
  if (n < 8) return false
  const single = participantsPerGroup.filter((p) => p <= 1).length
  const sorted = [...participantsPerGroup].sort((a, b) => a - b)
  const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2
  // Médiane visée : 4 participants par motif, ou moins sur un très petit corpus.
  return single / n > 0.15 || median < Math.min(4, Math.max(2, Math.round(respondents / 5)))
}

/** Un verbatim d'exemple, court : assez pour juger le sens, sans alourdir la demande. */
function shortExample(text: string, max = 140): string {
  const t = text.replace(/\s+/g, ' ').trim()
  return t.length <= max ? t : `${t.slice(0, max - 1).replace(/\s+\S*$/, '')}…`
}

/** La question, sans pictogramme ni ponctuation de tête, et courte. */
export function shortPrompt(prompt: string | undefined, max = 70): string | undefined {
  if (!prompt) return undefined
  const t = prompt
    .replace(/^[^\p{L}\p{N}]+/u, '')
    .replace(/\s+/g, ' ')
    .trim()
  return t.length <= max ? t : `${t.slice(0, max - 1).replace(/\s+\S*$/, '')}…`
}

async function groupIdeas(corpus: Corpus, state: AnalysisState, runner: LlmRunner, emit: () => Promise<void>) {
  const s = state.steps.find((x) => x.id === 'group')!
  // Un regroupement relancé repart des catégories de l'extraction : le ton jugé par motif ne vaut que pour ces motifs-là.
  const original = new Map(state.ideas.map((i) => [i.id, i]))
  for (const r of state.retoned ?? []) {
    const idea = original.get(r.id)
    if (idea) idea.category = r.from
  }
  state.retoned = []
  state.moved = []
  state.offTopic = []
  s.state = 'running'
  s.done = 0
  await emit()

  // Les libellés identiques sont envoyés une seule fois, avec leur nombre de mentions.
  const contributionById = new Map(corpus.contributions.map((c) => [c.id, c]))
  const items: { id: string; label: string; ideaIds: string[]; example: string; question?: string }[] = []
  // Méthode « en contexte » : jusqu'à quatre verbatims par libellé, avec leur ton.
  const withContext = methodOf(state.settings).groupingContext === true
  const ideaOf = new Map(state.ideas.map((i) => [i.id, i]))
  const examplesOf = (it: { ideaIds: string[] }) =>
    withContext ? it.ideaIds.slice(0, 4).map((id) => ({ text: shortExample(ideaOf.get(id)!.verbatim, 160), tone: ideaOf.get(id)!.category })) : undefined
  const byLabel = new Map<string, (typeof items)[number]>()
  for (const idea of state.ideas) {
    const k = normLabel(idea.label)
    let item = byLabel.get(k)
    if (!item) {
      item = {
        id: `L${items.length + 1}`,
        label: idea.label.trim(),
        ideaIds: [],
        example: shortExample(idea.verbatim),
        question: shortPrompt(contributionById.get(idea.contributionId)?.prompt),
      }
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
  // Méthode qui le prévoit : une case pour les idées sans rapport avec la question, connue dès le premier rangement.
  const offTopic = !grid.length && methodOf(state.settings).offTopic === true
  if (offTopic) addTitle(OFF_TOPIC)

  // Titres écartés parce qu'ils définissaient un motif par son ton : le modèle ne peut pas y revenir.
  const banned = new Set<string>()
  const allowedTitle = (t: string): string | null => {
    if (!grid.length) return banned.has(titleKey(t)) ? null : addTitle(t)
    const k = titleKey(t)
    if (canonical.has(k)) return canonical.get(k)!
    if (k === titleKey(OUTSIDE)) return addTitle(OUTSIDE)
    return null
  }

  // Premier lot : fonde les groupes.
  const first = items.slice(0, batchSizes(state.settings).grouping)
  const target = groupTarget(
    first.reduce((n, i) => n + i.ideaIds.length, 0),
    new Set(state.ideas.map((i) => i.participantId)).size,
  )
  const firstSpec = groupingPrompt(
    {
      items: first.map((i) => ({
        id: i.id,
        label: i.label,
        count: i.ideaIds.length,
        ...(withContext ? { examples: examplesOf(i) } : { example: i.example }),
        question: i.question,
      })),
      grid: grid.length ? grid : undefined,
    },
    state.settings,
    target,
  )
  let grouped = await runner.json(firstSpec, groupingSchema)
  // Regroupement dégénéré (un modèle léger met tout dans un ou deux groupes) : le code le voit et redemande une fois.
  if (!grid.length && degenerateGrouping(grouped.groups.length, first.length, target.min)) {
    grouped = await runner.json(
      {
        ...firstSpec,
        user: `${firstSpec.user}\n\nATTENTION : ta réponse précédente ne formait que ${grouped.groups.length} groupe(s) pour ${first.length} idées. Un groupe = UN objet ; on attend entre ${target.min} et ${target.max} groupes. Recommence.`,
      },
      groupingSchema,
    )
  }
  for (const g of grouped.groups) {
    const title = allowedTitle(g.title)
    if (!title) continue
    for (const id of g.items) {
      if (known.has(id) && !assigned.has(id)) assigned.set(id, title)
    }
  }
  s.done = assigned.size
  await emit()

  // Un motif défini par son ton (« Bilan positif ») ne pouvait donner que 100 % : ses idées sont rangées à nouveau selon leur objet.
  if (!grid.length) {
    const ideaCat = new Map(state.ideas.map((i) => [i.id, i.category]))
    for (const title of [...titles]) {
      if (offTopic && title === OFF_TOPIC) continue
      const its = items.filter((i) => assigned.get(i.id) === title)
      if (
        !isToneDefined(
          title,
          its.flatMap((i) => i.ideaIds.map((id) => ideaCat.get(id)!)),
        )
      )
        continue
      banned.add(titleKey(title))
      titles.splice(titles.indexOf(title), 1)
      its.forEach((i) => assigned.delete(i.id))
    }
  }

  // Lots suivants et oubliés : rangés dans les groupes existants (ou de nouveaux en mode libre).
  for (let round = 0; round < 2; round++) {
    const left = items.filter((i) => !assigned.has(i.id))
    if (!left.length) break
    for (let i = 0; i < left.length; i += batchSizes(state.settings).assign) {
      const batch = left.slice(i, i + batchSizes(state.settings).assign)
      const assignSpec = assignPrompt(
        {
          groups: [...titles],
          items: batch.map((b) => ({ id: b.id, label: b.label, ...(withContext ? { examples: examplesOf(b) } : { example: b.example }) })),
          allowNew: !grid.length,
        },
        state.settings,
      )
      let res = await runner.json(assignSpec, assignSchema)
      // Tout un lot rangé dans un seul groupe alors qu'il en existe plusieurs : redemandé une fois.
      if (!grid.length && titles.length >= 4 && batch.length >= 20 && new Set(res.assignments.map((a) => a.group)).size === 1) {
        res = await runner.json(
          {
            ...assignSpec,
            user: `${assignSpec.user}\n\nATTENTION : ta réponse précédente rangeait les ${batch.length} idées dans un seul groupe. Range chacune selon son objet ; crée un groupe si aucun ne convient.`,
          },
          assignSchema,
        )
      }
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
  const build = (list: { title: string; ideaIds: string[] }[]): Group[] =>
    list
      .map((g) => ({ title: g.title, ideaIds: [...g.ideaIds].sort(), summary: '', metrics: computeMetrics(g.ideaIds.map((id) => ideaById.get(id)!)) }))
      .filter((g) => g.ideaIds.length > 0)
      .sort((a, b) => b.metrics.participants - a.metrics.participants || b.metrics.mentions - a.metrics.mentions || a.title.localeCompare(b.title))
      .map((g, i) => ({ ...g, id: `G${i + 1}` }))

  // Les idées « hors question » sortent des motifs : ni consolidées, ni comptées, ni résumées ; le rapport les liste.
  const takeOffTopic = (list: Group[]): Group[] => {
    const out = list.filter((g) => titleKey(g.title) === titleKey(OFF_TOPIC))
    if (!offTopic || !out.length) return list
    state.offTopic = [...(state.offTopic ?? []), ...out.flatMap((g) => g.ideaIds)].sort()
    return build(list.filter((g) => !out.includes(g)))
  }
  let groups = takeOffTopic(
    build(titles.map((title) => ({ title, ideaIds: items.filter((i) => assigned.get(i.id) === title).flatMap((i) => i.ideaIds) }))),
  )
  state.merges = []
  // En mode grille, les titres sont imposés : pas de consolidation.
  const respondents = new Set(state.ideas.map((i) => i.participantId)).size
  if (
    !grid.length &&
    needsConsolidation(
      groups.map((g) => g.metrics.participants),
      respondents,
    )
  ) {
    s.message = 'Consolidation des motifs'
    await emit()
    const res = await runner.json(
      consolidationPrompt(
        {
          groups: groups.map((g) => ({
            id: g.id,
            title: g.title,
            people: g.metrics.participants,
            examples: g.ideaIds.slice(0, 3).map((id) => shortExample(ideaById.get(id)!.verbatim, 110)),
          })),
        },
        state.settings,
      ),
      consolidationSchema,
    )
    const merged = applyMerges(groups, res.merges)
    state.merges = merged.merges
    groups = build(merged.groups)
    s.message = undefined
  }

  // Méthode qui le demande : chaque motif isolé est proposé au rattachement, une question simple à la fois par lot.
  if (!grid.length && methodOf(state.settings).attachSingles) {
    const singles = groups.filter((g) => g.metrics.participants === 1)
    const targets = groups.filter((g) => g.metrics.participants > 1)
    if (singles.length && targets.length) {
      s.message = 'Rattachement des motifs isolés'
      await emit()
      const proposals: { single: string; group: string }[] = []
      for (let i = 0; i < singles.length; i += 40) {
        const res = await runner.json(
          attachPrompt(
            {
              groups: targets.map((g) => ({ id: g.id, title: g.title, people: g.metrics.participants })),
              singles: singles.slice(i, i + 40).map((g) => ({
                id: g.id,
                title: g.title,
                examples: g.ideaIds.slice(0, 2).map((id) => shortExample(ideaById.get(id)!.verbatim, 110)),
              })),
            },
            state.settings,
          ),
          attachSchema,
        )
        proposals.push(...res.attachments)
      }
      const attached = applyAttachments(groups, proposals)
      state.merges = [...(state.merges ?? []), ...attached.merges]
      groups = build(attached.groups)
      s.message = undefined
    }
  }

  // Un titre qui relie deux mots par « et » peut cacher deux objets : on pose la question au modèle, le code applique.
  const joined = !grid.length ? groups.filter((g) => /\s(et|and)\s/i.test(g.title)) : []
  if (joined.length) {
    const res = await runner.json(
      splitPrompt(
        {
          groups: joined.map((g) => ({
            id: g.id,
            title: g.title,
            ideas: g.ideaIds.slice(0, 40).map((id) => ({ id, label: ideaById.get(id)!.label, verbatim: shortExample(ideaById.get(id)!.verbatim, 110) })),
          })),
        },
        state.settings,
      ),
      splitSchema,
    )
    const split = applySplits(groups, res.decisions)
    if (split.changed) groups = build(split.groups)
  }

  // Relecture des motifs : une idée hors de l'objet de son motif est déplacée, un ton faux par rapport à cet objet est corrigé.
  // Les mitigés sont vérifiés en priorité : souvent leurs deux idées parlent de deux objets. Le modèle propose, le code applique et garde la trace.
  if (!grid.length && groups.length > 1) {
    s.message = 'Relecture des motifs'
    await emit()
    const before = (i: Idea) => {
      const text = contributionById.get(i.contributionId)?.text ?? ''
      const start = (i.parts ?? [i.span])[0].start
      if (start <= 0) return undefined
      const prev = text.slice(Math.max(0, start - 160), start)
      return (start > 160 ? prev.slice(prev.indexOf(' ') + 1) : prev).trim() || undefined
    }
    // Livre de codes (méthode qui le demande) : la définition écrite par le moteur suit le motif par son titre
    // (les identifiants G… sont renumérotés après chaque tour).
    const definitions = new Map<string, GroupDefinition>()
    const codebook = methodOf(state.settings).codebook === true
    // Un tour de relecture sur les motifs donnés ; `arrived` : idées déplacées au tour précédent, à vérifier d'abord.
    const reviewRound = async (scope: Group[], arrived?: Set<string>) => {
      const titles = groups.map((g) => ({ id: g.id, title: g.title }))
      const titleOf = new Map(groups.map((g) => [g.id, g.title]))
      const batches: Group[][] = []
      let cur: Group[] = []
      for (const g of scope) {
        if (cur.length && cur.reduce((n, x) => n + x.ideaIds.length, 0) + g.ideaIds.length > batchSizes(state.settings).review) {
          batches.push(cur)
          cur = []
        }
        cur.push(g)
      }
      if (cur.length) batches.push(cur)
      const responses = await Promise.all(
        batches.map((batch) =>
          runner.json(
            reviewPrompt(
              {
                titles,
                groups: batch.map((g) => ({
                  id: g.id,
                  title: g.title,
                  mixed: g.metrics.mixed,
                  ...(codebook && definitions.has(titleKey(g.title)) ? { definition: definitions.get(titleKey(g.title)) } : {}),
                  ideas: g.ideaIds.map((id) => {
                    const i = ideaById.get(id)!
                    return {
                      id,
                      participant: i.participantId,
                      category: i.category,
                      label: i.label,
                      verbatim: shortExample(i.verbatim, 220),
                      before: before(i),
                      ...(arrived?.has(id) ? { arrived: true } : {}),
                    }
                  }),
                })),
              },
              state.settings,
            ),
            reviewSchema,
          ).catch((e: unknown) => {
            // Une relecture qui boucle jusqu'à la limite de réponse (un modèle local qui répète les mêmes déplacements)
            // est ignorée pour ce lot : le rangement d'avant reste, l'analyse continue.
            if (e instanceof ProviderError && e.truncated) {
              state.reviewSkipped = (state.reviewSkipped ?? 0) + 1
              return { definitions: [], changes: [] }
            }
            throw e
          }),
        ),
      )
      if (codebook)
        for (const d of responses.flatMap((r) => r.definitions ?? [])) {
          const title = titleOf.get(d.id)
          if (title && d.positive.trim() && d.negative.trim())
            definitions.set(titleKey(title), { positive: d.positive.trim(), negative: d.negative.trim(), ...(d.neutral?.trim() ? { neutral: d.neutral.trim() } : {}) })
        }
      return responses.flatMap((r) => r.changes)
    }
    const reviewed = applyReview(state.ideas, groups, await reviewRound(groups))
    state.retoned = reviewed.retoned
    state.moved = reviewed.moved
    if (reviewed.retoned.length || reviewed.moved.length) groups = takeOffTopic(build(reviewed.groups))

    // Méthode qui le demande : les motifs qui ont reçu une idée sont relus une seconde fois, avec la liste à jour des motifs.
    // Au premier tour, chaque lot ne connaît que les motifs d'avant : un motif ouvert par un autre lot lui échappe,
    // et l'idée part vers le motif voisin en gardant le ton jugé par rapport à son ancien motif.
    if (methodOf(state.settings).arrivalReview && reviewed.moved.length) {
      const arrived = arrivals(reviewed.moved)
      const scope = groups.filter((g) => g.ideaIds.some((id) => arrived.has(id)))
      if (scope.length) {
        s.message = 'Seconde relecture des motifs'
        await emit()
        const second = applyReview(state.ideas, groups, keepForward(await reviewRound(scope, arrived), reviewed.moved, groups))
        state.retoned = [...state.retoned, ...second.retoned]
        state.moved = [...state.moved, ...second.moved]
        if (second.retoned.length || second.moved.length) groups = takeOffTopic(build(second.groups))
      }
    }

    if (definitions.size) groups = groups.map((g) => (definitions.has(titleKey(g.title)) ? { ...g, definition: definitions.get(titleKey(g.title)) } : g))
    s.message = undefined
  }

  // Méthode qui le demande : un motif unanime (ou presque) est confronté aux idées de ton contraire rangées ailleurs.
  if (!grid.length && methodOf(state.settings).unanimityReview && groups.length > 1) {
    const motifs = unanimityCheck(groups, state.ideas)
    if (motifs.length) {
      s.message = 'Vérification des unanimités'
      await emit()
      // Chaque candidate n'est envoyée qu'une fois : un motif ne liste que leurs identifiants.
      const pool = [...new Map(motifs.flatMap((m) => m.candidates).map((c) => [c.id, c])).values()]
      const res = await runner.json(
        unanimityPrompt({ motifs: motifs.map((m) => ({ ...m, candidates: m.candidates.map((c) => c.id) })), pool }, state.settings),
        reviewSchema,
      )
      // Seuls les déplacements proposés vers un motif vérifié, d'une idée qui figurait parmi ses candidates, sont appliqués.
      const allowed = new Map(motifs.map((m) => [m.id, new Set(m.candidates.map((c) => c.id))]))
      const moves = res.changes.filter((c) => c.to && allowed.get(c.to)?.has(c.id)).map((c) => ({ id: c.id, to: c.to }))
      const checked = applyReview(state.ideas, groups, moves)
      state.moved = [...(state.moved ?? []), ...checked.moved]
      if (checked.moved.length) groups = build(checked.groups)
      s.message = undefined
    }
  }

  state.groups = groups
  s.done = items.length
  s.state = 'done'
  await emit()
}

/**
 * Motifs unanimes ou à large majorité (au moins 3 avis), chacun avec les idées de ton contraire rangées
 * dans d'autres motifs : le moteur dira lesquelles jugent le même objet (méthode « contexte »).
 */
export function unanimityCheck(
  groups: Group[],
  ideas: Idea[],
): (Omit<UnanimityInput['motifs'][number], 'candidates'> & { candidates: UnanimityInput['pool'] })[] {
  const byId = new Map(ideas.map((i) => [i.id, i]))
  const home = new Map(groups.flatMap((g) => g.ideaIds.map((id) => [id, g] as const)))
  const opinions = (g: Group) => g.metrics.positiveOnly.length + g.metrics.negativeOnly.length + g.metrics.mixed.length
  return groups
    .filter((g) => (g.metrics.stance === 'unanimous' || g.metrics.stance === 'consensus') && opinions(g) >= 3)
    .map((g) => {
      const side: 'positive' | 'negative' = g.metrics.positiveOnly.length >= g.metrics.negativeOnly.length ? 'positive' : 'negative'
      const opposite: 'positive' | 'negative' = side === 'positive' ? 'negative' : 'positive'
      return {
        id: g.id,
        title: g.title,
        side,
        ideas: g.ideaIds
          .map((id) => byId.get(id)!)
          .filter((i) => i.category === side)
          .map((i) => ({ id: i.id, label: i.label, verbatim: shortExample(i.verbatim, 160) })),
        candidates: ideas
          .filter((i) => i.category === opposite && home.get(i.id) && home.get(i.id) !== g)
          .map((i) => ({ id: i.id, motif: home.get(i.id)!.title, tone: opposite, label: i.label, verbatim: shortExample(i.verbatim, 160) })),
      }
    })
    .filter((m) => m.candidates.length > 0)
}

/**
 * Pistes opposées signalées par le moteur : le code ne garde que deux
 * propositions du motif, de deux personnes différentes, avec un objet nommé.
 */
export function checkOpposed(
  group: { ideaIds: string[] },
  ideaById: Map<string, Idea>,
  proposed: { a: string; b: string; about: string }[],
): { a: string; b: string; about: string }[] {
  const inGroup = new Set(group.ideaIds)
  const seen = new Set<string>()
  return proposed.filter((o) => {
    const a = ideaById.get(o.a)
    const b = ideaById.get(o.b)
    const key = [o.a, o.b].sort().join('|')
    const ok =
      !!a &&
      !!b &&
      inGroup.has(o.a) &&
      inGroup.has(o.b) &&
      a.category === 'suggestion' &&
      b.category === 'suggestion' &&
      a.participantId !== b.participantId &&
      !!o.about.trim() &&
      !seen.has(key)
    if (ok) seen.add(key)
    return ok
  })
}

const sameTitle = (t: string) => t.trim().toLowerCase()

/** Idées déplacées par la relecture (une idée partie « Hors question » n'est plus dans un motif). */
export function arrivals(moved: { id: string; to: string }[]): Set<string> {
  return new Set(moved.filter((m) => sameTitle(m.to) !== sameTitle(OFF_TOPIC)).map((m) => m.id))
}

/**
 * Seconde relecture : une idée ne revient jamais au motif qu'elle a quitté au premier tour
 * (le modèle trancherait deux fois la même question, sans fin). Les autres changements passent.
 */
export function keepForward(
  changes: { id: string; to?: string; new?: string; category?: IdeaCategory }[],
  moved: { id: string; from: string }[],
  groups: { id: string; title: string }[],
): { id: string; to?: string; new?: string; category?: IdeaCategory }[] {
  const left = new Map(moved.map((m) => [m.id, sameTitle(m.from)]))
  const titleOf = new Map(groups.map((g) => [g.id, sameTitle(g.title)]))
  return changes.flatMap((c) => {
    const back = left.get(c.id)
    const dest = c.to ? titleOf.get(c.to) : c.new ? sameTitle(c.new) : undefined
    if (!back || dest !== back) return [c]
    // Le retour est refusé ; une correction de ton proposée avec lui reste valable.
    return c.category ? [{ id: c.id, category: c.category }] : []
  })
}

/** Un titre qui nomme un jugement (« Points forts ») ou relie deux objets ne fonde pas un motif. */
const JUDGEMENT_TITLE =
  /\b(points? forts?|points? faibles?|critiques?|réussites?|satisfactions?|insatisfactions?|positifs?|négatifs?|avis|bilan|divers|autres sujets)\b/i

/**
 * Applique la relecture des motifs : déplacements vers un motif existant ou
 * nouveau, et corrections de ton. Le code refuse ce qui ne tient pas (idée ou
 * motif inconnus, titre de jugement ou à deux objets, catégorie invalide) et
 * n'applique qu'un changement par idée. Renvoie les motifs refaits et la trace.
 */
export function applyReview(
  ideas: Idea[],
  groups: { id: string; title: string; ideaIds: string[] }[],
  changes: { id: string; to?: string; new?: string; category?: IdeaCategory }[],
): {
  groups: { title: string; ideaIds: string[] }[]
  retoned: { id: string; from: IdeaCategory; to: IdeaCategory }[]
  moved: { id: string; from: string; to: string }[]
} {
  const byId = new Map(ideas.map((i) => [i.id, i]))
  const home = new Map(groups.flatMap((g) => g.ideaIds.map((id) => [id, g.id] as const)))
  const out = groups.map((g) => ({ id: g.id, title: g.title, ideaIds: [...g.ideaIds] }))
  const byTitle = new Map(out.map((g) => [g.title.trim().toLowerCase(), g]))
  const retoned: { id: string; from: IdeaCategory; to: IdeaCategory }[] = []
  const moved: { id: string; from: string; to: string }[] = []
  // Deux changements sur une même idée (un déplacement, puis une correction de ton) se cumulent : le premier de chaque sorte compte.
  const merged = new Map<string, { id: string; to?: string; new?: string; category?: IdeaCategory }>()
  for (const c of changes) {
    const m = merged.get(c.id) ?? { id: c.id }
    if (!m.to && !m.new && (c.to || c.new)) Object.assign(m, c.to ? { to: c.to } : { new: c.new })
    if (!m.category && c.category) m.category = c.category
    merged.set(c.id, m)
  }
  for (const c of merged.values()) {
    const idea = byId.get(c.id)
    const from = home.get(c.id)
    if (!idea || !from) continue
    if (c.category && c.category !== idea.category && IDEA_CATEGORIES.includes(c.category)) {
      retoned.push({ id: c.id, from: idea.category, to: c.category })
      idea.category = c.category
    }
    let target = c.to ? out.find((g) => g.id === c.to) : undefined
    const title = c.new?.trim()
    if (!target && title) {
      // Un modèle léger met parfois l'identifiant d'un motif existant à la place d'un titre nouveau.
      target = byTitle.get(title.toLowerCase()) ?? out.find((g) => g.id.toLowerCase() === title.toLowerCase())
      if (!target && !/^[A-Z]\d+$/i.test(title) && title.length >= 3 && title.length <= 60 && !/\s(et|and)\s/i.test(title) && !JUDGEMENT_TITLE.test(title)) {
        target = { id: `N${out.length + 1}`, title, ideaIds: [] }
        out.push(target)
        byTitle.set(title.toLowerCase(), target)
      }
    }
    if (!target || target.id === from) continue
    const source = out.find((g) => g.id === from)!
    source.ideaIds = source.ideaIds.filter((id) => id !== c.id)
    target.ideaIds.push(c.id)
    home.set(c.id, target.id)
    moved.push({ id: c.id, from: source.title, to: target.title })
  }
  return { groups: out.map(({ title, ideaIds }) => ({ title, ideaIds })), retoned, moved }
}

/**
 * Sépare un motif en deux quand le modèle le demande, si la proposition tient :
 * exactement deux parties, chaque idée du motif dans une seule, titres sans
 * « et » ni jugement. Un motif de plus de 40 idées n'est pas séparé (le modèle
 * n'en a vu qu'une partie). Sinon le motif reste tel quel.
 */
export function applySplits(
  groups: { id: string; title: string; ideaIds: string[] }[],
  decisions: { group: string; objects: number; parts?: { title: string; ideas: string[] }[] }[],
): { groups: { title: string; ideaIds: string[] }[]; changed: boolean } {
  let changed = false
  const out: { title: string; ideaIds: string[] }[] = []
  for (const g of groups) {
    const d = decisions.find((x) => x.group === g.id)
    const parts = d?.objects === 2 ? (d.parts ?? []) : []
    const all = new Set(g.ideaIds)
    const listed = parts.flatMap((p) => p.ideas)
    const valid =
      parts.length === 2 &&
      g.ideaIds.length <= 40 &&
      listed.length === all.size &&
      new Set(listed).size === listed.length &&
      listed.every((id) => all.has(id)) &&
      parts.every((p) => p.ideas.length > 0 && p.title.trim() && !/\s(et|and)\s/i.test(p.title) && !JUDGMENT_TITLE.test(p.title))
    if (!valid) {
      out.push({ title: g.title, ideaIds: g.ideaIds })
      continue
    }
    changed = true
    for (const p of parts) out.push({ title: p.title.trim(), ideaIds: p.ideas })
  }
  return { groups: out, changed }
}

/**
 * Applique les fusions proposées par le modèle, en refusant celles qui ne
 * tiennent pas : identifiant inconnu ou déjà fusionné, moins de deux motifs,
 * ou titre qui relie deux objets par « et » (le signe d'un fourre-tout).
 */
export function applyMerges(
  groups: { id: string; title: string; ideaIds: string[] }[],
  proposals: { groups: string[]; title: string; reason: string }[],
): { groups: { title: string; ideaIds: string[] }[]; merges: Merge[] } {
  const byId = new Map(groups.map((g) => [g.id, g]))
  const used = new Set<string>()
  const merges: Merge[] = []
  const out: { title: string; ideaIds: string[] }[] = []
  for (const p of proposals) {
    const ids = [...new Set(p.groups)].filter((id) => byId.has(id) && !used.has(id))
    const title = p.title.trim()
    if (ids.length < 2 || !title || /\set\s/i.test(title) || /\sand\s/i.test(title) || JUDGMENT_TITLE.test(title)) continue
    ids.forEach((id) => used.add(id))
    out.push({ title, ideaIds: ids.flatMap((id) => byId.get(id)!.ideaIds) })
    merges.push({ title, from: ids.map((id) => byId.get(id)!.title), reason: p.reason.trim() })
  }
  for (const g of groups) if (!used.has(g.id)) out.push({ title: g.title, ideaIds: g.ideaIds })
  // Deux groupes peuvent finir sous le même titre : on les réunit.
  const byTitle = new Map<string, { title: string; ideaIds: string[] }>()
  for (const g of out) {
    const k = g.title.toLowerCase()
    const prev = byTitle.get(k)
    if (prev) prev.ideaIds.push(...g.ideaIds)
    else byTitle.set(k, { title: g.title, ideaIds: [...g.ideaIds] })
  }
  return { groups: [...byTitle.values()], merges }
}

/**
 * Rattache un motif porté par une seule personne à un motif plus large, si le modèle le propose :
 * le motif cible doit exister et réunir au moins deux personnes ; « aucun » laisse le motif isolé.
 */
export function applyAttachments(
  groups: { id: string; title: string; ideaIds: string[]; metrics: { participants: number } }[],
  proposals: { single: string; group: string }[],
): { groups: { title: string; ideaIds: string[] }[]; merges: Merge[] } {
  const byId = new Map(groups.map((g) => [g.id.toLowerCase(), g]))
  const into = new Map<string, string[]>()
  const moved = new Set<string>()
  const merges: Merge[] = []
  for (const p of proposals) {
    const single = byId.get(p.single.trim().toLowerCase())
    const target = byId.get(p.group.trim().toLowerCase())
    if (!single || !target || single === target || moved.has(single.id)) continue
    if (single.metrics.participants !== 1 || target.metrics.participants < 2) continue
    moved.add(single.id)
    into.set(target.id, [...(into.get(target.id) ?? []), ...single.ideaIds])
    merges.push({ title: target.title, from: [target.title, single.title], reason: 'Motif isolé rattaché au motif qui traite le même objet.' })
  }
  return {
    groups: groups.filter((g) => !moved.has(g.id)).map((g) => ({ title: g.title, ideaIds: [...g.ideaIds, ...(into.get(g.id) ?? [])] })),
    merges,
  }
}

// ─── Étape 3 ─────────────────────────────────────────────────────────────────

const pct = (x: number) => `${Math.round(x * 100)} %`

/**
 * Les chiffres d'un groupe, en une phrase lisible. Ce texte est affiché dans le
 * rapport ET recopié par le modèle dans ses synthèses : sa langue compte autant
 * que celle du modèle (un défaut ici se répète dans tout le rapport).
 */
export function describeMetrics(m: Metrics, lang: 'fr' | 'en' = 'fr', opts: { stance?: boolean } = {}): string {
  // Un thème réunit des sujets différents : y calculer consensus ou désaccord additionnerait des avis sur des objets distincts.
  const withStance = opts.stance !== false
  const pos = m.positiveOnly.length
  const neg = m.negativeOnly.length
  const mix = m.mixed.length
  const polarised = pos + neg + mix
  const top = Math.max(pos, neg)
  // Un pourcentage n'a de sens qu'à partir d'une dizaine de participants.
  // Placé entre parenthèses dans la ligne de chiffres : le pourcentage suit après une virgule, pas dans une seconde parenthèse.
  const share = (n: number, of: number, sep: string) => `${n} ${sep} ${of}${of >= 10 ? `, ${pct(n / of)}` : ''}`

  if (lang === 'en') {
    const n = (k: number, one: string, many = `${one}s`) => `${k} ${k > 1 ? many : one}`
    const parts = [n(m.participants, 'person', 'people')]
    if (withStance) {
      const opinions = [pos && `${pos} positive`, neg && `${neg} negative`, mix && `${mix} mixed`].filter(Boolean)
      if (opinions.length) parts.push(`opinions: ${opinions.join(', ')}`)
    }
    if (m.participantsByCategory.suggestion) parts.push(`${n(m.participantsByCategory.suggestion, 'person', 'people')} made suggestions`)
    if (m.participantsByCategory.question) parts.push(`${n(m.participantsByCategory.question, 'person', 'people')} raised questions`)
    if (!withStance) return parts.join(' · ')
    const scaleEn = { unanimous: 'unanimously', consensus: 'large majority', majority: 'majority', lean: 'no majority, leaning' } as const
    if ((m.stance === 'unanimous' || m.stance === 'consensus' || m.stance === 'majority' || m.stance === 'lean') && m.majority)
      parts.push(`${scaleEn[m.stance]} ${m.majority} (${share(top, polarised, 'out of')})`)
    else if (m.stance === 'divided') parts.push('divided opinions')
    if (m.minority)
      parts.push(
        `against the grain: ${n(m.minority.participantIds.length, 'person', 'people')} ${m.minority.side === 'positive' ? 'appreciate it' : 'criticise it'}`,
      )
    return parts.join(' · ')
  }

  const n = (k: number, one: string, many = `${one}s`) => `${k} ${k > 1 ? many : one}`
  const parts = [n(m.participants, 'participant')]
  // Au niveau d'un thème, additionner des avis sur des objets différents n'a pas de sens : on ne les affiche pas.
  if (withStance) {
    // « avis » est masculin : 3 positifs, 1 négatif.
    const opinions = [pos && n(pos, 'positif'), neg && n(neg, 'négatif'), mix && n(mix, 'mitigé')].filter(Boolean)
    if (opinions.length) parts.push(`avis : ${opinions.join(', ')}`)
  }
  const sug = m.participantsByCategory.suggestion
  if (sug) parts.push(`${n(sug, 'participant')} ${sug > 1 ? 'font' : 'fait'} des suggestions`)
  const qu = m.participantsByCategory.question ?? 0
  if (qu) parts.push(`${n(qu, 'participant')} ${qu > 1 ? 'se posent' : 'se pose'} des questions`)
  if (!withStance) return parts.join(' · ')
  // « Peu d'avis » répétait le nombre de participants affiché juste avant : la Méthode explique le seuil.
  const pol = m.majority === 'positive' ? 'positif' : 'négatif'
  const fem = m.majority === 'negative' ? 'négative' : 'positive'
  if (m.stance === 'unanimous' && m.majority) parts.push(`avis ${pol} unanime (${share(top, polarised, 'sur')})`)
  else if (m.stance === 'consensus' && m.majority) parts.push(`large majorité ${fem} (${share(top, polarised, 'sur')})`)
  else if (m.stance === 'majority' && m.majority) parts.push(`majorité ${fem} (${share(top, polarised, 'sur')})`)
  else if (m.stance === 'lean' && m.majority) parts.push(`pas de majorité, penche vers le ${pol} (${share(top, polarised, 'sur')})`)
  else if (m.stance === 'divided') parts.push('avis partagés')
  if (m.minority) {
    const k = m.minority.participantIds.length
    parts.push(
      `à contre-courant : ${n(k, 'participant')} ${m.minority.side === 'positive' ? (k > 1 ? "l'apprécient" : "l'apprécie") : k > 1 ? 'le critiquent' : 'le critique'}`,
    )
  }
  return parts.join(' · ')
}

/**
 * Les chiffres d'un thème : participants et nombre de motifs. Ni avis, ni
 * consensus : un thème réunit des objets différents, et additionner leurs avis
 * produirait de faux consensus (« 12 positifs contre 1 » sur l'esprit d'équipe).
 */
export function describeTheme(theme: { metrics: Metrics }, groups: { metrics: Metrics }[], lang: 'fr' | 'en' = 'fr'): string {
  const n = (k: number, one: string, many = `${one}s`) => `${k} ${k > 1 ? many : one}`
  if (lang === 'en') return `${n(theme.metrics.participants, 'person', 'people')} · ${n(groups.length, 'pattern')}`
  return `${n(theme.metrics.participants, 'participant')} · ${n(groups.length, 'motif')}`
}

/** Ne garde que les références [I…] qui appartiennent bien au périmètre. */
export function sanitizeCitations(text: string, allowed: Set<string>): string {
  return repairRefs(text)
    .replace(/(\s*)\[([^\]]*)\]/g, (whole, space: string, inner: string) => {
      const ids = inner.split(/[\s,;]+/).filter(Boolean)
      // Renvoi à un motif (« [G3] ») : rien à montrer au lecteur.
      if (ids.length && ids.every((id) => /^G\d+$/.test(id))) return ''
      // Un renvoi mal formé (« [I016] ») n'existe pas : il tombe comme un renvoi inconnu.
      if (!ids.length || !ids.every((id) => /^I\d+$/.test(id))) return whole
      const kept = ids.filter((id) => allowed.has(id))
      // Une référence retirée emporte l'espace qui la précède : la ponctuation reste intacte.
      return kept.length ? `${space}[${kept.join(', ')}]` : ''
    })
    .replace(/ {2,}/g, ' ')
    .trim()
}

/**
 * Renvois mal formés par un modèle léger : identifiants laissés sans crochets,
 * renvoi qui clôt une phrase sans point (« … [I0001] Neuf personnes… »).
 */
export function repairRefs(text: string): string {
  return text
    .split(/(\[[^\]]*\])/)
    .map((part, i) =>
      i % 2 ? part : part.replace(/\bI\d{4,}(?:[\s,;]+I\d{4,})*\b/g, (run) => `[${run.split(/[\s,;]+/).filter(Boolean).join(', ')}]`),
    )
    .join('')
    .replace(/([^.!?\s])(\s*\[I\d{4,}(?:\s*,\s*I\d{4,})*\])(\s+)(?=\p{Lu})/gu, '$1$2.$3')
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
    ...(g.definition ? { definition: g.definition } : {}),
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
    if (cur.length && size + g.ideas.length > batchSizes(state.settings).summary) {
      batches.push(cur)
      cur = []
      size = 0
    }
    cur.push(g)
    size += g.ideas.length
  }
  if (cur.length) batches.push(cur)

  const summaries = new Map<string, string>()
  const opposedBy = new Map<string, { a: string; b: string; about: string }[]>()
  const apply = () => {
    for (const g of state.groups) {
      const raw = summaries.get(g.id)
      if (raw !== undefined) g.summary = sanitizeCitations(raw, new Set(g.ideaIds))
      g.opposed = checkOpposed(g, ideaById, opposedBy.get(g.id) ?? [])
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
          if (missing.some((m) => m.id === r.id) && r.summary.trim()) {
            summaries.set(r.id, r.summary)
            opposedBy.set(r.id, r.opposed ?? [])
          }
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

/** Racine carrée du nombre de motifs, à deux près : environ 4 à 8 thèmes pour 35 motifs. */
export function themeTarget(groupCount: number): { min: number; max: number } {
  const r = Math.round(Math.sqrt(groupCount))
  return { min: Math.max(3, r - 2), max: Math.max(5, Math.min(10, r + 2)) }
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

  const ideaById = new Map(state.ideas.map((i) => [i.id, i]))
  const ask = (groups: Group[]) =>
    runner.json(
      themePrompt(
        {
          groups: groups.map((g) => ({
            id: g.id,
            title: g.title,
            // Une même personne peut parler dans plusieurs groupes : le modèle doit le savoir pour ne pas la compter deux fois.
            people: [...new Set(g.ideaIds.map((id) => ideaById.get(id)!.participantId))].sort(),
            // L'échelle du motif (consensus, majoritairement…) : la synthèse du thème dit chaque constat au même degré.
            facts: describeMetrics(g.metrics, state.settings.language),
            summary: g.summary,
          })),
        },
        state.settings,
        themeTarget(groups.length),
      ),
      themeSchema,
    )
  const groupIds = new Set(state.groups.map((g) => g.id))
  const taken = new Set<string>()
  const themes: Omit<Theme, 'id' | 'metrics'>[] = []
  const collect = (res: { themes: { title: string; groups: string[]; summary: string }[] }) => {
    for (const t of res.themes) {
      const own = t.groups.filter((id) => groupIds.has(id) && !taken.has(id))
      own.forEach((id) => taken.add(id))
      if (own.length) themes.push({ title: t.title.trim(), groupIds: own, summary: t.summary })
    }
  }
  collect(await ask(state.groups))
  // Le modèle a oublié des motifs : on les lui redonne seuls, plutôt que de les jeter dans « Autres sujets ».
  const forgotten = state.groups.filter((g) => !taken.has(g.id))
  if (forgotten.length > 1) collect(await ask(forgotten))
  const orphans = state.groups.filter((g) => !taken.has(g.id)).map((g) => g.id)
  if (orphans.length) themes.push({ title: state.settings.language === 'en' ? 'Other topics' : 'Autres sujets', groupIds: orphans, summary: '' })

  const groupById = new Map(state.groups.map((g) => [g.id, g]))
  state.themes = themes
    .map((t) => {
      const ideaIds = t.groupIds.flatMap((id) => groupById.get(id)!.ideaIds)
      const sortedGroups = [...t.groupIds].sort((a, b) => groupById.get(b)!.metrics.participants - groupById.get(a)!.metrics.participants)
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

/** L'équilibre des avis, en personnes, hors des idées « hors question » : qui critique, qui se dit satisfait, qui fait les deux. */
export function opinionBalance(state: Pick<AnalysisState, 'ideas' | 'offTopic'>): { speakers: number; critics: number; satisfied: number; both: number } {
  const offTopic = new Set(state.offTopic ?? [])
  const ideas = state.ideas.filter((i) => !offTopic.has(i.id))
  const who = (cat: Idea['category']) => new Set(ideas.filter((i) => i.category === cat).map((i) => i.participantId))
  const [critics, satisfied] = [who('negative'), who('positive')]
  return {
    speakers: new Set(ideas.map((i) => i.participantId)).size,
    critics: critics.size,
    satisfied: satisfied.size,
    both: [...critics].filter((p) => satisfied.has(p)).length,
  }
}

async function writeGlobalSummary(corpus: Corpus, state: AnalysisState, runner: LlmRunner) {
  const all = computeMetrics(state.ideas)
  const respondents = activeParticipants(corpus).length
  const lang = state.settings.language
  const checks = methodOf(state.settings).summaryChecks === true
  // Méthode qui le demande : l'équilibre des avis, compté en personnes, pour que le résumé ne s'ouvre pas sur une force isolée.
  const b = opinionBalance(state)
  const balance = checks
    ? lang === 'en'
      ? ` Of ${b.speakers} people, ${b.critics} voice at least one criticism, ${b.satisfied} at least one satisfaction, ${b.both} both.`
      : ` Sur ${b.speakers} participants, ${b.critics} expriment au moins une critique, ${b.satisfied} au moins une satisfaction, ${b.both} les deux.`
    : ''
  const facts =
    (lang === 'en' ? `${all.participants} people out of ${respondents} who answered.` : `${all.participants} participants sur ${respondents} ayant répondu.`) + balance
  const h = highlights(state.groups, new Map(state.ideas.map((i) => [i.id, i])))
  const groupById = new Map(state.groups.map((g) => [g.id, g]))
  // Méthode qui le demande : l'exemple d'une ligne est la première idée de son camp citée par la synthèse du motif
  // (la première par identifiant tombait parfois sur un avis atypique du camp).
  const refOf = (x: (typeof h)['strengths'][number]) => {
    if (!checks) return x.ideaIds[0]
    const side = new Set(x.ideaIds)
    return (groupById.get(x.groupId)?.summary.match(/I\d{4,}/g) ?? []).find((id) => side.has(id)) ?? x.ideaIds[0]
  }
  const sections = state.themes.length
    ? state.themes.map((t) => ({
        title: t.title,
        facts: describeTheme(
          t,
          t.groupIds.map((id) => groupById.get(id)!),
          lang,
        ),
        summary: t.summary,
      }))
    : state.groups.slice(0, 15).map((g) => ({ title: g.title, facts: describeMetrics(g.metrics, lang), summary: g.summary }))
  if (!sections.length) {
    state.globalSummary = ''
    return
  }
  const scale = methodOf(state.settings).scaleInLines === true
  const lines = (kind: keyof typeof h, list = h[kind].slice(0, methodOf(state.settings).summaryLines ?? 6)) =>
    list.map((x) => ({ text: highlightLine(x, kind, lang, scale), ref: kind === 'strengths' || kind === 'blockers' ? refOf(x) : x.ideaIds[0] }))
  // Méthode qui le demande : le verbatim de chaque proposition et question, pour rapporter ce qu'elle dit et non le titre du motif.
  const ideaText = new Map(state.ideas.map((i) => [i.id, i.verbatim]))
  const withExample = (list: { text: string; ref: string }[]) =>
    methodOf(state.settings).globalContext ? list.map((l) => ({ ...l, example: shortExample(ideaText.get(l.ref) ?? '', 220) })) : list
  const res = await runner.json(
    globalPrompt(
      {
        facts,
        strengths: lines('strengths'),
        blockers: lines('blockers'),
        divided: lines('divided'),
        proposals: withExample(lines('proposals', h.proposals.slice(0, 8))),
        questions: withExample(lines('questions', h.questions.slice(0, 6))),
        sections,
      },
      state.settings,
    ),
    globalSchema,
  )
  // La phrase sur ce qui divise est ajoutée par le code à la toute fin (voir `runAnalysis`) : écrite avec les chiffres du code,
  // elle ne passe ni par la relecture de la langue ni par les contrôles, qui la récrivaient ou la retiraient.
  state.globalSummary = sanitizeCitations(res.summary, new Set(state.ideas.map((i) => i.id)))
}

/**
 * La phrase du résumé sur ce qui divise est écrite par le code, à partir de la
 * liste calculée : tous les sujets y sont nommés, une seule fois, avec le mot
 * de l'échelle, leurs chiffres et un renvoi par camp ; une critique partagée
 * aux remèdes opposés cite ses deux propositions.
 */
/**
 * `compact` (méthode « consultation ») : une seule phrase pour les sujets partagés, la base au premier seulement,
 * et l'objet des propositions contraires nommé. Sinon, la phrase de référence, inchangée.
 */
export function withDivided(summary: string, groups: Group[], lang: 'fr' | 'en' = 'fr', onlyMissing = false, ideas?: Map<string, Idea>, compact = false): string {
  const named = summary.toLowerCase()
  // Une phrase qui dit déjà ce qui divise suffit : on ne la répète pas.
  if (onlyMissing && /(avis s['’]opposent|avis sont partagés|opinions are split|propositions s['’]opposent|propositions contraires|pistes proposées s['’]opposent|proposals diverge|opposite directions)/i.test(summary)) return summary
  const divided = highlights(groups).divided.filter((d) => !onlyMissing || !named.includes(d.title.toLowerCase()))
  if (!divided.length || !summary.trim()) return summary
  const groupById = new Map(groups.map((g) => [g.id, g]))
  const q = (t: string) => (lang === 'en' ? `“${t}”` : `« ${t} »`)
  // Méthode « consultation » : un titre de motif dans une phrase n'est pas une citation, il perd ses « » et sa majuscule
  // (sauf un sigle : « CAF… »). Il suit un deux-points, ce qui évite d'avoir à choisir son article.
  const bare = (t: string) => (lang === 'en' ? q(t) : t.length > 1 && t[1] === t[1].toLowerCase() ? t[0].toLowerCase() + t.slice(1) : t)
  // « Qualité de l'accueil » : 20 positifs, 12 négatifs et 1 mitigé parmi les 33 participants qui en donnent un [I0004, I0011].
  // Un renvoi par camp (le premier positif, le premier négatif) : la phrase se vérifie comme les autres.
  // Le premier sujet donne la base (« parmi les 33 participants qui en donnent un »), les suivants leurs seuls camps.
  const figures = (d: (typeof divided)[number], first: boolean) => {
    const m = groupById.get(d.groupId)!.metrics
    const [pos, neg, mix] = [m.positiveOnly.length, m.negativeOnly.length, m.mixed.length]
    // Méthode « consultation » : l'exemple d'un camp est d'abord une idée que la synthèse du motif cite (la plus petite par numéro tombait sur un avis atypique).
    const cited = compact ? (groupById.get(d.groupId)!.summary.match(/I\d{4,}/g) ?? []) : []
    const firstOf = (side: 'positive' | 'negative') =>
      cited.find((id) => ideas?.get(id)?.category === side && groupById.get(d.groupId)!.ideaIds.includes(id)) ??
      groupById.get(d.groupId)!.ideaIds.find((id) => ideas?.get(id)?.category === side)
    const refs = [firstOf('positive'), firstOf('negative')].filter(Boolean)
    const camps =
      lang === 'en'
        ? [`${pos} positive`, `${neg} negative`, ...(mix ? [`${mix} mixed`] : [])]
        : [`${pos} positif${pos > 1 ? 's' : ''}`, `${neg} négatif${neg > 1 ? 's' : ''}`, ...(mix ? [`${mix} mitigé${mix > 1 ? 's' : ''}`] : [])]
    const and = lang === 'en' ? 'and' : 'et'
    const counts = `${camps.slice(0, -1).join(', ')} ${and} ${camps[camps.length - 1]}`
    const among = compact && !first ? '' : lang === 'en' ? ` among the ${d.of} people who give one` : ` parmi les ${d.of} participants qui en donnent un`
    const r = refs.length ? ` [${refs.join(', ')}]` : ''
    return compact ? `${bare(d.title)} (${counts}${among})${r}` : `${q(d.title)}${lang === 'en' ? ':' : ' :'} ${counts}${among}${r}`
  }
  const list = (items: string[]) => {
    const and = lang === 'en' ? 'and' : 'et'
    return items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} ${and} ${items[items.length - 1]}`
  }
  // Une seule phrase pour tous les sujets partagés, trois au plus : au-delà, la liste « Ce qui divise » les donne tous.
  const MAX = 3
  const split = divided.filter((d) => !d.opposed || groupById.get(d.groupId)!.metrics.stance === 'divided')
  const opposed = divided.filter((d) => d.opposed)
  const shownSplit = split.slice(0, MAX)
  const rest = split.length - shownSplit.length
  const shown = list(shownSplit.map((d, i) => figures(d, i === 0)))
  const sentences = compact
    ? [
        ...(shownSplit.length
          ? [
              lang === 'en'
                ? `Opinions are split on ${shown}.`
                : `Les avis sont partagés sur ${shownSplit.length > 1 ? `${NUMBER_WORDS_FR[shownSplit.length]} sujets` : 'un sujet'} : ${shown}.`,
            ]
          : []),
        ...(rest > 0
          ? [
              lang === 'en'
                ? `${rest > 1 ? `${rest} other topics divide` : 'One other topic divides'} too (see “What divides”).`
                : spellLeadingNumbers(`${rest > 1 ? `${rest} autres sujets divisent` : 'Un autre sujet divise'} aussi (voir « Ce qui divise »).`),
            ]
          : []),
        // Une seule phrase pour toutes les propositions contraires (plume, passe 8 : trois phrases de même forme à la suite).
        ...(opposed.length
          ? [
              lang === 'en'
                ? `Two proposals go in opposite directions ${list(opposed.map((d) => `on ${d.opposed!.about} [${d.opposed!.a}, ${d.opposed!.b}]`))}.`
                : // L'objet du désaccord est nommé : « deux propositions s'opposent sur « X » : … » annonçait deux propositions sans les dire.
                  `Deux propositions vont en sens contraire ${list(opposed.map((d) => `sur ${d.opposed!.about} [${d.opposed!.a}, ${d.opposed!.b}]`))}.`,
            ]
          : []),
      ]
    : [
        ...shownSplit.map((d, i) =>
          lang === 'en'
            ? `${i ? 'Opinions are also split on' : 'Opinions are split on'} ${figures(d, true)}.`
            : `${i ? 'Ils le sont aussi sur' : 'Les avis sont partagés sur'} ${figures(d, true)}.`,
        ),
        ...(rest > 0
          ? [
              lang === 'en'
                ? `They are split on ${rest} other ${rest > 1 ? 'topics' : 'topic'} too (see “What divides”).`
                : `Ils le sont encore sur ${rest} autre${rest > 1 ? 's' : ''} sujet${rest > 1 ? 's' : ''} (voir « Ce qui divise »).`,
            ]
          : []),
        ...opposed.map((d) =>
          lang === 'en'
            ? `Two proposals diverge on ${q(d.title)}: ${d.opposed!.about} [${d.opposed!.a}, ${d.opposed!.b}].`
            : // « Les critiques se rejoignent » affirmait un accord sur le constat que les données ne montrent pas toujours.
              `Deux propositions s'opposent sur ${q(d.title)} : ${d.opposed!.about} [${d.opposed!.a}, ${d.opposed!.b}].`,
        ),
      ]
  const paragraphs = summary.trim().split(/\n\s*\n/)
  const at = paragraphs.length > 1 ? 1 : paragraphs.length - 1
  paragraphs[at] = `${paragraphs[at].trim()} ${sentences.join(' ')}`
  return paragraphs.join('\n\n')
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
  const polishBatch = methodOf(state.settings).batches.polish
  for (let i = 0; i < targets.length; i += polishBatch) batches.push(targets.slice(i, i + polishBatch))
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

// ─── Vérification des renvois ────────────────────────────────────────────────

/** Les phrases d'un texte, paragraphe par paragraphe, pour les vérifier une à une puis le recomposer. */
export function sentencesOf(text: string): string[][] {
  return text
    .split(/\n\s*\n/)
    .map((p) =>
      p
        .trim()
        .split(/(?<=[.!?])\s+/)
        .filter(Boolean),
    )
    .filter((p) => p.length)
}

/**
 * Applique les corrections de renvois à un texte. Une phrase réécrite n'est
 * gardée que si elle ne cite que des idées permises, n'ajoute aucun nombre et
 * reste de longueur comparable ; une phrase retirée ne vide jamais le texte.
 */
export function applySupport(
  text: string,
  allowed: Set<string>,
  fixes: { n: number; sentence?: string; drop?: boolean }[],
  options: { addNumbers?: Set<number>; addTo?: 'last' | 'second'; personOf?: (ideaId: string) => string | undefined } = {},
): { text: string; fixed: number; dropped: number; added: number } {
  const paragraphs = sentencesOf(text)
  const flat = paragraphs.flat()
  const result = new Map<number, string | null>()
  // Phrases ajoutées (n = 0) : renvois permis, aucun nombre hors de ceux du signalement.
  const additions = fixes
    .filter((f) => f.n === 0 && f.sentence?.trim())
    .map((f) => f.sentence!.trim())
    .filter((r) => {
      const ids = r.match(/I\d{4,}/g) ?? []
      return ids.length > 0 && ids.every((id) => allowed.has(id)) && numbersIn(r).every((x) => options.addNumbers?.has(x.value)) && r.length <= 400
    })
    .slice(0, 2)
  for (const f of fixes.filter((x) => x.n > 0)) {
    const original = flat[f.n - 1]
    if (original === undefined || result.has(f.n)) continue
    if (f.drop) {
      result.set(f.n, null)
      continue
    }
    const r = f.sentence?.trim()
    if (!r) continue
    const ids = r.match(/I\d{4,}/g) ?? []
    const before = new Set(numbersIn(original).map((x) => x.value))
    // Un nombre nouveau n'est accepté que s'il compte exactement les personnes distinctes citées dans la phrase réécrite.
    const personOf = options.personOf
    const cited = personOf ? new Set(ids.map(personOf).filter(Boolean)).size : -1
    // Un compte vaut pour son passage (« Une personne propose X [a], une autre Y [b] ») ou pour toute la phrase.
    const covers = (x: { raw: string; value: number }) => {
      if (before.has(x.value) || x.value === cited) return true
      if (!personOf) return false
      const at = r.indexOf(x.raw)
      if (at < 0) return false
      const peopleOf = (passage: string) => new Set((passage.match(/I\d{4,}/g) ?? []).map(personOf).filter(Boolean)).size
      // « Six personnes dénoncent X [6 renvois], et 9 reprochent Y [9 renvois] » : le compte vaut aussi pour son premier renvoi.
      const span = countSpan(r, at)
      const firstRef = span.slice(0, span.indexOf(']') + 1)
      return peopleOf(span) === x.value || (firstRef !== '' && peopleOf(firstRef) === x.value)
    }
    const ok = ids.length > 0 && ids.every((id) => allowed.has(id)) && numbersIn(r).every(covers) && r.length <= original.length * 1.5
    if (ok) result.set(f.n, r)
  }
  if (flat.every((_, i) => result.get(i + 1) === null)) return { text, fixed: 0, dropped: 0, added: 0 }
  let n = 0
  let fixed = 0
  let dropped = 0
  const out = paragraphs
    .map((p) =>
      p
        .map((sentence) => {
          n++
          const r = result.get(n)
          if (r === null) {
            dropped++
            return ''
          }
          if (r !== undefined && r !== sentence) {
            fixed++
            return r
          }
          return sentence
        })
        .filter(Boolean)
        .join(' '),
    )
    .filter(Boolean)
  if (additions.length) {
    const at = options.addTo === 'second' && out.length > 1 ? 1 : out.length - 1
    out[at] = `${out[at]} ${additions.join(' ')}`
  }
  return { text: out.join('\n\n'), fixed, dropped, added: additions.length }
}

const NUMBER_WORDS_FR: Record<number, string> = { 2: 'deux', 3: 'trois', 4: 'quatre', 5: 'cinq', 6: 'six', 7: 'sept', 8: 'huit', 9: 'neuf', 10: 'dix' }

/** Les camps d'avis d'un motif (positif, négatif) que sa synthèse ne cite par aucune idée. */
export function missingCamps(g: Group, ideaById: Map<string, Idea>): { side: 'positive' | 'negative'; people: string[]; ideaIds: string[] }[] {
  const cited = new Set(g.summary.match(/I\d{4,}/g) ?? [])
  return (['positive', 'negative'] as const)
    .map((side) => {
      const ideaIds = g.ideaIds.filter((id) => ideaById.get(id)?.category === side)
      const people = [...new Set(ideaIds.map((id) => ideaById.get(id)!.participantId))]
      return { side, people, ideaIds }
    })
    .filter((c) => c.ideaIds.length && !c.ideaIds.some((id) => cited.has(id)))
}

/** Les phrases d'un texte qui contiennent l'un des termes signalés par les contrôles (numéros à partir de 1). */
function flaggedSentences(text: string, bad?: string[]): number[] {
  if (!bad?.length) return []
  const has = (x: string) => bad.some((b) => new RegExp(`(?<![\\p{L}\\p{N}])${b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'iu').test(x))
  return sentencesOf(text)
    .flat()
    .map((x, i) => (has(x) ? i + 1 : 0))
    .filter(Boolean)
}

/**
 * Chaque phrase des synthèses renvoie à des idées ; le lecteur suivra ces
 * renvois jusqu'aux personnes. Le moteur relit chaque phrase face aux idées
 * citées et propose une correction ; le code n'accepte que des renvois vers
 * les idées du motif, du thème ou des listes du résumé. Les phrases que les
 * contrôles du code ont signalées (compte sans appui, phrase sans renvoi) et
 * ce qui manque (un camp d'avis absent d'un motif, un motif qui divise absent
 * du résumé) lui sont désignés : il récrit ou complète, au lieu que le code
 * retire.
 */
async function checkSupport(state: AnalysisState, runner: LlmRunner, emit: () => Promise<void>) {
  const s = state.steps.find((x) => x.id === 'polish')!
  const ideaById = new Map(state.ideas.map((i) => [i.id, i]))
  const groupById = new Map(state.groups.map((g) => [g.id, g]))
  const groupOf = new Map(state.groups.flatMap((g) => g.ideaIds.map((id) => [id, g] as const)))
  type Target = {
    id: string
    get: () => string
    set: (t: string) => void
    allowed: string[]
    flags: { n: number; problem: string }[]
    addTo: 'last' | 'second'
    definition?: GroupDefinition
  }
  const targets: Target[] = []
  const unsupported = (text: string, bad?: string[]) => [
    ...flaggedSentences(text, bad).map((n) => ({
      n,
      problem: `compte ou nombre sans appui dans les idées citées (${bad!.map((b) => `« ${b} »`).join(', ')})`,
    })),
    ...sentencesOf(text)
      .flat()
      .map((x, i) => (/I\d{4,}/.test(x) ? null : { n: i + 1, problem: 'phrase sans renvoi : ajoute les idées qui la fondent, ou retire-la' }))
      .filter((x): x is { n: number; problem: string } => !!x),
  ]
  for (const g of state.groups) {
    if (!g.summary) continue
    const flags = unsupported(g.summary, g.unverified)
    for (const c of missingCamps(g, ideaById))
      flags.push({
        n: 0,
        problem: `le camp ${c.side === 'positive' ? 'positif' : 'négatif'} (${c.people.length} ${c.people.length > 1 ? 'personnes' : 'personne'} : ${c.ideaIds.join(', ')}) n'est pas cité : ajoute une phrase sur ce qu'il dit`,
      })
    targets.push({ id: `G:${g.id}`, get: () => g.summary, set: (t) => (g.summary = t), allowed: g.ideaIds, flags, addTo: 'last', ...(g.definition ? { definition: g.definition } : {}) })
  }
  for (const t of state.themes)
    if (t.summary)
      targets.push({
        id: `T:${t.id}`,
        get: () => t.summary,
        set: (x) => (t.summary = x),
        allowed: t.groupIds.flatMap((id) => groupById.get(id)?.ideaIds ?? []),
        flags: unsupported(t.summary, t.unverified),
        addTo: 'last',
      })
  if (state.globalSummary) {
    // Le résumé cite une idée par ligne de liste : il peut s'appuyer sur tout le motif de cette idée.
    const cited = state.globalSummary.match(/I\d{4,}/g) ?? []
    const allowed = [...new Set(cited.flatMap((id) => groupOf.get(id)?.ideaIds ?? []))]
    const flags = flaggedSentences(state.globalSummary, state.globalUnverified).map((n) => ({
      n,
      problem: `compte ou nombre sans appui (${state.globalUnverified!.map((b) => `« ${b} »`).join(', ')})`,
    }))
    // Méthode qui le demande : une ligne de forces ou de freins absente du résumé est signalée (ajout), et une ligne « fragile »
    // dont la phrase ne le dit pas aussi. Le moteur complète ; le code ne vérifie que les renvois et les chiffres.
    if (methodOf(state.settings).summaryChecks) {
      const h = highlights(state.groups, ideaById)
      const scale = methodOf(state.settings).scaleInLines === true
      const lang = state.settings.language
      const sentences = sentencesOf(state.globalSummary).flat()
      const lines = methodOf(state.settings).summaryLines ?? 6
      // Les freins d'abord : deux ajouts au plus sont acceptés, et ce sont eux que le résumé oubliait.
      for (const [kind, list] of [['blockers', h.blockers.slice(0, lines)], ['strengths', h.strengths.slice(0, lines)]] as const)
        for (const x of list) {
          const ids = new Set(groupById.get(x.groupId)?.ideaIds ?? [])
          const at = sentences.findIndex((t) => (t.match(/I\d{4,}/g) ?? []).some((id) => ids.has(id)))
          const line = highlightLine(x, kind, lang, scale)
          if (at < 0) {
            allowed.push(...ids)
            flags.push({ n: 0, problem: `la ligne « ${line} » n'est pas reprise : ajoute une phrase qui la dit, avec son mot de l'échelle et son chiffre, et un renvoi à une idée de ce motif` })
          } else if (x.fragile && !/fragile/i.test(sentences[at])) flags.push({ n: at + 1, problem: `la ligne « ${line} » est fragile : écris « fragile » à côté du mot de l'échelle` })
        }
    }
    targets.push({ id: 'R', get: () => state.globalSummary, set: (t) => (state.globalSummary = t), allowed: [...new Set(allowed)], flags, addTo: 'second' })
  }
  if (!targets.length) return
  s.message = 'Vérification des renvois'
  await emit()

  const batches: Target[][] = []
  let cur: Target[] = []
  for (const t of targets) {
    if (cur.length && cur.reduce((n, x) => n + x.allowed.length, 0) + t.allowed.length > methodOf(state.settings).batches.support) {
      batches.push(cur)
      cur = []
    }
    cur.push(t)
  }
  if (cur.length) batches.push(cur)

  const stats = { checked: 0, fixed: 0, dropped: 0, added: 0 }
  const responses = await Promise.all(
    batches.map((batch) =>
      runner.json(
        supportPrompt(
          {
            texts: batch.map((t) => ({
              id: t.id,
              sentences: sentencesOf(t.get())
                .flat()
                .map((text, i) => ({ n: i + 1, text })),
              flags: t.flags.length ? t.flags : undefined,
              ideas: t.allowed.map((id) => {
                const i = ideaById.get(id)!
                return { id, participant: i.participantId, category: i.category, verbatim: shortExample(i.verbatim, 200) }
              }),
              ...(t.definition ? { definition: t.definition } : {}),
            })),
          },
          state.settings,
        ),
        supportSchema,
      ),
    ),
  )
  const fixes = responses.flatMap((r) => r.fixes)
  for (const t of targets) {
    stats.checked += sentencesOf(t.get()).flat().length
    // Une phrase ajoutée ne peut citer que les nombres donnés dans le signalement qui la demande.
    const addNumbers = new Set(t.flags.filter((f) => f.n === 0).flatMap((f) => numbersIn(f.problem.replace(/I\d{4,}/g, '')).map((x) => x.value)))
    const r = applySupport(
      t.get(),
      new Set(t.allowed),
      fixes.filter((f) => f.text === t.id && (f.n > 0 || t.flags.some((x) => x.n === 0))),
      { addNumbers, addTo: t.addTo, personOf: (id) => ideaById.get(id)?.participantId },
    )
    if (r.fixed || r.dropped || r.added) t.set(r.text)
    stats.fixed += r.fixed
    stats.dropped += r.dropped
    stats.added += r.added
  }
  state.support = stats
  s.message = undefined
  await emit()
}

/**
 * Filet final : un motif dont la synthèse ne cite toujours pas un camp d'avis
 * reçoit une phrase écrite par le code, avec ses renvois. Un camp compté dans
 * l'en-tête n'est jamais absent du texte.
 */
function ensureCamps(state: AnalysisState) {
  const ideaById = new Map(state.ideas.map((i) => [i.id, i]))
  for (const g of state.groups) {
    if (!g.summary) continue
    for (const c of missingCamps(g, ideaById)) {
      const n = c.people.length
      const who = n > 1 ? `${NUMBER_WORDS_FR[n] ?? n} personnes` : 'Une personne'
      // L'objet est nommé : ajoutée en fin de texte, « le critiquent » n'a pas d'antécédent sûr.
      const verb = `${n > 1 ? 'portent' : 'porte'} un avis ${c.side === 'positive' ? 'positif' : 'critique'} sur « ${g.title} »`
      const sentence = `${who.charAt(0).toUpperCase()}${who.slice(1)} ${verb} [${c.ideaIds.join(', ')}].`
      g.summary = `${g.summary.trim()} ${sentence}`
      state.campsAdded = (state.campsAdded ?? 0) + 1
    }
  }
}

// ─── Contrôle final des chiffres ─────────────────────────────────────────────

/** Repère, dans chaque synthèse, les nombres et les comptes de personnes que rien n'appuie (sans rien retirer). */
function markUnverified(corpus: Corpus, state: AnalysisState) {
  const ideaById = new Map(state.ideas.map((i) => [i.id, i]))
  const groupById = new Map(state.groups.map((g) => [g.id, g]))
  const quotes = (ids: string[]) => ids.map((id) => ideaById.get(id)!.verbatim)
  // « Trois personnes jugent l'application lente [I3, I15, I30] » : le nombre de personnes
  // derrière les références citées se vérifie aussi.
  const motifOf = new Map(state.groups.flatMap((g) => g.ideaIds.map((id) => [id, g.metrics.participants] as const)))
  const check = (text: string, allowed: Set<number>, strict = false, global = false) => {
    const people = (part: string) => new Set((part.match(/I\d{4,}/g) ?? []).map((id) => ideaById.get(id)?.participantId).filter(Boolean)).size
    // Par référence et par phrase (« Deux personnes pointent X [I1] et Y [I2]. »).
    const counts = [...[...text.matchAll(/\[[^\]]*\]/g)].map((m) => people(m[0])), ...text.split(/(?<=[.!?])\s+/).map(people)]
    for (const n of counts) if (n > 0) allowed.add(n)
    // Un nombre de personnes plus grand que les personnes réellement citées est faux, même s'il existe ailleurs dans les chiffres.
    const personOf = (id: string) => ideaById.get(id)?.participantId
    // Thèmes et résumé : « trois personnes » exige les idées de trois personnes citées dans la phrase.
    // Le résumé ne cite qu'une référence par ligne de liste : elle vaut pour tout son motif.
    const motifSize = global ? (id: string) => motifOf.get(id) ?? 0 : undefined
    const strictPeople = strict ? undercitedPeople(text, personOf, motifSize) : []
    return [
      ...new Set([
        ...unverifiedNumbers(text, allowed),
        ...overcountedPeople(text, personOf),
        ...strictPeople,
        ...vaguePlurals(text, personOf, motifSize),
        ...impliedOthers(text, personOf),
        ...(global ? [] : clauseCounts(text, personOf)),
      ]),
    ]
  }
  for (const g of state.groups) {
    g.unverified = check(g.summary, allowedNumbers([g.metrics], quotes(g.ideaIds)))
    // « Toutes les personnes qui en parlent » couvre chaque personne qui donne un avis sur le motif.
    const opinions = g.metrics.positiveOnly.length + g.metrics.negativeOnly.length + g.metrics.mixed.length
    const all = allClaims(g.summary, (id) => ideaById.get(id)?.participantId, opinions)
    if (all.length) g.unverified = [...new Set([...(g.unverified ?? []), ...all])]
  }
  for (const t of state.themes) {
    const groups = t.groupIds.map((id) => groupById.get(id)!)
    const allowed = allowedNumbers([t.metrics, ...groups.map((g) => g.metrics)], quotes(groups.flatMap((g) => g.ideaIds)))
    allowed.add(groups.length) // « ce thème réunit 7 sujets »
    t.unverified = check(t.summary, allowed, true)
  }
  const all = computeMetrics(state.ideas)
  const allowed = allowedNumbers([all, ...state.themes.map((t) => t.metrics), ...state.groups.map((g) => g.metrics)], quotes(state.ideas.map((i) => i.id)))
  allowed.add(activeParticipants(corpus).length)
  // L'équilibre des avis donné au résumé (méthode « consultation »).
  for (const n of Object.values(opinionBalance(state))) allowed.add(n)
  allowed.add(state.ideas.length)
  allowed.add(state.themes.length)
  allowed.add(state.groups.length)
  // Chiffres fournis au modèle pour le résumé global : motifs portés par un seul participant, et les autres.
  const single = state.groups.filter((g) => g.metrics.participants === 1).length
  allowed.add(single)
  allowed.add(state.groups.length - single)
  const h = highlights(state.groups)
  for (const x of [...h.strengths, ...h.blockers, ...h.divided, ...h.proposals, ...h.questions]) allowed.add(x.people).add(x.of)
  state.globalUnverified = check(state.globalSummary, allowed, true, true)
}

/** Contrôle final : une phrase dont un nombre ou un compte reste sans appui n'est pas livrée ; on la retire et on le note dans la Méthode. */
function verifyNumbers(corpus: Corpus, state: AnalysisState) {
  markUnverified(corpus, state)
  let removed = 0
  // Le signalement ne reste que si la phrase n'a pas pu être retirée.
  const clean = (o: { text: string; bad?: string[] }) => {
    const r = dropSentences(o.text, o.bad)
    removed += r.removed
    return { text: r.text, bad: r.removed ? [] : o.bad }
  }
  for (const g of state.groups) ({ text: g.summary, bad: g.unverified } = clean({ text: g.summary, bad: g.unverified }))
  for (const t of state.themes) ({ text: t.summary, bad: t.unverified } = clean({ text: t.summary, bad: t.unverified }))
  // Une phrase de motif ou de thème restée sans renvoi après la vérification n'est pas livrée : rien ne permet de la contrôler.
  const unreferenced = (text: string) => {
    const r = dropUnreferenced(text)
    removed += r.removed
    return r.text
  }
  // Un texte entre guillemets doit exister tel quel : une réponse, une question posée, ou un titre de motif.
  const known = [
    ...corpus.contributions.flatMap((c) => [c.text, c.prompt ?? '']),
    ...state.groups.map((g) => g.title),
    ...state.themes.map((t) => t.title),
  ].filter(Boolean)
  const quoted = (text: string) => {
    const r = dropInventedQuotes(text, known)
    const d = dropNearDuplicates(r.text)
    removed += r.removed + d.removed
    return d.text
  }
  for (const g of state.groups) g.summary = spellLeadingNumbers(unreferenced(quoted(g.summary)))
  for (const t of state.themes) t.summary = spellLeadingNumbers(unreferenced(quoted(t.summary)))
  state.globalSummary = spellLeadingNumbers(quoted(state.globalSummary))
  ;({ text: state.globalSummary, bad: state.globalUnverified } = clean({ text: state.globalSummary, bad: state.globalUnverified }))
  state.removedSentences = removed
}

const LEADING: Record<string, string> = {
  '2': 'Deux',
  '3': 'Trois',
  '4': 'Quatre',
  '5': 'Cinq',
  '6': 'Six',
  '7': 'Sept',
  '8': 'Huit',
  '9': 'Neuf',
  '10': 'Dix',
  '11': 'Onze',
  '12': 'Douze',
  '13': 'Treize',
  '14': 'Quatorze',
  '15': 'Quinze',
  '16': 'Seize',
  '20': 'Vingt',
}

/** Un nombre en tête de phrase s'écrit en lettres (« Trois personnes… ») : règle typographique appliquée par le code, pas laissée au moteur. */
export function spellLeadingNumbers(text: string): string {
  return text.replace(/(^|[.!?]\s+|\n\s*\n)(\d{1,2})(?= )/g, (all, before: string, n: string) => (LEADING[n] ? `${before}${LEADING[n]}` : all))
}

/**
 * Phrase qui s'appuie sur la précédente (pronom ou connecteur en tête : « Elles… », « À l'inverse… »,
 * « Une troisième… », « Six dénoncent en revanche… ») : retirée avec elle, sinon elle ne renvoie plus à rien.
 */
const DEPENDENT =
  /^(?:Elles?|Ils|Celles?-ci|Ceux-ci|Celui-ci|Cette dernière|Ce dernier|Ces derniers|Ces dernières|Cette personne|Celle-là|Celui-là|La seconde|Le second|La première|Le premier|L['’]une|L['’]un|Une autre|Un autre|D['’]autres|Les autres|Une (?:deuxième|seconde|troisième|quatrième)|Un (?:deuxième|second|troisième)|À l['’]inverse|Au contraire|En revanche|Enfin|Aussi|De plus|En outre|Toutefois|Cependant|Pourtant|Par ailleurs|Mais|Néanmoins|De même)(?![\p{L}])|^(?:\S+\s+){1,3}(?:en revanche|à l['’]inverse|quant à elles?|quant à eux)(?![\p{L}])/iu
function dropWithDependents(sentences: string[], drop: (s: string) => boolean): string[] {
  const out: string[] = []
  let previousDropped = false
  for (const s of sentences) {
    previousDropped = drop(s) || (previousDropped && DEPENDENT.test(s.trim()))
    if (!previousDropped) out.push(s)
  }
  return out
}

const contentWords = (s: string) => new Set(s.toLowerCase().replace(/\[[^\]]*\]/g, '').match(/\p{L}{4,}/gu) ?? [])
/** Deux phrases presque identiques (même seuil que l'audit) : la seconde n'apporte rien. */
function nearDuplicate(a: string, b: string): boolean {
  const x = contentWords(a)
  const y = contentWords(b)
  if (Math.min(x.size, y.size) <= 5) return false
  return [...x].filter((w) => y.has(w)).length / Math.min(x.size, y.size) > 0.7
}
/** Retire une phrase qui en répète une précédente du même texte (un modèle léger se répète parfois). */
export function dropNearDuplicates(text: string): { text: string; removed: number } {
  if (!text) return { text, removed: 0 }
  const seen: string[] = []
  const paragraphs = sentencesOf(text).map((p) =>
    p.filter((s) => {
      if (seen.some((x) => nearDuplicate(x, s))) return false
      seen.push(s)
      return true
    }),
  )
  const removed = sentencesOf(text).flat().length - paragraphs.flat().length
  return removed ? { text: paragraphs.map((p) => p.join(' ')).filter(Boolean).join('\n\n'), removed } : { text, removed: 0 }
}

/** Retire les phrases sans renvoi, paragraphe par paragraphe, sans jamais vider le texte. */
export function dropUnreferenced(text: string): { text: string; removed: number } {
  if (!text || !/I\d{4,}/.test(text)) return { text, removed: 0 }
  const paragraphs = sentencesOf(text)
  const keptParts = paragraphs.map((p) => dropWithDependents(p, (x) => !/I\d{4,}/.test(x)))
  const removed = paragraphs.flat().length - keptParts.flat().length
  return { text: keptParts.map((p) => p.join(' ')).filter(Boolean).join('\n\n'), removed }
}

/** Retire les phrases qui mettent entre guillemets un texte de trois mots ou plus introuvable dans `known`. */
export function dropInventedQuotes(text: string, known: string[]): { text: string; removed: number } {
  if (!text || !/[«"“]/.test(text)) return { text, removed: 0 }
  const invented = (sentence: string) =>
    [...sentence.matchAll(/[«"“]\s*([^»"”]+?)\s*[»"”]/g)].some(
      ([, q]) => q.split(/\s+/).length >= 3 && !known.some((k) => locateQuote(k, q)),
    )
  // La ponctuation d'une citation (« … ? ») ne coupe pas la phrase.
  const MARKS: Record<string, string> = { '.': '\uE000', '!': '\uE001', '?': '\uE002' }
  const protect = (t: string) => t.replace(/[«"“][^»"”]*[»"”]/g, (q) => q.replace(/[.!?]/g, (m) => MARKS[m]))
  const restore = (t: string) => t.replace(/[\uE000-\uE002]/g, (m) => Object.keys(MARKS).find((k) => MARKS[k] === m)!)
  const paragraphs = sentencesOf(protect(text)).map((p) => p.map(restore))
  const kept = paragraphs.map((p) => dropWithDependents(p, invented))
  const removed = paragraphs.flat().length - kept.flat().length
  if (!removed || !kept.flat().length) return { text, removed: 0 }
  return { text: kept.map((p) => p.join(' ')).filter(Boolean).join('\n\n'), removed }
}

/** Retire les phrases qui contiennent l'un des nombres signalés. */
export function dropSentences(text: string, bad?: string[]): { text: string; removed: number } {
  if (!bad?.length || !text) return { text, removed: 0 }
  const has = (s: string) => bad.some((b) => new RegExp(`(?<![\\p{L}\\p{N}])${b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'iu').test(s))
  // Paragraphe par paragraphe : le résumé en trois temps garde ses paragraphes.
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim().split(/(?<=[.!?])\s+/))
  const total = paragraphs.flat().length
  const keptParts = paragraphs.map((p) => dropWithDependents(p, has))
  const kept = keptParts.map((p) => p.join(' ')).filter(Boolean)
  const keptCount = keptParts.flat().length
  // Si toutes les phrases tombaient, on garde le texte : mieux vaut un signalement qu'une synthèse vide.
  if (!keptCount) return { text, removed: 0 }
  return { text: kept.join('\n\n'), removed: total - keptCount }
}

export { sortIds }
