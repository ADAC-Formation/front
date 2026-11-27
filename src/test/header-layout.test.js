// Garde-fous CSS de l'en-tête repliable (NOTES-35, D67). jsdom n'applique pas le CSS : on lit la feuille ;
// la géométrie réelle est vérifiée par le passage scripté consigné dans D67.
import { describe, expect, it } from 'vitest'
import { cssSheets, stripComments } from './css-sheets'

const sheet = stripComments(cssSheets['src/components/organisms/Header/Header.module.css'])

// Corps d'un bloc `@media (...) { ... }` (accolades équilibrées).
const mediaBlock = (condition) => {
  const start = sheet.search(new RegExp(String.raw`@media\s*\(${condition}\)\s*\{`))
  if (start < 0) return undefined
  let depth = 0
  for (let i = sheet.indexOf('{', start); i < sheet.length; i += 1) {
    if (sheet[i] === '{') depth += 1
    if (sheet[i] === '}' && --depth === 0) return sheet.slice(sheet.indexOf('{', start) + 1, i)
  }
  return undefined
}
const withoutMedia = sheet.replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '')
const headerRule = (css) => css.match(/\.header\s*\{([^}]*)\}/)?.[1] ?? ''

describe('Position de l’en-tête', () => {
  it('téléphone et tablette : en haut de la page, il défile avec elle (absolute)', () => {
    expect(headerRule(withoutMedia)).toMatch(/position:\s*absolute/)
  })

  it('ordinateur (≥ 1024 px) : fixé en haut à droite', () => {
    expect(headerRule(mediaBlock(String.raw`min-width:\s*1024px`) ?? '')).toMatch(/position:\s*fixed/)
  })

  it('le cadre de l’en-tête laisse passer les clics vers la page (seuls ses contrôles les captent)', () => {
    expect(headerRule(withoutMedia)).toMatch(/pointer-events:\s*none/)
  })
})

describe('Animation de la bulle', () => {
  it('aucune transition quand le système demande moins d’animations', () => {
    const reduced = mediaBlock(String.raw`prefers-reduced-motion:\s*reduce`)
    expect(reduced, 'bloc prefers-reduced-motion').toBeDefined()
    expect(reduced).toMatch(/transition:\s*none/)
  })
})
