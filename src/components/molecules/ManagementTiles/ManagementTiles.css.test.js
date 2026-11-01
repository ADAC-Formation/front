import { describe, expect, it } from 'vitest'
import { cssSheets, rulesOf, stripComments } from '../../../test/css-sheets'

const TILES = 'src/components/molecules/ManagementTiles/ManagementTiles.module.css'
const MENU = 'src/components/Pages/ManagementMenu/ManagementMenu.module.css'

const css = (file) => stripComments(cssSheets[file])
const rulesIn = (file) => rulesOf(css(file))
const find = (file, pattern) => rulesIn(file).find(({ selector }) => pattern.test(selector))
const mediaBlock = (file, condition) => {
  const start = css(file).indexOf(condition)
  if (start === -1) return ''
  // Le bloc va jusqu'à l'accolade fermante qui équilibre celle du @media.
  let depth = 0
  for (let i = css(file).indexOf('{', start); i < css(file).length; i += 1) {
    if (css(file)[i] === '{') depth += 1
    if (css(file)[i] === '}') depth -= 1
    if (depth === 0) return css(file).slice(start, i + 1)
  }
  return ''
}

describe('tuiles de gestion : actions accessibles au clavier', () => {
  it('les actions apparaissent aussi quand un lien de la tuile a le focus', () => {
    const actions = find(TILES, /\.tile:focus-within\s+\.actions/)
    expect(actions, '.tile:focus-within .actions').toBeDefined()
    expect(actions.body).toMatch(/opacity:\s*1/)
  })

  it('le titre cède la place aux actions au focus, comme au survol', () => {
    expect(find(TILES, /\.tile:focus-within\s+\.title/), '.tile:focus-within .title').toBeDefined()
    expect(find(TILES, /\.tile:focus-within::after/), '.tile:focus-within::after').toBeDefined()
  })

  it('le lien focalisé a un contour blanc visible sur la couleur de la tuile', () => {
    const rule = find(TILES, /\.action:focus-visible/)
    expect(rule, '.action:focus-visible').toBeDefined()
    expect(rule.body).toMatch(/outline:\s*3px\s+solid\s+var\(--color-white\)/)
  })
})

describe('tuiles de gestion : position des actions', () => {
  it('les actions sont descendues sous le centre de la tuile', () => {
    const rule = find(TILES, /^\s*\.actions\s*$/)
    expect(rule.body).toMatch(/padding-top:\s*calc\(32px\s*\+\s*3rem\)/)
  })

  it('sur petit écran, elles reprennent un remplissage normal pour tenir dans la tuile', () => {
    const block = mediaBlock(TILES, '@media (max-width: 700px)')
    expect(block).toMatch(/\.actions\s*\{[^}]*padding:\s*24px/)
  })
})

describe('tuiles de gestion : écrans tactiles et petits écrans', () => {
  it('sans survol possible, les actions sont toujours visibles dans la tuile', () => {
    const block = mediaBlock(TILES, '@media (hover: none)')
    expect(block, '@media (hover: none)').not.toBe('')
    expect(block).toMatch(/\.actions\s*\{[^}]*position:\s*static/)
    expect(block).toMatch(/\.actions\s*\{[^}]*opacity:\s*1/)
  })

  it('la tuile est moins haute sur petit écran', () => {
    const block = mediaBlock(TILES, '@media (max-width: 700px)')
    expect(block, '@media (max-width: 700px)').not.toBe('')
    expect(block).toMatch(/\.tile\s*\{[^}]*height:/)
  })

  it("la grille des tuiles s'adapte à la largeur (pas de 3 colonnes fixes)", () => {
    const rule = find(MENU, /\.tileContainer/)
    expect(rule.body).toMatch(/auto-fit/)
    expect(rule.body).toMatch(/minmax\(/)
    expect(rule.body).not.toMatch(/repeat\(\s*3/)
  })
})
