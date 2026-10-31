/**
 * Essai « boucle unique » (article d'Anthropic du 22/10/2026, « When to fold subagents into your main agent loop ») :
 * un seul agent mène toute la synthèse dans un seul contexte, au lieu des centaines de demandes séparées du pipeline.
 * Le savoir-faire des consignes devient des compétences (`essais/boucle-unique/kit/competences/`), les contrôles du code
 * deviennent des outils : l'agent propose (découpe, range, rédige), ces outils vérifient et calculent avec le code
 * du moteur, et lui renvoient en clair ce qui ne va pas.
 *
 * Usage : npx tsx essais/boucle-unique/kit/outil.ts <dossier> <commande> [arguments]
 *   init <fichier.csv> --question "…" [--modele nom]   prépare le dossier (corpus.md, etat.json)
 *   idees <fichier.json>                  découpe d'une ou plusieurs personnes : citations vérifiées mot pour mot
 *   motifs <fichier.json>                 rangement : creer, ranger, copier, ton, hors_question, renommer, definir, fusionner…
 *   voir motifs | motif G3 | idees P1-P40 | non-ranges | listes | textes
 *   ecrire <fichier.json>                 synthèses des motifs, thèmes, résumé : contrôles du code renvoyés
 *   finaliser --titre "…"                 état d'analyse, rapport.md et rapport.html, par le code du moteur
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { activeParticipants, contributionsOf, type Corpus } from '../../../src/core/corpus'
import { analyzeCsv, csvToCorpus, type ColumnRole } from '../../../src/core/import/csv'
import {
  checkOpposed,
  corpusHash,
  describeMetrics,
  describeTheme,
  ensureCamps,
  extractParticipant,
  groupTarget,
  needsConsolidation,
  themeTarget,
  markUnverified,
  missingCamps,
  sanitizeCitations,
  sentencesOf,
  thinCamps,
  verifyNumbers,
  withDivided,
} from '../../../src/core/analysis/pipeline'
import { computeMetrics } from '../../../src/core/analysis/metrics'
import { fragileShown, highlightLine, highlights, labelDoubt } from '../../../src/core/analysis/highlights'
import { uncoveredWithContext } from '../../../src/core/analysis/coverage'
import { reportToHtml, reportToMarkdown } from '../../../src/core/analysis/report'
import { DEFAULT_SETTINGS, type AnalysisSettings, type AnalysisState, type Group, type GroupDefinition, type Idea, type IdeaCategory, type Merge, type RejectedIdea, type Theme } from '../../../src/core/analysis/types'
import type { LlmRunner } from '../../../src/core/analysis/runner'
import { methodOf } from '../../../src/core/analysis/methods'

const CATS: IdeaCategory[] = ['positive', 'negative', 'neutral', 'suggestion', 'question']
const CAT_FR: Record<IdeaCategory, string> = { positive: 'positif', negative: 'négatif', neutral: 'constat', suggestion: 'suggestion', question: 'question' }

interface Motif {
  id: string
  title: string
  ideaIds: string[]
  definition?: GroupDefinition
  summary: string
  opposed: { a: string; b: string; about: string }[]
}

interface Etat {
  csv: string
  modele: string
  settings: AnalysisSettings
  createdAt: string
  nextIdea: number
  nextGroup: number
  ideas: Idea[]
  extracted: string[]
  rejected: RejectedIdea[]
  names: string[]
  groups: Motif[]
  offTopic: string[]
  themes: { title: string; groupIds: string[]; summary: string }[]
  globalSummary: string
  moved: { id: string; from: string; to: string }[]
  retoned: { id: string; from: IdeaCategory; to: IdeaCategory }[]
  copied: { id: string; from: string; to: string }[]
  merges: Merge[]
  /** Appels d'outils, pour mesurer la boucle (nombre de tours). */
  calls: Record<string, number>
  /** Analyse importée d'un pipeline : ses bilans d'étapes (relecture, balayage…), gardés pour la section Méthode. */
  extra?: Partial<AnalysisState>
}

const [dirArg, cmd, ...args] = process.argv.slice(2)
if (!dirArg || !cmd) {
  console.error('Usage : npx tsx essais/boucle-unique/kit/outil.ts <dossier> <commande> [arguments]')
  process.exit(1)
}
const dir = resolve(dirArg)
const etatPath = join(dir, 'etat.json')
const opt = (name: string) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}

function loadCorpus(csvPath: string): Corpus {
  const csv = analyzeCsv(readFileSync(csvPath, 'utf8'))
  const roles: Record<number, ColumnRole> = Object.fromEntries(csv.columns.map((c) => [c.index, c.suggestedRole]))
  const corpus = csvToCorpus(csv.table, { roles, sourceName: csvPath.split('/').pop() ?? 'corpus.csv' })
  // Identifiant de source fixe : l'empreinte du corpus ne dépend pas du tirage.
  for (const s of corpus.sources) s.id = 'src_boucle'
  for (const c of corpus.contributions) c.sourceId = 'src_boucle'
  return corpus
}

