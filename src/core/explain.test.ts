import { describe, expect, it } from 'vitest'
import { doubtReason, fragileReason, themeVerdicts, verdictLabel, verdictOf } from './analysis/explain'
import { fragileShown } from './analysis/highlights'
import { computeMetrics } from './analysis/metrics'
import type { Group, Idea, IdeaCategory } from './analysis/types'

// Données fictives : une piscine municipale (aucun texte d'un corpus réel, src/core/privacy.test.ts).
const idea = (n: number, category: IdeaCategory, copyOf?: string, participant = n): Idea =>
  ({ id: `I${String(n).padStart(4, '0')}`, participantId: `P${participant}`, category, verbatim: 'x', ...(copyOf ? { copyOf } : {}) }) as Idea
const group = (ideas: Idea[]): Group => ({ id: 'G1', title: 'Piscine', summary: '', ideaIds: ideas.map((i) => i.id), metrics: computeMetrics(ideas) }) as Group
const many = (from: number, n: number, cat: IdeaCategory) => Array.from({ length: n }, (_, k) => idea(from + k, cat))

describe('étiquettes expliquées au cas par cas', () => {
  it('12 sur 14 n\'est pas fragile : une voix de moins laisserait le même camp en tête (règle « la conclusion change »)', () => {
    const g = group([...many(1, 12, 'positive'), ...many(13, 2, 'negative')])
    expect(fragileShown(g.metrics)).toBe(false)
    expect(fragileReason(g)).toBeUndefined()
  })

  it('« fragile » quand une voix changerait la conclusion, avec le chiffre', () => {
    // 5 négatifs, 1 positif : une voix de moins, 4 contre 2 : avis partagés.
    const g = group([...many(1, 5, 'negative'), idea(6, 'positive')])
    expect(fragileShown(g.metrics)).toBe(true)
    expect(fragileReason(g)).toBe(
      '5 des 6 personnes qui donnent un avis sont négatives. Si une seule de ces 5 personnes avait donné un avis positif, ce serait 2 avis positifs contre 4 négatifs : les avis seraient partagés, le plus petit camp valant au moins la moitié du plus grand. Sur 6 avis, la conclusion tient donc à une voix : citez le chiffre (5 sur 6) plutôt que l\'étiquette seule, et lisez les verbatims des deux camps.',
    )
  })

  it('un « unanime » n\'est jamais fragile', () => {
    expect(fragileReason(group(many(1, 4, 'positive')))).toBeUndefined()
  })

  it('« à vérifier » compte des personnes, nomme les deux camps et l\'étiquette sans les idées rangées d\'abord ailleurs', () => {
    // P7 n'est ici que par une copie ; P1 a sa propre idée et une copie : elle reste comptée.
    const ideas = [...many(1, 6, 'positive'), idea(7, 'negative', 'I0099'), idea(8, 'positive', 'I0098', 1)]
    const byId = new Map(ideas.map((i) => [i.id, i]))
    const r = doubtReason(group(ideas), byId, () => 'Horaires')
    expect(r?.ideaIds).toEqual(['I0007', 'I0008'])
    expect(r?.text).toBe(
      "1 des 7 personnes qui donnent un avis n'est comptée ici que par une idée rangée d'abord dans un autre motif : 1 avis négatif (P7, d'abord dans « Horaires »). Sans ces idées, il resterait 6 avis : « unanime » (6 sur 6), une étiquette plus nette. À vous de juger si ces 2 verbatims, quel que soit leur camp, parlent bien de « Piscine ».",
    )
  })

  it('le verdict d\'un motif résume les étiquettes d\'un thème, jamais plus fort que l\'étiquette', () => {
    const appreciated = group(many(1, 4, 'positive')).metrics
    const proposals = group([idea(9, 'suggestion'), idea(10, 'suggestion')]).metrics
    expect(verdictOf(appreciated)).toBe('appreciated')
    expect(verdictOf(proposals)).toBe('none')
    expect(themeVerdicts([appreciated, appreciated, proposals]).map((x) => verdictLabel(x.verdict, x.count))).toEqual(['2 appréciés', '1 sans avis'])
  })
})
