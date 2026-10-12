import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { computeMetrics } from './analysis/metrics'
import { allowedNumbers, unverifiedNumbers } from './analysis/numbers'
import { acceptRewrite, describeMetrics, describeTheme, groupTarget, newAnalysis, runAnalysis, sanitizeCitations } from './analysis/pipeline'
import { reportToHtml, reportToMarkdown } from './analysis/report'
import { MemoryCache } from './analysis/runner'
import { DEFAULT_SETTINGS, type AnalysisState, type Idea } from './analysis/types'
import { locateVerbatim } from './analysis/verbatim'
import { activeParticipants, type Corpus } from './corpus'
import { analyzeCsv, csvToCorpus, type ColumnRole } from './import/csv'
import { detectSpeakers, textToCorpus } from './import/text'
import { exportProject, importProject, newProject } from './project'
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
  it('vise des groupes fins, sans émietter les gros corpus', () => {
    // 36 libellés : l'ancienne cible (2 à 6 groupes) forçait le mélange de sujets.
    expect(groupTarget(36)).toEqual({ min: 6, max: 18 })
    expect(groupTarget(5)).toEqual({ min: 3, max: 7 })
    // Le nombre de groupes croît moins vite que les idées (saturation des motifs).
    expect(groupTarget(300)).toEqual({ min: 17, max: 52 })
  })

  it("ne calcule ni consensus ni désaccord sur un thème, qui réunit des objets différents", () => {
    const a = computeMetrics(['P1', 'P2'].map((p, k) => idea(`I000${k}`, p, 'positive')))
    const b = computeMetrics(['P3', 'P4', 'P5'].map((p, k) => idea(`I001${k}`, p, 'negative')))
    const theme = computeMetrics(
      [...['P1', 'P2'].map((p, k) => idea(`I000${k}`, p, 'positive')), ...['P3', 'P4', 'P5'].map((p, k) => idea(`I001${k}`, p, 'negative'))],
    )
    const text = describeTheme({ metrics: theme }, [{ metrics: a }, { metrics: b }])
    expect(text).not.toMatch(/consensus|partagés|peu d'avis/)
    expect(text).toContain('2 sujets')
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
    expect(m.stance).toBe('consensus')
    expect(m.majority).toBe('negative')
  })

  it("les suggestions ne sont pas une polarité", () => {
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
    expect(text).toBe('5 participants (5 occurrences) ; avis : 4 positifs, 1 négatif ; consensus positif : 4 sur 5')
    expect(text).not.toMatch(/\(s\)|: 0|%/)
  })
})

describe('contrôle des chiffres des synthèses', () => {
  it('signale un nombre, en chiffres ou en lettres, qui ne vient ni du calcul ni des citations', () => {
    const ideas = ['P1', 'P2', 'P3', 'P4', 'P5'].map((p, k) => idea(`I000${k}`, p, k < 4 ? 'positive' : 'negative'))
    const ok = allowedNumbers([computeMetrics(ideas)], ['On était 12 bénévoles en 2020'])
    expect(unverifiedNumbers('Quatre personnes sur cinq apprécient [I0001]. Une personne regrette [I0004].', ok)).toEqual([])
    expect(unverifiedNumbers('Les 12 bénévoles de 2020 sont cités.', ok)).toEqual([])
    expect(unverifiedNumbers('Sept personnes apprécient, soit 64 %.', ok)).toEqual(['64', 'Sept personnes'])
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
