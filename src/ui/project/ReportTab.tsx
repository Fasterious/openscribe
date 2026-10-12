import { Download, FileCode2, Printer, Quote, Users } from 'lucide-react'
import { Fragment, useMemo, useState } from 'react'
import { computeMetrics, METRICS_VERSION } from '@/core/analysis/metrics'
import { describeMetrics } from '@/core/analysis/pipeline'
import { reportToHtml, reportToMarkdown } from '@/core/analysis/report'
import type { AnalysisState, Group, Idea, IdeaCategory, Metrics } from '@/core/analysis/types'
import type { Contribution } from '@/core/corpus'
import { corpusForAnalysis, type Project } from '@/core/project'
import { CATEGORY, CATEGORY_ORDER, download, formatDate, plural, slug } from '../format'
import { Alert, Badge, Button, Card, CardContent, CardHeader, CardTitle, Dialog, Disclosure, Label, Select } from '../primitives'

interface Ctx {
  ideaById: Map<string, Idea>
  contributionById: Map<string, Contribution>
  /** Personnes retenues par le filtre de segment (toutes si null). */
  segment: Set<string> | null
  openQuotes: (title: string, ids: string[]) => void
}

function stanceBadge(m: Metrics) {
  if (m.stance === 'consensus')
    return <Badge tone={m.majority === 'positive' ? 'positive' : 'negative'}>Consensus {m.majority === 'positive' ? 'positif' : 'négatif'}</Badge>
  if (m.stance === 'divided') return <Badge tone="warning">Avis partagés</Badge>
  if (m.stance === 'thin') return <Badge tone="outline">Peu d'avis</Badge>
  return <Badge tone="outline">Sans polarité</Badge>
}

/** Barre empilée en personnes : avis positifs, mitigés, négatifs. */
function OpinionBar({ m }: { m: Metrics }) {
  const pos = m.positiveOnly.length
  const mix = m.mixed.length
  const neg = m.negativeOnly.length
  const total = pos + mix + neg
  if (!total) return <div className="h-2 rounded-full bg-muted" aria-hidden />
  const w = (n: number) => `${(n / total) * 100}%`
  return (
    <div
      className="flex h-2 overflow-hidden rounded-full bg-muted"
      role="img"
      aria-label={`${pos} positives, ${mix} mitigées, ${neg} négatives`}
    >
      <div className="bg-positive" style={{ width: w(pos) }} />
      <div className="bg-warning" style={{ width: w(mix) }} />
      <div className="bg-negative" style={{ width: w(neg) }} />
    </div>
  )
}

/** Affiche un texte en rendant cliquables les références [I0001, I0002]. */
function CitedText({ text, ctx, title }: { text: string; ctx: Ctx; title: string }) {
  const parts = text.split(/(\[I\d{4,}(?:\s*,\s*I\d{4,})*\])/g)
  return (
    <p className="leading-relaxed">
      {parts.map((part, i) => {
        const m = part.match(/^\[(.*)\]$/)
        if (!m) return <Fragment key={i}>{part}</Fragment>
        const ids = m[1].split(/\s*,\s*/).filter((id) => ctx.ideaById.has(id))
        if (!ids.length) return null
        return (
          <button
            key={i}
            type="button"
            onClick={() => ctx.openQuotes(title, ids)}
            className="mx-0.5 inline-flex cursor-pointer items-center gap-0.5 rounded-full bg-accent px-1.5 py-0 align-baseline text-xs font-medium text-accent-foreground hover:bg-primary hover:text-primary-foreground"
            aria-label={`Voir ${plural(ids.length, 'citation')}`}
          >
            <Quote className="size-3" />
            {ids.length}
          </button>
        )
      })}
    </p>
  )
}

