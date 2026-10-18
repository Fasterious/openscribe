import { CircleCheck, CircleHelp, Download, FileCode2, Lightbulb, OctagonAlert, Printer, Quote, Save, Scale, Users } from 'lucide-react'
import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { computeMetrics, METRICS_VERSION, withCurrentMetrics } from '@/core/analysis/metrics'
import { maskNames } from '@/core/analysis/names'
import {
  bothSides,
  categoryHeading,
  dominantVoice,
  alsoInOf,
  categoryBar,
  definitionLine,
  categoryOrder,
  categoryBarLabel,
  highlightSections,
  leadSentence,
  wholeCamp,
  SECTION_CAMP,
  type HighlightSection,
  summaryDoubts,
  metricsLine,
  originOf,
  personLines,
  shortAnswerContext,
  fullQuestionIds,
  displayOrder,
  reportToHtml,
  reportToMarkdown,
  methodNote,
  offTopicLines,
  OFF_TOPIC_INTRO,
} from '@/core/analysis/report'
import { corpusHash } from '@/core/analysis/pipeline'
import type { AnalysisState, Group, Idea, IdeaCategory, Metrics } from '@/core/analysis/types'
import type { Contribution } from '@/core/corpus'
import { corpusForAnalysis, type Project } from '@/core/project'
import { isExample } from '../Synthesis'
import { Fold, freezeHeadroom, glideTo, revealMotif } from './fold'
import { TAB_ACTIONS } from './slots'
import { CATEGORY, download, formatDate, plural, slug } from '../format'
import { Alert, Badge, Card, CardContent, CardHeader, CardTitle, DropMenu, MenuItem, MenuSection, Tooltip } from '../primitives'
import { helpText, STANCE_HELP } from '@/core/analysis/glossary'
import { fragileShown, labelDoubt } from '@/core/analysis/highlights'
import { doubtReason, fragileReason, themeVerdicts, verdictLabel, verdictOf, type Verdict } from '@/core/analysis/explain'

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
  /** Codage en double : l'autre motif où compte cette citation (la mention « à vérifier » y renvoie). */
  alsoIn: (idea: Idea) => string | undefined
  /** Le motif où une idée est rangée (l'en-tête d'un volet de verbatims le nomme). */
  groupTitle: (ideaId: string) => string | undefined
  /** Va lire un motif dans la partie détaillée ; un bouton ramène ensuite à `from` (règle : tout départ offre son retour). */
  reveal: (groupId: string, from: HTMLElement, label: string) => void
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

/** La barre d'un motif : une part par liste affichée en dessous, aux mêmes couleurs (`categoryBar`). */
function OpinionBar({ m, onPick }: { m: Metrics; onPick?: (cat: IdeaCategory) => void }) {
  const parts = categoryBar(m)
  if (!parts.length) return <div className="h-2 rounded-full bg-muted" aria-hidden />
  const label = categoryBarLabel(m)
  // Dans un motif ouvert, toucher un segment déroule son camp : un raccourci (le segment est souvent petit) ; la vraie
  // cible, au clavier et au lecteur d'écran, est l'en-tête du camp, juste dessous.
  if (onPick)
    return (
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-full" aria-hidden>
        {parts.map(({ cat, people }) => (
          <div key={cat} className={`${BAR[cat]} cursor-pointer hover:opacity-80`} style={{ flexGrow: people }} title={LEGEND[cat]} onClick={() => onPick(cat)} />
        ))}
      </div>
    )
  return (
    <div className="flex h-2 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={label} title={label}>
      {parts.map(({ cat, people }) => (
        <div key={cat} className={BAR[cat]} style={{ flexGrow: people }} />
      ))}
    </div>
  )
}

/** Sur petit écran, une carte perd son cadre : le contenu prend toute la largeur (remarque d'Arnaud, 17/10). */
const FLAT_CARD = 'max-sm:rounded-none max-sm:border-x-0 max-sm:border-b-0 max-sm:bg-transparent max-sm:shadow-none'

const LEGEND: Record<IdeaCategory, string> = { positive: 'avis positifs', negative: 'avis négatifs', suggestion: 'suggestions', question: 'questions', neutral: 'constats' }

const BAR: Record<IdeaCategory, string> = {
  positive: 'bg-positive',
  negative: 'bg-negative',
  suggestion: 'bg-suggestion',
  question: 'bg-question',
  neutral: 'bg-neutral',
}

/**
 * Affiche un texte en rendant cliquables les références [I0001, I0002] : un
 * clic déplie les verbatims juste en dessous, sans quitter la lecture.
 */
/** `camps` (le résumé) : une pastille qui suit un nombre annoncé déroule tout le camp compté (`wholeCamp`). */
function CitedText({ text, ctx, camps }: { text: string; ctx: Ctx; camps?: Group[] }) {
  // Un texte rédigé peut compter plusieurs paragraphes (le résumé en trois temps).
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim())
  if (paragraphs.length > 1)
    return (
      <div className="space-y-3">
        {paragraphs.map((p, i) => (
          <CitedParagraph key={i} text={p.trim()} ctx={ctx} camps={camps} />
        ))}
      </div>
    )
  return <CitedParagraph text={text} ctx={ctx} camps={camps} />
}

