import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { computeMetrics, isFragile, stanceOf } from './analysis/metrics'
import {
  allClaims,
  allowedNumbers,
  clauseCounts,
  impliedOthers,
  overcountedPeople,
  undercitedPeople,
  unverifiedNumbers,
  vaguePlurals,
} from './analysis/numbers'
import {
  acceptRewrite,
  applyMerges,
  applyReview,
  arrivals,
  keepForward,
  unanimityCheck,
  applySplits,
  applySupport,
  dropUnreferenced,
  dropNearDuplicates,
  degenerateGrouping,
  checkOpposed,
  spellLeadingNumbers,
  withDivided,
  missingCamps,
  describeMetrics,
  describeTheme,
  dropSentences,
  groupTarget,
  extractParticipant,
  isToneDefined,
  needsConsolidation,
  newAnalysis,
  runAnalysis,
  sanitizeCitations,
  dropInventedQuotes,
  applyAttachments,
} from './analysis/pipeline'
import { uncoveredPassages, uncoveredWithContext } from './analysis/coverage'
import { locateQuote, quoteText, withAntecedent } from './analysis/verbatim'
import { emptyCorpus, promptsOf, removeSource, renameSource } from './corpus'
import { maskNames, verifiedNames } from './analysis/names'
import { highlightLine, highlights } from './analysis/highlights'
import { fullQuestionIds, metricsLine, opinionSquares, refsToPeople, reportToHtml, reportToMarkdown, shortAnswerContext } from './analysis/report'
import { LlmRunner, MemoryCache } from './analysis/runner'
import { DEFAULT_SETTINGS, type AnalysisState, type Group, type Idea, type IdeaCategory, type Metrics } from './analysis/types'
import { locateVerbatim } from './analysis/verbatim'
import { groupingPrompt, groupSummaryPrompt, groupSummarySchema, reviewPrompt } from './analysis/prompts'
import { methodRules } from './analysis/methods'
import { activeParticipants, type Corpus } from './corpus'
import { analyzeCsv, csvToCorpus, decodeText, type ColumnRole } from './import/csv'
import { detectSpeakers, textToCorpus } from './import/text'
import { corpusForAnalysis, exportProject, importProject, newProject } from './project'
import { withLimits } from './providers/limits'
import { createSimulationProvider } from './providers/simulation'
import { ProviderError, type LlmProvider } from './providers/types'

const csvText = readFileSync(new URL('../../fixtures/mediatheque.csv', import.meta.url), 'utf8')

function surveyCorpus(): Corpus {
  const a = analyzeCsv(csvText)
  const roles: Record<number, ColumnRole> = Object.fromEntries(a.columns.map((c) => [c.index, c.suggestedRole]))
  return csvToCorpus(a.table, { roles, sourceName: 'mediatheque.csv' })
}

function idea(id: string, participantId: string, category: Idea['category']): Idea {
  return { id, participantId, contributionId: 'c', label: 'x', verbatim: 'x', category, span: { start: 0, end: 1 }, approximate: false }
}

describe('import CSV', () => {
  it('reconnaît les rôles des colonnes', () => {
    const a = analyzeCsv(csvText)
    const roles = a.columns.map((c) => c.suggestedRole)
    expect(roles).toEqual(['ignore', 'ignore', 'attribute', 'open', 'open', 'open'])
  })

  it('construit un corpus pseudonyme avec attributs, sans réponses vides', () => {
    const corpus = surveyCorpus()
    expect(corpus.participants).toHaveLength(12)
    expect(corpus.participants[0]).toMatchObject({ id: 'P1', label: 'P1', attributes: { 'Vous êtes…': 'Usager régulier' } })
    // P5 n'a pas répondu à la 3e question, P11 non plus.
    expect(corpus.contributions).toHaveLength(12 * 3 - 2)
    expect(JSON.stringify(corpus)).not.toContain('@example.org')
  })

  it('gère guillemets, virgules et BOM', () => {
    const a = analyzeCsv('﻿Nom,Avis\nAnne,"Bien, mais ""lent"""\n')
    expect(a.table.headers).toEqual(['Nom', 'Avis'])
    expect(a.table.rows[0][1]).toBe('Bien, mais "lent"')
  })
})

describe('encodage des fichiers', () => {
  it('lit un CSV enregistré par Excel en français (Windows-1252) sans abîmer les accents', () => {
    const bytes = new Uint8Array([0x54, 0x72, 0xe8, 0x73, 0x20, 0x70, 0x72, 0x61, 0x74, 0x69, 0x71, 0x75, 0x65]) // « Très pratique » en Windows-1252
    expect(decodeText(bytes.buffer)).toBe('Très pratique')
    expect(decodeText(new TextEncoder().encode('Très pratique').buffer as ArrayBuffer)).toBe('Très pratique')
  })
})

describe('import de texte', () => {
  const transcript = `Animateur : Qu'avez-vous pensé de l'inscription ?
Julie : C'était simple. Par contre le mot de passe est trop compliqué.
Julie : Il faut huit caractères spéciaux, enfin c'est ce que j'ai cru.
Animateur : Et la suite ?
Marc (00:03:12) : Moi j'ai bloqué sur la validation du mail.`

  it('détecte les locuteurs et regroupe les tours de parole', () => {
    const d = detectSpeakers(transcript)
    expect(d.speakers.map((s) => s.name)).toEqual(['Animateur', 'Julie', 'Marc'])
    expect(d.speakers.find((s) => s.name === 'Julie')!.turns).toBe(1)
  })

  it("exclut l'animateur et garde sa question comme contexte", () => {
    const corpus = textToCorpus(transcript, { sourceName: 'entretien.txt', excludeSpeakers: ['Animateur'] })
    expect(corpus.participants.map((p) => p.label)).toEqual(['Julie', 'Marc'])
    expect(corpus.contributions[0].prompt).toBe("Qu'avez-vous pensé de l'inscription ?")
    expect(corpus.contributions[1]).toMatchObject({ prompt: 'Et la suite ?', time: { start: 192 } })
  })

  it('accepte du texte sans locuteurs (un paragraphe = une contribution)', () => {
    const corpus = textToCorpus('Premier retour.\n\nSecond retour, plus long.', { sourceName: 'notes', kind: 'notes' })
    expect(corpus.participants).toHaveLength(1)
    expect(corpus.contributions).toHaveLength(2)
  })
})

describe('vérification des citations', () => {
  const source = "L'application est lente au démarrage, il faut parfois attendre dix secondes."
  it('trouve une citation exacte', () => {
    expect(locateVerbatim(source, 'lente au démarrage')).toMatchObject({ approximate: false })
  })
  it('tolère apostrophes typographiques, casse et ponctuation de bord', () => {
    const m = locateVerbatim(source, '« L’application est LENTE au démarrage »')
    expect(m).not.toBeNull()
    expect(source.slice(m!.start, m!.end)).toBe("L'application est lente au démarrage")
    expect(m!.approximate).toBe(true)
  })
  it('tolère les accents manquants', () => {
    expect(locateVerbatim(source, 'lente au demarrage')).not.toBeNull()
  })
  it('rejette une reformulation', () => {
    expect(locateVerbatim(source, "l'appli démarre lentement")).toBeNull()
    expect(locateVerbatim(source, 'lente … dix secondes')).toBeNull()
  })
})

