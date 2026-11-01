import { describe, expect, it } from 'vitest'
import { blendSpeed, estimateDuration, observedSecondsPerCall, predictedCalls } from '../analysis/estimate'
import { BLIND_THRESHOLD, PROVIDER_PRESETS, modelProposed, modelStudy, presetStudy, typicalSecondsPerCall } from './presets'

describe('fiches des fournisseurs', () => {
  it('le modèle par défaut est le seul recommandé de sa liste expliquée', () => {
    for (const p of PROVIDER_PRESETS.filter((x) => x.models?.length)) {
      const recommended = p.models!.filter((m) => m.recommended)
      expect(recommended.map((m) => m.id), p.id).toEqual([p.defaultModel])
      expect(new Set(p.models!.map((m) => m.id)).size, p.id).toBe(p.models!.length)
      for (const m of p.models!) expect(m.hint, `${p.id} ${m.id}`).not.toBe('')
    }
  })

  it('le modèle par défaut figure parmi les suggestions', () => {
    for (const p of PROVIDER_PRESETS.filter((x) => x.defaultModel)) expect(p.suggestedModels, p.id).toContain(p.defaultModel)
  })
})

describe('erreurs du fournisseur', () => {
  it('un modèle hors de l’offre est dit comme tel, pas comme une clé refusée', async () => {
    const { createOpenAiCompatibleProvider } = await import('./openai-compatible')
    const provider = createOpenAiCompatibleProvider({
      presetId: 'mistral',
      label: 'Mistral AI',
      baseUrl: 'https://exemple.test/v1',
      apiKey: 'cle-de-test',
      model: 'gros-modele',
      supportsJsonMode: false,
      fetchImpl: async () =>
        new Response(JSON.stringify({ message: 'This model is not available in your subscription tier', type: 'tier_not_allowed' }), { status: 403 }),
    })
    await expect(provider.complete({ task: 'ping', system: '', user: '', json: false, temperature: 0 })).rejects.toThrow(/ne donne pas accès au modèle « gros-modele »/)
  })
})

describe('quota du jour', () => {
  it('reconnu même quand la réponse d’erreur est longue, comme chez Gemini', async () => {
    const { createOpenAiCompatibleProvider } = await import('./openai-compatible')
    const provider = createOpenAiCompatibleProvider({
      presetId: 'gemini',
      label: 'Google Gemini',
      baseUrl: 'https://exemple.test/v1',
      apiKey: 'cle-de-test',
      model: 'modele',
      supportsJsonMode: false,
      fetchImpl: async () => new Response(`${'x'.repeat(500)} Generate content requests per day limit exceeded`, { status: 429 }),
    })
    await expect(provider.complete({ task: 'test', system: '', user: '', json: false, temperature: 0 })).rejects.toMatchObject({
      fatal: true,
      message: expect.stringContaining('quota du jour'),
    })
  })
})

describe('réponses emballées des modèles légers', () => {
  it('un résumé renvoyé en objet ou en liste de phrases est lu comme un texte', async () => {
    const { groupSummarySchema, globalSchema } = await import('../analysis/prompts')
    const parsed = groupSummarySchema.parse({
      groups: [
        { id: 'g1', summary: { text: 'Le tri des déchets plaît.' } },
        { id: 'g2', summary: ['Première phrase.', 'Seconde phrase.'] },
      ],
    })
    expect(parsed.groups.map((g) => g.summary)).toEqual(['Le tri des déchets plaît.', 'Première phrase. Seconde phrase.'])
    expect(() => globalSchema.parse({ summary: {} })).toThrow()
  })

  it('une piste opposée mal formée est ignorée, le reste de la réponse est gardé', async () => {
    const { groupSummarySchema } = await import('../analysis/prompts')
    const parsed = groupSummarySchema.parse({
      groups: [{ id: 'g1', summary: 'Texte.', opposed: [{ a: { id: 'I1' }, b: 'I2', about: 'x' }, { a: 'I3', b: 'I4', about: 'y' }] }],
    })
    expect(parsed.groups[0].opposed).toEqual([{ a: 'I3', b: 'I4', about: 'y' }])
  })
})

