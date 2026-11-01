import { describe, expect, it } from 'vitest'
import { cssSheets, rulesOf, stripComments } from './css-sheets'

const rulesIn = (file) => rulesOf(stripComments(cssSheets[file]))
const find = (rules, selectorPattern) => rules.find(({ selector }) => selectorPattern.test(selector))

describe('focus clavier visible', () => {
  it('index.css pose un anneau global :focus-visible de 2 px aux couleurs de --ring', () => {
    const rule = find(rulesIn('src/index.css'), /^\s*:focus-visible\s*$/)
    expect(rule, 'règle :focus-visible dans index.css').toBeDefined()
    expect(rule.body).toMatch(/outline:\s*2px\s+solid\s+var\(--ring\)/)
    expect(rule.body).toMatch(/outline-offset:\s*2px/)
  })

  it.each([
    'src/features/formations/pages/FormationPages.module.css',
    'src/features/accounts/pages/AccountPages.module.css',
  ])('le conteneur de recherche de %s reçoit l’anneau via :focus-within', (file) => {
    const rule = find(rulesIn(file), /\.searchContainer:focus-within/)
    expect(rule, `.searchContainer:focus-within dans ${file}`).toBeDefined()
    expect(rule.body).toMatch(/outline:\s*2px\s+solid\s+var\(--ring\)/)
  })
})