const save = (e: Etat) => writeFileSync(etatPath, JSON.stringify(e))
const pad = (n: number) => `I${String(n).padStart(4, '0')}`
const short = (t: string, max = 160) => {
  const s = t.replace(/\s+/g, ' ').trim()
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`
}
const readJson = (p: string) => JSON.parse(readFileSync(resolve(p), 'utf8'))

// ─── init ────────────────────────────────────────────────────────────────────

if (cmd === 'init') {
  const csvPath = resolve(args[0])
  const corpus = loadCorpus(csvPath)
  const settings: AnalysisSettings = {
    ...DEFAULT_SETTINGS,
    researchQuestion: opt('question') ?? '',
    method: 'consultation',
    multiCoding: true,
  }
  const etat: Etat = {
    csv: csvPath,
    modele: opt('modele') ?? 'claude',
    settings,
    createdAt: new Date().toISOString(),
    nextIdea: 1,
    nextGroup: 1,
    ideas: [],
    extracted: [],
    rejected: [],
    names: [],
    groups: [],
    offTopic: [],
    themes: [],
    globalSummary: '',
    moved: [],
    retoned: [],
    copied: [],
    merges: [],
    calls: {},
  }
  save(etat)
  const prompts = [...new Set(corpus.contributions.map((c) => c.prompt))]
  const lines = [
    `# Corpus : ${activeParticipants(corpus).length} participants`,
    '',
    `Objectif de l'étude : « ${settings.researchQuestion} »`,
    '',
    ...prompts.map((p, i) => `Question Q${i + 1} : « ${p} »`),
    '',
    'Chaque participant : identifiant, attributs, puis sa réponse (référence C1, C2… si plusieurs).',
    '',
  ]
  for (const p of activeParticipants(corpus)) {
    const cs = contributionsOf(corpus, p.id)
    const attrs = Object.values(p.attributes).filter(Boolean).join(', ')
    lines.push(`## ${p.id}${attrs ? ` (${attrs})` : ''}`)
    cs.forEach((c, i) => lines.push(`${cs.length > 1 ? `C${i + 1} : ` : ''}${c.text}`))
    lines.push('')
  }
  writeFileSync(join(dir, 'corpus.md'), lines.join('\n'))
  console.log(`Prêt : ${activeParticipants(corpus).length} participants, ${corpus.contributions.length} réponses. Corpus lisible : ${join(dir, 'corpus.md')}`)
  process.exit(0)
}

// ─── importer ────────────────────────────────────────────────────────────────

/** Les phrases que le code ajoute au résumé sur ce qui divise : retirées à l'import, le code les réécrit en finalisant. */
const CODE_DIVIDED = /\s*(Les avis sont partagés sur |Un autre sujet divise aussi|\d+ autres sujets divisent aussi|Deux propositions vont en sens contraire|Des propositions vont en sens contraire).*$/s

if (cmd === 'importer') {
  // Reprend l'état final d'un pipeline (state.json) pour qu'un agent le corrige avec les mêmes outils.
  const st: AnalysisState = JSON.parse(readFileSync(resolve(args[0]), 'utf8'))
  const csvPath = resolve(args[1] ?? join(dir, 'corpus.csv'))
  const num = (id: string) => Number(id.slice(1))
  const paragraphs = st.globalSummary.split(/\n\s*\n/)
  if (paragraphs.length > 1) paragraphs[1] = paragraphs[1].replace(CODE_DIVIDED, '')
  const { reconciled, swept, support, polish, campsAdded, reviewSkipped } = st
  const etat: Etat = {
    csv: csvPath,
    modele: st.engine.model,
    settings: st.settings,
    createdAt: st.createdAt,
    nextIdea: Math.max(0, ...st.ideas.map((i) => num(i.id))) + 1,
    nextGroup: Math.max(0, ...st.groups.map((g) => num(g.id))) + 1,
    ideas: st.ideas,
    extracted: st.extractedParticipants,
    rejected: st.rejected,
    names: st.names ?? [],
    groups: st.groups.map((g) => ({ id: g.id, title: g.title, ideaIds: g.ideaIds, ...(g.definition ? { definition: g.definition } : {}), summary: g.summary, opposed: g.opposed ?? [] })),
    offTopic: st.offTopic ?? [],
    themes: st.themes.map((t) => ({ title: t.title, groupIds: t.groupIds, summary: t.summary })),
    globalSummary: paragraphs.join('\n\n'),
    moved: st.moved ?? [],
    retoned: st.retoned ?? [],
    copied: st.copied ?? [],
    merges: st.merges ?? [],
    calls: {},
    extra: { reconciled, swept, support, polish, campsAdded, reviewSkipped, calls: st.calls },
  }
  save(etat)
  console.log(`Importé : ${etat.ideas.length} idées, ${etat.groups.length} motifs, ${etat.themes.length} thèmes.`)
  process.exit(0)
}

if (!existsSync(etatPath)) {
  console.error(`Pas d'état dans ${dir} : lance d'abord « init ».`)
  process.exit(1)
}
const etat: Etat = JSON.parse(readFileSync(etatPath, 'utf8'))
etat.calls[cmd] = (etat.calls[cmd] ?? 0) + 1
const corpus = loadCorpus(etat.csv)
const order = new Map(activeParticipants(corpus).map((p, i) => [p.id, i]))
const ideaById = () => new Map(etat.ideas.map((i) => [i.id, i]))
const motifOf = () => new Map(etat.groups.flatMap((g) => g.ideaIds.map((id) => [id, g] as const)))
const findMotif = (ref: string): Motif | undefined =>
  etat.groups.find((g) => g.id === ref) ?? etat.groups.find((g) => g.title.trim().toLowerCase() === String(ref).trim().toLowerCase())
const asGroup = (m: Motif, byId = ideaById()): Group => ({
  id: m.id,
  title: m.title,
  ideaIds: m.ideaIds,
  summary: m.summary,
  metrics: computeMetrics(m.ideaIds.map((id) => byId.get(id)!).filter(Boolean)),
  ...(m.definition ? { definition: m.definition } : {}),
  opposed: m.opposed,
})
const groupsNow = () => {
  const byId = ideaById()
  return etat.groups.map((m) => asGroup(m, byId))
}

/** La ligne d'un motif, comme le code la calcule : personnes, avis, étiquette, « fragile », « à vérifier ». */
function motifLine(g: Group, byId: Map<string, Idea>): string {
  const marks = [fragileShown(g.metrics) && 'fragile', labelDoubt(g, byId) && 'à vérifier'].filter(Boolean)
  return `${g.id} · ${g.title} · ${describeMetrics(g.metrics)}${marks.length ? ` · ${marks.join(', ')}` : ''}${g.definition ? '' : ' · sans définition'}${g.summary ? '' : ' · sans synthèse'}`
}

