import { describe, expect, it } from 'vitest'
import { PROVIDER_PRESETS } from './presets'

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