describe('regroupement', () => {
  it('vise environ min(1,5 × √idées ; 1,2 × participants) motifs', () => {
    expect(groupTarget(36)).toEqual({ min: 7, max: 11 })
    expect(groupTarget(5)).toEqual({ min: 3, max: 6 })
    // Corpus réel : 311 idées de 20 participants, dont un très prolixe. La racine seule visait 26 à 44 ; le nombre de participants borne à 24.
    expect(groupTarget(311, 20)).toEqual({ min: 18, max: 30 })
  })

  it('sépare un motif à deux objets seulement si la proposition tient', () => {
    const groups = [{ id: 'G1', title: 'Tractage et affichage', ideaIds: ['I1', 'I2', 'I3'] }]
    const ok = applySplits(groups, [
      {
        group: 'G1',
        objects: 2,
        parts: [
          { title: 'Tractage', ideas: ['I1', 'I2'] },
          { title: 'Affichage', ideas: ['I3'] },
        ],
      },
    ])
    expect(ok.groups.map((g) => g.title)).toEqual(['Tractage', 'Affichage'])
    // Une idée oubliée, un titre encore double : rien ne change.
    expect(
      applySplits(groups, [
        {
          group: 'G1',
          objects: 2,
          parts: [
            { title: 'Tractage', ideas: ['I1'] },
            { title: 'Affichage', ideas: ['I3'] },
          ],
        },
      ]).changed,
    ).toBe(false)
    expect(
      applySplits(groups, [
        {
          group: 'G1',
          objects: 2,
          parts: [
            { title: 'Tracts et flyers', ideas: ['I1', 'I2'] },
            { title: 'Affichage', ideas: ['I3'] },
          ],
        },
      ]).changed,
    ).toBe(false)
    expect(applySplits(groups, [{ group: 'G1', objects: 1 }]).changed).toBe(false)
  })

  it('reconnaît un motif défini par son ton', () => {
    expect(isToneDefined("Bilan positif de l'équipe", ['positive', 'positive', 'positive'])).toBe(true)
    expect(isToneDefined('Ambiance du groupe', ['positive', 'positive', 'positive'])).toBe(false)
    expect(isToneDefined('Points forts', ['positive', 'negative', 'positive'])).toBe(false)
  })

  it('déclenche la consolidation quand les motifs sont émiettés', () => {
    // 16 motifs sur 75 portés par une seule personne : au-dessus de 15 %.
    expect(needsConsolidation([...Array(16).fill(1), ...Array(59).fill(3)])).toBe(true)
    // Médiane sous 3 personnes par motif.
    expect(needsConsolidation([...Array(10).fill(2), ...Array(5).fill(4)])).toBe(true)
    expect(needsConsolidation([...Array(2).fill(1), ...Array(20).fill(4)])).toBe(false)
    // Trop peu de motifs pour juger.
    expect(needsConsolidation([1, 1, 1])).toBe(false)
  })

  it('applique les fusions qui tiennent et refuse les autres', () => {
    const g = (id: string, title: string, ideaIds: string[]) => ({ id, title, ideaIds })
    const groups = [
      g('G1', 'Communication tardive', ['I1']),
      g('G2', 'Démarrage de la campagne', ['I2']),
      g('G3', 'Budget', ['I3']),
      g('G4', 'Affiches', ['I4']),
    ]
    const r = applyMerges(groups, [
      { groups: ['G1', 'G2'], title: 'Calendrier et anticipation', reason: 'fourre-tout refusé' },
      { groups: ['G1', 'G2', 'G9'], title: 'Calendrier de la campagne', reason: 'même objet' },
      { groups: ['G2', 'G3'], title: 'Moyens', reason: 'G2 déjà pris' },
      { groups: ['G4'], title: 'Seul', reason: 'un seul motif' },
    ])
    expect(r.merges).toEqual([{ title: 'Calendrier de la campagne', from: ['Communication tardive', 'Démarrage de la campagne'], reason: 'même objet' }])
    // Une fusion sous un titre de jugement est refusée.
    expect(applyMerges(groups, [{ groups: ['G3', 'G4'], title: 'Points faibles', reason: '' }]).merges).toEqual([])
    expect(r.groups.map((x) => x.title).sort()).toEqual(['Affiches', 'Budget', 'Calendrier de la campagne'])
    // Rien ne se perd.
    expect(r.groups.flatMap((x) => x.ideaIds).sort()).toEqual(['I1', 'I2', 'I3', 'I4'])
  })

  it('ne calcule ni consensus ni désaccord sur un thème, qui réunit des objets différents', () => {
    const a = computeMetrics(['P1', 'P2'].map((p, k) => idea(`I000${k}`, p, 'positive')))
    const b = computeMetrics(['P3', 'P4', 'P5'].map((p, k) => idea(`I001${k}`, p, 'negative')))
    const theme = computeMetrics([
      ...['P1', 'P2'].map((p, k) => idea(`I000${k}`, p, 'positive')),
      ...['P3', 'P4', 'P5'].map((p, k) => idea(`I001${k}`, p, 'negative')),
    ])
    const text = describeTheme({ metrics: theme }, [{ metrics: a }, { metrics: b }])
    expect(text).not.toMatch(/consensus|partagés|peu d'avis|positif|négatif|mitigé/)
    expect(text).toContain('2 motifs')
  })
})

describe('indicateurs', () => {
  it('compte une personne une seule fois, même avec huit critiques', () => {
    const ideas = Array.from({ length: 8 }, (_, i) => idea(`I${i}`, 'P1', 'negative'))
    const m = computeMetrics(ideas)
    expect(m.participants).toBe(1)
    expect(m.mentions).toBe(8)
    expect(m.negativeOnly).toEqual(['P1'])
    expect(m.stance).toBe('thin')
  })

  it('les mitigés comptent au dénominateur mais dans aucun camp', () => {
    const ideas = [
      ...['P1', 'P2', 'P3', 'P4', 'P5', 'P6'].map((p, i) => idea(`N${i}`, p, 'negative')),
      idea('P', 'P6', 'positive'),
      idea('Q', 'P7', 'positive'),
    ]
    const m = computeMetrics(ideas)
    expect(m.mixed).toEqual(['P6'])
    expect(m.negativeOnly).toHaveLength(5)
    expect(m.consensusRate).toBeCloseTo(5 / 7)
    // 71 % : majoritairement négatif ; le consensus demande 80 %.
    expect(m.stance).toBe('majority')
    expect(m.majority).toBe('negative')
  })

  it('situe chaque motif sur l’échelle d’avis (positifs, négatifs, mitigés)', () => {
    expect(stanceOf(2, 8, 2)).toBe('majority') // 67 % : clairement négatif, pas « partagé »
    expect(stanceOf(0, 4, 3)).toBe('majority') // 57 %, aucun avis positif
    expect(stanceOf(3, 4, 0)).toBe('divided')
    expect(stanceOf(1, 6, 0)).toBe('consensus') // 86 %
    expect(stanceOf(0, 3, 1)).toBe('majority') // 75 %
    expect(stanceOf(1, 3, 1)).toBe('majority') // 60 %
    expect(stanceOf(1, 3, 2)).toBe('lean') // 50 %, les mitigés moins nombreux que le camp dominant
    expect(stanceOf(2, 1, 2)).toBe('divided') // autant de mitigés que le camp le plus fort : avis partagés
    expect(stanceOf(1, 1, 4)).toBe('divided') // les mitigés dominent
    expect(stanceOf(0, 6, 0)).toBe('unanimous')
    expect(stanceOf(0, 4, 0)).toBe('unanimous')
    expect(stanceOf(2, 2, 0)).toBe('divided')
    expect(stanceOf(1, 1, 0)).toBe('thin')
    expect(stanceOf(0, 0, 0)).toBe('none')
  })

  it('« fragile » quand une seule voix changerait l’étiquette', () => {
    expect(isFragile(4, 1, 0)).toBe(true) // 4 sur 5 large majorité ; 3 sur 5 majorité
    expect(isFragile(0, 4, 0)).toBe(true) // unanime sur 4 : une voix et ce n'est plus unanime
    expect(isFragile(1, 12, 0)).toBe(false) // 12 sur 13 reste une large majorité
    expect(isFragile(2, 2, 0)).toBe(false) // avis partagés : pas d'étiquette de camp
  })

  it('les suggestions ne sont pas une polarité', () => {
    const m = computeMetrics(['P1', 'P2', 'P3', 'P4', 'P5'].map((p, i) => idea(`S${i}`, p, 'suggestion')))
    expect(m.stance).toBe('none')
    expect(m.consensusRate).toBeNull()
    expect(m.participantsByCategory.suggestion).toBe(5)
  })

  it('détecte une minorité constante, avec ses preuves', () => {
    const neg = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8'].map((p, i) => idea(`N${i}`, p, 'negative'))
    const pos = [idea('A', 'P9', 'positive'), idea('B', 'P10', 'positive')]
    const m = computeMetrics([...neg, ...pos])
    expect(m.minority).toEqual({ side: 'positive', participantIds: ['P9', 'P10'], ideaIds: ['A', 'B'] })
  })

  it('ne compte pas deux fois une idée référencée deux fois', () => {
    const i = idea('I1', 'P1', 'positive')
    expect(computeMetrics([i, i]).mentions).toBe(1)
  })
})

describe('chiffres en toutes lettres', () => {
  it('accorde, omet les zéros, et ne met de pourcentage qu’à partir de dix participants', () => {
    const ideas = ['P1', 'P2', 'P3', 'P4', 'P5'].map((p, k) => idea(`I000${k}`, p, k < 4 ? 'positive' : 'negative'))
    const text = describeMetrics(computeMetrics(ideas))
    expect(text).toBe('5 participants · avis : 4 positifs, 1 négatif · large majorité positive (4 sur 5)')
    expect(text).not.toMatch(/\(s\)|: 0|%/)
  })
})

describe('idées qui se recouvrent', () => {
  it('garde la plus longue quand deux idées d’une personne disent la même chose', async () => {
    const corpus = surveyCorpus()
    const text = corpus.contributions[0].text
    const runner = new LlmRunner(
      {
        label: 'test',
        fingerprint: { presetId: 'test', model: 't', baseUrl: '' },
        async complete() {
          return {
            text: JSON.stringify({
              ideas: [
                { ref: 'C1', label: 'Long', verbatim: text.slice(0, 40), category: 'negative' },
                { ref: 'C1', label: 'Court', verbatim: text.slice(5, 30), category: 'positive' },
              ],
              names: [],
            }),
          }
        },
      },
      new MemoryCache(),
      DEFAULT_SETTINGS,
    )
    const r = await extractParticipant([corpus.contributions[0]], corpus.contributions[0].participantId, DEFAULT_SETTINGS, runner)
    expect(r.ideas.map((i) => i.label)).toEqual(['Long'])
  })
})

describe('sources multiples', () => {
  it('renomme et retire une source sans toucher aux autres', () => {
    const base = emptyCorpus()
    const corpus = {
      ...base,
      sources: [
        { id: 'S1', kind: 'survey' as const, name: 'reponses.csv', importedAt: '' },
        { id: 'S2', kind: 'transcript' as const, name: 'entretien.txt', importedAt: '' },
      ],
      participants: [
        { id: 'P1', label: 'P1', attributes: {} },
        { id: 'P2', label: 'P2', attributes: {} },
      ],
      contributions: [
        { id: 'C1', participantId: 'P1', sourceId: 'S1', text: 'Oui' },
        { id: 'C2', participantId: 'P2', sourceId: 'S2', text: 'Non' },
      ],
    }
    expect(renameSource(corpus, 'S2', '  Entretien du 18 mai  ').sources[1].name).toBe('Entretien du 18 mai')
    expect(renameSource(corpus, 'S2', '   ').sources[1].name).toBe('entretien.txt')
    // Les relances de l'animateur ne sont pas des questions à choisir, et décocher une question du questionnaire n'écarte pas l'entretien.
    const withPrompts = {
      ...corpus,
      contributions: [
        { ...corpus.contributions[0], prompt: 'Q du questionnaire' },
        { ...corpus.contributions[1], prompt: 'Relance de l’animatrice' },
      ],
    }
    expect(promptsOf(withPrompts)).toEqual(['Q du questionnaire'])
    const project = { ...newProject('t'), corpus: withPrompts, selectedPrompts: ['Autre question'] }
    expect(corpusForAnalysis(project).contributions.map((c) => c.id)).toEqual(['C2'])
    const r = removeSource(corpus, 'S2')
    expect(r.sources.map((s) => s.id)).toEqual(['S1'])
    expect(r.participants.map((p) => p.id)).toEqual(['P1'])
    expect(r.contributions.map((c) => c.id)).toEqual(['C1'])
  })
})

describe('citations coupées', () => {
  const source =
    "Je trouve que l'ergonomie est vraiment top. Ah, tant que j'y pense, la dernière mise à jour a planté hier soir. Ce que j'apprécie surtout, c'est l'iconographie minimale et claire."
  it('accepte une coupure « […] » si chaque fragment existe, dans l’ordre', () => {
    const q = "Je trouve que l'ergonomie est vraiment top. […] Ce que j'apprécie surtout, c'est l'iconographie minimale et claire."
    const m = locateQuote(source, q)
    expect(m?.parts).toHaveLength(2)
    expect(quoteText(source, m!)).toBe(q)
  })
  it('refuse le désordre, l’invention, les fragments courts et plusieurs coupures', () => {
    expect(locateQuote(source, "c'est l'iconographie minimale et claire […] Je trouve que l'ergonomie est vraiment top")).toBeNull()
    expect(locateQuote(source, "Je trouve que l'ergonomie est vraiment top […] elle est aussi très rapide partout")).toBeNull()
    expect(locateQuote(source, "Je trouve que l'ergonomie […] minimale et claire")).toBeNull()
    expect(locateQuote(source, "Je trouve que l'ergonomie est […] la dernière mise à jour a planté […] l'iconographie minimale et claire")).toBeNull()
    // Des points de suspension seuls restent une reformulation.
    expect(locateQuote(source, "Je trouve que l'ergonomie est vraiment top… l'iconographie minimale et claire")).toBeNull()
  })
  it('refuse une coupure qui retire une négation ou un contraste', () => {
    const s2 = 'Le site est clair, mais pas du tout pour les nouveaux venus qui arrivent, et il reste agréable à utiliser au quotidien.'
    expect(locateQuote(s2, 'Le site est clair, […] et il reste agréable à utiliser au quotidien.')).toBeNull()
  })
})

describe('citations qui renvoient à la phrase d’avant', () => {
  it('« Malgré cela… » emporte la phrase précédente, rien d’autre ne change', () => {
    const text = 'La commande a été modifiée deux fois. Malgré cela, tout est arrivé à temps. Merci.'
    const m = locateQuote(text, 'Malgré cela, tout est arrivé à temps.')!
    const w = withAntecedent(text, m)
    expect(quoteText(text, w)).toBe('La commande a été modifiée deux fois. Malgré cela, tout est arrivé à temps.')
    const plain = locateQuote(text, 'tout est arrivé à temps')!
    expect(withAntecedent(text, plain)).toEqual(plain)
    const first = locateQuote('Elle est pratique.', 'Elle est pratique.')!
    expect(withAntecedent('Elle est pratique.', first)).toEqual(first)
  })
})

describe('couverture des longues réponses', () => {
  it('repère les passages assez longs qu’aucune citation ne couvre', () => {
    const text = 'La livraison était rapide. On pourrait aussi parler du parking, qui reste introuvable pour la plupart des clients du samedi. Merci !'
    const covered = [{ start: 0, end: 26 }]
    expect(uncoveredPassages(text, covered)).toEqual([
      'On pourrait aussi parler du parking, qui reste introuvable pour la plupart des clients du samedi. Merci !',
    ])
    expect(uncoveredPassages(text, [{ start: 0, end: 132 }])).toEqual([])
  })

  it('donne avec chaque passage ce qui le précède : une liste d’exemples peut illustrer une critique', () => {
    const text = "Le bilan est décevant : la lettre aux adhérents n'ouvre aucune perspective concrète. Par exemple les horaires d'ouverture, le prix des abonnements, la navette du samedi ou la salle de lecture."
    const critique = text.indexOf('Par exemple')
    expect(uncoveredWithContext(text, [{ start: 0, end: critique - 1 }])).toEqual([
      {
        text: "Par exemple les horaires d'ouverture, le prix des abonnements, la navette du samedi ou la salle de lecture.",
        before: "Le bilan est décevant : la lettre aux adhérents n'ouvre aucune perspective concrète.",
      },
    ])
  })
})

describe('prénoms des particuliers', () => {
  it('ne garde que les noms présents dans le texte, et les masque mot entier', () => {
    const texts = ['Mélodie a répondu à toutes mes questions.', 'Merci Karim pour le conseil.']
    const names = verifiedNames(['Mélodie', 'Karim', 'Yanis', 'Al'], texts)
    expect(names).toEqual(['Mélodie', 'Karim'])
    expect(maskNames('Mélodie a tout réglé.', names)).toBe('[prénom] a tout réglé.')
    // Pas de masquage à l'intérieur d'un mot.
    expect(maskNames('Les Mélodiettes', names)).toBe('Les Mélodiettes')
  })
})

describe('faits saillants', () => {
  it('classe ce qui a marché, ce qui bloque, ce qui divise, avec les mêmes chiffres que le consensus', () => {
    const mk = (id: string, title: string, list: [string, IdeaCategory][]) => {
      const ideas = list.map(([p, c], k) => idea(`${id}-${k}`, p, c))
      return { id, title, ideaIds: ideas.map((i) => i.id), summary: '', metrics: computeMetrics(ideas), ideas }
    }
    const groups = [
      // 3 positifs, 1 négatif : consensus positif, 3 des 4 avis.
      mk('G1', 'Ambiance', [
        ['P1', 'positive'],
        ['P2', 'positive'],
        ['P3', 'positive'],
        ['P4', 'negative'],
      ]),
      // Un mitigé ne compte dans aucun camp : 4 négatifs + 1 mitigé = 4 des 5 avis.
      mk('G2', 'Budget', [
        ['P1', 'negative'],
        ['P2', 'negative'],
        ['P3', 'negative'],
        ['P4', 'negative'],
        ['P6', 'negative'],
        ['P6', 'positive'],
        ['P5', 'suggestion'],
      ]),
      // Trop peu d'avis : aucune liste.
      mk('G3', 'Affiches', [['P1', 'negative']]),
      mk('G4', 'Formation', [
        ['P2', 'suggestion'],
        ['P3', 'suggestion'],
      ]),
      mk('G5', 'Réseaux sociaux', [
        ['P1', 'positive'],
        ['P2', 'positive'],
        ['P3', 'negative'],
        ['P4', 'negative'],
      ]),
    ]
    const byId = new Map(groups.flatMap((g) => g.ideas).map((i) => [i.id, i]))
    const h = highlights(groups, byId)
    expect(h.strengths.map((x) => [x.title, x.people, x.of])).toEqual([['Ambiance', 3, 4]])
    expect(h.blockers.map((x) => [x.title, x.people, x.of])).toEqual([['Budget', 4, 5]])
    expect(h.divided.map((x) => x.title)).toEqual(['Réseaux sociaux'])
    expect(h.proposals.map((x) => [x.title, x.people])).toEqual([
      ['Formation', 2],
      ['Budget', 1],
    ])
    // Les propositions portent leurs propres idées, pour les montrer.
    expect(h.proposals[0].ideaIds).toEqual(['G4-0', 'G4-1'])
  })
})

describe('ligne de chiffres affichée', () => {
  it('donne la fraction sans pourcentage, les constats, et « peu d’avis »', () => {
    const many = computeMetrics([
      ...Array.from({ length: 10 }, (_, k) => idea(`N${k}`, `P${k}`, 'negative')),
      idea('A', 'P20', 'positive'),
      idea('B', 'P21', 'neutral'),
    ])
    expect(metricsLine(many)).toBe('12 participants · avis : 1 positif, 10 négatifs · 1 participant fait un constat · large majorité négative (10 sur 11 qui donnent un avis)')
    expect(metricsLine(computeMetrics([idea('X', 'P1', 'negative')]))).toBe('1 participant · avis : 1 négatif')
  })
})

describe('contrôle des chiffres des synthèses', () => {
  it('retire une phrase au nombre introuvable plutôt que de la livrer', () => {
    expect(dropSentences('Une personne apprécie [I0001]. Deux autres la jugent insuffisante.', ['Deux autres'])).toEqual({
      text: 'Une personne apprécie [I0001].',
      removed: 1,
    })
    // Si tout tombait, on garde le texte et son signalement.
    expect(dropSentences('Sept personnes apprécient.', ['Sept personnes']).removed).toBe(0)
  })
  it('signale un nombre, en chiffres ou en lettres, qui ne vient ni du calcul ni des citations', () => {
    const ideas = ['P1', 'P2', 'P3', 'P4', 'P5'].map((p, k) => idea(`I000${k}`, p, k < 4 ? 'positive' : 'negative'))
    const ok = allowedNumbers([computeMetrics(ideas)], ['On était 12 bénévoles en 2020'])
    expect(unverifiedNumbers('Quatre personnes sur cinq apprécient [I0001]. Une personne regrette [I0004].', ok)).toEqual([])
    expect(unverifiedNumbers('Les 12 bénévoles de 2020 sont cités.', ok)).toEqual([])
    expect(unverifiedNumbers('Sept personnes apprécient, soit 64 %.', ok)).toEqual(['64', 'Sept personnes'])
  })
  it('repère deux idées d’une même personne comptées comme deux personnes', () => {
    const person = (id: string) => ({ I0252: 'P15', I0253: 'P15', I0010: 'P1', I0011: 'P2' })[id]
    expect(overcountedPeople('Deux personnes suggèrent un debrief [I0252, I0253].', person)).toEqual(['Deux personnes'])
    expect(overcountedPeople('Deux personnes regrettent [I0010, I0011].', person)).toEqual([])
    // Une phrase qui cite un exemple pour six personnes n'affirme rien sur les autres.
    expect(overcountedPeople('Six personnes saluent la collaboration [I0010].', person)).toEqual([])
  })
  it('dans un thème, « trois personnes » doit citer trois personnes', () => {
    const person = (id: string) => ({ I0069: 'P5', I0070: 'P5', I0010: 'P1', I0011: 'P2', I0012: 'P3' })[id]
    expect(undercitedPeople('Trois personnes saluent la déclaration de la liste [I0069].', person)).toEqual(['Trois personnes'])
    expect(undercitedPeople('Trois personnes saluent la déclaration [I0010, I0011, I0012].', person)).toEqual([])
    // Un ratio repris des listes du code n'est pas un comptage à prouver idée par idée.
    expect(undercitedPeople('10 des 12 participants qui donnent un avis la critiquent [I0010].', person)).toEqual([])
    expect(undercitedPeople('Une personne regrette [I0069].', person)).toEqual([])
  })
  it('la relecture ne peut pas changer « deux » en « trois »', () => {
    expect(acceptRewrite('Deux personnes regrettent [I0001].', 'Trois personnes regrettent [I0001].')).toBe(false)
    expect(acceptRewrite('2 personnes regrettent [I0001].', 'Deux personnes le regrettent [I0001].')).toBe(true)
  })
})

describe('citations dans les synthèses', () => {
  it('ne garde que les références du périmètre', () => {
    const s = sanitizeCitations('Lent [I0001, I0099]. Bien [I0050] ! Texte [voir annexe].', new Set(['I0001']))
    expect(s).toBe('Lent [I0001]. Bien ! Texte [voir annexe].')
  })
})

async function runSim(corpus: Corpus, faults = {}, cache = new MemoryCache()) {
  const provider = createSimulationProvider(faults)
  const updates: AnalysisState[] = []
  const state = await runAnalysis(corpus, await newAnalysis(corpus, DEFAULT_SETTINGS, provider), {
    provider,
    cache,
    onUpdate: (s) => {
      updates.push(s)
    },
  })
  return { state, updates }
}

function checkInvariants(state: AnalysisState, corpus: Corpus) {
  const byContribution = new Map(corpus.contributions.map((c) => [c.id, c]))
  // Chaque citation existe dans le texte source, à la position indiquée.
  for (const i of state.ideas) {
    const c = byContribution.get(i.contributionId)!
    expect(c.participantId).toBe(i.participantId)
    expect(c.text.slice(i.span.start, i.span.end)).toBe(i.verbatim)
  }
  // Chaque idée est rangée dans exactement un groupe.
  const seen = state.groups.flatMap((g) => g.ideaIds)
  expect(new Set(seen).size).toBe(seen.length)
  expect(new Set(seen)).toEqual(new Set(state.ideas.map((i) => i.id)))
  // Chaque groupe est dans au plus un thème, et tous y sont s'il y a des thèmes.
  if (state.themes.length) {
    const g = state.themes.flatMap((t) => t.groupIds)
    expect(new Set(g).size).toBe(g.length)
    expect(g.length).toBe(state.groups.length)
  }
  // Les chiffres sont ceux du code.
  const byId = new Map(state.ideas.map((i) => [i.id, i]))
  for (const g of state.groups) {
    expect(g.metrics).toEqual(computeMetrics(g.ideaIds.map((id) => byId.get(id)!)))
  }
}

describe('chaîne complète (simulation)', () => {
  it('produit un rapport cohérent', async () => {
    const corpus = surveyCorpus()
    const { state } = await runSim(corpus)
    expect(state.status).toBe('done')
    expect(state.ideas.length).toBeGreaterThan(20)
    expect(state.groups.length).toBeGreaterThan(2)
    expect(state.globalSummary).toContain('[Simulation]')
    expect(state.steps.every((s) => s.state === 'done')).toBe(true)
    checkInvariants(state, corpus)
    const respondents = activeParticipants(corpus).map((p) => p.id)
    expect(state.extractedParticipants).toEqual(respondents)
  })

  it('rattrape citations reformulées, oublis de regroupement et JSON invalide', async () => {
    const corpus = surveyCorpus()
    const { state } = await runSim(corpus, { paraphraseEvery: 3, forgetEvery: 4, brokenJsonTasks: ['extract', 'group'] })
    expect(state.status).toBe('done')
    checkInvariants(state, corpus)
    expect(state.ideas.length).toBeGreaterThan(20)
  })

  it('relecture : refuse toute réécriture qui perd une citation ou change un chiffre', async () => {
    expect(acceptRewrite('6 personnes trouvent ça lent [I0001, I0002].', '6 personnes jugent l’outil lent [I0001, I0002].')).toBe(true)
    expect(acceptRewrite('6 personnes trouvent ça lent [I0001, I0002].', '6 personnes trouvent ça lent [I0001].')).toBe(false)
    expect(acceptRewrite('6 personnes trouvent ça lent [I0001].', 'Sept personnes trouvent ça lent [I0001].')).toBe(false)
    const corpus = surveyCorpus()
    const good = await runSim(corpus)
    expect(good.state.polish?.checked).toBeGreaterThan(0)
    expect(good.state.polish?.refused).toBe(0)
    const bad = await runSim(corpus, { badPolish: true })
    expect(bad.state.status).toBe('done')
    expect(bad.state.polish?.changed).toBe(0)
    expect(bad.state.polish?.refused).toBeGreaterThan(0)
    // Les synthèses d'origine, avec leurs citations, sont conservées.
    expect(bad.state.groups.map((g) => g.summary)).toEqual(good.state.groups.map((g) => g.summary))
  })

  it('redonne au modèle les motifs qu’il a oubliés en formant les thèmes', async () => {
    const { state } = await runSim(surveyCorpus(), { forgetHalfThemes: true })
    expect(state.status).toBe('done')
    expect(state.themes.some((t) => t.title === 'Autres sujets')).toBe(false)
    // Chaque motif est dans exactement un thème.
    expect(state.themes.flatMap((t) => t.groupIds).sort()).toEqual(state.groups.map((g) => g.id).sort())
  })

  it('est reproductible mot pour mot, et la relance passe entièrement par le cache', async () => {
    const corpus = surveyCorpus()
    const cache = new MemoryCache()
    const a = await runSim(corpus, {}, cache)
    const b = await runSim(corpus, {}, cache)
    const strip = (s: AnalysisState) => ({ ideas: s.ideas, groups: s.groups, themes: s.themes, summary: s.globalSummary })
    expect(strip(b.state)).toEqual(strip(a.state))
    expect(b.state.calls.cached).toBe(b.state.calls.total)
  })

  it('reprend une analyse interrompue sans refaire les personnes déjà traitées', async () => {
    const corpus = surveyCorpus()
    const base = createSimulationProvider()
    let calls = 0
    const failing: LlmProvider = {
      ...base,
      fingerprint: base.fingerprint,
      label: base.label,
      async complete(req) {
        calls++
        if (req.task === 'extract' && calls === 6) throw new ProviderError('Coupure réseau', { status: 0, fatal: true })
        return base.complete(req)
      },
    }
    const cache = new MemoryCache()
    const first = await runAnalysis(corpus, await newAnalysis(corpus, DEFAULT_SETTINGS, failing), {
      provider: failing,
      cache,
      concurrency: 1,
    })
    expect(first.status).toBe('error')
    expect(first.extractedParticipants.length).toBe(5)
    const done = await runAnalysis(corpus, first, { provider: base, cache, concurrency: 1 })
    expect(done.status).toBe('done')
    const fresh = (await runSim(corpus)).state
    expect(done.ideas).toEqual(fresh.ideas)
  })

  it('une relecture des motifs qui boucle jusqu\'à la limite est ignorée, l\'analyse continue', async () => {
    const corpus = surveyCorpus()
    const base = createSimulationProvider()
    const looping: LlmProvider = {
      ...base,
      fingerprint: base.fingerprint,
      label: base.label,
      async complete(req) {
        if (req.task === 'review') throw new ProviderError('coupée', { fatal: true, truncated: true })
        return base.complete(req)
      },
    }
    const state = await runAnalysis(corpus, await newAnalysis(corpus, DEFAULT_SETTINGS, looping), { provider: looping, cache: new MemoryCache(), concurrency: 1 })
    expect(state.status).toBe('done')
    expect(state.reviewSkipped).toBeGreaterThan(0)
  })

  it('découpage par lots de personnes (méthode « lots ») : les idées sont rendues à chaque personne, comme une à une', async () => {
    const corpus = surveyCorpus()
    const provider = createSimulationProvider()
    const one = await runAnalysis(corpus, await newAnalysis(corpus, DEFAULT_SETTINGS, provider), { provider, cache: new MemoryCache() })
    const batched = await runAnalysis(corpus, await newAnalysis(corpus, { ...DEFAULT_SETTINGS, method: 'lots' }, provider), {
      provider,
      cache: new MemoryCache(),
    })
    expect(batched.status).toBe('done')
    const key = (s: AnalysisState) => s.ideas.map((i) => `${i.participantId}|${i.verbatim}`).sort()
    expect(key(batched)).toEqual(key(one))
    expect(batched.calls.total).toBeLessThan(one.calls.total)
  })

  it('méthode « contexte » : le regroupement reçoit les verbatims et leur ton, les unanimités sont vérifiées, l’analyse va au bout', async () => {
    const corpus = surveyCorpus()
    const base = createSimulationProvider()
    const seen: string[] = []
    const spy: LlmProvider = {
      ...base,
      fingerprint: base.fingerprint,
      label: base.label,
      async complete(req) {
        if (req.task === 'group') seen.push(req.user.includes('"examples"') && req.user.includes('"tone"') ? 'contexte' : 'sans')
        if (req.task === 'unanimity') seen.push('unanimité')
        return base.complete(req)
      },
    }
    const state = await runAnalysis(corpus, await newAnalysis(corpus, { ...DEFAULT_SETTINGS, method: 'contexte' }, spy), { provider: spy, cache: new MemoryCache() })
    expect(state.status).toBe('done')
    expect(seen[0]).toBe('contexte')
    // La vérification n'a lieu que s'il existe un motif unanime (au moins 3 avis) et une idée de ton contraire ailleurs.
    const opinions = (g: Group) => g.metrics.positiveOnly.length + g.metrics.negativeOnly.length + g.metrics.mixed.length
    const eligible = state.groups.some((g) => (g.metrics.stance === 'unanimous' || g.metrics.stance === 'consensus') && opinions(g) >= 3)
    expect(seen.includes('unanimité')).toBe(eligible)
  })

  it('vérification des unanimités : un motif unanime d’au moins 3 avis reçoit les idées de ton contraire rangées ailleurs', () => {
    const idea = (id: string, p: string, category: IdeaCategory) => ({ id, participantId: p, category, label: id, verbatim: `texte ${id}` }) as unknown as Idea
    const ideas = [
      idea('I1', 'P1', 'positive'),
      idea('I2', 'P2', 'positive'),
      idea('I3', 'P3', 'positive'),
      idea('I6', 'P6', 'positive'),
      idea('I4', 'P4', 'negative'),
      idea('I5', 'P5', 'suggestion'),
    ]
    const group = (id: string, ids: string[]): Group => ({ id, title: id, ideaIds: ids, summary: '', metrics: computeMetrics(ids.map((x) => ideas.find((i) => i.id === x)!)) })
    const check = unanimityCheck([group('G1', ['I1', 'I2', 'I3', 'I6']), group('G2', ['I4', 'I5'])], ideas)
    expect(check.map((m) => [m.id, m.side, m.candidates.map((c) => c.id)])).toEqual([['G1', 'positive', ['I4']]])
    // Trop peu d'avis pour parler d'unanimité : pas de vérification.
    expect(unanimityCheck([group('G1', ['I1', 'I2']), group('G2', ['I4'])], ideas)).toEqual([])
  })

  it('vérification des unanimités : seul un déplacement vers le motif vérifié, d’une de ses candidates, est appliqué', () => {
    const ideas = [
      { id: 'I1', participantId: 'P1', category: 'positive' },
      { id: 'I2', participantId: 'P2', category: 'negative' },
      { id: 'I3', participantId: 'P3', category: 'negative' },
    ] as unknown as Idea[]
    const groups = [
      { id: 'G1', title: 'Accueil', ideaIds: ['I1'] },
      { id: 'G2', title: 'Attente', ideaIds: ['I2', 'I3'] },
    ]
    const r = applyReview(ideas, groups, [{ id: 'I2', to: 'G1' }])
    expect(r.moved).toEqual([{ id: 'I2', from: 'Attente', to: 'Accueil' }])
  })

  it('méthode « contexte2 » : règles de découpage, verbatims au résumé ; la référence ne change pas', async () => {
    const corpus = surveyCorpus()
    const run = async (method?: 'contexte2') => {
      const base = createSimulationProvider()
      const seen: Record<string, string> = {}
      const spy: LlmProvider = {
        ...base,
        fingerprint: base.fingerprint,
        label: base.label,
        async complete(req) {
          seen[req.task] ??= req.user
          return base.complete(req)
        },
      }
      const state = await runAnalysis(corpus, await newAnalysis(corpus, { ...DEFAULT_SETTINGS, method }, spy), { provider: spy, cache: new MemoryCache() })
      return { state, seen }
    }
    const ref = await run()
    const v2 = await run('contexte2')
    expect(v2.state.status).toBe('done')
    expect(v2.seen.extract).toContain('Une critique formulée comme un manque')
    expect(ref.seen.extract).not.toContain('Une critique formulée comme un manque')
    expect(v2.seen.global).toContain('"example"')
    expect(ref.seen.global).not.toContain('"example"')
    expect(v2.seen.themes).toContain('écris le chiffre de ses')
  })

  it("s'arrête proprement quand on annule", async () => {
    const corpus = surveyCorpus()
    const controller = new AbortController()
    const provider = createSimulationProvider()
    const state = await runAnalysis(corpus, await newAnalysis(corpus, DEFAULT_SETTINGS, provider), {
      provider,
      cache: new MemoryCache(),
      signal: controller.signal,
      concurrency: 1,
      onUpdate: (s) => {
        if (s.extractedParticipants.length === 2) controller.abort()
      },
    })
    expect(state.status).toBe('cancelled')
    expect(state.extractedParticipants.length).toBeLessThan(11)
  })

  it('mode grille : seuls les titres imposés et « Hors grille »', async () => {
    const corpus = surveyCorpus()
    const provider = createSimulationProvider()
    const settings = { ...DEFAULT_SETTINGS, mode: 'grid' as const, grid: ['Lenteur et performance', 'Notifications'] }
    const state = await runAnalysis(corpus, await newAnalysis(corpus, settings, provider), { provider, cache: new MemoryCache() })
    expect(state.status).toBe('done')
    for (const g of state.groups) expect(['Lenteur et performance', 'Notifications', 'Hors grille']).toContain(g.title)
    checkInvariants(state, corpus)
  })
})

describe('citation aux fautes de frappe corrigées (méthode Ministral seulement)', () => {
  const source = "On a vu les contributins des ateliers , et c'était utile pour 3 commissions."
  const typos = { typos: true }
  it('retrouve le passage d’origine et montre le texte du participant', () => {
    const m = locateVerbatim(source, "On a vu les contributions des ateliers, et c'était utile pour 3 commissions.", typos)
    expect(m && source.slice(m.start, m.end)).toBe(source.replace(/\.$/, ''))
    expect(m?.approximate).toBe(true)
  })
  it('refuse un écart qui change le sens, un chiffre changé, une citation trop courte', () => {
    expect(locateVerbatim(source, "On a vu les contributions des ateliers, et ce n'était pas utile pour 3 commissions.", typos)).toBeNull()
    expect(locateVerbatim(source, "On a vu les contributions des ateliers, et c'était utile pour 8 commissions.", typos)).toBeNull()
    expect(locateVerbatim('Les contributins', 'Les contributions', typos)).toBeNull()
  })
  it('la méthode de référence reste stricte', () => {
    expect(locateVerbatim(source, "On a vu les contributions des ateliers, et c'était utile pour 3 commissions.")).toBeNull()
  })
})

describe('phrase qui dépend d’une phrase retirée', () => {
  it('part avec elle ; une phrase autonome reste', () => {
    expect(dropUnreferenced('Le tri plaît. Elles soulignent la rapidité [I0001]. Trois personnes jugent le site lent [I0002].').text).toBe(
      'Trois personnes jugent le site lent [I0002].',
    )
    expect(dropUnreferenced('Le tri plaît. Six critiquent en revanche le délai [I0001]. Le site est lent [I0002].').text).toBe('Le site est lent [I0002].')
    expect(dropUnreferenced('Le tri plaît [I0001]. Elles soulignent la rapidité [I0002].').text).toBe('Le tri plaît [I0001]. Elles soulignent la rapidité [I0002].')
    // Une reprise (« Cette dernière », « La seconde ») part avec la phrase qu'elle reprend.
    expect(dropUnreferenced('Une personne juge le site lent. Cette dernière propose un mode hors ligne [I0001]. Le tri plaît [I0002].').text).toBe(
      'Le tri plaît [I0002].',
    )
  })
})

describe('phrase répétée', () => {
  it('la seconde de deux phrases presque identiques est retirée', () => {
    const t =
      'Quatre personnes jugent les affiches trop rares dans les quartiers [I0001]. Le tractage plaît [I0002]. Quatre personnes jugent les affiches beaucoup trop rares dans les quartiers [I0003].'
    expect(dropNearDuplicates(t)).toEqual({ text: 'Quatre personnes jugent les affiches trop rares dans les quartiers [I0001]. Le tractage plaît [I0002].', removed: 1 })
  })
})

describe('regroupement dégénéré', () => {
  it('un ou deux groupes pour une longue liste est redemandé ; une réponse saine ne l’est pas', () => {
    expect(degenerateGrouping(1, 150, 14)).toBe(true)
    expect(degenerateGrouping(5, 150, 14)).toBe(true)
    expect(degenerateGrouping(18, 284, 18)).toBe(false)
    expect(degenerateGrouping(2, 12, 3)).toBe(false) // liste courte : rien à redire
  })
})

describe('motifs isolés rattachés (méthode Gemini)', () => {
  it('rattache un motif à une personne à un motif plus large ; « aucun », un motif inconnu ou une cible isolée sont ignorés', () => {
    const g = (id: string, title: string, ideaIds: string[], participants: number) => ({ id, title, ideaIds, metrics: { participants } })
    const groups = [g('G1', 'Affichage en ville', ['I1', 'I2'], 2), g('G2', 'Affiches trop rares', ['I3'], 1), g('G3', 'Chanson', ['I4'], 1), g('G4', 'Vidéos', ['I5'], 1)]
    const r = applyAttachments(groups, [
      { single: 'G2', group: 'g1' },
      { single: 'G3', group: 'aucun' },
      { single: 'G4', group: 'G3' }, // cible isolée : refusé
      { single: 'G9', group: 'G1' },
    ])
    expect(r.groups.map((x) => [x.title, x.ideaIds])).toEqual([
      ['Affichage en ville', ['I1', 'I2', 'I3']],
      ['Chanson', ['I4']],
      ['Vidéos', ['I5']],
    ])
    expect(r.merges).toHaveLength(1)
  })
})

describe('méthodes par famille de modèles', () => {
  it('la référence garde sa consigne de regroupement mot pour mot ; Ministral a la sienne', () => {
    const input = { items: [{ id: 'L1', label: 'x', count: 1, example: 'x' }] }
    const ref = groupingPrompt(input, DEFAULT_SETTINGS, { min: 3, max: 6 }).user
    expect(ref).toContain('(« Démarrage tardif », « Communication de dernière minute », « Commencer un an avant » relèvent tous du calendrier)')
    const light = groupingPrompt(input, { ...DEFAULT_SETTINGS, method: 'ministral' }, { min: 3, max: 6 }).user
    expect(light).toContain("relèvent tous de l'attente au guichet")
    expect(light.replace(/\(« Trop peu[^)]*\)/, '')).toBe(ref.replace(/\(« Démarrage tardif[^)]*\)/, ''))
  })

  it('la référence n’a aucune règle propre ; Gemini ajoute les siennes sans toucher le reste de la consigne', () => {
    for (const k of ['grouping', 'assign', 'review', 'summary', 'themes', 'global'] as const) expect(methodRules(DEFAULT_SETTINGS, k)).toBe('')
    const input = { groups: [{ id: 'G1', title: 'x', facts: 'y', ideas: [] }] }
    const ref = groupSummaryPrompt(input, DEFAULT_SETTINGS).user
    const gem = groupSummaryPrompt(input, { ...DEFAULT_SETTINGS, method: 'gemini' }).user
    expect(gem).toContain('Chaque phrase se comprend seule')
    expect(gem.replace(/9\. Chaque phrase[^\n]*\n/, '')).toBe(ref)
  })
})