describe('réponse coupée', () => {
  it('une réponse coupée par la limite de longueur est signalée, sans nouvelle tentative', async () => {
    const { createOpenAiCompatibleProvider } = await import('./openai-compatible')
    const provider = createOpenAiCompatibleProvider({
      presetId: 'mistral',
      label: 'Mistral AI',
      baseUrl: 'https://exemple.test/v1',
      model: 'petit-modele',
      supportsJsonMode: false,
      fetchImpl: async () => new Response(JSON.stringify({ choices: [{ message: { content: '{"groups": [' }, finish_reason: 'length' }] }), { status: 200 }),
    })
    const err = await provider.complete({ task: 'groupe', system: '', user: '', json: true, temperature: 0 }).catch((e) => e)
    expect(err.message).toMatch(/a coupé sa réponse/)
    expect(err.fatal).toBe(true)
  })
})

describe('limites de l’offre', () => {
  const provider = async (status: number, message: string) => {
    const { createOpenAiCompatibleProvider } = await import('./openai-compatible')
    return createOpenAiCompatibleProvider({
      presetId: 'groq',
      label: 'Groq',
      baseUrl: 'https://exemple.test/v1',
      model: 'm',
      supportsJsonMode: false,
      fetchImpl: async () => new Response(JSON.stringify({ error: { message } }), { status }),
    })
  }
  const req = { task: 't', system: '', user: '', json: false, temperature: 0 }
  it('une demande trop longue (413) est dite comme telle, sans nouvelle tentative', async () => {
    const err = await (await provider(413, 'Request too large on tokens per minute (TPM)')).complete(req).catch((e) => e)
    expect(err.message).toMatch(/trop longue pour votre offre/)
    expect(err.fatal).toBe(true)
  })
  it('un quota du jour épuisé invite à reprendre demain, sans nouvelle tentative', async () => {
    const err = await (await provider(429, 'Rate limit reached on tokens per day (TPD)')).complete(req).catch((e) => e)
    expect(err.message).toMatch(/Reprenez demain/)
    expect(err.fatal).toBe(true)
  })
})

describe('plafond de jetons par demande', () => {
  it('la réponse réservée est ce qui reste du plafond, jamais moins de 800', async () => {
    const { createOpenAiCompatibleProvider } = await import('./openai-compatible')
    const sent: number[] = []
    const provider = createOpenAiCompatibleProvider({
      presetId: 'groq',
      label: 'Groq',
      baseUrl: 'https://exemple.test/v1',
      model: 'm',
      supportsJsonMode: false,
      maxOutputTokens: 4000,
      tokenBudget: 8000,
      fetchImpl: async (_url, init) => {
        sent.push(JSON.parse(String(init?.body)).max_tokens)
        return new Response(JSON.stringify({ choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }] }))
      },
    })
    const req = (user: string) => ({ task: 't', system: '', user, json: false, temperature: 0 })
    await provider.complete(req('court'))
    await provider.complete(req('x'.repeat(15_000)))
    await provider.complete(req('x'.repeat(30_000)))
    expect(sent).toEqual([4000, 8000 - 5000 - 150, 800])
  })
})

describe('où tourne un moteur', () => {
  it('seule une adresse locale compte comme « sur votre ordinateur »', async () => {
    const { runsLocally } = await import('./location')
    for (const u of ['http://localhost:11434/v1', 'http://127.0.0.1:1234/v1', 'http://[::1]:8080/v1', 'local']) expect(runsLocally(u), u).toBe(true)
    for (const u of ['https://api.mistral.ai/v1', 'http://192.168.1.20:11434/v1', 'https://localhost.example.com/v1', 'pas une adresse'])
      expect(runsLocally(u), u).toBe(false)
  })
})

describe('méthode des modèles installés', () => {
  it('une nouvelle synthèse suit la méthode commune, avec le réglage de la famille du modèle s’il en a un', async () => {
    const { methodForModel } = await import('./presets')
    expect(methodForModel('ollama', 'gpt-oss:20b-32k')).toBe('commune-gptoss')
    expect(methodForModel('ollama', 'gemma4:12b')).toBe('commune-gemma')
    expect(methodForModel('ollama', 'llama3.1:8b')).toBe('commune')
    expect(methodForModel('mistral', 'ministral-14b-2512')).toBe('commune-ministral')
    expect(methodForModel('anthropic', 'claude-opus-5-5')).toBe('commune')
  })
})

