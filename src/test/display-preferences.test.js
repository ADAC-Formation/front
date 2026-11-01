import { describe, expect, it } from 'vitest'
import { cssSheets, jsxSources, rulesOf, stripComments } from './css-sheets'

const indexRules = rulesOf(stripComments(cssSheets['src/index.css']))
const bodyOf = (selector) => indexRules.find((rule) => rule.selector.trim() === selector)?.body

// Valeur hexadécimale d'une variable dans un corps de règle.
const hexToken = (body, name) => body?.match(new RegExp(String.raw`${name}\s*:\s*(#[0-9a-fA-F]{6})`))?.[1]

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

describe('Taille du texte', () => {
  it.each([['1', '112.5%'], ['2', '125%'], ['3', '150%']])(
    'html.text-step-%s porte la taille de base à %s',
    (step, size) => {
      expect(bodyOf(`html.text-step-${step}`)).toContain(`font-size: ${size}`)
    },
  )

  it('aucune taille de police en pixels (tout suit la taille de base)', () => {
    const violations = []
    for (const [file, css] of Object.entries(cssSheets)) {
      for (const [declaration] of stripComments(css).matchAll(/font-size:\s*[0-9.]+px/g)) {
        violations.push(`${file} : ${declaration}`)
      }
    }
    expect(violations).toEqual([])
  })
})

describe.each([
  ['html.high-contrast', 'clair'],
  ['html.dark.high-contrast', 'sombre'],
])('Contraste élevé (%s, mode %s)', (selector) => {
  const body = bodyOf(selector)
  const token = (name) => hexToken(body, name)

  it('définit les jetons de texte, de bordure et de focus en hexadécimal', () => {
    for (const name of ['--background', '--foreground', '--muted-foreground', '--border', '--ring']) {
      expect(token(name), `${name} dans ${selector}`).toBeDefined()
    }
  })

  it('texte et texte atténué atteignent 7:1 sur le fond', () => {
    expect(contrast(token('--foreground'), token('--background'))).toBeGreaterThanOrEqual(7)
    expect(contrast(token('--muted-foreground'), token('--background'))).toBeGreaterThanOrEqual(7)
  })

  it('bordures et anneau de focus atteignent 3:1 sur le fond', () => {
    expect(contrast(token('--border'), token('--background'))).toBeGreaterThanOrEqual(3)
    expect(contrast(token('--ring'), token('--background'))).toBeGreaterThanOrEqual(3)
  })
})

// Les couleurs de catégories ne passent pas 7:1 : en contraste élevé le texte prend --foreground,
// la couleur reste portée par la barre et le point (constaté au passage manuel : 1,44:1 à 4,28:1).
describe('Contraste élevé : étiquettes de catégorie', () => {
  it.each([
    'src/components/molecules/ListItem/ListItem.module.css',
    'src/components/Pages/FormationDetails/FormationDetails.module.css',
  ])('le texte de .category prend --foreground dans %s', (file) => {
    const rule = rulesOf(stripComments(cssSheets[file])).find(
      ({ selector }) => /high-contrast/.test(selector) && /\.category/.test(selector),
    )
    expect(rule, `règle high-contrast .category dans ${file}`).toBeDefined()
    expect(rule.body).toMatch(/color:\s*var\(--foreground\)/)
  })

  it('ListItem ne fixe pas la couleur du texte en ligne (une feuille ne pourrait pas la remplacer)', () => {
    expect(jsxSources['src/components/molecules/ListItem/ListItem.jsx']).not.toMatch(/style=\{\{\s*color:/)
  })
})

describe('Options du menu Accessibilité (D60)', () => {
  it.each([
    ['html.grayscale', /filter:\s*grayscale\(1\)/],
    ['html.negative-contrast', /filter:\s*invert\(1\)/],
    ['html.readable-font', /--font-sans:/],
  ])('%s a une règle effective', (selector, expected) => {
    expect(bodyOf(selector)).toMatch(expected)
  })

  it('html.underline-links souligne les liens', () => {
    expect(bodyOf('html.underline-links a')).toMatch(/text-decoration:\s*underline/)
  })

  it('html.light-background impose un fond clair, aussi en mode sombre', () => {
    const rule = indexRules.find(({ selector }) => selector.includes('html.dark.light-background'))
    expect(rule?.selector).toContain('html.light-background')
    expect(rule?.body).toMatch(/--background:/)
  })
})