describe('méthode « consultation » (Observatoire)', () => {
  it('les idées hors question sortent des motifs, restent listées, et la référence ne change pas', async () => {
    const corpus = surveyCorpus()
    const run = async (method?: 'consultation') => {
      const base = createSimulationProvider()
      const seen: Record<string, string> = {}
      const spy: LlmProvider = {
        ...base,
        fingerprint: base.fingerprint,
        label: base.label,
        async complete(req) {
          seen[req.task] ??= req.user
          const res = await base.complete(req)
          // Le modèle range la première idée du premier groupe « Hors question ».
          if (method && req.task === 'group') {
            const out = JSON.parse(res.text) as { groups: { title: string; items: string[] }[] }
            const first = out.groups[0].items.shift()!
            out.groups.push({ title: 'Hors question', items: [first] })
            return { ...res, text: JSON.stringify(out) }
          }
          return res
        },
      }
      const state = await runAnalysis(corpus, await newAnalysis(corpus, { ...DEFAULT_SETTINGS, method }, spy), { provider: spy, cache: new MemoryCache() })
      return { state, seen }
    }
    const ref = await run()
    const c = await run('consultation')
    expect(c.state.status).toBe('done')
    expect(ref.state.offTopic ?? []).toEqual([])
    expect(c.state.offTopic!.length).toBeGreaterThan(0)
    const grouped = c.state.groups.flatMap((g) => g.ideaIds)
    expect(new Set([...grouped, ...c.state.offTopic!])).toEqual(new Set(c.state.ideas.map((i) => i.id)))
    for (const id of c.state.offTopic!) expect(grouped).not.toContain(id)
    expect(c.state.groups.some((g) => g.title === 'Hors question')).toBe(false)
    expect(reportToMarkdown(c.state, corpus, 'Test')).toContain('## Hors question')
    expect(reportToMarkdown(ref.state, corpus, 'Test')).not.toContain('## Hors question')
    // Règles propres à la méthode, absentes de la référence.
    expect(c.seen.group).toContain('« Hors question »')
    expect(ref.seen.group).not.toContain('Hors question')
    expect(c.seen.review).toContain('critique le bus, pas la voiture')
    expect(ref.seen.review).not.toContain('critique le bus')
    expect(c.seen.summarize).toContain('Format de "opposed"')
    expect(c.seen.summarize).toContain('Ne montre pas tes comptes')
    expect(ref.seen.summarize).not.toContain('Ne montre pas tes comptes')
    // Le découpage ne change pas : l'extraction déjà en cache reste valable.
    expect(c.seen.extract).toBe(ref.seen.extract)
  })

  it('le mot de l’échelle accompagne le chiffre ; un camp unanime se dit « les 24 »', () => {
    const h = { groupId: 'G1', title: 'Absences', people: 24, of: 24, ideaIds: [], stance: 'unanimous' as const }
    expect(highlightLine(h, 'blockers')).toBe('Absences : 24 des 24 participants qui donnent un avis')
    expect(highlightLine(h, 'blockers', 'fr', true)).toBe('Absences : unanime, les 24 participants qui donnent un avis')
    expect(highlightLine({ ...h, people: 28, of: 33, stance: 'consensus', fragile: true }, 'blockers', 'fr', true)).toBe(
      'Absences : large majorité (fragile), 28 des 33 participants qui donnent un avis',
    )
  })

  it('« notamment » ne vient pas d’un « tous » qui ne compte pas des personnes ; un seul prénom s’accorde', () => {
    const byId = new Map([{ id: 'I0001', participantId: 'P70', verbatim: 'v' } as Idea].map((i) => [i.id, i]))
    expect(refsToPeople('Une personne, attachée à l’école pour tous, juge l’organisation inadaptée [I0001].', byId, undefined, () => 30)).toBe(
      'Une personne, attachée à l’école pour tous, juge l’organisation inadaptée (P70).',
    )
    expect(refsToPeople('Une autre réclame des horaires adaptés à tous les âges [I0001].', byId, undefined, () => 30)).toBe(
      'Une autre réclame des horaires adaptés à tous les âges (P70).',
    )
    expect(refsToPeople('Tous les participants qui en parlent le saluent [I0001].', byId, undefined, () => 30)).toBe(
      'Tous les participants qui en parlent le saluent (notamment P70).',
    )
  })
})