function overview(): string {
  const byId = ideaById()
  const groups = groupsNow().sort((a, b) => b.metrics.participants - a.metrics.participants)
  const placed = new Set([...etat.groups.flatMap((g) => g.ideaIds), ...etat.offTopic])
  const originals = etat.ideas.filter((i) => !i.copyOf)
  const unplaced = originals.filter((i) => !placed.has(i.id)).length
  const single = groups.filter((g) => g.metrics.participants === 1).length
  const biggest = groups[0]
  const out = [
    `${groups.length} motifs ; ${originals.length} idées, dont ${unplaced} non rangées et ${etat.offTopic.length} hors question ; ${etat.ideas.length - originals.length} copies (codage en double).`,
    `${single} motifs à une seule personne${groups.length ? ` (${Math.round((single / groups.length) * 100)} %)` : ''} ; le plus gros : ${biggest ? `${biggest.title}, ${biggest.ideaIds.length} idées (${Math.round((biggest.ideaIds.length / Math.max(1, etat.ideas.length)) * 100)} %)` : '—'}.`,
    (() => {
      const g = groupTarget(new Set(originals.map((i) => i.label.trim().toLowerCase())).size, new Set(originals.map((i) => i.participantId)).size)
      const t = themeTarget(groups.length)
      const gate = needsConsolidation(groups.map((x) => x.metrics.participants), activeParticipants(corpus).length)
      return `Repères du code : ${g.min} à ${g.max} motifs à titre indicatif ; ${t.min} à ${t.max} thèmes${gate ? ' ; porte de qualité : trop de motifs à une personne ou médiane trop basse, cherche les motifs qui traitent le même objet' : ''}.`
    })(),
    ...groups.map((g) => motifLine(g, byId)),
  ]
  return out.join('\n')
}

// ─── idees ───────────────────────────────────────────────────────────────────

type ItemIn = { ref?: string; label: string; verbatim: string; category: IdeaCategory }

async function cmdIdees(file: string) {
  const raw = readJson(file)
  const list: { p: string; ideas: ItemIn[]; names?: string[] }[] = Array.isArray(raw)
    ? raw
    : Object.entries(raw).map(([p, v]) => (Array.isArray(v) ? { p, ideas: v as ItemIn[] } : { p, ...(v as { ideas: ItemIn[]; names?: string[] }) }))
  // Le découpage d'une personne ne fait aucune demande : couverture et correction reviennent à l'agent.
  const noAsk = { json: async () => ({ ideas: [] }) } as unknown as LlmRunner
  const out: string[] = []
  for (const entry of list) {
    const pid = entry.p
    const contributions = contributionsOf(corpus, pid)
    if (!contributions.length) {
      out.push(`${pid} : participant inconnu ou sans réponse.`)
      continue
    }
    const bad = (entry.ideas ?? []).filter((x) => !CATS.includes(x.category))
    if (bad.length) out.push(`${pid} : catégorie inconnue pour ${bad.map((b) => `« ${b.label} »`).join(', ')} (positive, negative, neutral, suggestion, question).`)
    const given = {
      ideas: (entry.ideas ?? []).filter((x) => CATS.includes(x.category)).map((x) => ({ ref: x.ref ?? 'C1', label: x.label, verbatim: x.verbatim, category: x.category })),
      names: entry.names ?? [],
    }
    const res = await extractParticipant(contributions, pid, etat.settings, noAsk, given)
    // Un nouveau découpage remplace l'ancien : ses idées (et leurs copies) quittent les motifs.
    const old = new Set(etat.ideas.filter((i) => i.participantId === pid).map((i) => i.id))
    const lost = etat.groups.filter((g) => g.ideaIds.some((id) => old.has(id))).map((g) => g.id)
    if (old.size) {
      etat.ideas = etat.ideas.filter((i) => !old.has(i.id))
      for (const g of etat.groups) g.ideaIds = g.ideaIds.filter((id) => !old.has(id))
      etat.offTopic = etat.offTopic.filter((id) => !old.has(id))
      etat.copied = etat.copied.filter((c) => !old.has(c.id))
    }
    const added = res.ideas.map((i) => ({ ...i, id: pad(etat.nextIdea++) }))
    etat.ideas.push(...added)
    etat.rejected = [...etat.rejected.filter((r) => r.participantId !== pid), ...res.rejected]
    etat.names = [...new Set([...etat.names, ...res.names])]
    if (!etat.extracted.includes(pid)) etat.extracted.push(pid)
    const uncovered = contributions.flatMap((c) =>
      uncoveredWithContext(
        c.text,
        added.filter((i) => i.contributionId === c.id).flatMap((i) => i.parts ?? [i.span]),
      ).map((p) => p.text),
    )
    const lines = [`${pid} : ${added.length} idée${added.length > 1 ? 's' : ''}${old.size ? ` (remplace ${old.size}${lost.length ? ` ; retirées de ${lost.join(', ')} : à ranger de nouveau` : ''})` : ''}`]
    for (const i of added) lines.push(`  ${i.id} ${CAT_FR[i.category]} · ${i.label}${i.approximate ? ' · citation retrouvée à quelques écarts près' : ''}`)
    const dropped = given.ideas.length - added.length - res.rejected.length
    if (dropped > 0) lines.push(`  ${dropped} idée${dropped > 1 ? 's' : ''} retirée${dropped > 1 ? 's' : ''} : même passage qu'une autre idée de même ton.`)
    for (const r of res.rejected) lines.push(`  CITATION INTROUVABLE « ${short(r.verbatim, 120)} » (${r.label}) : ${r.reason}. Renvoie toutes les idées de ${pid}, citation recopiée à l'identique.`)
    for (const u of uncovered) lines.push(`  PASSAGE SANS IDÉE : « ${short(u, 200)} ». S'il porte une idée, renvoie toutes les idées de ${pid} en l'ajoutant.`)
    out.push(lines.join('\n'))
  }
  save(etat)
  const left = activeParticipants(corpus).filter((p) => !etat.extracted.includes(p.id))
  out.push(
    `Découpage : ${etat.extracted.length}/${activeParticipants(corpus).length} personnes${left.length ? ` ; restent ${left.length} (${left.slice(0, 12).map((p) => p.id).join(', ')}${left.length > 12 ? '…' : ''})` : ', toutes découpées'}.`,
  )
  console.log(out.join('\n'))
}

