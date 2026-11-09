import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { applyDesignVariant } from './designVariant'

const root = () => document.documentElement

beforeEach(() => sessionStorage.clear())
afterEach(() => root().classList.remove('design-site'))

describe('applyDesignVariant', () => {
  it('ne change rien sans paramètre', async () => {
    expect(await applyDesignVariant('')).toBe('default')
    expect(root().classList.contains('design-site')).toBe(false)
  })

  it('?design=site ajoute la classe design-site à <html>', async () => {
    expect(await applyDesignVariant('?design=site')).toBe('site')
    expect(root().classList.contains('design-site')).toBe(true)
  })

  it('garde le choix le temps de la session (navigation sans paramètre)', async () => {
    await applyDesignVariant('?design=site')
    root().classList.remove('design-site')
    expect(await applyDesignVariant('')).toBe('site')
    expect(root().classList.contains('design-site')).toBe(true)
  })

  it('?design=default revient au design du portail', async () => {
    await applyDesignVariant('?design=site')
    expect(await applyDesignVariant('?design=default')).toBe('default')
    expect(root().classList.contains('design-site')).toBe(false)
    expect(await applyDesignVariant('')).toBe('default')
  })

  it('ignore une valeur inconnue', async () => {
    expect(await applyDesignVariant('?design=n-importe-quoi')).toBe('default')
    expect(root().classList.contains('design-site')).toBe(false)
  })

  it('fonctionne sans stockage de session', async () => {
    const original = Object.getOwnPropertyDescriptor(window, 'sessionStorage')
    Object.defineProperty(window, 'sessionStorage', { get() { throw new Error('bloqué') }, configurable: true })
    try {
      expect(await applyDesignVariant('?design=site')).toBe('site')
    } finally {
      Object.defineProperty(window, 'sessionStorage', original)
    }
  })
})
