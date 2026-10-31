import { describe, expect, it } from 'vitest'
import { href, parseRoute } from './router'

describe('page Contact', () => {
  it('garde le retour vers une synthèse ou une étude de l’Observatoire', () => {
    for (const back of ['#/etude/abc/rapport', '#/observatoire/ecole-grand-debat-2019']) {
      expect(parseRoute(href({ name: 'contact', back }))).toEqual({ name: 'contact', back })
    }
  })

  it('sans étude d’origine, pas de retour', () => {
    expect(href({ name: 'contact' })).toBe('#/contact')
    expect(parseRoute('#/contact')).toEqual({ name: 'contact' })
  })

  it('refuse un retour qui ne mène pas à une étude', () => {
    for (const back of ['javascript:alert(1)', 'https://exemple.org', '#/', '#/contact']) {
      expect(parseRoute(href({ name: 'contact', back }))).toEqual({ name: 'contact' })
    }
  })
})