// ─── motifs ──────────────────────────────────────────────────────────────────

type Op = { op: string; [k: string]: unknown }

function cmdMotifs(file: string) {
  const raw = readJson(file)
  const ops: Op[] = Array.isArray(raw) ? raw : raw.operations ?? []
  const errors: string[] = []
  const done: string[] = []
  const del = (id: string) => {
    etat.ideas = etat.ideas.filter((i) => i.id !== id)
    for (const g of etat.groups) g.ideaIds = g.ideaIds.filter((x) => x !== id)
    etat.copied = etat.copied.filter((c) => c.id !== id)
  }
  const placeOriginal = (idea: Idea, target: Motif) => {
    const from = motifOf().get(idea.id)
    if (from?.id === target.id) return
    if (from) {
      from.ideaIds = from.ideaIds.filter((x) => x !== idea.id)
      etat.moved.push({ id: idea.id, from: from.title, to: target.title })
    }
    etat.offTopic = etat.offTopic.filter((x) => x !== idea.id)
    // Une copie déjà dans le motif d'arrivée n'a plus lieu d'être.
    for (const c of etat.ideas.filter((i) => i.copyOf === idea.id && target.ideaIds.includes(i.id))) del(c.id)
    target.ideaIds.push(idea.id)
  }
  const ideasOf = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : v ? [String(v)] : [])
  for (const [k, o] of ops.entries()) {
    const where = `opération ${k + 1} (${o.op})`
    const byId = ideaById()
    try {
      if (o.op === 'creer') {
        const title = String(o.titre ?? '').trim()
        if (!title) throw new Error('titre manquant')
        if (findMotif(title)) throw new Error(`un motif « ${title} » existe déjà (${findMotif(title)!.id}) : utilise « ranger »`)
        const m: Motif = { id: `G${etat.nextGroup++}`, title, ideaIds: [], summary: '', opposed: [] }
        if (o.definition) m.definition = o.definition as GroupDefinition
        etat.groups.push(m)
        for (const id of ideasOf(o.idees)) {
          const idea = byId.get(id)
          if (!idea) errors.push(`${where} : idée ${id} inconnue`)
          else if (idea.copyOf) errors.push(`${where} : ${id} est une copie ; range l'original ${idea.copyOf}`)
          else placeOriginal(idea, m)
        }
        done.push(`${m.id} créé : ${title}`)
      } else if (o.op === 'ranger') {
        const m = findMotif(String(o.motif))
        if (!m) throw new Error(`motif ${o.motif} introuvable`)
        for (const id of ideasOf(o.idees)) {
          const idea = byId.get(id)
          if (!idea) errors.push(`${where} : idée ${id} inconnue`)
          else if (idea.copyOf) errors.push(`${where} : ${id} est une copie ; range l'original ${idea.copyOf} ou retire la copie`)
          else placeOriginal(idea, m)
        }
      } else if (o.op === 'copier') {
        const m = findMotif(String(o.motif))
        const idea = byId.get(String(o.idee))
        const category = String(o.category ?? idea?.category) as IdeaCategory
        if (!m) throw new Error(`motif ${o.motif} introuvable`)
        if (!idea) throw new Error(`idée ${o.idee} inconnue`)
        if (idea.copyOf) throw new Error(`${idea.id} est déjà une copie`)
        if (!CATS.includes(category)) throw new Error(`catégorie ${category} inconnue`)
        const home = motifOf().get(idea.id)
        if (!home) throw new Error(`${idea.id} n'est rangée dans aucun motif : range-la d'abord`)
        if (home.id === m.id) throw new Error(`${idea.id} est déjà dans ${m.id}`)
        if (etat.ideas.some((i) => i.copyOf === idea.id)) throw new Error(`${idea.id} a déjà une copie : deux motifs au plus par idée`)
        const copy: Idea = { ...idea, id: pad(etat.nextIdea++), copyOf: idea.id, category }
        etat.ideas.push(copy)
        m.ideaIds.push(copy.id)
        etat.copied.push({ id: copy.id, from: home.title, to: m.title })
        done.push(`copie ${copy.id} de ${idea.id} dans ${m.id} (${CAT_FR[category]})`)
      } else if (o.op === 'retirer_copie') {
        const idea = byId.get(String(o.idee))
        if (!idea?.copyOf) throw new Error(`${o.idee} n'est pas une copie`)
        del(idea.id)
      } else if (o.op === 'ton') {
        const idea = byId.get(String(o.idee))
        const category = String(o.category) as IdeaCategory
        if (!idea) throw new Error(`idée ${o.idee} inconnue`)
        if (!CATS.includes(category)) throw new Error(`catégorie ${category} inconnue`)
        if (idea.category !== category) {
          etat.retoned.push({ id: idea.id, from: idea.category, to: category })
          idea.category = category
        }
      } else if (o.op === 'hors_question') {
        for (const id of ideasOf(o.idees)) {
          const idea = byId.get(id)
          if (!idea || idea.copyOf) {
            errors.push(`${where} : ${id} inconnue ou copie`)
            continue
          }
          for (const g of etat.groups) g.ideaIds = g.ideaIds.filter((x) => x !== id)
          for (const c of etat.ideas.filter((i) => i.copyOf === id)) del(c.id)
          if (!etat.offTopic.includes(id)) etat.offTopic.push(id)
        }
      } else if (o.op === 'renommer') {
        const m = findMotif(String(o.motif))
        if (!m) throw new Error(`motif ${o.motif} introuvable`)
        m.title = String(o.titre).trim()
      } else if (o.op === 'definir') {
        const m = findMotif(String(o.motif))
        if (!m) throw new Error(`motif ${o.motif} introuvable`)
        m.definition = o.definition as GroupDefinition
      } else if (o.op === 'fusionner') {
        const ms = ideasOf(o.motifs).map((r) => findMotif(r))
        if (ms.some((m) => !m) || ms.length < 2) throw new Error('au moins deux motifs existants')
        const [keep, ...rest] = ms as Motif[]
        const title = String(o.titre ?? keep.title).trim()
        etat.merges.push({ title, from: ms.map((m) => m!.title), reason: String(o.raison ?? '') })
        keep.title = title
        if (o.definition) keep.definition = o.definition as GroupDefinition
        for (const m of rest) {
          for (const id of m.ideaIds) {
            const idea = byId.get(id)!
            const original = idea.copyOf
            // Une copie dont l'original est déjà dans le motif fusionné disparaît ; un original chasse sa copie.
            if (original && keep.ideaIds.includes(original)) del(id)
            else if (!original && etat.ideas.some((c) => c.copyOf === id && keep.ideaIds.includes(c.id))) {
              for (const c of etat.ideas.filter((c) => c.copyOf === id && keep.ideaIds.includes(c.id))) del(c.id)
              keep.ideaIds.push(id)
            } else keep.ideaIds.push(id)
          }
          etat.groups = etat.groups.filter((g) => g.id !== m.id)
        }
        done.push(`fusion dans ${keep.id} : ${title}`)
      } else if (o.op === 'supprimer') {
        const m = findMotif(String(o.motif))
        if (!m) throw new Error(`motif ${o.motif} introuvable`)
        if (m.ideaIds.length) throw new Error(`${m.id} contient encore ${m.ideaIds.length} idées`)
        etat.groups = etat.groups.filter((g) => g.id !== m.id)
      } else throw new Error('opération inconnue (creer, ranger, copier, retirer_copie, ton, hors_question, renommer, definir, fusionner, supprimer)')
    } catch (e) {
      errors.push(`${where} : ${e instanceof Error ? e.message : String(e)}`)
    }
  }
  // Un motif vidé disparaît.
  const empty = etat.groups.filter((g) => !g.ideaIds.length)
  etat.groups = etat.groups.filter((g) => g.ideaIds.length)
  save(etat)
  console.log(
    [
      `${ops.length} opérations ; ${errors.length} refusées.`,
      ...done,
      ...errors.map((e) => `REFUSÉ ${e}`),
      ...(empty.length ? [`Motifs vides retirés : ${empty.map((g) => `${g.id} ${g.title}`).join(', ')}`] : []),
      '',
      overview(),
    ].join('\n'),
  )
}