function GroupBlock({ group, ctx, headingLevel }: { group: Group; ctx: Ctx; headingLevel: 'h3' | 'h4' }) {
  const ideas = group.ideaIds.map((id) => ctx.ideaById.get(id)!).filter((i) => !ctx.segment || ctx.segment.has(i.participantId))
  const m = ctx.segment ? computeMetrics(ideas) : group.metrics
  if (!ideas.length) return null
  const H = headingLevel
  return (
    <Disclosure
      summary={
        <span className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
          <H className="text-sm font-semibold">{group.title}</H>
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">
              <Users className="mr-0.5 inline size-3" />
              {m.participants}
            </span>
            {stanceBadge(m)}
            {m.minority && <Badge tone="suggestion">Minorité constante</Badge>}
          </span>
        </span>
      }
    >
      <div className="space-y-3 text-sm">
        <div className="max-w-sm">
          <OpinionBar m={m} />
        </div>
        <p className="text-xs text-muted-foreground">{describeMetrics(m)}</p>
        {group.summary && !ctx.segment && <CitedText text={group.summary} ctx={ctx} title={group.title} />}
        {m.minority && (
          <Alert tone="info" className="text-xs">
            Position minoritaire mais constante ({m.minority.side === 'positive' ? 'positive' : 'négative'}) :{' '}
            {m.minority.participantIds.join(', ')}.{' '}
            <button className="cursor-pointer text-primary underline" onClick={() => ctx.openQuotes(`${group.title} — minorité`, m.minority!.ideaIds)}>
              Voir leurs citations
            </button>
          </Alert>
        )}
        <div className="grid gap-3 md:grid-cols-2">
          {CATEGORY_ORDER.map((cat) => {
            const items = ideas.filter((i) => i.category === cat)
            if (!items.length) return null
            return (
              <div key={cat} className="space-y-1.5">
                <p className="text-xs font-semibold">
                  <Badge tone={CATEGORY[cat].tone}>
                    {CATEGORY[cat].plural} · {plural(new Set(items.map((i) => i.participantId)).size, 'personne')}
                  </Badge>
                </p>
                <ul className="space-y-1.5">
                  {items.map((i) => (
                    <QuoteLine key={i.id} idea={i} ctx={ctx} />
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </Disclosure>
  )
}

function QuoteLine({ idea, ctx }: { idea: Idea; ctx: Ctx }) {
  const c = ctx.contributionById.get(idea.contributionId)
  return (
    <li className={`border-l-2 pl-2 border-${CATEGORY[idea.category].tone}`}>
      <span>« {idea.verbatim} »</span>{' '}
      <span className="text-xs text-muted-foreground" title={c?.prompt}>
        — {idea.participantId}
      </span>
    </li>
  )
}

function QuotesDialog({ title, ids, ctx, onClose }: { title: string; ids: string[]; ctx: Ctx; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()} title={title} description={`${plural(ids.length, 'citation')}, dans leur contexte.`} className="max-w-2xl">
      <ul className="space-y-3">
        {ids.map((id) => {
          const idea = ctx.ideaById.get(id)
          if (!idea) return null
          const c = ctx.contributionById.get(idea.contributionId)
          return (
            <li key={id} className="space-y-1 rounded-lg border p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={CATEGORY[idea.category].tone}>{CATEGORY[idea.category].label}</Badge>
                <span className="font-medium">{idea.label}</span>
                <span className="text-xs text-muted-foreground">
                  {idea.participantId} · {idea.id}
                </span>
              </div>
              {c?.prompt && <p className="text-xs text-muted-foreground">{c.prompt}</p>}
              {c ? (
                <p className="whitespace-pre-wrap">
                  {c.text.slice(0, idea.span.start)}
                  <mark className="rounded bg-warning/40 px-0.5 text-foreground">{c.text.slice(idea.span.start, idea.span.end)}</mark>
                  {c.text.slice(idea.span.end)}
                </p>
              ) : (
                <p>« {idea.verbatim} »</p>
              )}
            </li>
          )
        })}
      </ul>
    </Dialog>
  )
}

export function ReportTab({ project, analysis }: { project: Project; analysis: AnalysisState }) {
  const corpus = corpusForAnalysis(project)
  const [quotes, setQuotes] = useState<{ title: string; ids: string[] } | null>(null)
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

  const ctx: Ctx = {
    ideaById: new Map(analysis.ideas.map((i) => [i.id, i])),
    contributionById: new Map(corpus.contributions.map((c) => [c.id, c])),
    segment,
    openQuotes: (title, ids) => setQuotes({ title, ids }),
  }
  const groupById = new Map(analysis.groups.map((g) => [g.id, g]))
  const sections = analysis.themes.length
    ? analysis.themes.map((t) => ({ id: t.id, title: t.title, summary: t.summary, metrics: t.metrics, groups: t.groupIds.map((id) => groupById.get(id)!) }))
    : null

  const filteredMetrics = (ideaIds: string[], fallback: Metrics) =>
    segment ? computeMetrics(ideaIds.map((id) => ctx.ideaById.get(id)!).filter((i) => segment.has(i.participantId))) : fallback
  const overview = (sections ?? analysis.groups.map((g) => ({ id: g.id, title: g.title, summary: g.summary, metrics: g.metrics, groups: [g] }))).map((s) => ({
    ...s,
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Rapport du {formatDate(analysis.updatedAt)} · {plural(all.participants, 'personne')} · {plural(all.mentions, 'idée')}
          </p>
        </div>
        <div className="no-print flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => download(`${slug(title)}.md`, reportToMarkdown(analysis, corpus, title), 'text/markdown')}>
            <Download /> Markdown
          </Button>
          <Button variant="outline" size="sm" onClick={() => download(`${slug(title)}.html`, reportToHtml(analysis, corpus, title), 'text/html')}>
            <FileCode2 /> Page HTML
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer /> Imprimer / PDF
          </Button>
        </div>
      </div>

      {simulated && (
        <Alert tone="warning">
          Rapport de démonstration : produit par le moteur de simulation, son contenu est fictif. Configurez un vrai moteur d'IA pour
          analyser vos données.
        </Alert>
      )}

      {attributes.length > 0 && (
        <Card className="no-print">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1">
              <Label htmlFor="segment-key">Comparer un groupe de personnes</Label>
              <Select
                id="segment-key"
                value={segmentKey}
                onChange={(e) => {
                  setSegmentKey(e.target.value)
                  setSegmentValue('')
                }}
              >
                <option value="">Tout le monde</option>
                {attributes.map((a) => (
                  <option key={a.key} value={a.key}>
                    {a.key}
                  </option>
                ))}
              </Select>
            </div>
            {segmentKey && (
              <div className="flex-1 space-y-1">
                <Label htmlFor="segment-value">Valeur</Label>
                <Select id="segment-value" value={segmentValue} onChange={(e) => setSegmentValue(e.target.value)}>
                  <option value="">Choisir…</option>
                  {attributes
                    .find((a) => a.key === segmentKey)
                    ?.values.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                </Select>
              </div>
            )}
            {segment && (
              <p className="text-xs text-muted-foreground sm:max-w-56">
                Chiffres recalculés pour {plural(segment.size, 'personne')}. Les synthèses rédigées portent sur l'ensemble.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {analysis.globalSummary && !segment && (
        <section aria-labelledby="resume" className="space-y-2">
          <h2 id="resume" className="text-xl font-semibold">
            Résumé
          </h2>
          <div className="max-w-3xl text-[15px]">
            <CitedText text={analysis.globalSummary} ctx={ctx} title="Résumé" />
          </div>
        </section>
      )}

      <section aria-labelledby="vue" className="space-y-3">
        <h2 id="vue" className="text-xl font-semibold">
          Vue d'ensemble
        </h2>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block size-2.5 rounded-full bg-positive" /> positives
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block size-2.5 rounded-full bg-warning" /> mitigées
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block size-2.5 rounded-full bg-negative" /> négatives
          </span>
          <span>(en personnes)</span>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {overview
            .filter((s) => s.shown.participants > 0)
            .map((s) => (
              <li key={s.id}>
                <a href={`#sec-${s.id}`} className="block rounded-lg border bg-card p-3 hover:border-primary" onClick={(e) => {
                  e.preventDefault()
                  document.getElementById(`sec-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium">{s.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{plural(s.shown.participants, 'personne')}</span>
                  </div>
                  <div className="mt-2">
                    <OpinionBar m={s.shown} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {stanceBadge(s.shown)}
                    {s.shown.participantsByCategory.suggestion > 0 && (
                      <Badge tone="suggestion">{plural(s.shown.participantsByCategory.suggestion, 'suggestion')}</Badge>
                    )}
                  </div>
                </a>
              </li>
            ))}
        </ul>
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
                    <p className="text-xs text-muted-foreground">{describeMetrics(m)}</p>
                  </div>
                  {t.summary && !segment && (
                    <div className="max-w-3xl text-sm">
                      <CitedText text={t.summary} ctx={ctx} title={t.title} />
                    </div>
                  )}
                  <div className="space-y-2">
                    {t.groups.map((g) => (
                      <GroupBlock key={g.id} group={g} ctx={ctx} headingLevel="h3" />
                    ))}
                  </div>
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
            Le modèle de langage ({analysis.engine.model}) a découpé les réponses en idées, proposé les regroupements et rédigé les synthèses.
            Le code a vérifié chaque citation mot pour mot dans les réponses, rangé chaque idée exactement une fois, et calculé tous les chiffres.
            {analysis.polish &&
              ` Une relecture a ensuite amélioré la langue de ${plural(analysis.polish.changed, 'synthèse')} ; le code a vérifié qu'aucune citation ni aucun chiffre n'avait changé${analysis.polish.refused ? ` et a écarté ${plural(analysis.polish.refused, 'réécriture')} qui ne respectait pas cette règle` : ''}.`}
          </p>
          <p>
            On compte des personnes. Sur un sujet, une personne est « positive » si tout ce qu'elle en dit est positif, « négative » si
            tout est négatif, « mitigée » si elle dit les deux. « Consensus » : au moins 70 % de ces personnes sont du même côté ; les
            mitigées comptent dans le total mais dans aucun camp. Suggestions et constats neutres n'entrent pas dans ce calcul. En dessous
            de 4 personnes, on parle de « peu d'avis ». (Indicateurs v{METRICS_VERSION})
          </p>
          <p>
            {plural(analysis.ideas.length, 'idée retenue', 'idées retenues')} ; {plural(analysis.rejected.length, 'citation écartée', 'citations écartées')} car
            introuvable telle quelle. Température {analysis.settings.temperature}, graine {analysis.settings.seed} : relancer la même analyse redonne le
            même résultat.
          </p>
        </CardContent>
      </Card>

      {quotes && <QuotesDialog title={quotes.title} ids={quotes.ids} ctx={ctx} onClose={() => setQuotes(null)} />}
    </article>
  )
}

export type { IdeaCategory }
