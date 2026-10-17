import { CircleCheck, CircleHelp, Download, FileCode2, Lightbulb, OctagonAlert, Printer, Quote, Save, Scale, Users } from 'lucide-react'
import { Fragment, useEffect, useMemo, useState, type ReactElement } from 'react'
import { createPortal } from 'react-dom'
import { computeMetrics, METRICS_VERSION, withCurrentMetrics } from '@/core/analysis/metrics'
import { maskNames } from '@/core/analysis/names'
import { describeTheme } from '@/core/analysis/pipeline'
import {
  bothSides,
  categoryHeading,
  dominantVoice,
  engineName,
  highlightSections,
  summaryDoubts,
  metricsLine,
  originOf,
  personLines,
  shortAnswerContext,
  fullQuestionIds,
  displayOrder,
  reportToHtml,
  reportToMarkdown,
  stanceTitle,
} from '@/core/analysis/report'
import { corpusHash } from '@/core/analysis/pipeline'
import type { AnalysisState, Group, Idea, IdeaCategory, Metrics } from '@/core/analysis/types'
import type { Contribution } from '@/core/corpus'
import { corpusForAnalysis, type Project } from '@/core/project'
import { isExample } from '../Synthesis'
import { TAB_ACTIONS } from './slots'
import { CATEGORY, CATEGORY_ORDER, download, formatDate, plural, slug } from '../format'
import { Alert, Badge, Card, CardContent, CardHeader, CardTitle, Disclosure, DropMenu, MenuItem, MenuSection, Explain, Tooltip } from '../primitives'
import { DOUBT_HELP, FRAGILE_HELP, helpText, labelled, LIMITS_HELP, MINORITY_HELP, type LabelHelp } from '@/core/analysis/glossary'
import { fragileShown, labelDoubt } from '@/core/analysis/highlights'

/** Classes écrites en entier : Tailwind ne génère pas une classe construite à la volée. */
const BORDER: Record<IdeaCategory, string> = {
  positive: 'border-positive',
  negative: 'border-negative',
  suggestion: 'border-suggestion',
  question: 'border-question',
  neutral: 'border-neutral',
}

interface Ctx {
  ideaById: Map<string, Idea>
  contributionById: Map<string, Contribution>
  /** Participants retenus par le filtre de segment (tous si null). */
  segment: Set<string> | null
  /** Masque les prénoms des particuliers dans ce qui est affiché. */
  mask: (text: string) => string
  /** D'où vient un verbatim : Q1… pour un questionnaire, la source et le moment pour un entretien. */
  origin: (contributionId: string) => string | undefined
  sourceName: (contributionId: string) => string | undefined
  /** La question à donner après une réponse courte qui est toute la réponse (sinon rien). */
  context: (idea: Idea) => string | undefined
}

/** Chaque section calculée a sa couleur et son pictogramme : on s'y repère sans lire. */
const SECTION_LOOK = {
  strengths: {
    line: 'border-positive',
    icon: CircleCheck,
    text: 'text-positive',
    top: 'border-t-positive',
  },
  blockers: {
    line: 'border-negative',
    icon: OctagonAlert,
    text: 'text-negative',
    top: 'border-t-negative',
  },
  divided: {
    line: 'border-warning',
    icon: Scale,
    text: 'text-warning',
    top: 'border-t-warning',
  },
  proposals: {
    line: 'border-suggestion',
    icon: Lightbulb,
    text: 'text-suggestion',
    top: 'border-t-suggestion',
  },
  questions: {
    line: 'border-question',
    icon: CircleHelp,
    text: 'text-question',
    top: 'border-t-question',
  },
} as const

/** Une marque de méthode qui s'explique au survol et au focus clavier : ce qu'elle veut dire, pourquoi, quoi faire. */
function Help({ help, lead, children }: { help: LabelHelp | string; lead?: string; children: ReactElement }) {
  // Un intitulé qui dit déjà ce que veut dire la marque (lead) dispense de le redire : restent le pourquoi et l'action.
  const text = typeof help === 'string' ? help : lead ? helpText({ ...help, what: '' }) : helpText(help)
  return (
    <Explain content={lead ? `${lead} ${text}` : text}>{children}</Explain>
  )
}

function stanceBadge(m: Metrics) {
  return <Help help={stanceTitle(m)}>{stanceBadgeOnly(m)}</Help>
}

function stanceBadgeOnly(m: Metrics) {
  const tone = m.majority === 'positive' ? 'positive' : 'negative'
  const pol = m.majority === 'positive' ? 'positif' : 'négatif'
  const fem = m.majority === 'positive' ? 'positive' : 'négative'
  // « Fragile » : une seule voix qui change de camp changerait l'étiquette.
  const fragile = fragileShown(m) ? ' · fragile' : ''
  if (m.stance === 'unanimous')
    return (
      <Badge tone={tone}>
        Avis {pol} unanime{fragile}
      </Badge>
    )
  if (m.stance === 'consensus')
    return (
      <Badge tone={tone}>
        Large majorité {fem}
        {fragile}
      </Badge>
    )
  if (m.stance === 'majority')
    return (
      <Badge tone={tone}>
        Majorité {fem}
        {fragile}
      </Badge>
    )
  if (m.stance === 'lean') return <Badge tone="outline">Pas de majorité{fragile}</Badge>
  if (m.stance === 'divided') return <Badge tone="warning">Avis partagés</Badge>
  if (m.stance === 'thin') return <Badge tone="outline">Peu d'avis</Badge>
  // Seulement des suggestions, questions ou constats : personne n'a donné d'avis sur le motif.
  return <Badge tone="outline">Pas d'avis</Badge>
}