// ─── voir ────────────────────────────────────────────────────────────────────

function ideaLine(i: Idea, where?: string): string {
  const copy = i.copyOf ? ` · copie de ${i.copyOf}` : ''
  return `${i.id} ${i.participantId} ${CAT_FR[i.category]} · ${i.label}${copy}${where ? ` · ${where}` : ''} — « ${short(i.verbatim, 400)} »`
}

function cmdVoir(what: string, arg?: string) {
  const byId = ideaById()
  const home = motifOf()
  if (what === 'motifs') return console.log(overview())
  if (what === 'motif') {
    const m = findMotif(String(arg))
    if (!m) return console.log(`Motif ${arg} introuvable.`)
    const g = asGroup(m, byId)
    const out = [motifLine(g, byId)]
    if (m.definition) out.push(`Définition : positif = ${m.definition.positive} ; négatif = ${m.definition.negative}${m.definition.neutral ? ` ; hors camp = ${m.definition.neutral}` : ''}`)
    for (const cat of CATS) {
      const ids = m.ideaIds.filter((id) => byId.get(id)?.category === cat)
      if (!ids.length) continue
      out.push(`— ${CAT_FR[cat]} (${new Set(ids.map((id) => byId.get(id)!.participantId)).size} personnes)`)
      for (const id of ids) {
        const i = byId.get(id)!
        const other = i.copyOf ? home.get(i.copyOf)?.id : etat.ideas.filter((c) => c.copyOf === i.id).map((c) => home.get(c.id)?.id)[0]
        out.push(`  ${ideaLine(i, other ? `aussi dans ${other}` : undefined)}`)
      }
    }
    if (m.summary) out.push(`Synthèse : ${m.summary}`)
    return console.log(out.join('\n'))
  }
  if (what === 'idees') {
    const [a, b] = String(arg ?? '').replace(/P/g, '').split('-').map(Number)
    const inRange = (pid: string) => {
      const n = Number(pid.slice(1))
      return (!a || n >= a) && (!b || n <= (b || a))
    }
    const list = etat.ideas.filter((i) => inRange(i.participantId)).sort((x, y) => order.get(x.participantId)! - order.get(y.participantId)! || x.span.start - y.span.start)
    return console.log(list.map((i) => ideaLine(i, home.get(i.id)?.id ?? (etat.offTopic.includes(i.id) ? 'hors question' : 'non rangée'))).join('\n') || 'Aucune idée.')
  }
  if (what === 'non-ranges') {
    const placed = new Set([...home.keys(), ...etat.offTopic])
    const list = etat.ideas.filter((i) => !i.copyOf && !placed.has(i.id))
    return console.log(list.length ? `${list.length} idées non rangées :\n${list.map((i) => ideaLine(i)).join('\n')}` : 'Toutes les idées sont rangées.')
  }
  if (what === 'listes') {
    const groups = groupsNow()
    const h = highlights(groups, byId)
    const m = methodOf(etat.settings)
    const lines = m.summaryLines ?? 6
    const all = computeMetrics(etat.ideas)
    const groupById = new Map(groups.map((g) => [g.id, g]))
    // La référence de chaque ligne, choisie par le code comme dans le pipeline : pour une force ou un frein, la première idée
    // du camp citée par la synthèse du motif, de préférence d'une personne qui critique aussi ailleurs.
    const critics = new Set(etat.ideas.filter((i) => i.category === 'negative').map((i) => i.participantId))
    const refOf = (kind: keyof typeof h, x: (typeof h)['strengths'][number]) => {
      if (kind !== 'strengths' && kind !== 'blockers') return x.ideaIds[0]
      const side = new Set(x.ideaIds)
      const cited = (groupById.get(x.groupId)?.summary.match(/I\d{4,}/g) ?? []).filter((id) => side.has(id))
      return cited.find((id) => critics.has(byId.get(id)?.participantId ?? '')) ?? cited[0] ?? x.ideaIds[0]
    }
    const fmt = (kind: keyof typeof h, list: typeof h.strengths) =>
      list.map((x) => {
        const ref = refOf(kind, x)
        const ex = kind === 'proposals' || kind === 'questions' ? ` — exemple : « ${short(byId.get(ref)?.verbatim ?? '', 220)} »` : ''
        return `  ${highlightLine(x, kind, 'fr', true)} [${x.groupId}] · ref ${ref}${ex}`
      })
    const out = [
      `${all.participants} participants sur ${activeParticipants(corpus).length} ayant répondu.`,
      `Ce qui a marché (strengths, ${lines} premières lignes) :`,
      ...fmt('strengths', h.strengths.slice(0, lines)),
      `Ce qui bloque (blockers, ${lines} premières lignes) :`,
      ...fmt('blockers', h.blockers.slice(0, lines)),
      'Ce qui divise (divided : le code écrit lui-même la phrase qui les nomme) :',
      ...fmt('divided', h.divided),
      'Propositions (proposals) :',
      ...fmt('proposals', h.proposals.slice(0, 8)),
      'Questions :',
      ...fmt('questions', h.questions.slice(0, 6)),
    ]
    if (etat.themes.length) {
      out.push('Thèmes :')
      for (const t of etat.themes) {
        const gs = t.groupIds.map((id) => groupById.get(id)).filter((g): g is Group => !!g)
        out.push(`  ${t.title} : ${describeTheme({ metrics: computeMetrics(gs.flatMap((g) => g.ideaIds).map((id) => byId.get(id)!)) }, gs)}`)
      }
    }
    return console.log(out.join('\n'))
  }
  if (what === 'textes') {
    const out = etat.groups.map((g) => `${g.id} ${g.title} : ${g.summary || '(pas de synthèse)'}`)
    for (const t of etat.themes) out.push(`Thème « ${t.title} » (${t.groupIds.join(', ')}) : ${t.summary}`)
    out.push(`Résumé : ${etat.globalSummary || '(pas encore)'}`)
    return console.log(out.join('\n'))
  }
  console.log('voir motifs | motif G3 | idees P1-P40 | non-ranges | listes | textes')
}