function CitedParagraph({ text, ctx, camps }: { text: string; ctx: Ctx; camps?: Group[] }) {
  const [open, setOpen] = useState<number | null>(null)
  // Ouvrir ou fermer recompose le paragraphe : la pastille touchée garde le focus (clavier, lecteur d'écran, Échap).
  const box = useRef<HTMLDivElement>(null)
  const last = useRef<number | null>(null)
  useEffect(() => {
    if (last.current === null) return
    box.current?.querySelector<HTMLElement>(`[data-pill="${last.current}"]`)?.focus({ preventScroll: true })
  }, [open])
  const toggle = (i: number) => {
    last.current = i
    setOpen(open === i ? null : i)
  }
  const parts = text.split(/(\[I\d{4,}(?:\s*,\s*I\d{4,})*\])/g)
  const cited = parts.map((part) => {
    const m = part.match(/^\[(.*)\]$/)
    return m ? m[1].split(/\s*,\s*/).filter((id) => ctx.ideaById.has(id)) : null
  })
  // Le camp entier, quand la phrase en annonce le nombre ; sinon les idées citées.
  const whole = cited.map((ids, i) => (ids && camps ? wholeCamp(parts.slice(0, i).join(''), ids, camps, ctx.ideaById) : undefined))
  const refs = cited.map((ids, i) => whole[i]?.ids ?? ids)
  // Les verbatims s'intercalent à l'endroit de la pastille ouverte : le texte qui la suit reprend dessous (Arnaud, 17/10).
  const piece = (from: number, to: number) =>
    parts.slice(from, to).map((part, k) => {
      const i = from + k
      const ids = refs[i]
      if (!ids) return <Fragment key={i}>{ctx.mask(part)}</Fragment>
      if (!ids.length) return null
      const isOpen = open === i
      return (
            <Tooltip key={i} wide side="top" content={<QuotesPreview ids={ids} ctx={ctx} />}>
              <button
                type="button"
                data-pill={i}
                onClick={() => toggle(i)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape' && isOpen) toggle(i)
                }}
                aria-expanded={isOpen}
                className={`mx-0.5 inline-flex min-h-6 cursor-pointer items-center gap-0.5 rounded-full px-2 py-0 align-baseline text-sm font-medium sm:min-h-0 sm:px-1.5 ${
                  isOpen ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground'
                }`}
                aria-label={`${isOpen ? 'Masquer' : 'Voir'} ${whole[i] ? `les verbatims de ${plural(whole[i]!.people, 'participant')}` : plural(ids.length, 'verbatim')}`}
              >
                <Quote className="size-3" />
                {whole[i]?.people ?? ids.length}
              </button>
            </Tooltip>
      )
    })
  if (open === null || !refs[open])
    return (
      <div ref={box}>
        <p className="leading-relaxed">{piece(0, parts.length)}</p>
      </div>
    )
  // La ponctuation qui suit la pastille reste dans la phrase, avant le volet : plus de point orphelin dessous.
  const punct = parts[open + 1]?.match(/^\s*[.,;:!?…)»]+/)?.[0] ?? ''
  const tail = [parts[open + 1]?.slice(punct.length) ?? '', ...parts.slice(open + 2)]
  const rest = tail.join('').trim()
  const restParts = [...parts.slice(0, open + 1), ...tail]
  const pieceRest = () =>
    restParts.slice(open + 1).map((part, k) => {
      const i = open + 1 + k
      return k === 0 ? <Fragment key={i}>{ctx.mask(part.replace(/^\s+/, ''))}</Fragment> : piece(i, i + 1)
    })
  return (
    <div ref={box}>
      <p className="leading-relaxed">
        {piece(0, open + 1)}
        {punct.trim()}
      </p>
      <QuotesPanel ids={refs[open]!} ctx={ctx} onClose={() => setOpen(null)} />
      {rest && <p className="mt-2 leading-relaxed">{pieceRest()}</p>}
    </div>
  )
}

/**
 * Une ligne des listes du résumé : le titre et les chiffres, la phrase qui ouvre la synthèse du motif, et un bouton
 * ❝ N qui déroule les verbatims des N participants comptés (le camp de la liste), sans cadre, sous la ligne
 * (demande d'Arnaud, 17/10 : les verbatims viennent en appui, pas des citations choisies).
 */
function HighlightLine({
  section,
  item,
  ctx,
  groupById,
  children,
  compact = false,
}: {
  section: HighlightSection['key']
  item: HighlightSection['items'][number]
  ctx: Ctx
  groupById: Map<string, Group>
  children: React.ReactNode
  /** Vue restreinte (« Et aussi ») : sans la phrase d'ouverture de la synthèse. */
  compact?: boolean
}) {
  const [open, setOpen] = useState(false)
  const group = groupById.get(item.groupId)
  const camp = SECTION_CAMP[section]
  const inGroup = (group?.ideaIds ?? []).map((id) => ctx.ideaById.get(id)!).filter((i) => i && (!ctx.segment || ctx.segment.has(i.participantId)))
  // « 46 avis positifs » compte les seuls positifs : une personne mitigée n'est pas déroulée sous « Ce qui a marché ».
  const opposite = section === 'strengths' ? 'negative' : section === 'blockers' ? 'positive' : undefined
  const mixed = new Set(opposite ? inGroup.filter((i) => i.category === opposite).map((i) => i.participantId) : [])
  const ideas = inGroup.filter((i) => camp.includes(i.category) && !mixed.has(i.participantId))
  const people = new Set(ideas.map((i) => i.participantId)).size
  const lead = group?.summary && !ctx.segment && !compact ? leadSentence(group.summary) : ''
  return (
    <>
      {children}
      {(lead || people > 0) && (
        <span className="mt-1 block text-[15px] leading-relaxed">
          {lead && <span>{ctx.mask(lead)} </span>}
          {people > 0 && (
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              onKeyDown={(e) => {
                if (e.key === 'Escape' && open) setOpen(false)
              }}
              aria-expanded={open}
              aria-label={`${open ? 'Masquer' : 'Voir'} les verbatims de ${plural(people, 'participant')}`}
              className={`inline-flex min-h-6 cursor-pointer items-center gap-0.5 rounded-full px-2 py-0 align-baseline text-sm font-medium sm:min-h-0 sm:px-1.5 ${
                open ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground'
              }`}
            >
              <Quote className="size-3" />
              {people} {SECTION_WORD[section][people > 1 ? 1 : 0]}
            </button>
          )}
        </span>
      )}
      {open && <QuotesPanel ids={ideas.map((i) => i.id)} ctx={ctx} onClose={() => setOpen(false)} />}
    </>
  )
}

/**
 * Une ligne d'une liste du haut. Ses marques (« fragile », « à vérifier ») sont des boutons : ils déplient sous la ligne
 * l'explication propre à ce motif, la même que dans le motif ouvert (plus d'infobulle générale).
 */
function ListItem({
  section,
  item,
  ctx,
  groupById,
  lineClass,
  heading,
  compact = false,
}: {
  section: HighlightSection['key']
  item: HighlightSection['items'][number]
  ctx: Ctx
  groupById: Map<string, Group>
  lineClass: string
  /** Le titre de la liste, que nomme le bouton de retour. */
  heading: string
  compact?: boolean
}) {
  const [why, setWhy] = useState(false)
  const group = groupById.get(item.groupId)
  const mark = 'inline-flex min-h-6 cursor-pointer items-center rounded underline decoration-dotted underline-offset-2 hover:text-foreground'
  return (
    <li className={`border-l-[3px] pl-2.5 ${lineClass}`}>
      <HighlightLine section={section} item={item} ctx={ctx} groupById={groupById} compact={compact}>
        <span className="font-medium">{item.title}</span>
        <span className="block text-sm text-muted-foreground">
          {item.detail}
          {item.fragile && (
            <>
              {' · '}
              <button type="button" className={mark} aria-expanded={why} onClick={() => setWhy((w) => !w)}>
                fragile
              </button>
            </>
          )}
          {item.doubt && (
            <>
              {' · '}
              <button type="button" className={`${mark} bg-warning/30 px-1 font-medium text-foreground no-underline`} aria-expanded={why} onClick={() => setWhy((w) => !w)}>
                À vérifier
              </button>
            </>
          )}
        </span>
      </HighlightLine>
      {group && (
        <button
          type="button"
          onClick={(e) => ctx.reveal(group.id, e.currentTarget, `Revenir à « ${heading} »`)}
          className="no-print mt-1 block min-h-6 cursor-pointer text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
        >
          Lire le thème en détail →
        </button>
      )}
      {why && group && (
        <div className="fold-in mt-2">
          <WhyLabel group={group} ctx={ctx} />
        </div>
      )}
    </li>
  )
}

