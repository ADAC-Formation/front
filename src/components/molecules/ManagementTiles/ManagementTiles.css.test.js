import { describe, expect, it } from 'vitest'
import { cssSheets, rulesOf, stripComments } from '../../../test/css-sheets'

const TILES = 'src/components/molecules/ManagementTiles/ManagementTiles.module.css'

const css = (file) => stripComments(cssSheets[file])
const rulesIn = (file) => rulesOf(css(file))
const find = (file, pattern) => rulesIn(file).find(({ selector }) => pattern.test(selector))

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