describe('seuil de qualité : un moteur est validé ou à l’étude, jamais entre les deux', () => {
  it('un modèle validé a une note au moins égale au seuil, et rien d’autre n’est proposé sans raison', () => {
    for (const p of PROVIDER_PRESETS) {
      for (const m of p.models ?? []) {
        expect(modelProposed(m) !== Boolean(modelStudy(p.id, m.id)), `${p.id} ${m.id}`).toBe(true)
      }
      if (presetStudy(p)) expect(presetStudy(p)!.length, p.id).toBeGreaterThan(20)
    }
  })

  it('aujourd’hui : Gemini 3.5 Flash-Lite et Claude Sonnet validés ; Mistral, Groq et les moteurs locaux à l’étude', () => {
    expect(modelStudy('gemini', 'gemini-3.5-flash-lite')).toBeUndefined()
    expect(modelStudy('anthropic', 'claude-sonnet-5-5')).toBeUndefined()
    expect(modelStudy('gemini', 'gemini-3.8-flash')).toMatch(/pas encore évalué/)
    expect(modelStudy('anthropic', 'claude-opus-5-5')).toBeUndefined()
    expect(modelStudy('mistral', 'ministral-14b-2512')).toMatch(/sous le niveau/i)
    expect(modelStudy('anthropic', 'claude-haiku-5-5')).toBeUndefined()
    const choice = (preset: string, id: string) => PROVIDER_PRESETS.find((p) => p.id === preset)!.models!.find((m) => m.id === id)!
    expect(choice('gemini', 'gemini-3.5-flash-lite').blindTest!.scores).toEqual([BLIND_THRESHOLD, BLIND_THRESHOLD])
    expect(modelProposed(choice('mistral', 'ministral-14b-2512'))).toBe(false)
    // Au niveau de Gemini, mais une synthèse prend plus d'une heure : pénible à utiliser, donc pas proposé.
    expect(modelProposed(choice('mistral', 'mistral-large-4'))).toBe(false)
    expect(modelStudy('mistral', 'mistral-large-4')).toMatch(/plus d’une heure/)
    expect(modelStudy('ollama', 'gemma4:12b')).toMatch(/24 Go/)
    expect(modelStudy('openai', 'gpt-5')).toMatch(/Pas encore évalué/)
    const study = (id: string) => presetStudy(PROVIDER_PRESETS.find((p) => p.id === id)!)
    expect(study('gemini')).toBeUndefined()
    for (const id of ['mistral', 'groq', 'ollama', 'lmstudio', 'cohere', 'custom']) expect(study(id), id).toBeDefined()
  })
})

describe('durée estimée d’une synthèse', () => {
  it('prévoit le nombre de demandes d’ÉcoSol (20 participants, 90 réponses : 44 à 54 mesurées)', () => {
    expect(predictedCalls(20, 90)).toBeGreaterThanOrEqual(44)
    expect(predictedCalls(20, 90)).toBeLessThanOrEqual(56)
  })

  it('préfère la vitesse mesurée, puis celle de référence, puis une estimation grossière ; le débit autorisé reste un plancher', () => {
    expect(estimateDuration(50, { measured: 6, reference: 5, requestsPerMinute: 60, concurrency: 2 })).toEqual({ calls: 50, seconds: 300, basis: 'measured' })
    expect(estimateDuration(50, { reference: 5, requestsPerMinute: 60, concurrency: 2 }).basis).toBe('reference')
    expect(estimateDuration(50, { requestsPerMinute: 60, concurrency: 2 })).toEqual({ calls: 50, seconds: 500, basis: 'rough' })
    // Groq : 3 demandes par minute, plus lent que la vitesse de réponse.
    expect(estimateDuration(50, { reference: 5, requestsPerMinute: 3, concurrency: 1 }).seconds).toBeCloseTo(1000)
  })

  it('mesure la vitesse sur les seules demandes envoyées, et lisse sur les dernières synthèses', () => {
    expect(observedSecondsPerCall(300_000, 60)).toBe(5)
    expect(observedSecondsPerCall(300_000, 3)).toBeUndefined()
    expect(blendSpeed(undefined, 5)).toEqual({ secondsPerCall: 5, runs: 1 })
    expect(blendSpeed({ secondsPerCall: 5, runs: 1 }, 7)).toEqual({ secondsPerCall: 6, runs: 2 })
    expect(blendSpeed({ secondsPerCall: 10, runs: 9 }, 5).runs).toBe(5)
  })

  it('connaît la vitesse de référence des modèles mesurés sur un corpus réel', () => {
    expect(typicalSecondsPerCall('gemini', 'gemini-3.5-flash-lite')).toBe(5)
    expect(typicalSecondsPerCall('ollama', 'gemma4:12b-32k')).toBe(50)
    expect(typicalSecondsPerCall('openai', 'gpt-5')).toBeUndefined()
  })
})
