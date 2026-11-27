// NOTES-15 : libellés de formulaire lisibles (gris assez foncé) et détachés de leur champ.
import { describe, expect, it } from 'vitest'
import { cssSheets, rulesOf, stripComments } from './css-sheets'

const indexRules = rulesOf(stripComments(cssSheets['src/index.css']))
const bodyOf = (selector) => indexRules.find((rule) => rule.selector.trim() === selector)?.body

// Couleur `oklch(L C h)` d'une variable, en luminance relative WCAG (OKLab → sRGB linéaire).
const oklchToken = (body, name) => {
  const match = body?.match(new RegExp(String.raw`${name}\s*:\s*oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)`))
  return match?.slice(1).map(Number)
}
const luminance = ([L, C, h]) => {
  const a = C * Math.cos((h * Math.PI) / 180)
  const b = C * Math.sin((h * Math.PI) / 180)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  const [r, g, bl] = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((channel) => Math.min(1, Math.max(0, channel)))
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl
}
const contrast = (x, y) => {
  const [light, dark] = [luminance(x), luminance(y)].sort((p, q) => q - p)
  return (light + 0.05) / (dark + 0.05)
}

describe.each([':root', '.dark'])('Texte atténué (%s) : WCAG AA, 4.5:1', (selector) => {
  const token = (name) => oklchToken(bodyOf(selector), name)

  it.each(['--background', '--card', '--muted'])('--muted-foreground atteint 4.5:1 sur %s', (surface) => {
    expect(token('--muted-foreground'), `--muted-foreground dans ${selector}`).toBeDefined()
    expect(token(surface), `${surface} dans ${selector}`).toBeDefined()
    expect(contrast(token('--muted-foreground'), token(surface))).toBeGreaterThanOrEqual(4.5)
  })
})

describe('Espace entre un libellé et son champ', () => {
  it(':root définit --label-gap d’au moins 0.5rem', () => {
    const gap = bodyOf(':root')?.match(/--label-gap:\s*([\d.]+)rem/)?.[1]
    expect(Number(gap)).toBeGreaterThanOrEqual(0.5)
  })

  it.each([
    ['src/components/molecules/FormField/FormField.module.css', '.field'],
    ['src/features/messagerie/components/GroupFilters.module.css', '.field'],
    ['src/components/molecules/CheckboxPicker/CheckboxPicker.module.css', '.search'],
  ])('%s %s espace libellé et champ avec --label-gap', (file, selector) => {
    const rule = rulesOf(stripComments(cssSheets[file])).find((r) => r.selector.trim() === selector)
    expect(rule?.body).toMatch(/gap:\s*var\(--label-gap\)/)
  })
})