// ─── ecrire ──────────────────────────────────────────────────────────────────

/** Un état d'analyse construit à partir du travail en cours (sans renumérotation), pour lancer les contrôles du code. */
function workingState(): AnalysisState {
  const byId = ideaById()
  const groups = etat.groups.map((m) => asGroup(m, byId))
  const groupById = new Map(groups.map((g) => [g.id, g]))
  const themes: Theme[] = etat.themes.map((t, k) => ({
    id: `T${k + 1}`,
    title: t.title,
    groupIds: t.groupIds,
    summary: t.summary,
    metrics: computeMetrics(t.groupIds.flatMap((id) => groupById.get(id)?.ideaIds ?? []).map((id) => byId.get(id)!).filter(Boolean)),
  }))
  return {
    id: 'an_boucle',
    createdAt: etat.createdAt,
    updatedAt: new Date().toISOString(),
    settings: etat.settings,
    engine: { presetId: 'bridge', model: etat.modele, baseUrl: 'files' },
    corpusHash: '',
    extractedParticipants: etat.extracted,
    ideas: etat.ideas.map((i) => ({ ...i })),
    rejected: etat.rejected,
    groups,
    themes,
    globalSummary: etat.globalSummary,
    names: etat.names,
    merges: etat.merges,
    retoned: etat.retoned,
    offTopic: etat.offTopic,
    moved: etat.moved,
    copied: etat.copied,
    steps: (['extract', 'group', 'summarize', 'themes', 'report', 'polish'] as const).map((id) => ({ id, state: 'done' as const, done: 0, total: 0 })),
    calls: { total: Object.values(etat.calls).reduce((a, b) => a + b, 0), cached: 0, inputTokens: 0, outputTokens: 0 },
    cacheKeys: [],
    status: 'done',
    ...(etat.extra ?? {}),
  }
}

