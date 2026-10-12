import {
  readDataBlock,
  type AssignInput,
  type ExtractionInput,
  type FixInput,
  type GlobalInput,
  type GroupingInput,
  type SummaryGroupInput,
  type ThemeInput,
} from '../analysis/prompts'
import type { ChatRequest, ChatResult, LlmProvider } from './types'

/**
 * Moteur de simulation, hors ligne et déterministe.
 *
 * Il imite un modèle de langage avec des règles simples (découpage en phrases,
 * mots-clés). Ses résultats n'ont aucune valeur d'analyse : il sert à tester
 * toute la chaîne sans clé ni réseau, et à découvrir l'outil.
 *
 * Il peut aussi simuler les défauts d'un vrai modèle (citations reformulées,
 * identifiants oubliés, JSON invalide) pour vérifier que le code les rattrape.
 */

export interface SimulationFaults {
  /** Une citation sur N est légèrement reformulée. */
  paraphraseEvery?: number
  /** Le regroupement oublie un élément sur N. */
  forgetEvery?: number
  /** La première réponse de chaque tâche listée est un JSON invalide. */
  brokenJsonTasks?: string[]
}

const STOP = new Set(
  `le la les un une des du de d l à au aux et ou en dans sur pour par avec sans ce cet cette ces que qui quoi dont où est sont était été être avoir a ont avait il elle ils elles on nous vous je j tu me te se s y ne n pas plus très trop bien aussi mais donc car comme si leur leurs son sa ses mon ma mes notre nos votre vos tout tous toute toutes fait faire peu beaucoup même encore déjà alors c ça cela qu ont the a an and or of to in is it was were be for on with that this not`.split(
    ' ',
  ),
)

const NEG = /\b(pas|manqu\w*|trop|problèm\w*|difficil\w*|lent\w*|mal|jamais|aucun\w*|frustr\w*|déçu\w*|regret\w*|faibl\w*|insuffisan\w*|compliqu\w*|tard\w*)\b/i
const POS = /\b(bien|super|excellent\w*|réussi\w*|apprécié\w*|top|efficace\w*|agréable\w*|bravo|génial\w*|fort\w*|bon\w*|belle?s?|plaisir|fédérat\w*)\b/i
const SUG = /\b(faudrait|faut|devrait|devrions|pourrait|pourrions|proposer?|suggér\w*|idée|souhait\w*|aimerai\w*|il serait|mieux)\b/i

function categorize(s: string): 'positive' | 'negative' | 'neutral' | 'suggestion' {
  if (SUG.test(s)) return 'suggestion'
  if (NEG.test(s)) return 'negative'
  if (POS.test(s)) return 'positive'
  return 'neutral'
}

function keywords(s: string): string[] {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 3 && !STOP.has(w))
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Découpe un texte en phrases, et coupe « …, mais … » en deux. */
export function sentences(text: string): string[] {
  const parts = text.split(/(?<=[.!?;])\s+|\s+(?=mais\s)/i)
  return parts.map((p) => p.trim()).filter((p) => keywords(p).length > 0)
}

function labelFor(s: string): string {
  const kw = keywords(s)
  return cap(kw.slice(0, 2).join(' ') || 'Remarque')
}

export function createSimulationProvider(faults: SimulationFaults = {}): LlmProvider {
  let counter = 0
  const brokenOnce = new Set(faults.brokenJsonTasks ?? [])

  function answer(req: ChatRequest): unknown {
    switch (req.task) {
      case 'extract': {
        const input = readDataBlock<ExtractionInput>(req.user)
        const ideas = input.contributions.flatMap((c) =>
          sentences(c.text).map((s) => {
            counter++
            const verbatim =
              faults.paraphraseEvery && counter % faults.paraphraseEvery === 0 ? `En résumé, ${s.toLowerCase()}` : s
            return { ref: c.ref, label: labelFor(s), verbatim, category: categorize(s) }
          }),
        )
        return { ideas }
      }
      case 'fix': {
        const input = readDataBlock<FixInput>(req.user)
        return {
          ideas: input.attempts.map((a) => ({
            ref: a.ref,
            label: a.label,
            verbatim: a.verbatim.replace(/^En résumé, /i, ''),
            category: a.category,
          })),
        }
      }
      case 'group': {
        const input = readDataBlock<GroupingInput>(req.user)
        const groups = new Map<string, string[]>()
        input.items.forEach((item, i) => {
          if (faults.forgetEvery && (i + 1) % faults.forgetEvery === 0) return
          let title: string
          if (input.grid?.length) {
            const kw = new Set(keywords(item.label))
            title = input.grid.find((g) => keywords(g).some((w) => kw.has(w))) ?? 'Hors grille'
          } else {
            title = cap(keywords(item.label)[0] ?? 'Divers')
          }
          groups.set(title, [...(groups.get(title) ?? []), item.id])
        })
        return { groups: [...groups].map(([title, items]) => ({ title, items })) }
      }
      case 'assign': {
        const input = readDataBlock<AssignInput>(req.user)
        return {
          assignments: input.items.map((item) => {
            const kw = new Set(keywords(item.label))
            const match = input.groups.find((g) => keywords(g).some((w) => kw.has(w)))
            return {
              item: item.id,
              group: match ?? (input.allowNew ? cap(keywords(item.label)[0] ?? 'Divers') : 'Hors grille'),
            }
          }),
        }
      }
      case 'summarize': {
        const input = readDataBlock<{ groups: SummaryGroupInput[] }>(req.user)
        return {
          groups: input.groups.map((g) => ({
            id: g.id,
            summary: `[Simulation] ${cap(g.facts)}. Exemple : « ${g.ideas[0]?.verbatim ?? ''} » [${g.ideas
              .slice(0, 2)
              .map((i) => i.id)
              .join(', ')}].`,
          })),
        }
      }
      case 'themes': {
        const input = readDataBlock<ThemeInput>(req.user)
        const size = Math.max(2, Math.ceil(input.groups.length / 5))
        const themes = []
        for (let i = 0; i < input.groups.length; i += size) {
          const chunk = input.groups.slice(i, i + size)
          themes.push({
            title: `Autour de « ${chunk[0].title} »`,
            groups: chunk.map((g) => g.id),
            summary: `[Simulation] Ce thème réunit ${chunk.length} groupes : ${chunk.map((g) => g.title).join(', ')}.`,
          })
        }
        return { themes }
      }
      case 'global': {
        const input = readDataBlock<GlobalInput>(req.user)
        return {
          summary: `[Simulation] ${input.facts} Sujets principaux : ${input.sections
            .slice(0, 3)
            .map((s) => s.title)
            .join(', ')}.`,
        }
      }
      default:
        return {}
    }
  }

  return {
    label: 'Simulation (hors ligne)',
    fingerprint: { presetId: 'simulation', model: 'simulation-v1', baseUrl: 'local' },
    async complete(req: ChatRequest): Promise<ChatResult> {
      if (req.signal?.aborted) throw new DOMException('Aborted', 'AbortError')
      await new Promise((r) => setTimeout(r, 0))
      if (brokenOnce.has(req.task) && !req.user.includes('ATTENTION')) {
        brokenOnce.delete(req.task)
        return { text: '{"oups": ' }
      }
      const text = JSON.stringify(answer(req))
      return { text, usage: { inputTokens: Math.ceil(req.user.length / 4), outputTokens: Math.ceil(text.length / 4) } }
    },
  }
}
