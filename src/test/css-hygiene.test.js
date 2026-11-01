import { describe, expect, it } from 'vitest'
import { cssSheets, jsxSources, stripComments, rulesOf } from './css-sheets'

// Garde-fous lus dans les feuilles de style (analyse volontairement simple : pas de CSS imbriqué,
// ce que le projet n'utilise pas). Un cas non reconnu fait échouer le test plutôt que passer.
const GLOBAL_SHEET = 'src/index.css'

const definedIn = (css) => new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]))
const usedIn = (css) => [...css.matchAll(/var\(\s*(--[\w-]+)\s*(,|\))/g)].map((m) => ({ name: m[1], hasFallback: m[2] === ',' }))

describe('feuilles de style : variables', () => {
  it('toute variable utilisée est définie (jetons globaux, feuille elle-même ou style JSX)', () => {
    const globalTokens = definedIn(stripComments(cssSheets[GLOBAL_SHEET]))
    const inlineTokens = new Set(
      Object.values(jsxSources).flatMap((src) => [...src.matchAll(/['"](--[\w-]+)['"]\s*:/g)].map((m) => m[1])),
    )
    const violations = []
    for (const [file, raw] of Object.entries(cssSheets)) {
      const css = stripComments(raw)
      const local = definedIn(css)
      for (const { name, hasFallback } of usedIn(css)) {
        if (hasFallback || globalTokens.has(name) || local.has(name) || inlineTokens.has(name)) continue
        violations.push(`${file} : var(${name}) n'est définie nulle part`)
      }
    }
    expect(violations).toEqual([])
  })
})

describe('feuilles de style : couleurs', () => {
  it('aucune couleur hexadécimale en dur hors index.css (utiliser un jeton)', () => {
    const violations = []
    for (const [file, raw] of Object.entries(cssSheets)) {
      if (file === GLOBAL_SHEET) continue
      for (const [, hex] of stripComments(raw).matchAll(/(#[0-9a-fA-F]{3,8})\b/g)) {
        violations.push(`${file} : couleur ${hex} écrite en dur`)
      }
    }
    expect(violations).toEqual([])
  })
})

describe('feuilles de style : focus', () => {
  it('aucun `outline: none` sans indicateur de remplacement dans la même feuille', () => {
    const violations = []
    for (const [file, raw] of Object.entries(cssSheets)) {
      const rules = rulesOf(stripComments(raw))
      const hasReplacement = rules.some(
        ({ selector, body }) =>
          /:focus-visible|:focus-within/.test(selector) && /outline\s*:\s*(?!none)|box-shadow\s*:/.test(body),
      )
      for (const { selector, body } of rules) {
        if (/outline\s*:\s*none/.test(body) && !hasReplacement) {
          violations.push(`${file} : « ${selector.trim()} » supprime le contour sans remplacement`)
        }
      }
    }
    expect(violations).toEqual([])
  })
})