/** Les contrôles du code sur les textes écrits : ce que le pipeline signalait à la vérification des renvois, ou retirait. */
function checks(): string[] {
  const st = workingState()
  markUnverified(corpus, st)
  const byId = new Map(st.ideas.map((i) => [i.id, i]))
  const out: string[] = []
  const noRef = (text: string) =>
    sentencesOf(text)
      .flat()
      .map((s, k) => (/I\d{4,}/.test(s) ? null : `phrase ${k + 1} sans renvoi (« ${short(s, 90)} ») : ajoute les idées qui la fondent, ou retire-la`))
      .filter((x): x is string => !!x)
  for (const g of st.groups) {
    if (!g.summary) continue
    const f: string[] = []
    if (g.unverified?.length) f.push(`compte ou nombre sans appui dans les idées citées : ${g.unverified.map((b) => `« ${b} »`).join(', ')} (la phrase sera retirée par le code)`)
    f.push(...noRef(g.summary))
    for (const c of missingCamps(g, byId)) f.push(`le camp ${c.side === 'positive' ? 'positif' : 'négatif'} (${c.people.length} pers. : ${c.ideaIds.join(', ')}) n'est pas cité`)
    for (const c of thinCamps(g, byId, methodOf(st.settings).campCoverage ?? 0.8))
      f.push(`le camp ${c.side === 'positive' ? 'positif' : 'négatif'} n'est cité que pour ${c.cited} de ses ${c.people} personnes ; non citées : ${c.ideaIds.join(', ')}`)
    if (f.length) out.push(`${g.id} ${g.title} :\n  - ${f.join('\n  - ')}`)
  }
  for (const t of st.themes) {
    const f = [...(t.unverified?.length ? [`compte ou nombre sans appui : ${t.unverified.map((b) => `« ${b} »`).join(', ')}`] : []), ...noRef(t.summary)]
    if (f.length) out.push(`Thème « ${t.title} » :\n  - ${f.join('\n  - ')}`)
  }
  if (st.globalSummary) {
    const f: string[] = []
    if (st.globalUnverified?.length) f.push(`compte ou nombre sans appui : ${st.globalUnverified.map((b) => `« ${b} »`).join(', ')} (la phrase sera retirée par le code)`)
    const h = highlights(st.groups, byId)
    const lines = methodOf(st.settings).summaryLines ?? 6
    const sentences = sentencesOf(st.globalSummary).flat()
    const groupById = new Map(st.groups.map((g) => [g.id, g]))
    for (const [kind, list] of [['blockers', h.blockers.slice(0, lines)], ['strengths', h.strengths.slice(0, lines)]] as const)
      for (const x of list) {
        const ids = new Set(groupById.get(x.groupId)?.ideaIds ?? [])
        const at = sentences.findIndex((s) => (s.match(/I\d{4,}/g) ?? []).some((id) => ids.has(id)))
        const line = highlightLine(x, kind, 'fr', true)
        if (at < 0) f.push(`la ligne « ${line} » [${x.groupId}] n'est pas reprise`)
        else if (x.fragile && !/fragile/i.test(sentences[at])) f.push(`la ligne « ${line} » est fragile : écris « fragile » à côté du mot de l'échelle (phrase ${at + 1})`)
      }
    if (f.length) out.push(`Résumé :\n  - ${f.join('\n  - ')}`)
  }
  return out
}

function cmdEcrire(file: string) {
  const raw = readJson(file)
  const out: string[] = []
  const byId = ideaById()
  for (const s of raw.syntheses ?? []) {
    const m = findMotif(String(s.motif))
    if (!m) {
      out.push(`Synthèse : motif ${s.motif} introuvable.`)
      continue
    }
    const text = String(s.texte ?? s.summary ?? '')
    const clean = sanitizeCitations(text, new Set(m.ideaIds))
    const lost = [...new Set(text.match(/I\d{4,}/g) ?? [])].filter((id) => !m.ideaIds.includes(id))
    if (lost.length) out.push(`${m.id} : renvois retirés car hors du motif : ${lost.join(', ')}.`)
    m.summary = clean
    const proposed = (s.opposed ?? []) as { a: string; b: string; about: string }[]
    m.opposed = checkOpposed({ ideaIds: m.ideaIds }, byId, proposed)
    if (m.opposed.length < proposed.length) out.push(`${m.id} : ${proposed.length - m.opposed.length} paire(s) « opposed » refusée(s) (deux suggestions de deux personnes différentes, du même motif).`)
  }
  if (raw.themes) {
    const ids = new Set(etat.groups.map((g) => g.id))
    const seen = new Map<string, string>()
    const themes: Etat['themes'] = []
    for (const t of raw.themes as { titre: string; motifs: string[]; texte: string }[]) {
      const own = (t.motifs ?? []).map((r) => findMotif(r)?.id ?? r).filter((id) => {
        if (!ids.has(id)) out.push(`Thème « ${t.titre} » : motif ${id} inconnu.`)
        else if (seen.has(id)) out.push(`Thème « ${t.titre} » : ${id} est déjà dans « ${seen.get(id)} ».`)
        else return seen.set(id, t.titre), true
        return false
      })
      const allowed = new Set(own.flatMap((id) => etat.groups.find((g) => g.id === id)!.ideaIds))
      themes.push({ title: String(t.titre).trim(), groupIds: own, summary: sanitizeCitations(String(t.texte ?? ''), allowed) })
    }
    const missing = [...ids].filter((id) => !seen.has(id))
    if (missing.length) out.push(`Motifs sans thème : ${missing.join(', ')} (chaque motif dans exactement un thème).`)
    etat.themes = themes
  }
  if (raw.resume !== undefined) etat.globalSummary = sanitizeCitations(String(raw.resume), new Set(etat.ideas.map((i) => i.id)))
  save(etat)
  const flags = checks()
  const left = etat.groups.filter((g) => !g.summary).map((g) => g.id)
  out.push(left.length ? `Motifs sans synthèse : ${left.length} (${left.slice(0, 20).join(', ')}${left.length > 20 ? '…' : ''}).` : 'Chaque motif a sa synthèse.')
  out.push(flags.length ? `Contrôles du code (${flags.length} textes à revoir ; renvoie le texte entier corrigé) :\n${flags.join('\n')}` : 'Contrôles du code : rien à signaler.')
  console.log(out.join('\n'))
}

// ─── finaliser ───────────────────────────────────────────────────────────────

