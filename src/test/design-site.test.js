import { describe, expect, it } from 'vitest'
import { cssSheets, rulesOf, stripComments } from './css-sheets'

// Design alternatif « couleurs et polices du site de l'ADAC » (docs/design/design-site.md) : activé par
// ?design=site, il ne redéfinit que des jetons, sous `html.design-site`.
const css = stripComments(cssSheets['src/design/design-site.css'] ?? '').replace(/@import[^;]+;/g, '')
const rules = rulesOf(css)
const bodyOf = (selector) => rules.find((rule) => rule.selector.trim() === selector)?.body ?? ''
const token = (body, name) => body.match(new RegExp(String.raw`${name}\s*:\s*(#[0-9a-fA-F]{6})`))?.[1]

const channel = (value) => {
  const c = value / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}
const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => channel(parseInt(hex.slice(i, i + 2), 16)))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a, b) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

describe('design-site.css', () => {
  const light = bodyOf('html.design-site:not(.high-contrast)')
  const fonts = bodyOf('html.design-site:not(.readable-font)')

  it('reprend les polices du site : Lato pour les titres, Manrope pour le texte', () => {
    expect(fonts).toMatch(/--font-display:\s*"Lato"/)
    expect(fonts).toMatch(/--font-sans:\s*"Manrope Variable"/)
  })

  it('reprend les couleurs du site (rouge #cc3d34, texte #656b6f, fond blanc)', () => {
    expect(token(light, '--color-red')).toBe('#cc3d34')
    expect(token(light, '--foreground')).toBe('#656b6f')
    expect(token(light, '--background')).toBe('#ffffff')
  })

  it('auto-héberge ses polices (D31) : paquets @fontsource, aucun Google Fonts', () => {
    const raw = cssSheets['src/design/design-site.css']
    expect(raw).toMatch(/@import "@fontsource\/lato\//)
    expect(raw).toMatch(/@import "@fontsource-variable\/manrope\//)
    expect(raw).not.toMatch(/googleapis|gstatic/)
  })

  it('texte et action atteignent 4,5:1 (WCAG AA)', () => {
    expect(contrast(token(light, '--foreground'), token(light, '--background'))).toBeGreaterThanOrEqual(4.5)
    expect(contrast(token(light, '--color-yellow'), token(light, '--color-on-yellow'))).toBeGreaterThanOrEqual(4.5)
    expect(contrast(token(light, '--color-action'), token(light, '--color-on-action'))).toBeGreaterThanOrEqual(4.5)
  })

  it('tous les sélecteurs sont sous html.design-site', () => {
    const selectors = rules.map((rule) => rule.selector.trim())
    expect(selectors.length).toBeGreaterThan(0)
    expect(selectors.filter((selector) => !selector.startsWith('html.design-site'))).toEqual([])
  })

  it('laisse les options d’accessibilité l’emporter (contraste élevé, police lisible)', () => {
    const selectors = rules.map((rule) => rule.selector.trim())
    expect(selectors.every((selector) => selector.includes(':not(.high-contrast)') || selector.includes(':not(.readable-font)'))).toBe(true)
    expect(css).not.toMatch(/!important/)
  })
})
