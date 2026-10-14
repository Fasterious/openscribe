import { describe, expect, it } from 'vitest'
import { parseObservatoryIndex, sampleLine, type PublicStudy } from './observatory'

const study = (over: Partial<PublicStudy> = {}): PublicStudy => ({
  slug: 'transports-2020',
  title: 'Les transports vus par les habitants',
  publishedAt: '2026-01-05',
  news: 'Grève des transports cette semaine.',
  question: 'Que pensez-vous des transports ?',
  source: { name: 'Consultation fictive', url: 'https://example.org/consultation', license: 'Licence ouverte', period: '2020' },
  population: 5000,
  sample: 357,
  margin: 5,
  summary: 'Résumé.',
  warnings: ['Les réponses datent de 2020.'],
  file: 'transports-2020.openscribe.json',
  page: 'transports-2020.html',
  ...over,
})

describe('Observatoire', () => {
  it('range les synthèses de la plus récente à la plus ancienne', () => {
    const list = parseObservatoryIndex({ studies: [study(), study({ slug: 'recente', publishedAt: '2026-02-01' })] })
    expect(list.map((s) => s.slug)).toEqual(['recente', 'transports-2020'])
  })

  it('refuse un index sans avertissement de méthode ou avec un nom de fichier dangereux', () => {
    expect(() => parseObservatoryIndex({ studies: [study({ warnings: [] })] })).toThrow()
    expect(() => parseObservatoryIndex({ studies: [study({ file: '../secret.json' })] })).toThrow()
    expect(() => parseObservatoryIndex({ studies: [study({ slug: 'Avec Espace' })] })).toThrow()
  })

  it("annonce l'échantillon et sa marge, ou une analyse complète", () => {
    expect(sampleLine(study())).toBe("357 réponses tirées au sort parmi 5 000 (marge d'erreur ± 5 points)")
    expect(sampleLine(study({ sample: 120, population: 120, margin: 0 }))).toBe('Les 120 réponses, toutes analysées')
  })
})