async function cmdFinaliser() {
  const problems: string[] = []
  const left = activeParticipants(corpus).filter((p) => !etat.extracted.includes(p.id))
  if (left.length) problems.push(`${left.length} personnes non découpées`)
  const home = motifOf()
  const unplaced = etat.ideas.filter((i) => !i.copyOf && !home.has(i.id) && !etat.offTopic.includes(i.id))
  if (unplaced.length) problems.push(`${unplaced.length} idées non rangées`)
  const noSummary = etat.groups.filter((g) => !g.summary)
  if (noSummary.length) problems.push(`${noSummary.length} motifs sans synthèse`)
  const themed = new Set(etat.themes.flatMap((t) => t.groupIds))
  if (etat.groups.length > 12 && etat.groups.some((g) => !themed.has(g.id))) problems.push('des motifs sans thème')
  if (!etat.globalSummary) problems.push('pas de résumé')
  if (problems.length && !args.includes('--forcer')) {
    console.log(`Pas encore : ${problems.join(' ; ')}.`)
    process.exit(0)
  }

  // Renumérotation dans l'ordre du corpus, comme le pipeline : les idées d'abord, les copies ensuite.
  const originals = etat.ideas
    .filter((i) => !i.copyOf)
    .sort((a, b) => order.get(a.participantId)! - order.get(b.participantId)! || a.contributionId.localeCompare(b.contributionId) || a.span.start - b.span.start)
  const copies = etat.ideas.filter((i) => i.copyOf).sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1)))
  const map = new Map<string, string>()
  originals.forEach((i, k) => map.set(i.id, pad(k + 1)))
  copies.forEach((i, k) => map.set(i.id, pad(originals.length + k + 1)))
  const re = (id: string) => map.get(id) ?? id
  const reText = (t: string) => t.replace(/I\d{4,}/g, (id) => re(id))
  const ideas: Idea[] = [...originals, ...copies].map((i) => ({ ...i, id: re(i.id), ...(i.copyOf ? { copyOf: re(i.copyOf) } : {}) }))
  const byId = new Map(ideas.map((i) => [i.id, i]))
  const groups = etat.groups
    .map((m) => ({ old: m.id, m, ideaIds: m.ideaIds.map(re).sort() }))
    .map((x) => ({ ...x, metrics: computeMetrics(x.ideaIds.map((id) => byId.get(id)!)) }))
    .sort((a, b) => b.metrics.participants - a.metrics.participants || b.metrics.mentions - a.metrics.mentions || a.m.title.localeCompare(b.m.title))
    .map(
      (x, k): Group & { old: string } => ({
        old: x.old,
        id: `G${k + 1}`,
        title: x.m.title,
        ideaIds: x.ideaIds,
        summary: reText(x.m.summary),
        metrics: x.metrics,
        ...(x.m.definition ? { definition: x.m.definition } : {}),
        opposed: x.m.opposed.map((o) => ({ ...o, a: re(o.a), b: re(o.b) })),
      }),
    )
  const gmap = new Map(groups.map((g) => [g.old, g.id]))
  const groupById = new Map(groups.map((g) => [g.id, g]))
  const themes: Theme[] = etat.themes
    .map((t) => {
      const gids = t.groupIds.map((id) => gmap.get(id)).filter((id): id is string => !!id)
      const ideaIds = gids.flatMap((id) => groupById.get(id)!.ideaIds)
      return {
        title: t.title,
        groupIds: [...gids].sort((a, b) => groupById.get(b)!.metrics.participants - groupById.get(a)!.metrics.participants),
        summary: reText(t.summary),
        metrics: computeMetrics(ideaIds.map((id) => byId.get(id)!)),
      }
    })
    .sort((a, b) => b.metrics.participants - a.metrics.participants || b.metrics.mentions - a.metrics.mentions)
    .map((t, k) => ({ ...t, id: `T${k + 1}` }))
  const state: AnalysisState = {
    ...workingState(),
    corpusHash: await corpusHash(corpus),
    ideas,
    groups: groups.map(({ old: _old, ...g }) => g),
    themes,
    globalSummary: reText(etat.globalSummary),
    offTopic: etat.offTopic.map(re),
    moved: etat.moved.map((m) => ({ ...m, id: re(m.id) })),
    retoned: etat.retoned.map((r) => ({ ...r, id: re(r.id) })),
    copied: etat.copied.map((c) => ({ ...c, id: re(c.id) })),
    extractedParticipants: [...etat.extracted].sort((a, b) => order.get(a)! - order.get(b)!),
  }
  // Les filets du code, dans l'ordre du pipeline : chiffres sans appui retirés, camps manquants écrits, phrase de « ce qui divise ».
  verifyNumbers(corpus, state)
  ensureCamps(state)
  state.globalSummary = withDivided(state.globalSummary, state.groups, 'fr', false, byId, methodOf(state.settings).compactDivided === true)
  const title = opt('titre') ?? 'Synthèse'
  writeFileSync(join(dir, 'state.json'), JSON.stringify(state, null, 1))
  writeFileSync(join(dir, 'rapport.md'), reportToMarkdown(state, corpus, title))
  writeFileSync(join(dir, 'rapport.html'), reportToHtml(state, corpus, title))
  console.log(
    `Rapport écrit : ${join(dir, 'rapport.md')} ; ${ideas.length} idées (dont ${copies.length} copies), ${groups.length} motifs, ${themes.length} thèmes ; ${state.removedSentences ?? 0} phrases retirées par le code, ${state.campsAdded ?? 0} écrites pour un camp manquant.`,
  )
}

if (cmd === 'idees') await cmdIdees(args[0])
else if (cmd === 'motifs') cmdMotifs(args[0])
else if (cmd === 'voir') {
  cmdVoir(args[0], args[1])
  save(etat)
}
else if (cmd === 'ecrire') cmdEcrire(args[0])
else if (cmd === 'finaliser') await cmdFinaliser()
else console.log('Commandes : init, idees, motifs, voir, ecrire, finaliser')
