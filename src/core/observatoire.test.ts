import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { maskWithOffsets, NAME_MASK } from './analysis/names'
import type { AnalysisState, Idea } from './analysis/types'
import { CUT_MARK } from './analysis/verbatim'
import { EXAMPLE_MARK, exampleProject, publishedStudy, type PublishedStudy } from './observatoire'
import { newProject } from './project'

// Données fictives : aucun texte d'un corpus réel (src/core/privacy.test.ts).
const TEXT = "Merci à Karim pour l'accueil. La cantine est trop chère, demandez à Mélodie-Rose. Les horaires conviennent."

const idea = (id: string, verbatim: string, parts?: string[]): Idea => {
  const at = (s: string) => ({ start: TEXT.indexOf(s), end: TEXT.indexOf(s) + s.length })
  const ps = parts?.map(at)
  return {
    id,
    participantId: 'P1',
    contributionId: 'C1',
    label: verbatim.slice(0, 20),
    verbatim,
    category: 'negative',
    span: ps ? { start: ps[0].start, end: ps[ps.length - 1].end } : at(verbatim),
    ...(ps ? { parts: ps } : {}),
    approximate: false,
  }
}

const study = () => {
  const project = newProject('Étude fictive')
  project.corpus = {
    sources: [{ id: 'S1', kind: 'survey', name: 'questionnaire.csv' }],
    participants: [{ id: 'P1', sourceIds: ['S1'], attributes: {} }],
    contributions: [{ id: 'C1', participantId: 'P1', sourceId: 'S1', prompt: 'Votre avis ?', text: TEXT }],
  } as unknown as typeof project.corpus
  const analysis = {
    names: ['Karim', 'Mélodie-Rose'],
    settings: { maskNames: true },
    cacheKeys: ['k1'],
    ideas: [
      idea('I0001', 'Merci à Karim pour l\'accueil.'),
      idea('I0002', `La cantine est trop chère${CUT_MARK}Les horaires conviennent.`, ['La cantine est trop chère', 'Les horaires conviennent.']),
    ],
    groups: [{ id: 'G1', title: 'Cantine', summary: 'Karim remercie, une personne cite Mélodie-Rose.', ideaIds: ['I0001', 'I0002'] }],
    globalSummary: 'Karim est remercié.',
  } as unknown as AnalysisState
  project.analyses = [analysis]
  return publishedStudy(project, analysis, {
    slug: 'fictive',
    title: 'Étude fictive',
    publishedAt: '2026-10-17',
    news: '',
    fiche: { summary: 'Karim et les autres.', question: 'Votre avis ?', source: { name: 'Consultation fictive', url: '', period: '', license: '' }, sample: '', sampling: '', warnings: [] },
  })
}

describe('Observatoire : étude publiée', () => {
  it('sans marque « à vérifier » : l’Observatoire montre l’algorithme seul (la Synthèse les garde)', () => {
    expect(study().project.analyses[0].settings.doubtMarks).toBe(false)
  })

  it('l’exemple de la Synthèse : l’étude publiée, sa fiche, et les marques « à vérifier » revenues', () => {
    const s = study()
    const p = exampleProject(s)
    expect(p.description.startsWith(EXAMPLE_MARK)).toBe(true)
    expect(p.name).toBe(s.title)
    expect(p.brief).toEqual(s.fiche)
    expect(p.analyses[0].settings.doubtMarks).toBeUndefined()
    expect(p.id).not.toBe(s.project.id)
  })

  it('masque un prénom et garde la position de ce qui suit', () => {
    const m = maskWithOffsets(TEXT, ['Karim', 'Mélodie-Rose'])
    expect(m.text).toBe(`Merci à ${NAME_MASK} pour l'accueil. La cantine est trop chère, demandez à ${NAME_MASK}. Les horaires conviennent.`)
    const pos = TEXT.indexOf('Les horaires')
    expect(m.text.slice(m.at(pos), m.at(pos) + 12)).toBe('Les horaires')
  })

  it('aucun prénom nulle part, ni la liste des prénoms ; chaque citation retrouvée dans la réponse masquée', () => {
    const s = study()
    const json = JSON.stringify(s)
    expect(json).not.toContain('Karim')
    expect(json).not.toContain('Mélodie')
    const a = s.project.analyses[0]
    expect(a.names).toEqual([])
    expect(a.cacheKeys).toEqual([])
    const text = s.project.corpus.contributions[0].text
    const [i1, i2] = a.ideas
    expect(text.slice(i1.span.start, i1.span.end)).toBe(`Merci à ${NAME_MASK} pour l'accueil.`)
    expect(i1.verbatim).toBe(`Merci à ${NAME_MASK} pour l'accueil.`)
    // La citation coupée : chaque fragment au bon endroit.
    expect(i2.parts!.map((p) => text.slice(p.start, p.end))).toEqual(['La cantine est trop chère', 'Les horaires conviennent.'])
    expect(a.groups[0].summary).toBe(`${NAME_MASK} remercie, une personne cite ${NAME_MASK}.`)
    expect(s.fiche.summary).toBe(`${NAME_MASK} et les autres.`)
    expect(s.project.corpus.sources[0].name).toBe('Consultation fictive')
  })

  it('les études déjà publiées ne contiennent ni liste de prénoms ni réponses du moteur', () => {
    const root = join('public', 'observatoire')
    const files = existsSync(root) ? readdirSync(root).map((d) => join(root, d, 'etude.json')).filter(existsSync) : []
    for (const f of files) {
      const s = JSON.parse(readFileSync(f, 'utf8')) as PublishedStudy
      for (const a of s.project.analyses) {
        expect(a.names ?? []).toEqual([])
        expect(a.cacheKeys ?? []).toEqual([])
      }
      expect(JSON.stringify(s)).not.toContain('"responses"')
    }
  })
})