describe('citations inventées', () => {
  it('une phrase qui cite entre guillemets un texte absent des réponses est retirée', () => {
    const known = ['Le guichet ferme trop tôt le samedi.', 'Attente au guichet']
    const r = dropInventedQuotes(
      'Une personne note que « le guichet ferme trop tôt » [I0001]. Une autre se demande : « Comment concilier horaires et budget ? » [I0002]. Le motif « Attente au guichet » revient.',
      known,
    )
    expect(r).toEqual({ text: 'Une personne note que « le guichet ferme trop tôt » [I0001]. Le motif « Attente au guichet » revient.', removed: 1 })
  })
})

describe('renvois mal formés', () => {
  it('identifiants sans crochets, renvoi de motif et point manquant sont réparés', () => {
    const allowed = new Set(['I0001', 'I0002', 'I0003'])
    expect(sanitizeCitations('Le tri plaît [I0001] Deux personnes le jugent lent [I0002, I0003]. I0002 I0003', allowed)).toBe(
      'Le tri plaît [I0001]. Deux personnes le jugent lent [I0002, I0003]. [I0002, I0003]',
    )
    expect(sanitizeCitations('Les affiches manquent [G3]. Le tractage plaît [I0001].', allowed)).toBe('Les affiches manquent. Le tractage plaît [I0001].')
    expect(sanitizeCitations('Le tractage plaît [I016, I0001].', allowed)).toBe('Le tractage plaît [I0001].')
  })
})