/**
 * « À vérifier avant de citer ces étiquettes » : chaque motif nommé est un lien qui ouvre le motif, avec l'explication
 * de sa marque, et un bouton ramène au résumé.
 */
function DoubtLinks({ sections, ctx }: { sections: HighlightSection[]; ctx: Ctx }) {
  const items = [...new Map(sections.flatMap((sec) => sec.items.filter((x) => x.doubt).map((x) => [x.groupId, x.title] as const))).entries()]
  if (!items.length) return null
  return (
    <p className="mt-2 text-sm text-muted-foreground">
      À vérifier avant de citer : l'étiquette {items.length > 1 ? 'des thèmes' : 'du thème'}{' '}
      {items.map(([id, title], k) => (
        <Fragment key={id}>
          {k > 0 && (k === items.length - 1 ? ' et ' : ', ')}
          <button type="button" onClick={(e) => ctx.reveal(id, e.currentTarget, 'Revenir au résumé')} className="inline-flex min-h-6 cursor-pointer items-center text-primary underline-offset-4 hover:underline">
            {title}
          </button>
        </Fragment>
      ))}
      . {items.length > 1 ? 'Leur étiquette dépend' : 'Son étiquette dépend'} d'avis comptés aussi dans un autre thème ; chaque thème, une fois ouvert, explique pourquoi.
    </p>
  )
}

const MORE_WORD: Record<HighlightSection['key'], string> = {
  strengths: 'appréciés',
  blockers: 'critiqués',
  divided: 'qui divisent',
  proposals: 'avec des suggestions',
  questions: 'avec des questions',
}

/**
 * « Et aussi » se déplie sur place, en vue restreinte : titre, chiffres, marques, pastille (demande d'Arnaud, 18/10).
 * Le contenu reste dans la page, caché : l'impression le montre, Ctrl+F le trouve.
 */
function MoreItems({
  section,
  items,
  ctx,
  groupById,
  lineClass,
  heading,
}: {
  section: HighlightSection['key']
  items: HighlightSection['items']
  ctx: Ctx
  groupById: Map<string, Group>
  lineClass: string
  heading: string
}) {
  const [open, setOpen] = useState(false)
  const top = useRef<HTMLButtonElement>(null)
  const n = items.length
  const hide = n > 1 ? `Masquer les ${n} autres thèmes` : "Masquer l'autre thème"
  const toggle = (
    <button
      ref={top}
      type="button"
      aria-expanded={open}
      onClick={() => setOpen((o) => !o)}
      className="no-print inline-flex min-h-8 cursor-pointer items-center gap-1 rounded-md text-sm font-medium text-primary hover:underline"
    >
      {open ? hide : `Voir ${n > 1 ? `les ${n} autres thèmes` : "l'autre thème"} ${MORE_WORD[section]}`}
      <span aria-hidden className={`transition-transform motion-reduce:transition-none ${open ? '-rotate-90' : 'rotate-90'}`}>
        ›
      </span>
    </button>
  )
  return (
    <div className="mt-3 space-y-2">
      {toggle}
      <ul ref={foundable(open, () => setOpen(true))} data-print-open className="fold-in space-y-2 text-base">
        {items.map((x) => (
          <ListItem key={x.title} section={section} item={x} ctx={ctx} groupById={groupById} lineClass={lineClass} heading={heading} compact />
        ))}
      </ul>
      {open && (
        <button
          type="button"
          onClick={() => {
            freezeHeadroom()
            setOpen(false)
            requestAnimationFrame(() => {
              top.current?.scrollIntoView({ block: 'nearest' })
              top.current?.focus({ preventScroll: true })
            })
          }}
          className="no-print inline-flex min-h-8 cursor-pointer items-center gap-1 rounded-md text-sm font-medium text-primary hover:underline"
        >
          <span aria-hidden>⌃</span> {hide}
        </button>
      )}
    </div>
  )
}

/** Ce que déroule la pastille d'une ligne de liste : le lecteur lit « 27 avis négatifs », pas « 27 » à côté d'un « 6 ». */
const SECTION_WORD: Record<HighlightSection['key'], [string, string]> = {
  strengths: ['avis positif', 'avis positifs'],
  blockers: ['avis négatif', 'avis négatifs'],
  divided: ['avis', 'avis'],
  proposals: ['suggestion', 'suggestions'],
  questions: ['question', 'questions'],
}

/** Place ses enfants sur la barre des onglets de l'étude (à droite des onglets). */
function TabActions({ children }: { children: React.ReactNode }) {
  const [slot, setSlot] = useState<HTMLElement | null>(null)
  useEffect(() => setSlot(document.getElementById(TAB_ACTIONS)), [])
  return slot ? createPortal(<div className="no-print flex flex-wrap items-center gap-2">{children}</div>, slot) : null
}

/** Au survol d'une référence : les passages qui fondent la phrase, dans leur texte d'origine. */
function QuotesPreview({ ids, ctx }: { ids: string[]; ctx: Ctx }) {
  const all = ids.map((id) => ctx.ideaById.get(id)).filter((i): i is Idea => !!i)
  // Au survol, trois passages au plus : le clic les déroule tous.
  const ideas = all.slice(0, 3)
  return (
    <div className="space-y-3">
      {ideas.map((idea) => (
        <SourceContext key={idea.id} idea={idea} ctx={ctx} excerpt={ideas.length > 1 ? 90 : 180} />
      ))}
      <p className="text-xs text-muted-foreground">
        {all.length > 3 ? `Et ${all.length - 3} autres : cliquer pour tout dérouler.` : 'Cliquer pour garder ces passages ouverts.'}
      </p>
    </div>
  )
}

/**
 * Replier ramène le lecteur là où il était quand il a déplié : on note où le volet commençait à l'écran, et s'il a
 * défilé plus bas pour lire, on remonte d'autant avant de refermer (sinon le texte remonte sous lui, vers un endroit jamais lu).
 */
function useFoldBack() {
  const ref = useRef<HTMLDivElement>(null)
  const top = useRef(0)
  useLayoutEffect(() => {
    top.current = ref.current?.getBoundingClientRect().top ?? 0
  }, [])
  const back = () => {
    const now = ref.current?.getBoundingClientRect().top
    if (now !== undefined && now < top.current) window.scrollBy({ top: now - top.current, behavior: 'instant' })
  }
  return [ref, back] as const
}