/** Barre empilée en participants : avis positifs, mitigés, négatifs. */
function OpinionBar({ m }: { m: Metrics }) {
  const pos = m.positiveOnly.length
  const mix = m.mixed.length
  const neg = m.negativeOnly.length
  const total = pos + mix + neg
  if (!total) return <div className="h-2 rounded-full bg-muted" aria-hidden />
  // Rapportée à tous les participants du motif : la part grise, ce sont ceux qui proposent ou constatent sans juger.
  const all = Math.max(total, m.participants)
  const w = (n: number) => `${(n / all) * 100}%`
  return (
    <div
      className="flex h-2 overflow-hidden rounded-full bg-muted"
      role="img"
      aria-label={`Participants : ${plural(pos, 'positif')}, ${plural(mix, 'mitigé')}, ${plural(neg, 'négatif')}, ${all - total} sans avis`}
    >
      <div className="bg-positive" style={{ width: w(pos) }} />
      <div className="bg-warning" style={{ width: w(mix) }} />
      <div className="bg-negative" style={{ width: w(neg) }} />
    </div>
  )
}

/**
 * Affiche un texte en rendant cliquables les références [I0001, I0002] : un
 * clic déplie les verbatims juste en dessous, sans quitter la lecture.
 */
function CitedText({ text, ctx }: { text: string; ctx: Ctx }) {
  // Un texte rédigé peut compter plusieurs paragraphes (le résumé en trois temps).
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim())
  if (paragraphs.length > 1)
    return (
      <div className="space-y-3">
        {paragraphs.map((p, i) => (
          <CitedParagraph key={i} text={p.trim()} ctx={ctx} />
        ))}
      </div>
    )
  return <CitedParagraph text={text} ctx={ctx} />
}

function CitedParagraph({ text, ctx }: { text: string; ctx: Ctx }) {
  const [open, setOpen] = useState<number | null>(null)
  const parts = text.split(/(\[I\d{4,}(?:\s*,\s*I\d{4,})*\])/g)
  const refs = parts.map((part) => {
    const m = part.match(/^\[(.*)\]$/)
    return m ? m[1].split(/\s*,\s*/).filter((id) => ctx.ideaById.has(id)) : null
  })
  return (
    <div>
      <p className="leading-relaxed">
        {parts.map((part, i) => {
          const ids = refs[i]
          if (!ids) return <Fragment key={i}>{ctx.mask(part)}</Fragment>
          if (!ids.length) return null
          const isOpen = open === i
          return (
            <Tooltip key={i} wide side="top" content={<QuotesPreview ids={ids} ctx={ctx} />}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className={`mx-0.5 inline-flex min-h-6 cursor-pointer items-center gap-0.5 rounded-full px-2 py-0 align-baseline text-sm font-medium sm:min-h-0 sm:px-1.5 ${
                  isOpen ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground'
                }`}
                aria-label={`${isOpen ? 'Masquer' : 'Voir'} ${plural(ids.length, 'verbatim')}`}
              >
                <Quote className="size-3" />
                {ids.length}
              </button>
            </Tooltip>
          )
        })}
      </p>
      {open !== null && refs[open] && <QuotesPanel ids={refs[open]!} ctx={ctx} onClose={() => setOpen(null)} />}
    </div>
  )
}

/** Place ses enfants sur la barre des onglets de l'étude (à droite des onglets). */
function TabActions({ children }: { children: React.ReactNode }) {
  const [slot, setSlot] = useState<HTMLElement | null>(null)
  useEffect(() => setSlot(document.getElementById(TAB_ACTIONS)), [])
  return slot ? createPortal(<div className="no-print flex flex-wrap items-center gap-2">{children}</div>, slot) : null
}

/** Au survol d'une référence : les passages qui fondent la phrase, dans leur texte d'origine. */
function QuotesPreview({ ids, ctx }: { ids: string[]; ctx: Ctx }) {
  const ideas = ids.map((id) => ctx.ideaById.get(id)).filter((i): i is Idea => !!i)
  return (
    <div className="space-y-3">
      {ideas.map((idea) => (
        <SourceContext key={idea.id} idea={idea} ctx={ctx} excerpt={ideas.length > 1 ? 90 : 180} />
      ))}
      <p className="text-xs text-muted-foreground">Cliquer pour garder ces passages ouverts.</p>
    </div>
  )
}

/** Les verbatims d'une référence, dépliés sur place, avec leur contexte. */
function QuotesPanel({ ids, ctx, onClose }: { ids: string[]; ctx: Ctx; onClose: () => void }) {
  return (
    <div className="mt-2 space-y-2">
      {ids.map((id) => {
        const idea = ctx.ideaById.get(id)
        return idea ? <SourceContext key={id} idea={idea} ctx={ctx} card /> : null
      })}
      <button type="button" onClick={onClose} className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
        Replier
      </button>
    </div>
  )
}