describe('propositions opposées', () => {
  it('lit aussi une opposition écrite {"ids":[…],"about":…}', () => {
    const r = groupSummarySchema.parse({ groups: [{ id: 'G1', summary: 'Texte.', opposed: [{ ids: ['I0001', 'I0002'], about: 'le prix' }] }] })
    expect(r.groups[0].opposed).toEqual([expect.objectContaining({ a: 'I0001', b: 'I0002', about: 'le prix' })])
  })
})

describe('relecture des motifs', () => {
  const idea = (id: string, participantId: string, category: IdeaCategory) => ({ id, participantId, category }) as Idea
  it('déplace une idée hors sujet, corrige un ton, refuse ce qui ne tient pas, et garde la trace', () => {
    const ideas = [idea('I1', 'P5', 'positive'), idea('I2', 'P5', 'negative'), idea('I3', 'P9', 'positive'), idea('I4', 'P4', 'positive')]
    const groups = [
      { id: 'G1', title: 'Outils numériques et IA', ideaIds: ['I1', 'I2'] },
      { id: 'G2', title: 'Accueil des nouveaux', ideaIds: ['I3'] },
      { id: 'G3', title: 'Calendrier de la campagne', ideaIds: ['I4'] },
    ]
    const r = applyReview(ideas, groups, [
      { id: 'I2', new: 'Ouverture aux nouveaux outils' },
      { id: 'I4', category: 'negative' },
      { id: 'I3', new: 'Points forts' }, // titre de jugement : refusé
      { id: 'I9', to: 'G2' }, // idée inconnue
      { id: 'I1', to: 'G9' }, // motif inconnu
    ])
    expect(r.groups.map((g) => [g.title, g.ideaIds])).toEqual([
      ['Outils numériques et IA', ['I1']],
      ['Accueil des nouveaux', ['I3']],
      ['Calendrier de la campagne', ['I4']],
      ['Ouverture aux nouveaux outils', ['I2']],
    ])
    expect(r.moved).toEqual([{ id: 'I2', from: 'Outils numériques et IA', to: 'Ouverture aux nouveaux outils' }])
    expect(r.retoned).toEqual([{ id: 'I4', from: 'positive', to: 'negative' }])
  })

  it('un identifiant de motif donné comme nouveau titre vaut déplacement, jamais un motif « G2 »', () => {
    const ideas = [idea('I1', 'P1', 'positive'), idea('I2', 'P2', 'positive')]
    const groups = [
      { id: 'G1', title: 'Tractage', ideaIds: ['I1', 'I2'] },
      { id: 'G2', title: 'Affiches', ideaIds: [] },
    ]
    const r = applyReview(ideas, groups, [
      { id: 'I1', new: 'g2' },
      { id: 'I2', new: 'N7' }, // ressemble à un identifiant : refusé
    ])
    expect(r.groups.map((g) => [g.title, g.ideaIds])).toEqual([
      ['Tractage', ['I2']],
      ['Affiches', ['I1']],
    ])
  })

  it('seconde relecture : les idées arrivées sont vérifiées, jamais renvoyées au motif quitté', () => {
    const moved = [
      { id: 'I1', from: 'Horaires du bus', to: 'Pistes cyclables' },
      { id: 'I2', from: 'Pistes cyclables', to: 'Hors question' },
    ]
    expect([...arrivals(moved)]).toEqual(['I1'])
    const groups = [
      { id: 'G1', title: 'Pistes cyclables' },
      { id: 'G2', title: 'Horaires du bus' },
      { id: 'G3', title: 'Covoiturage' },
    ]
    expect(
      keepForward(
        [
          { id: 'I1', to: 'G2' }, // retour au motif quitté : refusé
          { id: 'I1', new: 'horaires du bus', category: 'negative' }, // retour par le titre : refusé, le ton reste
          { id: 'I1', to: 'G3' },
          { id: 'I5', category: 'positive' },
        ],
        moved,
        groups,
      ),
    ).toEqual([{ id: 'I1', category: 'negative' }, { id: 'I1', to: 'G3' }, { id: 'I5', category: 'positive' }])
  })

  it('la consigne de relecture ne parle des idées arrivées que s\'il y en a', () => {
    const input = (arrived?: boolean) => ({
      titles: [{ id: 'G1', title: 'Bus' }],
      groups: [{ id: 'G1', title: 'Bus', mixed: [], ideas: [{ id: 'I1', participant: 'P1', category: 'positive' as const, label: 'Covoiturage pratique', verbatim: 'le covoiturage, c\'est pratique', ...(arrived ? { arrived } : {}) }] }],
    })
    const settings = { ...DEFAULT_SETTINGS, method: 'consultation' as const }
    expect(reviewPrompt(input(), settings).user).not.toContain('"arrived"')
    expect(reviewPrompt(input(true), settings).user).toContain('Les idées marquées "arrived"')
  })

  it('pistes opposées : deux propositions du motif, de deux personnes différentes', () => {
    const s = (id: string, p: string, c: IdeaCategory = 'suggestion') => ({ id, participantId: p, category: c }) as Idea
    const byId = new Map([s('I1', 'P12'), s('I2', 'P20'), s('I3', 'P20'), s('I4', 'P5', 'negative')].map((i) => [i.id, i]))
    const g = { ideaIds: ['I1', 'I2', 'I3', 'I4'] }
    expect(
      checkOpposed(g, byId, [
        { a: 'I1', b: 'I2', about: 'étiquette politique' },
        { a: 'I2', b: 'I3', about: 'même personne' },
        { a: 'I1', b: 'I4', about: 'pas une proposition' },
        { a: 'I2', b: 'I1', about: 'doublon' },
      ]),
    ).toEqual([{ a: 'I1', b: 'I2', about: 'étiquette politique' }])
  })
})