const PANEL_WORD: Record<IdeaCategory, [string, string]> = {
  positive: ['avis positif', 'avis positifs'],
  negative: ['avis négatif', 'avis négatifs'],
  suggestion: ['suggestion', 'suggestions'],
  question: ['question', 'questions'],
  neutral: ['constat', 'constats'],
}

/** Ce que déroule un volet, dit dans son en-tête : « ❝ 46 avis positifs · Expérience globale de scolarisation ». */
function panelTitle(ideas: Idea[], ctx: Ctx): string {
  const people = new Set(ideas.map((i) => i.participantId)).size
  const cats = [...new Set(ideas.map((i) => i.category))]
  const groups = [...new Set(ideas.map((i) => ctx.groupTitle(i.id)).filter(Boolean))]
  const what = cats.length === 1 ? PANEL_WORD[cats[0]][people > 1 ? 1 : 0] : people > 1 ? 'participants' : 'participant'
  return groups.length === 1 ? `${people} ${what} · ${groups[0]}` : `${people} ${what}`
}

/**
 * Les verbatims qu'une pastille déroule, sous le texte : une ligne par participant, par catégorie, sans cadre ;
 * chaque verbatim se déplie à son tour dans sa réponse entière (même forme partout : synthèses, résumé, listes).
 * Son en-tête dit ce qu'on lit et reste collé, avec « Replier », tant qu'on est dans le volet ; replier ramène là où l'on
 * avait déplié et rend le focus à la pastille ; Échap replie.
 */
function QuotesPanel({ ids, ctx, onClose }: { ids: string[]; ctx: Ctx; onClose: () => void }) {
  const ideas = ids.map((id) => ctx.ideaById.get(id)).filter((i): i is Idea => !!i)
  const cats = [...new Set(ideas.map((i) => i.category))]
  const [ref, back] = useFoldBack()
  const opener = useRef<HTMLElement | null>(null)
  useLayoutEffect(() => {
    opener.current = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null
  }, [])
  const close = () => {
    freezeHeadroom()
    back()
    onClose()
    const o = opener.current
    if (o) requestAnimationFrame(() => o.isConnected && o.focus({ preventScroll: true }))
  }
  return (
    <div
      ref={ref}
      className="fold-in mt-2 space-y-1.5"
      onKeyDown={(e) => {
        if (e.key !== 'Escape') return
        e.stopPropagation()
        close()
      }}
    >
      <div className="sticky top-[calc(var(--app-bar)+var(--theme-stick,0px)+var(--motif-stick,0px))] z-[5] flex items-center justify-between gap-2 border-b bg-background/95 py-1 text-sm backdrop-blur transition-[top] duration-200 motion-reduce:transition-none">
        <span className="min-w-0 truncate font-medium">
          <Quote className="mr-1 inline size-3" aria-hidden />
          {panelTitle(ideas, ctx)}
        </span>
        <button type="button" onClick={close} className="no-print inline-flex min-h-8 shrink-0 cursor-pointer items-center gap-1 rounded-md px-2 font-medium text-muted-foreground hover:bg-accent hover:text-foreground">
          <span aria-hidden>⌃</span> Replier
        </button>
      </div>
      <ul className="space-y-1.5">
        {cats.map((cat) =>
          personLines(ideas.filter((i) => i.category === cat)).map((l) => (
            <PersonLine key={`${cat}-${l.participantId}`} line={l} cat={cat} other={false} full={new Set()} ctx={ctx} />
          )),
        )}
      </ul>
      <button type="button" onClick={close} className="no-print inline-flex min-h-8 cursor-pointer items-center gap-1 rounded-md px-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground">
        <span aria-hidden>⌃</span> Replier ces verbatims
      </button>
    </div>
  )
}