/** Ce qui précède ou suit le passage cité, raccourci à une coupure de mot : on garde le fil sans noyer la citation. */
function clip(text: string, max: number, side: 'before' | 'after'): string {
  if (text.length <= max) return text
  if (side === 'before') {
    const cut = text.slice(-max)
    return `…${cut.slice(cut.indexOf(' ') + 1)}`
  }
  const cut = text.slice(0, max)
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`
}

/**
 * Un verbatim dans son texte d'origine : qui parle, d'où (source, question),
 * puis le texte, le passage cité en gras et le reste en gris. `excerpt`
 * raccourcit ce qui entoure la citation (bulle de survol) ; `card` l'encadre
 * (panneau ouvert au clic).
 */
function SourceContext({ idea, ctx, excerpt, card = false }: { idea: Idea; ctx: Ctx; excerpt?: number; card?: boolean }) {
  const c = ctx.contributionById.get(idea.contributionId)
  const pieces: { text: string; marked: boolean }[] = []
  if (c) {
    let pos = 0
    for (const p of idea.parts ?? [idea.span]) {
      if (p.start > pos) pieces.push({ text: c.text.slice(pos, p.start), marked: false })
      pieces.push({ text: c.text.slice(p.start, p.end), marked: true })
      pos = p.end
    }
    pieces.push({ text: c.text.slice(pos), marked: false })
    if (excerpt) {
      const last = pieces.length - 1
      if (!pieces[0].marked) pieces[0] = { text: clip(pieces[0].text, excerpt, 'before'), marked: false }
      if (!pieces[last].marked) pieces[last] = { text: clip(pieces[last].text, excerpt, 'after'), marked: false }
    }
  }
  const where = c ? [ctx.sourceName(c.id), ctx.origin(c.id)].filter((x, i, a) => x && a.indexOf(x) === i) : []
  return (
    <div className={`space-y-2 border-l-[3px] pl-3 ${BORDER[idea.category]} ${card ? 'rounded-r-lg border-y border-r bg-card py-3 pr-3 shadow-sm' : ''}`}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span className="font-semibold text-foreground">{idea.participantId}</span>
        <Badge tone={CATEGORY[idea.category].tone}>{CATEGORY[idea.category].label}</Badge>
        {where.length > 0 && <span className="text-muted-foreground">{where.join(' · ')}</span>}
      </div>
      {c?.prompt && <p className="text-sm font-medium text-muted-foreground">« {c.prompt.replace(/^[^\p{L}\p{N}]+/u, '')} »</p>}
      {c ? (
        <p className="whitespace-pre-wrap text-base leading-relaxed text-muted-foreground">
          {pieces.map((x, i) =>
            x.marked ? (
              <mark key={i} className="bg-transparent font-semibold text-foreground">
                {ctx.mask(x.text)}
              </mark>
            ) : (
              <Fragment key={i}>{ctx.mask(x.text)}</Fragment>
            ),
          )}
        </p>
      ) : (
        <>
          <p className="text-base">«&nbsp;{ctx.mask(idea.verbatim)}&nbsp;»</p>
          <p className="text-sm text-muted-foreground">Sa source a été retirée de la synthèse depuis ce rapport : le texte d'origine n'est plus disponible.</p>
        </>
      )}
    </div>
  )
}

/** Nombres de la synthèse que le code n'a pas pu rattacher à un chiffre calculé ou cité. */
function Unverified({ items }: { items?: string[] }) {
  if (!items?.length) return null
  return (
    <p className="text-sm text-muted-foreground">
      <span className="rounded bg-warning/30 px-1 font-medium">À vérifier</span> {items.map((x) => `« ${x} »`).join(', ')} ne correspond
      {items.length > 1 ? 'ent' : ''} à aucun chiffre calculé ni cité.
    </p>
  )
}

function GroupBlock({ group, ctx, headingLevel }: { group: Group; ctx: Ctx; headingLevel: 'h3' | 'h4' }) {
  const ideas = group.ideaIds.map((id) => ctx.ideaById.get(id)!).filter((i) => !ctx.segment || ctx.segment.has(i.participantId))
  const m = ctx.segment ? computeMetrics(ideas) : group.metrics
  const both = bothSides(ideas)
  const full = fullQuestionIds(displayOrder(ideas, m, CATEGORY_ORDER), ctx.context)
  // La mention « à vérifier » vaut pour le motif entier : elle se tait quand on regarde un segment.
  const doubt = ctx.segment ? undefined : labelDoubt(group, ctx.ideaById)
  if (!ideas.length) return null
  const H = headingLevel
  return (
    <Disclosure
      summary={
        <span className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
          <H className="text-base font-semibold">{group.title}</H>
          <span className="flex flex-wrap items-center gap-2">
            <span className="block w-14 sm:w-20">
              <OpinionBar m={m} />
            </span>
            <span className="text-sm text-muted-foreground">
              <Users className="mr-0.5 inline size-3" />
              {m.participants}
            </span>
            {stanceBadge(m)}
            {m.minority && (
              <Help help={MINORITY_HELP}>
                <Badge tone="suggestion">Minorité constante</Badge>
              </Help>
            )}
            {doubt && (
              <Help help={DOUBT_HELP} lead={`${doubt.charAt(0).toUpperCase()}${doubt.slice(1)}.`}>
                <Badge tone="warning">À vérifier</Badge>
              </Help>
            )}
          </span>
        </span>
      }
    >
      <div className="space-y-3 text-base">
        <div className="max-w-sm">
          <OpinionBar m={m} />
        </div>
        <p className="text-sm text-muted-foreground">{metricsLine(m)}</p>
        {dominantVoice(ideas) && <p className="text-sm text-muted-foreground">{dominantVoice(ideas)}</p>}
        {group.summary && !ctx.segment && (
          <>
            <CitedText text={group.summary} ctx={ctx} />
            <Unverified items={group.unverified} />
          </>
        )}
        {m.minority && <MinorityNote minority={m.minority} ctx={ctx} />}
        <div className="grid gap-3 md:grid-cols-2">
          {CATEGORY_ORDER.map((cat) => {
            const items = ideas.filter((i) => i.category === cat)
            if (!items.length) return null
            const lines = personLines(items)
            const polar = cat === 'positive' || cat === 'negative'
            return (
              <div key={cat} className="space-y-1.5">
                <p className="text-sm font-semibold">
                  <Badge tone={CATEGORY[cat].tone} className="text-sm">
                    {categoryHeading(
                      cat,
                      lines.map((l) => l.participantId),
                      both,
                    )}
                  </Badge>
                </p>
                <ul className="space-y-1.5">
                  {lines.map((l) => (
                    <PersonLine key={l.participantId} line={l} cat={cat} other={polar && both.has(l.participantId)} full={full} ctx={ctx} />
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
        {both.size > 0 && <p className="text-sm text-muted-foreground">* Personne qui s'exprime aussi dans l'autre sens sur ce motif.</p>}
      </div>
    </Disclosure>
  )
}

/**
 * Une personne, une ligne : ses verbatims à la suite. Un clic sur un verbatim
 * l'affiche dans son texte d'origine.
 */
function PersonLine({
  line,
  cat,
  other,
  full,
  ctx,
}: {
  line: { participantId: string; ideas: Idea[] }
  cat: IdeaCategory
  other: boolean
  /** Idées dont la question est donnée en entier (la première réponse courte à cette question dans le motif). */
  full: Set<string>
  ctx: Ctx
}) {
  const [open, setOpen] = useState<string | null>(null)
  return (
    <li
      className={`flex gap-2 border-l-[3px] py-0.5 pl-2.5 ${BORDER[cat]}`}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) setOpen(null)
      }}
    >
      <span className="w-9 shrink-0 pt-px text-sm font-semibold text-muted-foreground">
        {line.participantId}
        {other && ' *'}
      </span>
      <div className="min-w-0 flex-1">
        {line.ideas.map((i, k) => {
          const where = ctx.origin(i.contributionId)
          // Une réponse courte qui est toute la réponse (« Les tarifs ») ne dit son sens qu'avec sa question.
          const question = full.has(i.id) ? ctx.context(i) : undefined
          const origin = question ? `— ${where ? `${where}, ` : ''}en réponse à «\u00a0${question}\u00a0»` : where ? `(${where})` : ''
          return (
            <Fragment key={i.id}>
              <span>
                <Tooltip wide side="top" content={<SourceContext idea={i} ctx={ctx} excerpt={180} />}>
                  <button
                    type="button"
                    className="cursor-pointer text-left underline-offset-4 hover:underline"
                    aria-expanded={open === i.id}
                    onClick={() => setOpen(open === i.id ? null : i.id)}
                  >
                    «&nbsp;{ctx.mask(i.verbatim)}&nbsp;»
                  </button>
                </Tooltip>
                {origin && <span className="text-sm text-muted-foreground"> {origin}</span>}
                {k < line.ideas.length - 1 && ' ;'}
              </span>{' '}
            </Fragment>
          )
        })}
        {open && (
          <div className="mt-2 space-y-1">
            <SourceContext idea={line.ideas.find((i) => i.id === open)!} ctx={ctx} card />
            <button type="button" onClick={() => setOpen(null)} className="mt-1 cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              Replier
            </button>
          </div>
        )}
      </div>
    </li>
  )
}

function MinorityNote({ minority, ctx }: { minority: NonNullable<Metrics['minority']>; ctx: Ctx }) {
  const [open, setOpen] = useState(false)
  return (
    <Alert tone="info" className="text-sm">
      Minorité constante ({minority.side === 'positive' ? 'avis positifs' : 'avis négatifs'}) : {minority.participantIds.join(', ')}.{' '}
      <button className="cursor-pointer text-primary underline" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? 'Masquer leurs verbatims' : 'Voir leurs verbatims'}
      </button>
      {open && <QuotesPanel ids={minority.ideaIds} ctx={ctx} onClose={() => setOpen(false)} />}
    </Alert>
  )
}

/**
 * Un thème réunit des motifs différents : on n'y affiche ni consensus ni
 * désaccord global, seulement le nombre de motifs et ceux aux avis partagés.
 */
function ThemeBadges({ groups }: { groups: { metrics: Metrics }[] }) {
  const divided = groups.filter((g) => g.metrics.stance === 'divided').length
  return (
    <>
      <Badge tone="outline">{plural(groups.length, 'motif')}</Badge>
      {divided > 0 && <Badge tone="warning">{divided} aux avis partagés</Badge>}
    </>
  )
}

export function ReportTab({ project, analysis: saved, onSaveStudy }: { project: Project; analysis: AnalysisState; onSaveStudy?: () => void }) {
  const analysis = useMemo(() => withCurrentMetrics(saved), [saved])
  const corpus = corpusForAnalysis(project)
  // Un rapport dont les données ont changé (source retirée…) le dit, ici aussi : l'étude s'ouvre souvent directement sur le rapport.
  const [currentHash, setCurrentHash] = useState<string | null>(null)
  useEffect(() => {
    corpusHash(corpus).then(setCurrentHash)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project])
  const stale = currentHash !== null && currentHash !== analysis.corpusHash
  // À l'impression, tout est déplié : sinon les verbatims des motifs fermés disparaîtraient du PDF.
  useEffect(() => {
    let closed: HTMLDetailsElement[] = []
    const before = () => {
      closed = [...document.querySelectorAll<HTMLDetailsElement>('article details:not([open])')]
      closed.forEach((d) => (d.open = true))
    }
    const after = () => closed.forEach((d) => (d.open = false))
    window.addEventListener('beforeprint', before)
    window.addEventListener('afterprint', after)
    return () => {
      window.removeEventListener('beforeprint', before)
      window.removeEventListener('afterprint', after)
    }
  }, [])
  const attributes = useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const p of corpus.participants) for (const [k, v] of Object.entries(p.attributes)) map.set(k, (map.get(k) ?? new Set()).add(v))
    return [...map].filter(([, vals]) => vals.size > 1 && vals.size <= 12).map(([k, vals]) => ({ key: k, values: [...vals].sort() }))
  }, [corpus.participants])
  const [segmentKey, setSegmentKey] = useState('')
  const [segmentValue, setSegmentValue] = useState('')

  const segment = useMemo(() => {
    if (!segmentKey || !segmentValue) return null
    return new Set(corpus.participants.filter((p) => p.attributes[segmentKey] === segmentValue).map((p) => p.id))
  }, [segmentKey, segmentValue, corpus.participants])

  const [maskChoice, setMaskChoice] = useState<boolean | null>(null)
  const names = analysis.names ?? []
  const masked = (maskChoice ?? analysis.settings.maskNames === true) && names.length > 0
  // Les exports suivent ce qui est affiché à l'écran.
  const view: AnalysisState = {
    ...analysis,
    settings: { ...analysis.settings, maskNames: masked },
  }
  const ctx: Ctx = {
    ideaById: new Map(analysis.ideas.map((i) => [i.id, i])),
    contributionById: new Map(corpus.contributions.map((c) => [c.id, c])),
    segment,
    mask: (t) => (masked ? maskNames(t, names) : t),
    origin: originOf(corpus),
    context: shortAnswerContext(corpus),
    sourceName: (id) => {
      const c = corpus.contributions.find((x) => x.id === id)
      return corpus.sources.find((src) => src.id === c?.sourceId)?.name
    },
  }
  const sectionsHL = highlightSections(view)
  const groupById = new Map(analysis.groups.map((g) => [g.id, g]))
  const sections = analysis.themes.length
    ? analysis.themes.map((t) => ({
        id: t.id,
        title: t.title,
        summary: t.summary,
        unverified: t.unverified,
        metrics: t.metrics,
        groups: t.groupIds.map((id) => groupById.get(id)!),
      }))
    : null

  const filteredMetrics = (ideaIds: string[], fallback: Metrics) =>
    segment ? computeMetrics(ideaIds.map((id) => ctx.ideaById.get(id)!).filter((i) => segment.has(i.participantId))) : fallback
  /** Les motifs d'un thème, avec leurs chiffres recalculés pour le segment choisi. */
  const shownGroups = (groups: Group[]) => groups.map((g) => ({ metrics: filteredMetrics(g.ideaIds, g.metrics) })).filter((g) => g.metrics.participants > 0)
  const overview = (
    sections ??
    analysis.groups.map((g) => ({
      id: g.id,
      title: g.title,
      summary: g.summary,
      metrics: g.metrics,
      groups: [g],
    }))
  ).map((s) => ({
    ...s,
    subGroups: shownGroups(s.groups),
    shown: filteredMetrics(
      s.groups.flatMap((g) => g.ideaIds),
      s.metrics,
    ),
  }))
  const all = segment ? computeMetrics(analysis.ideas.filter((i) => segment.has(i.participantId))) : computeMetrics(analysis.ideas)
  const title = project.name
  const simulated = analysis.engine.presetId === 'simulation'

  return (
    <article className="space-y-6">
      <p className="text-base text-muted-foreground">
        Rapport du {formatDate(analysis.updatedAt)} · {plural(all.participants, 'participant')} · {plural(all.mentions, 'occurrence')}
        {names.length > 0 &&
          (masked
            ? ` · ${plural(names.length, 'prénom')} cité${names.length > 1 ? 's' : ''} ${names.length > 1 ? 'masqués' : 'masqué'}`
            : ` · verbatims tels quels, ${plural(names.length, 'prénom')} compris`)}
        {segment && ` · chiffres recalculés pour ${plural(segment.size, 'participant')}, synthèses rédigées masquées`}
      </p>

      {/* Les actions du rapport rejoignent la barre des onglets : filtrer, masquer, exporter. */}
      <TabActions>
        {attributes.length > 0 && (
          <span className="flex max-w-full flex-wrap items-center gap-1">
            <DropMenu ariaLabel="Afficher un segment" icon={<Users />} label={segmentKey || 'Tous les participants'} align="left" width="w-64">
              {(close) => (
                <>
                  <MenuSection>Afficher un segment</MenuSection>
                  <MenuItem
                    label="Tous les participants"
                    checked={!segmentKey}
                    onSelect={() => {
                      setSegmentKey('')
                      setSegmentValue('')
                      close()
                    }}
                  />
                  {attributes.map((a) => (
                    <MenuItem
                      key={a.key}
                      label={a.key}
                      hint={plural(a.values.length, 'valeur')}
                      checked={segmentKey === a.key}
                      onSelect={() => {
                        setSegmentKey(a.key)
                        setSegmentValue('')
                        close()
                      }}
                    />
                  ))}
                </>
              )}
            </DropMenu>
            {segmentKey && (
              <DropMenu ariaLabel="Valeur du segment" label={segmentValue || 'Choisir une valeur'} align="left" width="w-64">
                {(close) =>
                  attributes
                    .find((a) => a.key === segmentKey)
                    ?.values.map((v) => (
                      <MenuItem
                        key={v}
                        label={v}
                        checked={segmentValue === v}
                        onSelect={() => {
                          setSegmentValue(v)
                          close()
                        }}
                      />
                    ))
                }
              </DropMenu>
            )}
          </span>
        )}
        {names.length > 0 && (
          <Tooltip content="Remplace les prénoms cités dans les réponses par « [prénom] », à l'écran et dans les exports. Les verbatims restent sinon tels quels.">
            <label className="flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-input bg-card px-2.5 text-sm">
              <input type="checkbox" checked={masked} onChange={() => setMaskChoice(!masked)} />
              Masquer les prénoms
            </label>
          </Tooltip>
        )}
        <DropMenu icon={<Download />} label="Exporter">
          {(close) => {
            const run = (f: () => void) => () => {
              close()
              f()
            }
            return (
              <>
                <MenuSection>Le rapport</MenuSection>
                <MenuItem
                  icon={<Download className="size-4" />}
                  label="Markdown"
                  hint="Texte structuré, à coller dans un wiki ou un document partagé."
                  onSelect={run(() => download(`${slug(title)}.md`, reportToMarkdown(view, corpus, title, { stale }), 'text/markdown'))}
                />
                <MenuItem
                  icon={<FileCode2 className="size-4" />}
                  label="Page HTML"
                  hint="Une page autonome, à ouvrir dans un navigateur ou à envoyer."
                  onSelect={run(() => download(`${slug(title)}.html`, reportToHtml(view, corpus, title, { stale }), 'text/html'))}
                />
                <MenuItem
                  icon={<Printer className="size-4" />}
                  label="PDF"
                  hint="Ouvre l'impression : choisissez « Enregistrer au format PDF »."
                  onSelect={run(() => window.print())}
                />
                {onSaveStudy && (
                  <>
                    <MenuSection>Toute la synthèse</MenuSection>
                    <MenuItem
                      icon={<Save className="size-4" />}
                      label="Sauvegarder la synthèse"
                      hint="Données, réglages, analyse et rapport dans un fichier, à rouvrir ici ou sur un autre ordinateur."
                      onSelect={run(onSaveStudy)}
                    />
                  </>
                )}
              </>
            )
          }}
        </DropMenu>
      </TabActions>

      {stale && (
        <Alert tone="warning">
          Les données ont changé depuis ce rapport (source ajoutée, retirée ou questions modifiées). Il reste consultable, mais relancez l'analyse dans l'onglet
          Analyse pour qu'il en tienne compte.
        </Alert>
      )}
      {analysis.engine.presetId === 'bridge' && (
        <Alert tone="info">
          {isExample(project)
            ? `Rapport d'exemple : produit une fois par un vrai moteur d'IA (${analysis.engine.model}) à partir d'un questionnaire fictif, puis conservé tel quel. Pour vos propres données, choisissez un moteur dans « Moteurs d'IA ».`
            : `Rapport produit hors de l'application par un vrai moteur d'IA (${analysis.engine.model}), puis importé avec la synthèse.`}
        </Alert>
      )}
      {simulated && (
        <Alert tone="warning">
          Rapport de démonstration : produit par le moteur de simulation, son contenu est fictif. Configurez un vrai moteur d'IA pour analyser vos données.
        </Alert>
      )}

      {analysis.globalSummary && !segment && (
        <section aria-labelledby="resume" className="space-y-2">
          <h2 id="resume" className="text-xl font-semibold">
            Résumé
          </h2>
          <div className="max-w-3xl text-base">
            <CitedText text={analysis.globalSummary} ctx={ctx} />
            <Unverified items={analysis.globalUnverified} />
            {summaryDoubts(sectionsHL) && <p className="mt-2 text-sm text-muted-foreground">{summaryDoubts(sectionsHL)}</p>}
          </div>
        </section>
      )}

      {!segment && sectionsHL.length > 0 && (
        <section aria-labelledby="saillants" className="space-y-3">
          <h2 id="saillants" className="sr-only">
            Faits saillants
          </h2>
          {/* Colonnes plutôt que grille : des cartes de hauteurs inégales ne laissent pas de trou. */}
          <div className="gap-3 md:columns-2">
            {sectionsHL.map((sec) => {
              const look = SECTION_LOOK[sec.key]
              const Icon = look.icon
              return (
                <Card key={sec.key} className={`mb-3 break-inside-avoid border-t-4 ${look.top}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Icon className={`size-4 ${look.text}`} aria-hidden />
                      {sec.heading}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {sec.intro && <p className="mb-2 text-sm text-muted-foreground">{sec.intro}</p>}
                    <ul className="space-y-2 text-base">
                      {sec.items.map((x) => (
                        <li key={x.title} className={`border-l-[3px] pl-2.5 ${look.line}`}>
                          <span className="font-medium">{x.title}</span>
                          <span className="block text-sm text-muted-foreground">
                            {x.detail}
                            {x.fragile && (
                              <>
                                {' · '}
                                <Help help={FRAGILE_HELP}>
                                  <span className="underline decoration-dotted underline-offset-2">fragile</span>
                                </Help>
                              </>
                            )}
                            {x.doubt && (
                              <>
                                {' · '}
                                <Help help={DOUBT_HELP} lead={`${x.doubt.charAt(0).toUpperCase()}${x.doubt.slice(1)}.`}>
                                  <span className="rounded bg-warning/30 px-1 font-medium text-foreground">À vérifier</span>
                                </Help>
                              </>
                            )}
                          </span>
                          {x.quotes.map((q, i) => (
                            <span key={i} className="mt-1 block text-sm">
                              <span className="italic">«&nbsp;{q.text}&nbsp;»</span> <span className="font-semibold text-muted-foreground">{q.who}</span>
                            </span>
                          ))}
                        </li>
                      ))}
                    </ul>
                    {sec.more.length > 0 && <p className="mt-2 text-sm text-muted-foreground">Et aussi : {sec.more.join(' · ')}</p>}
                  </CardContent>
                </Card>
              )
            })}
          </div>
          <p className="text-sm text-muted-foreground">
            Listes établies par le code à partir des chiffres de chaque motif, sans rédaction de l'IA, sur {plural(all.participants, 'participant')}.
          </p>
        </section>
      )}

      <section aria-labelledby="vue" className="space-y-3">
        <h2 id="vue" className="text-xl font-semibold">
          Vue d'ensemble
        </h2>
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="flex max-w-full flex-wrap items-center gap-1">
            <span className="inline-block size-2.5 rounded-full bg-positive" /> positifs
          </span>
          <span className="flex max-w-full flex-wrap items-center gap-1">
            <span className="inline-block size-2.5 rounded-full bg-warning" /> mitigés
          </span>
          <span className="flex max-w-full flex-wrap items-center gap-1">
            <span className="inline-block size-2.5 rounded-full bg-negative" /> négatifs
          </span>
          <span className="flex max-w-full flex-wrap items-center gap-1">
            <span className="inline-block size-2.5 rounded-full bg-muted ring-1 ring-border" /> sans avis
          </span>
          <span>(en participants)</span>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {overview
            .filter((s) => s.shown.participants > 1)
            .map((s) => (
              <li key={s.id}>
                <a
                  href={`#sec-${s.id}`}
                  className="block rounded-lg border bg-card p-3 hover:border-primary"
                  onClick={(e) => {
                    e.preventDefault()
                    document.getElementById(`sec-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-base font-medium">{s.title}</span>
                    <span className="shrink-0 text-sm text-muted-foreground">{plural(s.shown.participants, 'participant')}</span>
                  </div>
                  <div className="mt-2">
                    <OpinionBar m={s.shown} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {sections ? <ThemeBadges groups={s.subGroups} /> : stanceBadge(s.shown)}
                    {s.shown.participantsByCategory.suggestion > 0 && (
                      <Badge tone="suggestion">{plural(s.shown.participantsByCategory.suggestion, 'suggestion')}</Badge>
                    )}
                  </div>
                </a>
              </li>
            ))}
        </ul>
        {overview.some((s) => s.shown.participants === 1) && (
          <div className="rounded-lg border border-dashed bg-card p-3 text-base">
            <p className="font-medium">Avis isolés</p>
            <p className="text-sm text-muted-foreground">Portés chacun par un seul participant : à lire comme des signaux, pas comme des tendances.</p>
            <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
              {overview
                .filter((s) => s.shown.participants === 1)
                .map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#sec-${s.id}`}
                      className="text-primary underline-offset-4 hover:underline"
                      onClick={(e) => {
                        e.preventDefault()
                        document.getElementById(`sec-${s.id}`)?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'start',
                        })
                      }}
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </section>

      <section className="space-y-6">
        {sections
          ? sections.map((t) => {
              const m = filteredMetrics(
                t.groups.flatMap((g) => g.ideaIds),
                t.metrics,
              )
              if (!m.participants) return null
              return (
                <div key={t.id} id={`sec-${t.id}`} className="scroll-mt-20 space-y-3">
                  <div className="space-y-1">
                    <h2 className="text-xl font-semibold">{t.title}</h2>
                    <p className="text-sm text-muted-foreground">{describeTheme({ metrics: m }, shownGroups(t.groups))}</p>
                  </div>
                  {t.summary && !segment && (
                    <div className="max-w-3xl text-base">
                      <CitedText text={t.summary} ctx={ctx} />
                      <Unverified items={t.unverified} />
                    </div>
                  )}
                  <div className="space-y-2">
                    {t.groups
                      .filter((g) => g.metrics.participants > 1)
                      .map((g) => (
                        <GroupBlock key={g.id} group={g} ctx={ctx} headingLevel="h3" />
                      ))}
                  </div>
                  {t.groups.some((g) => g.metrics.participants <= 1) && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Signaux isolés · un seul participant chacun</p>
                      {t.groups
                        .filter((g) => g.metrics.participants <= 1)
                        .map((g) => (
                          <GroupBlock key={g.id} group={g} ctx={ctx} headingLevel="h3" />
                        ))}
                    </div>
                  )}
                </div>
              )
            })
          : analysis.groups.map((g) => (
              <div key={g.id} id={`sec-${g.id}`} className="scroll-mt-20">
                <GroupBlock group={g} ctx={ctx} headingLevel="h3" />
              </div>
            ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Méthode</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Le moteur d'IA ({engineName(analysis.engine.presetId, analysis.engine.model)} · {analysis.engine.model}) a découpé les réponses en idées, proposé
            les motifs et rédigé les synthèses. Le code a vérifié chaque verbatim mot pour mot dans les réponses, rangé chaque idée exactement une fois, calculé
            tous les chiffres, puis contrôlé que chaque nombre cité dans les synthèses correspond à un chiffre calculé ou à un verbatim.
            {analysis.polish &&
              analysis.polish.changed > 0 &&
              ` Une relecture a ensuite amélioré la langue de ${plural(analysis.polish.changed, 'synthèse')} ; le code a vérifié qu'aucun verbatim ni aucun chiffre n'avait changé${analysis.polish.refused ? ` et a écarté ${plural(analysis.polish.refused, 'réécriture')} qui ne respectait pas cette règle` : ''}.`}
          </p>
          <p>
            Principe : restituer ce que les participants ont dit, avec le moins de déformation possible. Les verbatims sont recopiés tels quels ; seule une
            coupure « […] » peut sauter un passage sans rapport, jamais une négation ou une réserve. Un clic sur un verbatim le montre dans son texte d'origine.
            {corpus.sources.length > 1 &&
              ` Sources : ${corpus.sources
                .map(
                  (src) =>
                    `${src.name} (${plural(new Set(corpus.contributions.filter((c) => c.sourceId === src.id).map((c) => c.participantId)).size, 'participant')})`,
                )
                .join(' ; ')}. Un entretien compte pour une personne, comme une ligne de questionnaire.`}
          </p>
          <p>
            On compte des participants. Sur un motif, un participant est « positif » si tout ce qu'il en dit est positif, « négatif » si tout est négatif, «
            mitigé » s'il dit les deux ; les mitigés comptent dans le total mais dans aucun camp. Suggestions, questions et constats ne sont pas des avis. Le
            chiffre vient toujours avec le mot : « unanime » quand toutes les personnes qui donnent un avis sont du même côté, « large majorité » à partir de 80
            %, « majorité » au-dessus de la moitié, « pas de majorité » quand le camp en tête reste sous la moitié, « avis partagés » quand les camps sont
            proches ou que les mitigés pèsent autant que le camp le plus fort ; en dessous de 4 avis, « peu d'avis ». « Fragile » : une seule voix qui change de
            camp changerait l'étiquette. Se taire n'est ni approuver ni désapprouver. Un thème réunit des motifs différents : on n'y additionne pas les avis.
            Les listes en tête du rapport sont établies par le code, sans rédaction de l'IA. (Indicateurs, version {METRICS_VERSION})
          </p>
          {analysis.groups.some((g) => labelDoubt(g, ctx.ideaById)) && <p>{labelled('« À vérifier »', DOUBT_HELP)}</p>}
          {analysis.groups.some((g) => g.metrics.minority) && <p>{labelled('« Minorité constante »', MINORITY_HELP)}</p>}
          <p>{labelled('Limites', LIMITS_HELP)}</p>
          <p>
            {plural(analysis.groups.length, 'motif')}
            {analysis.merges?.length ? `, dont ${plural(analysis.merges.length, 'fusion')} de motifs qui traitaient le même objet` : ''}
            {names.length > 0 && ` · ${plural(names.length, 'prénom')} de particuliers repéré${names.length > 1 ? 's' : ''} dans les réponses`}
            {analysis.removedSentences
              ? ` · ${plural(analysis.removedSentences, 'phrase')} retirée${analysis.removedSentences > 1 ? 's' : ''} des synthèses car ${analysis.removedSentences > 1 ? 'elles citaient' : 'elle citait'} un nombre introuvable`
              : ''}
            .
          </p>
          <p>
            {plural(analysis.ideas.length, 'idée retenue', 'idées retenues')} ; {plural(analysis.rejected.length, 'verbatim écarté', 'verbatims écartés')} car
            introuvable{analysis.rejected.length > 1 ? 's' : ''} tel
            {analysis.rejected.length > 1 ? 's' : ''} quel
            {analysis.rejected.length > 1 ? 's' : ''} dans les réponses. Température {analysis.settings.temperature}, graine {analysis.settings.seed} : relancer
            la même analyse redonne le même résultat.
          </p>
        </CardContent>
      </Card>
    </article>
  )
}

export type { IdeaCategory }