describe('vérification des renvois', () => {
  const text =
    'Cinq personnes critiquent les ateliers, l’une pour leur horaire tardif [I0001].\n\nUne personne propose un atelier [I0002]. Une autre salue la presse [I0003].'
  it('remplace une phrase mal appuyée, retire une phrase sans appui, garde les paragraphes', () => {
    const r = applySupport(text, new Set(['I0001', 'I0002', 'I0003', 'I0015']), [
      { n: 1, sentence: 'Cinq personnes critiquent les ateliers, l’une pour leur horaire tardif [I0015].' },
      { n: 3, drop: true },
    ])
    expect(r).toEqual({
      text: 'Cinq personnes critiquent les ateliers, l’une pour leur horaire tardif [I0015].\n\nUne personne propose un atelier [I0002].',
      fixed: 1,
      dropped: 1,
      added: 0,
    })
  })
  it('ajoute une phrase demandée (n = 0) si ses renvois sont permis et ses nombres signalés', () => {
    const allowed = new Set(['I0001', 'I0002', 'I0003', 'I0015'])
    const add = (sentence: string) => applySupport(text, allowed, [{ n: 0, sentence }], { addNumbers: new Set([2]), addTo: 'second' })
    expect(add('Deux personnes regrettent le bruit [I0015].').text).toBe(
      'Cinq personnes critiquent les ateliers, l’une pour leur horaire tardif [I0001].\n\nUne personne propose un atelier [I0002]. Une autre salue la presse [I0003]. Deux personnes regrettent le bruit [I0015].',
    )
    expect(add('Quatre personnes regrettent le bruit [I0015].').added).toBe(0)
    expect(add('Deux personnes regrettent le bruit [I0099].').added).toBe(0)
  })

  it('repère un camp d’avis compté mais absent de la synthèse', () => {
    const i = (id: string, p: string, c: IdeaCategory) => ({ id, participantId: p, category: c }) as Idea
    const byId = new Map([i('I0001', 'P1', 'positive'), i('I0002', 'P2', 'negative'), i('I0003', 'P3', 'negative')].map((x) => [x.id, x]))
    const g = { id: 'G1', title: 'x', ideaIds: ['I0001', 'I0002', 'I0003'], summary: 'Une personne apprécie [I0001].' } as unknown as Group
    expect(missingCamps(g, byId)).toEqual([{ side: 'negative', people: ['P2', 'P3'], ideaIds: ['I0002', 'I0003'] }])
  })

  it('refuse un renvoi hors du texte, un nombre ajouté, et ne vide jamais le texte', () => {
    const allowed = new Set(['I0001', 'I0002', 'I0003'])
    expect(applySupport(text, allowed, [{ n: 2, sentence: 'Une personne propose un atelier [I0099].' }]).fixed).toBe(0)
    expect(applySupport(text, allowed, [{ n: 2, sentence: 'Trois personnes proposent un atelier [I0002].' }]).fixed).toBe(0)
    expect(
      applySupport(
        text,
        allowed,
        [1, 2, 3].map((n) => ({ n, drop: true })),
      ).text,
    ).toBe(text)
  })
})