/** La réponse entière autour d'un verbatim, dépliée sous la ligne de la personne. */
function ContextPanel({ idea, ctx, onClose }: { idea: Idea; ctx: Ctx; onClose: () => void }) {
  const [ref, back] = useFoldBack()
  return (
    <div ref={ref} className="mt-2 space-y-1">
      <SourceContext idea={idea} ctx={ctx} card />
      <button
        type="button"
        onClick={() => {
          back()
          onClose()
        }}
        className="mt-1 inline-flex min-h-8 cursor-pointer items-center gap-1 rounded-md px-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <span aria-hidden>⌃</span> Replier
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
  const full = fullQuestionIds(displayOrder(ideas, m), ctx.context)
  // La mention « à vérifier » vaut pour le motif entier : elle se tait quand on regarde un segment.
  const doubt = ctx.segment ? undefined : labelDoubt(group, ctx.ideaById)
  if (!ideas.length) return null
  const H = headingLevel
  // La ligne fermée est une seule cible, qui ouvre : ses étiquettes ne sont plus des infobulles (au doigt, elles
  // captaient le toucher au lieu d'ouvrir le motif). Leur explication vit dans le motif ouvert.
  const marks = (
    <>
      {stanceBadgeOnly(m)}
      {m.minority && <Badge tone="suggestion">Minorité constante</Badge>}
      {doubt && <Badge tone="warning">À vérifier</Badge>}
    </>
  )
  return (
    <Fold
      level="motif"
      id={`motif-${group.id}`}
      label={`le thème « ${group.title} »`}
      className="border-b py-0.5"
      closed={
        <span className="flex flex-col gap-1.5 py-2 sm:flex-row sm:items-center sm:justify-between">
          <H data-vt="title" className="text-base font-semibold">
            {group.title}
          </H>
          <span className="flex flex-wrap items-center gap-2">
            <span data-vt="bar" className="block w-14 sm:w-20">
              <OpinionBar m={m} />
            </span>
            <span data-vt="meta" className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">
                <Users className="mr-0.5 inline size-3" aria-hidden />
                {m.participants}
              </span>
              {marks}
            </span>
          </span>
        </span>
      }
      opened={
        // La barre reste dans l'en-tête ouvert : ce que contient le thème ne disparaît pas quand on l'ouvre (Arnaud, 18/10).
        <span className="flex min-w-0 items-center gap-2">
          <H data-vt="title" className="min-w-0 truncate text-base font-semibold">
            {group.title}
          </H>
          <span data-vt="bar" className="block w-10 shrink-0 sm:w-20">
            <OpinionBar m={m} />
          </span>
          <span data-vt="meta" className="hidden shrink-0 items-center gap-2 sm:inline-flex">
            <span className="text-sm text-muted-foreground">
              <Users className="mr-0.5 inline size-3" aria-hidden />
              {m.participants}
            </span>
            <span className="hidden md:inline-flex md:gap-1.5">{stanceBadgeOnly(m)}</span>
          </span>
        </span>
      }
      bodyClassName="pb-3"
    >
      <div className="space-y-3 text-base">
        <p className="text-sm text-muted-foreground">{metricsLine(m)}</p>
        {/* Ce que veut dire l'étiquette, plié : dans la ligne fermée, ce n'est plus une infobulle (une seule cible). */}
        <details className="text-sm" onKeyDown={closeOnEscape}>
          <summary className="cursor-pointer py-1 text-muted-foreground">Que veut dire cette étiquette ?</summary>
          <p className="mt-1 rounded-md bg-muted px-3 py-2 text-muted-foreground">{helpText(STANCE_HELP[m.stance])}</p>
        </details>
        {dominantVoice(ideas) && <p className="text-sm text-muted-foreground">{dominantVoice(ideas)}</p>}
        {!ctx.segment && <WhyLabel group={group} ctx={ctx} />}
        {group.summary && !ctx.segment && (
          <>
            <CitedText text={group.summary} ctx={ctx} />
            <Unverified items={group.unverified} />
          </>
        )}
        {/* La définition du motif : explication secondaire, pliée ; la synthèse se lit d'abord (remarque d'Arnaud, 17/10). */}
        {group.definition && (
          <details className="group/def text-sm" onKeyDown={closeOnEscape}>
            <summary className="cursor-pointer py-1 text-muted-foreground">Ce qui compte comme positif ou négatif dans ce thème</summary>
            <p className="mt-1 rounded-md bg-muted px-3 py-2 text-muted-foreground">{definitionLine(group.definition)}</p>
          </details>
        )}
        {m.minority && <MinorityNote minority={m.minority} ctx={ctx} />}
        <Camps ideas={ideas} m={m} both={both} full={full} ctx={ctx} />
        {both.size > 0 && <p className="text-sm text-muted-foreground">* Personne qui s'exprime aussi dans l'autre sens sur ce thème.</p>}
      </div>
    </Fold>
  )
}

/**
 * Un contenu caché « jusqu'à ce qu'on le trouve » : la recherche du navigateur (Ctrl+F) le trouve, le montre, et
 * l'état de l'écran suit (`beforematch`, Chrome et Edge ; ailleurs, le contenu reste caché à la recherche).
 */
const foundHandlers = new WeakMap<HTMLElement, () => void>()
/** L'attribut est posé à la main : React réduit `hidden` à un booléen et perdrait « until-found ». */
function foundable(open: boolean, onOpen: () => void) {
  return (el: HTMLElement | null) => {
    if (!el) return
    if (open) el.removeAttribute('hidden')
    else el.setAttribute('hidden', 'until-found')
    if (!foundHandlers.has(el)) el.addEventListener('beforematch', () => foundHandlers.get(el)?.())
    foundHandlers.set(el, onOpen)
  }
}

/** Échap referme un `<details>` d'explication ouvert, sans refermer le motif qui le contient. */
function closeOnEscape(e: React.KeyboardEvent<HTMLDetailsElement>) {
  if (e.key !== 'Escape' || !e.currentTarget.open) return
  e.stopPropagation()
  e.currentTarget.open = false
  ;(e.currentTarget.querySelector(':scope > summary') as HTMLElement | null)?.focus()
}

/** Au-delà de 8 lignes, un camp reste fermé : le lecteur choisit le sien au lieu de faire défiler 8 écrans (D6). */
const CAMP_OPEN_MAX = 8

/**
 * Les camps d'un motif, un par catégorie, dans l'ordre de la barre. Leur en-tête est aussi la légende de la barre : le
 * toucher (ou toucher le segment de la barre) déroule le camp entier, jamais un échantillon (demande d'Arnaud, 18/10).
 */
function Camps({ ideas, m, both, full, ctx }: { ideas: Idea[]; m: Metrics; both: Set<string>; full: Set<string>; ctx: Ctx }) {
  const camps = categoryOrder(m)
    .map((cat) => ({ cat, lines: personLines(ideas.filter((i) => i.category === cat)) }))
    .filter((c) => c.lines.length)
  const [open, setOpen] = useState(() => new Set(camps.filter((c) => c.lines.length <= CAMP_OPEN_MAX).map((c) => c.cat)))
  const refs = useRef(new Map<IdeaCategory, HTMLElement>())
  const show = (cat: IdeaCategory) => {
    setOpen((o) => new Set(o).add(cat))
    requestAnimationFrame(() => refs.current.get(cat)?.scrollIntoView({ block: 'nearest' }))
  }
  return (
    <div className="space-y-3">
      <div className="max-w-sm">
        <OpinionBar m={m} onPick={show} />
      </div>
      {camps.map(({ cat, lines }) => {
        const isOpen = open.has(cat)
        const polar = cat === 'positive' || cat === 'negative'
        return (
          <div key={cat} ref={(el) => void (el ? refs.current.set(cat, el) : refs.current.delete(cat))} className="scroll-mt-32 space-y-1.5">
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen((o) => {
                const next = new Set(o)
                if (next.has(cat)) next.delete(cat)
                else next.add(cat)
                return next
              })}
              className="flex min-h-8 cursor-pointer items-center gap-2 rounded-md text-left text-sm font-semibold hover:text-primary"
            >
              <span className={`inline-block size-2.5 shrink-0 rounded-full ${BAR[cat]}`} aria-hidden />
              {categoryHeading(
                cat,
                lines.map((l) => l.participantId),
                both,
              )}
              <span aria-hidden className={`text-muted-foreground transition-transform motion-reduce:transition-none ${isOpen ? 'rotate-90' : ''}`}>
                ›
              </span>
            </button>
            {/* Toujours dans la page, caché quand le camp est fermé : l'impression le montre, Ctrl+F le trouve et l'ouvre. */}
            <ul
              ref={foundable(isOpen, () => setOpen((o) => new Set(o).add(cat)))}
              data-print-open
              className="fold-in space-y-1.5"
            >
              {lines.map((l) => (
                <PersonLine key={l.participantId} line={l} cat={cat} other={polar && both.has(l.participantId)} full={full} ctx={ctx} />
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

/**
 * « Pourquoi cette étiquette ? » : ce qui rend ce motif fragile, ce qui est à vérifier, dans ce cas précis, calculé
 * par le code (`explain.ts`). Remplace les infobulles générales, qu'Arnaud jugeait incompréhensibles (18/10).
 */
function WhyLabel({ group, ctx }: { group: Group; ctx: Ctx }) {
  const fragile = fragileReason(group)
  const doubt = doubtReason(group, ctx.ideaById, ctx.alsoIn)
  const [open, setOpen] = useState(false)
  if (!fragile && !doubt) return null
  return (
    <div className="space-y-2 rounded-md bg-muted px-3 py-2 text-sm">
      <p className="font-semibold">Pourquoi cette étiquette ?</p>
      {fragile && (
        <p>
          <span className="font-semibold">Fragile.</span> {fragile}
        </p>
      )}
      {doubt && (
        <>
          <p>
            <span className="font-semibold">À vérifier.</span> {ctx.mask(doubt.text)}
          </p>
          <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="no-print inline-flex min-h-8 cursor-pointer items-center font-medium text-primary underline-offset-4 hover:underline">
            {open ? (doubt.ideaIds.length > 1 ? 'Masquer ces verbatims' : 'Masquer ce verbatim') : doubt.ideaIds.length > 1 ? `Voir ces ${doubt.ideaIds.length} verbatims` : 'Voir ce verbatim'}
          </button>
          {open && <QuotesPanel ids={doubt.ideaIds} ctx={ctx} onClose={() => setOpen(false)} />}
        </>
      )}
    </div>
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
  const box = useRef<HTMLLIElement>(null)
  const close = () => {
    const id = open
    setOpen(null)
    requestAnimationFrame(() => box.current?.querySelector<HTMLElement>(`[data-idea="${id}"]`)?.focus({ preventScroll: true }))
  }
  return (
    <li
      ref={box}
      className={`flex gap-2 border-l-[3px] py-0.5 pl-2.5 ${BORDER[cat]}`}
      onKeyDown={(e) => {
        if (e.key !== 'Escape' || !open) return
        // Échap referme la réponse entière seulement, pas le motif qui la contient ; le focus revient au verbatim.
        e.stopPropagation()
        close()
      }}
    >
      <span className="w-9 shrink-0 pt-px text-sm font-semibold text-muted-foreground">
        {line.participantId}
        {other && ' *'}
      </span>
      <div className="min-w-0 flex-1">
        {line.ideas.map((i) => {
          const where = ctx.origin(i.contributionId)
          // Une réponse courte qui est toute la réponse (« Les tarifs ») ne dit son sens qu'avec sa question.
          const question = full.has(i.id) ? ctx.context(i) : undefined
          const also = ctx.alsoIn(i)
          const origin = [
            question ? `— ${where ? `${where}, ` : ''}en réponse à «\u00a0${question}\u00a0»` : where ? `(${where})` : '',
            also ? `aussi dans «\u00a0${also}\u00a0»` : '',
          ]
            .filter(Boolean)
            .join(' · ')
          return (
            // Un verbatim par ligne : plus de point-virgule orphelin entre deux citations d'une même personne.
            <Fragment key={i.id}>
              <span className={line.ideas.length > 1 ? 'block' : undefined}>
                <Tooltip wide side="top" content={<SourceContext idea={i} ctx={ctx} excerpt={180} />}>
                  <button
                    type="button"
                    data-idea={i.id}
                    className="cursor-pointer text-left underline-offset-4 hover:underline"
                    aria-expanded={open === i.id}
                    onClick={() => setOpen(open === i.id ? null : i.id)}
                  >
                    «&nbsp;{ctx.mask(i.verbatim)}&nbsp;»
                  </button>
                </Tooltip>
                {origin && <span className="text-sm text-muted-foreground"> {origin}</span>}
              </span>{' '}
            </Fragment>
          )
        })}
        {open && <ContextPanel idea={line.ideas.find((i) => i.id === open)!} ctx={ctx} onClose={close} />}
      </div>
    </li>
  )
}

function MinorityNote({ minority, ctx }: { minority: NonNullable<Metrics['minority']>; ctx: Ctx }) {
  const [open, setOpen] = useState(false)
  return (
    <Alert tone="info" className="text-sm">
      Minorité constante ({minority.side === 'positive' ? 'avis positifs' : 'avis négatifs'}) : {minority.participantIds.join(', ')}.{' '}
      <button className="no-print inline-flex min-h-6 cursor-pointer items-center text-primary underline" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? 'Masquer leurs verbatims' : 'Voir leurs verbatims'}
      </button>
      {open && <QuotesPanel ids={minority.ideaIds} ctx={ctx} onClose={() => setOpen(false)} />}
    </Alert>
  )
}

const VERDICT_DOT: Record<Verdict, string> = {
  appreciated: 'bg-positive',
  criticized: 'bg-negative',
  divided: 'bg-warning',
  nomajority: 'bg-neutral',
  none: 'bg-muted-foreground/40',
  few: 'bg-muted-foreground/30',
}

/**
 * Un thème réunit des motifs différents : on n'y additionne pas leurs avis. Sa barre montre ses motifs, chacun à la
 * couleur de son verdict et à la largeur de ses participants (on compte des personnes, pas des motifs) ; ses étiquettes
 * disent combien de motifs sont appréciés, critiqués, discutés (remarque d'Arnaud, 18/10 ; `methodologue`, D4).
 */
function VerdictBar({ groups }: { groups: Metrics[] }) {
  const shown = groups.filter((m) => m.participants > 1)
  if (!shown.length) return <div className="h-2 rounded-full bg-muted" aria-hidden />
  return (
    <div className="flex h-2 gap-0.5 overflow-hidden rounded-full" aria-hidden>
      {shown.map((m, k) => (
        <div key={k} className={VERDICT_DOT[verdictOf(m)]} style={{ flexGrow: m.participants }} />
      ))}
    </div>
  )
}

function VerdictLine({ groups, suggestions }: { groups: Metrics[]; suggestions?: number }) {
  const counted = groups.filter((m) => m.participants > 1)
  const isolated = groups.length - counted.length
  const verdicts = themeVerdicts(counted)
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
      <span className="font-medium text-foreground">{plural(groups.length, 'thème')} :</span>
      {verdicts.map(({ verdict, count }) => (
        <span key={verdict} className="inline-flex items-center gap-1.5">
          <span className={`inline-block size-2.5 rounded-full ${VERDICT_DOT[verdict]}`} aria-hidden />
          {verdictLabel(verdict, count)}
        </span>
      ))}
      {isolated > 0 && (
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full border border-muted-foreground/50" aria-hidden />
          {isolated} d'une seule personne
        </span>
      )}
      {!!suggestions && <span>{suggestions > 1 ? `${suggestions} personnes font des suggestions` : '1 personne fait une suggestion'}</span>}
    </span>
  )
}

/**
 * Le compte court des thèmes, dans l'en-tête collé d'un grand thème ouvert, sur un écran assez large : « 5 thèmes
 * ● 1 ● 4 », les mots complets en infobulle et pour les lecteurs d'écran ; la ligne complète reste en tête du contenu.
 */
function VerdictDots({ groups }: { groups: Metrics[] }) {
  const counted = groups.filter((m) => m.participants > 1)
  const isolated = groups.length - counted.length
  const verdicts = themeVerdicts(counted)
  const words = [...verdicts.map(({ verdict, count }) => verdictLabel(verdict, count)), ...(isolated ? [`${isolated} d'une seule personne`] : [])].join(', ')
  return (
    <span className="hidden shrink-0 items-center gap-2 text-sm text-muted-foreground md:inline-flex" title={words}>
      <span>{plural(groups.length, 'thème')}</span>
      <span className="sr-only">: {words}</span>
      {verdicts.map(({ verdict, count }) => (
        <span key={verdict} className="inline-flex items-center gap-1" aria-hidden>
          <span className={`inline-block size-2.5 rounded-full ${VERDICT_DOT[verdict]}`} />
          {count}
        </span>
      ))}
      {isolated > 0 && (
        <span className="inline-flex items-center gap-1" aria-hidden>
          <span className="inline-block size-2.5 rounded-full border border-muted-foreground/50" />
          {isolated}
        </span>
      )}
    </span>
  )
}

/** La ligne d'un thème fermé : une seule cible, qui ouvre. */
function ThemeRow({ title, m, groups }: { title: string; m: Metrics; groups: Metrics[] }) {
  return (
    <span className="block space-y-2 py-3">
      <span className="flex items-start justify-between gap-2">
        <h3 data-vt="title" className="text-lg font-semibold">
          {title}
        </h3>
        <span data-vt="meta" className="shrink-0 pt-1 text-sm text-muted-foreground">
          {plural(m.participants, 'participant')}
        </span>
      </span>
      <span data-vt="bar" className="block">
        <VerdictBar groups={groups} />
      </span>
      <VerdictLine groups={groups} />
    </span>
  )
}

/** Déplier ou replier tous les thèmes (pas les motifs) : pour qui veut tout parcourir, ou chercher avec Ctrl+F. */
function ExpandAll() {
  const [all, setAll] = useState(false)
  // Le libellé suit l'état réel : des thèmes ouverts un à un comptent aussi.
  useEffect(() => {
    const sync = () => {
      const themes = [...document.querySelectorAll<HTMLDetailsElement>('details[data-fold="theme"]')]
      setAll(themes.length > 0 && themes.every((d) => d.open))
    }
    document.addEventListener('toggle', sync, true)
    return () => document.removeEventListener('toggle', sync, true)
  }, [])
  return (
    <button
      type="button"
      onClick={() => document.querySelectorAll<HTMLDetailsElement>('details[data-fold="theme"]').forEach((d) => (d.open = !all))}
      className="no-print inline-flex min-h-8 cursor-pointer items-center rounded-md border border-input bg-card px-3 text-sm font-medium hover:bg-accent"
    >
      {all ? 'Replier tous les grands thèmes' : 'Déplier tous les grands thèmes'}
    </button>
  )
}

export function ReportTab({
  project,
  analysis: saved,
  onSaveStudy,
  published = false,
}: {
  project: Project
  analysis: AnalysisState
  onSaveStudy?: () => void
  /** Étude publiée (Observatoire) : lecture seule, textes déjà masqués, sa fiche dit d'où vient le rapport. */
  published?: boolean
}) {
  const analysis = useMemo(() => withCurrentMetrics(saved), [saved])
  const corpus = corpusForAnalysis(project)
  // Un rapport dont les données ont changé (source retirée…) le dit, ici aussi : l'étude s'ouvre souvent directement sur le rapport.
  const [currentHash, setCurrentHash] = useState<string | null>(null)
  useEffect(() => {
    corpusHash(corpus).then(setCurrentHash)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project])
  const stale = !published && currentHash !== null && currentHash !== analysis.corpusHash
  // À l'impression, tout est déplié : sinon les verbatims des motifs fermés disparaîtraient du PDF.
  useEffect(() => {
    let closed: HTMLDetailsElement[] = []
    const before = () => {
      closed = [...document.querySelectorAll<HTMLDetailsElement>('main details:not([open])')]
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
  const offTopic = offTopicLines(analysis)
  const [back, setBack] = useState<{ from: HTMLElement; label: string } | null>(null)
  // Le retour s'efface quand on referme le motif où l'on est allé, et seulement celui-là (un nouveau saut remplace l'écoute).
  const watched = useRef<{ d: HTMLDetailsElement; off: () => void } | null>(null)
  const unwatch = () => {
    watched.current?.off()
    watched.current = null
  }
  // Tant que le bouton de retour flotte en bas, le focus clavier ne s'arrête jamais dessous (WCAG 2.4.11) : un élément
  // qui reçoit le focus sous le bouton remonte juste assez pour le dégager.
  const backButton = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!back) return
    const onFocus = (e: FocusEvent) => {
      const el = e.target as HTMLElement
      const b = backButton.current?.getBoundingClientRect()
      if (!b || el === backButton.current) return
      const r = el.getBoundingClientRect()
      const overlap = r.bottom > b.top && r.top < b.bottom && r.right > b.left && r.left < b.right
      if (overlap) window.scrollBy({ top: r.bottom - b.top + 8, behavior: 'instant' })
    }
    document.addEventListener('focusin', onFocus)
    return () => document.removeEventListener('focusin', onFocus)
  }, [back])
  const ctx: Ctx = {
    reveal: (groupId, from, label) => {
      const d = revealMotif(groupId)
      if (!d) return
      unwatch()
      setBack({ from, label })
      const onToggle = () => {
        if (d.open) return
        setBack(null)
        unwatch()
      }
      d.addEventListener('toggle', onToggle)
      watched.current = { d, off: () => d.removeEventListener('toggle', onToggle) }
    },
    ideaById: new Map(analysis.ideas.map((i) => [i.id, i])),
    contributionById: new Map(corpus.contributions.map((c) => [c.id, c])),
    segment,
    mask: (t) => (masked ? maskNames(t, names) : t),
    origin: originOf(corpus),
    context: shortAnswerContext(corpus),
    alsoIn: alsoInOf(analysis),
    groupTitle: (() => {
      const titles = new Map(analysis.groups.flatMap((g) => g.ideaIds.map((id) => [id, g.title] as const)))
      return (id: string) => titles.get(id)
    })(),
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
  const all = segment ? computeMetrics(analysis.ideas.filter((i) => segment.has(i.participantId))) : computeMetrics(analysis.ideas)
  const title = project.name
  const simulated = analysis.engine.presetId === 'simulation'

  return (
    <article className="space-y-6">
      {/* Une étude publiée dit sa date et ses chiffres dans son en-tête : pas de seconde ligne (remarque d'Arnaud, 17/10). */}
      <p className={published && !segment ? 'hidden' : 'text-base text-muted-foreground'}>
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
        {/* Une étude publiée se télécharge depuis l'article, qui porte sa fiche (source, licence, limites). */}
        {!published && (
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
        )}
      </TabActions>

      {stale && (
        <Alert tone="warning">
          Les données ont changé depuis ce rapport (source ajoutée, retirée ou questions modifiées). Il reste consultable, mais relancez l'analyse dans l'onglet
          Analyse pour qu'il en tienne compte.
        </Alert>
      )}
      {analysis.engine.presetId === 'bridge' && !published && (
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
            <CitedText text={analysis.globalSummary} ctx={ctx} camps={analysis.groups} />
            <Unverified items={analysis.globalUnverified} />
            {summaryDoubts(sectionsHL) && <DoubtLinks sections={sectionsHL} ctx={ctx} />}
          </div>
        </section>
      )}

      {!segment && sectionsHL.length > 0 && (
        <section aria-labelledby="saillants" className="space-y-3">
          <h2 id="saillants" className="sr-only">
            Faits saillants
          </h2>
          {/* Colonnes plutôt que grille : des cartes de hauteurs inégales ne laissent pas de trou. */}
          <div className="gap-3 md:columns-2 print:columns-1">
            {sectionsHL.map((sec) => {
              const look = SECTION_LOOK[sec.key]
              const Icon = look.icon
              return (
                <Card key={sec.key} className={`mb-3 break-inside-avoid border-t-4 ${look.top} ${FLAT_CARD}`}>
                  <CardHeader className="pb-2 max-sm:px-0">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Icon className={`size-4 ${look.text}`} aria-hidden />
                      {sec.heading}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="max-sm:px-0">
                    {sec.intro && <p className="mb-2 text-sm text-muted-foreground">{sec.intro}</p>}
                    <ul className="space-y-2 text-base">
                      {sec.items.map((x) => (
                        <ListItem key={x.title} section={sec.key} item={x} ctx={ctx} groupById={groupById} lineClass={look.line} heading={sec.heading} />
                      ))}
                    </ul>
                    {sec.moreItems.length > 0 && <MoreItems section={sec.key} items={sec.moreItems} ctx={ctx} groupById={groupById} lineClass={look.line} heading={sec.heading} />}
                  </CardContent>
                </Card>
              )
            })}
          </div>
          <p className="text-sm text-muted-foreground">
            Listes établies par le code à partir des chiffres de chaque thème, sur {plural(all.participants, 'participant')} ; la phrase sous chaque
            thème ouvre sa synthèse, et ❝ déroule les verbatims qu'elle compte.
          </p>
        </section>
      )}

      {/* La partie détaillée, séparée de « la température » du haut : on y explore, thème par thème, motif par motif. */}
      <section aria-labelledby="detail" className="space-y-3 border-t-4 border-foreground/10 pt-8">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="space-y-1">
            <h2 id="detail" className="text-xl font-semibold">
              {sections ? 'Le détail, par grand thème' : 'Le détail, thème par thème'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {sections ? `${plural(sections.length, 'grand thème', 'grands thèmes')}, ${plural(analysis.groups.length, 'thème')}. Ouvrez un grand thème, puis un thème, pour lire ce que disent les participants.` : 'Ouvrez un thème pour lire ce que disent les participants.'}
            </p>
          </div>
          {sections && <ExpandAll />}
        </div>
        {sections ? (
          <div>
            {sections.map((t) => {
              const m = filteredMetrics(
                t.groups.flatMap((g) => g.ideaIds),
                t.metrics,
              )
              if (!m.participants) return null
              const groups = t.groups.map((g) => ({ g, m: filteredMetrics(g.ideaIds, g.metrics) })).filter((x) => x.m.participants > 0)
              return (
                <Fold
                  key={t.id}
                  id={`sec-${t.id}`}
                  level="theme"
                  label={`le grand thème « ${t.title} »`}
                  className="border-b"
                  closed={<ThemeRow title={t.title} m={m} groups={groups.map((x) => x.m)} />}
                  opened={
                    <span className="flex min-w-0 items-center gap-3">
                      <h3 data-vt="title" className="min-w-0 truncate text-lg font-semibold">
                        {t.title}
                      </h3>
                      <span data-vt="bar" className="block w-12 shrink-0 sm:w-28">
                        <VerdictBar groups={groups.map((x) => x.m)} />
                      </span>
                      <VerdictDots groups={groups.map((x) => x.m)} />
                      <span data-vt="meta" className="hidden shrink-0 text-sm text-muted-foreground lg:inline">
                        {plural(m.participants, 'participant')}
                      </span>
                    </span>
                  }
                  bodyClassName="space-y-3 pb-4 pt-2"
                >
                  <VerdictLine groups={groups.map((x) => x.m)} suggestions={m.participantsByCategory.suggestion} />
                  {t.summary && !segment && (
                    <div className="max-w-3xl text-base">
                      <CitedText text={t.summary} ctx={ctx} />
                      <Unverified items={t.unverified} />
                    </div>
                  )}
                  <div>
                    {t.groups
                      .filter((g) => g.metrics.participants > 1)
                      .map((g) => (
                        <GroupBlock key={g.id} group={g} ctx={ctx} headingLevel="h4" />
                      ))}
                  </div>
                  {t.groups.some((g) => g.metrics.participants <= 1) && (
                    <div>
                      <p className="pt-2 text-sm font-medium text-muted-foreground">Signaux isolés · un seul participant chacun</p>
                      {t.groups
                        .filter((g) => g.metrics.participants <= 1)
                        .map((g) => (
                          <GroupBlock key={g.id} group={g} ctx={ctx} headingLevel="h4" />
                        ))}
                    </div>
                  )}
                </Fold>
              )
            })}
          </div>
        ) : (
          <div>
            {analysis.groups.map((g) => (
              <div key={g.id} id={`sec-${g.id}`}>
                <GroupBlock group={g} ctx={ctx} headingLevel="h3" />
              </div>
            ))}
          </div>
        )}
      </section>

      {offTopic.ideas > 0 && (
        <section aria-labelledby="hors-question" className="space-y-2">
          <h2 id="hors-question" className="text-xl font-semibold">
            Hors question
          </h2>
          <p className="text-sm text-muted-foreground">{OFF_TOPIC_INTRO}</p>
          <ul className="space-y-1.5">
            {offTopic.lines.map((l) => (
              <PersonLine key={l.participantId} line={l} cat="neutral" other={false} full={new Set()} ctx={ctx} />
            ))}
          </ul>
        </section>
      )}

      {back && (
        <button
          ref={backButton}
          type="button"
          onClick={() => {
            glideTo(back.from, 'center')
            setBack(null)
            unwatch()
          }}
          className="no-print fixed bottom-4 left-4 z-40 inline-flex min-h-10 max-w-[calc(100vw-2rem)] cursor-pointer items-center gap-1 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground shadow-lg"
        >
          <span className="truncate">← {back.label}</span>
        </button>
      )}

      <Card className={`max-sm:border-t ${FLAT_CARD}`}>
        <CardHeader className="max-sm:px-0">
          <CardTitle>Méthode</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground max-sm:px-0">
          <ul className="list-disc space-y-1.5 pl-5">
            {methodNote(analysis, corpus).map((line, k) => (
              <li key={k}>{line}</li>
            ))}
            <li>Indicateurs, version {METRICS_VERSION}.</li>
          </ul>
        </CardContent>
      </Card>
    </article>
  )
}

export type { IdeaCategory }