describe('contrôles ajoutés à la certification B8', () => {
  const person = (id: string) => ({ I0001: 'P4', I0002: 'P4', I0003: 'P7', I0004: 'P9' })[id]
  it('« une autre » exige une personne différente', () => {
    expect(impliedOthers('Une personne apprécie X, une autre regrette Y [I0001, I0002].', person)).toEqual(['une autre'])
    expect(impliedOthers('Une personne apprécie X, une autre regrette Y [I0001, I0003].', person)).toEqual([])
    expect(impliedOthers('Une personne apprécie X [I0001]. Une autre regrette Y [I0003].', person)).toEqual([])
    expect(impliedOthers('Une personne apprécie X [I0001]. Une autre regrette Y [I0002].', person)).toEqual(['Une autre'])
    expect(impliedOthers('Une personne, une autre et une troisième proposent Z [I0001, I0003].', person)).toEqual(['une troisième'])
  })
  it('« il faut » n’est pas une reprise ; une question de deux mots emporte sa phrase ; jamais par-dessus une autre idée', () => {
    const text = 'Le magasin est loin. Il faut prendre la voiture. Pourquoi pas ? comment ?'
    const m = locateQuote(text, 'Il faut prendre la voiture.')!
    expect(withAntecedent(text, m)).toEqual(m)
    const t2 = 'On voudrait plus de caisses ouvertes, mais comment ?'
    const q = locateQuote(t2, 'comment ?')!
    expect(quoteText(t2, withAntecedent(t2, q))).toBe('On voudrait plus de caisses ouvertes, mais comment ?')
    const t3 = 'La commande a été modifiée deux fois. Malgré cela, tout est arrivé à temps.'
    const r = locateQuote(t3, 'Malgré cela, tout est arrivé à temps.')!
    expect(withAntecedent(t3, r, 260, [{ start: 0, end: 37 }])).toEqual(r)
  })
  it('un compte réécrit est accepté s’il égale les personnes citées', () => {
    const text = 'Quatre personnes regrettent le bruit [I0001, I0003, I0004].'
    const r = applySupport(text, new Set(['I0001', 'I0003', 'I0004']), [{ n: 1, sentence: 'Trois personnes regrettent le bruit [I0001, I0003, I0004].' }], {
      personOf: (id) => ({ I0001: 'P1', I0003: 'P3', I0004: 'P4' })[id],
    })
    expect(r.fixed).toBe(1)
  })
  it('deux renvois identiques dans une phrase n’en font qu’un', () => {
    const byId = new Map([{ id: 'I0001', participantId: 'P4' } as Idea].map((i) => [i.id, i]))
    expect(refsToPeople('Elle salue X [I0001] et regrette Y [I0001].', byId)).toBe('Elle salue X et regrette Y (P4).')
  })
})

describe('phrases sans renvoi', () => {
  it('ne sont pas livrées dans un motif, sauf si rien d’autre ne reste', () => {
    expect(dropUnreferenced('L’accueil reste inégal. Deux personnes regrettent X [I0001, I0002].')).toEqual({
      text: 'Deux personnes regrettent X [I0001, I0002].',
      removed: 1,
    })
    expect(dropUnreferenced('Un texte sans aucun renvoi.')).toEqual({ text: 'Un texte sans aucun renvoi.', removed: 0 })
  })
})

describe('contrôles ajoutés à la certification B9', () => {
  const person = (id: string) => ({ I0001: 'P4', I0002: 'P7', I0003: 'P9' })[id]
  it('un compte vaut pour son passage, jusqu’à la voix suivante', () => {
    expect(clauseCounts('Deux personnes proposent de filmer [I0001], et une troisième de créer un lien [I0002].', person)).toEqual(['Deux personnes'])
    expect(clauseCounts('Deux personnes proposent : filmer [I0001], ou créer un lien [I0002].', person)).toEqual([])
    expect(clauseCounts('6 des 7 participants qui donnent un avis le critiquent [I0001].', person)).toEqual([])
  })
  it('« toutes les personnes » couvre chaque personne qui donne un avis', () => {
    expect(allClaims('Toutes les personnes qui en parlent le jugent tardif [I0001, I0002].', person, 3)).toEqual(['Toutes les personnes'])
    expect(allClaims('Toutes les personnes qui en parlent le jugent tardif [I0001, I0002, I0003].', person, 3)).toEqual([])
    // « Presque toutes » ne dit pas « toutes » (contrôlé comme un pluriel vague).
    expect(allClaims('Presque toutes les personnes qui en parlent le jugent tardif [I0001, I0002].', person, 3)).toEqual([])
  })
  it('les sujets qui divisent sont nommés une fois, par le code', () => {
    const g = (id: string, title: string, stance: string, opposed?: { a: string; b: string; about: string }[]) =>
      ({
        id,
        title,
        ideaIds: [],
        summary: '',
        opposed,
        metrics: { stance, positiveOnly: ['a', 'b'], negativeOnly: ['c', 'd'], mixed: [], participantsByCategory: {} },
      }) as unknown as Group
    const divided = { ...g('G1', 'Prise de décision', 'divided'), ideaIds: ['I0003', 'I0004', 'I0005'] }
    const ideas = new Map(
      (
        [
          ['I0003', 'suggestion'],
          ['I0004', 'negative'],
          ['I0005', 'positive'],
        ] as const
      ).map(([id, category]) => [id, { id, category } as Idea]),
    )
    const out = withDivided(
      'Ce qui a marché.\n\nCe qui a bloqué.\n\nCe que demandent les participants.',
      [divided, g('G2', 'Positionnement', 'consensus', [{ a: 'I0001', b: 'I0002', about: 'afficher ou non une étiquette' }])],
      'fr',
      false,
      ideas,
    )
    // Le mot de l'échelle, les chiffres et un renvoi par camp (positif d'abord) : la phrase du code se vérifie comme les autres.
    expect(out.split('\n\n')[1]).toBe(
      'Ce qui a bloqué. Les avis sont partagés sur « Prise de décision » : 2 positifs et 2 négatifs parmi les 4 participants qui en donnent un [I0005, I0004]. Deux propositions s’opposent sur « Positionnement » : afficher ou non une étiquette [I0001, I0002].'.replace(
        /’/g,
        "'",
      ),
    )
  })
  it('au-delà de trois sujets partagés, la phrase du code renvoie à « Ce qui divise »', () => {
    const g = (id: string, title: string) =>
      ({ id, title, ideaIds: [], summary: '', metrics: { stance: 'divided', positiveOnly: ['a', 'b'], negativeOnly: ['c', 'd'], mixed: [], participantsByCategory: {} } }) as unknown as Group
    const out = withDivided('A.\n\nB.', [g('G1', 'Un'), g('G2', 'Deux'), g('G3', 'Trois'), g('G4', 'Quatre'), g('G5', 'Cinq')])
    // À nombre égal, ordre alphabétique : Cinq, Deux, Quatre.
    expect(out).toContain('Ils le sont aussi sur « Quatre »')
    expect(out).not.toContain('« Trois »')
    expect(out.endsWith('Ils le sont encore sur 2 autres sujets (voir « Ce qui divise »).')).toBe(true)
  })
  it('un nombre en tête de phrase s’écrit en lettres', () => {
    expect(spellLeadingNumbers('3 personnes regrettent X. Puis 4 autres.\n\n2 personnes proposent Y.')).toBe(
      'Trois personnes regrettent X. Puis 4 autres.\n\nDeux personnes proposent Y.',
    )
  })
})

describe('phrases écrites par le code', () => {
  it('le rattrapage final ne répète pas « Les avis s’opposent » quand la relecture a reformulé les titres', () => {
    const g = { id: 'G1', title: 'Prise de décision', ideaIds: [], summary: '', metrics: { stance: 'divided', positiveOnly: ['a', 'b'], negativeOnly: ['c', 'd'], mixed: [], participantsByCategory: {} } } as unknown as Group
    const polished = "Ce qui a marché.\n\nCe qui a bloqué. Les avis s'opposent sur la prise de décision collective.\n\nLa suite."
    expect(withDivided(polished, [g], 'fr', true)).toBe(polished)
  })
})

describe('pluriels vagues', () => {
  const person = (id: string) => ({ I0129: 'P6', I0130: 'P6', I0010: 'P2', I0011: 'P3', I0012: 'P4' })[id]
  it("« d'autres » qui ne cite qu'une personne est signalé", () => {
    expect(vaguePlurals("Le manque d'implication a pesé, alors que d'autres ont salué l'engagement [I0130, I0129].", person)).toEqual(["d'autres"])
    expect(vaguePlurals('Certains saluent la bienveillance [I0010, I0011].', person)).toEqual([])
    expect(vaguePlurals('Plusieurs personnes regrettent [I0010, I0011].', person)).toEqual(['Plusieurs'])
    expect(vaguePlurals('Plusieurs personnes regrettent [I0010, I0011, I0012].', person)).toEqual([])
    // Ce qu'une personne rapporte n'est pas un compte : « reprises par d'autres », « a vu plusieurs personnes partir ».
    expect(vaguePlurals("Une personne décrit des tâches reprises par d'autres [I0129].", person)).toEqual([])
    expect(vaguePlurals('Une personne a vu plusieurs personnes motivées se désinvestir [I0129].', person)).toEqual([])
    // Une énumération après le pluriel compte tous ses renvois.
    expect(vaguePlurals("Trois l'apprécient [I0010], d'autres lui reprochent un flou [I0011] ou des lenteurs [I0012].", person)).toEqual([])
    // Résumé : la référence d'une ligne de liste vaut pour son motif.
    expect(vaguePlurals('Certains regrettent le calendrier [I0129].', person, () => 6)).toEqual([])
    // « Certains points » ne parle pas de personnes.
    expect(vaguePlurals('Une personne juge certains points flous [I0129].', person)).toEqual([])
    // Propos rapporté : « relève que certains colistiers… » ; mais « tandis que d'autres » oppose bien deux voix.
    expect(vaguePlurals("Une personne relève que certains colistiers n'étaient pas venus [I0129].", person)).toEqual([])
    expect(vaguePlurals("Trois l'apprécient [I0010, I0011, I0012], tandis que d'autres le critiquent [I0129].", person)).toEqual(["d'autres"])
    // « Presque toutes les personnes » : une large majorité, au moins trois personnes citées.
    expect(vaguePlurals('Presque toutes les personnes qui en parlent le saluent [I0010, I0011, I0012].', person)).toEqual([])
    expect(vaguePlurals('Presque toutes les personnes qui en parlent le saluent [I0010, I0011].', person)).toEqual(['Presque toutes'])
  })
})

describe('rapport', () => {
  it('échappe le HTML venant des participants', async () => {
    const corpus = surveyCorpus()
    corpus.contributions[0].text = 'Super <script>alert(1)</script> outil, vraiment bien.'
    const { state } = await runSim(corpus)
    const html = reportToHtml(state, corpus, 'Test <b>titre</b>')
    expect(html).not.toContain('<script>alert')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('Test &lt;b&gt;titre&lt;/b&gt;')
    const md = reportToMarkdown(state, corpus, 'Test')
    expect(md).toContain('## Méthode')
    // Les références d'idées ne paraissent pas dans un rapport à lire.
    expect(md).not.toMatch(/\[I\d{4}/)
    expect(html).not.toMatch(/\[I\d{4}/)
  })

  it('remplace les références par les participants cités, sans doublon', () => {
    const idea = (id: string, participantId: string) => ({ id, participantId, verbatim: `v ${id}` }) as Idea
    const byId = new Map([idea('I0001', 'P2'), idea('I0002', 'P2'), idea('I0003', 'P7')].map((i) => [i.id, i]))
    expect(refsToPeople('Deux personnes regrettent [I0001, I0002, I0003].', byId)).toBe('Deux personnes regrettent (P2, P7).')
    expect(refsToPeople('Inconnue [I0099].', byId)).toBe('Inconnue.')
    expect(refsToPeople('Lien [I0003].', byId, (who, i) => `<a href="#${i.id}">${who}</a>`)).toBe('Lien (<a href="#I0003">P7</a>).')
  })

  it('une case par participant : avis en couleur, les autres en blanc', () => {
    const m = { participants: 6, positiveOnly: ['a'], mixed: ['b'], negativeOnly: ['c', 'd'] } as unknown as Metrics
    expect(opinionSquares(m)).toBe('🟩🟨🟥🟥⬜⬜')
    expect(opinionSquares(m, 5)).toBe('')
  })

  it('« notamment » quand la phrase compte plus de personnes que les renvois, numéros triés', () => {
    const idea = (id: string, participantId: string) => ({ id, participantId, verbatim: 'v' }) as Idea
    const byId = new Map([idea('I0001', 'P12'), idea('I0002', 'P2')].map((i) => [i.id, i]))
    expect(refsToPeople('Pour 10 des 13 personnes, l’ambiance a tenu [I0001].', byId)).toBe('Pour 10 des 13 personnes, l’ambiance a tenu (notamment P12).')
    expect(refsToPeople('Deux personnes regrettent [I0001, I0002].', byId)).toBe('Deux personnes regrettent (P2, P12).')
    // Un nombre qui compte autre chose que les personnes, ou deux renvois d'une même phrase qui couvrent son compte : sans « notamment ».
    expect(refsToPeople('Une personne rapporte qu’au moins trois membres sont partis [I0001].', byId)).toBe(
      'Une personne rapporte qu’au moins trois membres sont partis (P12).',
    )
    expect(refsToPeople('Une autre dit avoir vu plusieurs personnes motivées partir [I0001].', byId)).toBe(
      'Une autre dit avoir vu plusieurs personnes motivées partir (P12).',
    )
    expect(refsToPeople('Plusieurs personnes regrettent le bruit [I0001].', byId)).toBe('Plusieurs personnes regrettent le bruit (notamment P12).')
    // « Toutes les personnes qui en parlent » : un exemple si le motif compte plus de personnes que les renvois.
    expect(refsToPeople('Toutes les personnes qui en parlent le saluent [I0001].', byId, undefined, () => 5)).toBe(
      'Toutes les personnes qui en parlent le saluent (notamment P12).',
    )
    expect(refsToPeople('Toutes les personnes qui en parlent le saluent [I0001, I0002].', byId, undefined, () => 2)).toBe(
      'Toutes les personnes qui en parlent le saluent (P2, P12).',
    )
    expect(refsToPeople('Une personne signale des tâches reprises par d’autres [I0001].', byId)).toBe(
      'Une personne signale des tâches reprises par d’autres (P12).',
    )
    expect(refsToPeople('Deux personnes proposent : décider ensemble [I0001], ou suivre une méthode [I0002].', byId)).toBe(
      'Deux personnes proposent : décider ensemble (P12), ou suivre une méthode (P2).',
    )
  })

  it('la question suit une réponse courte qui est toute la réponse, jamais un fragment', () => {
    const corpus = {
      sources: [{ id: 's', kind: 'survey', name: 'q' }],
      contributions: [
        { id: 'c1', sourceId: 's', participantId: 'P1', prompt: '⚠️ Qu’est-ce qui a moins bien marché ?', text: 'Tarifs' },
        {
          id: 'c2',
          sourceId: 's',
          participantId: 'P2',
          prompt: '✅ Qu’est-ce qui a bien marché ?',
          text: 'Le service client, mais pas assez de caisses ouvertes le samedi.',
        },
      ],
    } as unknown as Corpus
    const ctx = shortAnswerContext(corpus)
    const idea = (contributionId: string, verbatim: string, category: IdeaCategory) => ({ id: verbatim, contributionId, verbatim, category }) as Idea
    expect(ctx(idea('c1', 'Tarifs', 'negative'))).toBe('Qu’est-ce qui a moins bien marché ?')
    expect(ctx(idea('c2', 'pas assez de caisses ouvertes', 'negative'))).toBeUndefined()
    expect(ctx(idea('c1', 'Tarifs', 'suggestion'))).toBeUndefined()
    // Une seule fois par motif et par question.
    const ideas = [idea('c1', 'Tarifs', 'negative'), { ...idea('c1', 'Tarifs', 'negative'), id: 'autre' }]
    expect([...fullQuestionIds(ideas, ctx)]).toEqual(['Tarifs'])
  })
})

describe('projet', () => {
  it("s'exporte et se réimporte avec ses réponses", async () => {
    const project = newProject('Médiathèque')
    project.corpus = surveyCorpus()
    const text = exportProject(project, { k: 'v' })
    const back = importProject(text)
    expect(back.project.corpus).toEqual(project.corpus)
    expect(back.project.id).not.toBe(project.id)
    expect(back.responses).toEqual({ k: 'v' })
    expect(() => importProject('{"kind":"autre"}')).toThrow()
  })
})

describe('limites de débit', () => {
  it('réessaie une erreur temporaire, pas une clé refusée', async () => {
    let n = 0
    const flaky: LlmProvider = {
      label: 'x',
      fingerprint: { presetId: 'x', model: 'x', baseUrl: 'x' },
      async complete() {
        n++
        if (n < 3) throw new ProviderError('429', { status: 429, retryAfterMs: 1 })
        return { text: '{}' }
      },
    }
    const limited = withLimits(flaky, { requestsPerMinute: 6000, concurrency: 1, retries: 3, sleep: async () => {} })
    await expect(limited.complete({ task: 't', system: '', user: '', json: true, temperature: 0 })).resolves.toEqual({ text: '{}' })
    expect(n).toBe(3)

    const refused: LlmProvider = {
      ...flaky,
      async complete() {
        throw new ProviderError('401', { status: 401, fatal: true })
      },
    }
    const l2 = withLimits(refused, { requestsPerMinute: 6000, concurrency: 1, retries: 3, sleep: async () => {} })
    await expect(l2.complete({ task: 't', system: '', user: '', json: true, temperature: 0 })).rejects.toThrow('401')
  })
})
