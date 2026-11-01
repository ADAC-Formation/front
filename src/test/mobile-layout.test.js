import { describe, expect, it } from 'vitest'
import { cssSheets, rulesOf, stripComments } from './css-sheets'

// Garde-fous de la mise en page mobile (D61). jsdom n'applique pas le CSS : ces tests lisent les feuilles de style ;
// la géométrie réelle est vérifiée par le passage scripté consigné dans D61.
const sheet = (file) => stripComments(cssSheets[file])
const rulesIn = (file) => rulesOf(sheet(file))
const labelRules = (file) => rulesIn(file).filter(({ selector }) => /\.label\b/.test(selector))

describe('bouton de session (LoginButton)', () => {
  const file = 'src/components/atoms/LoginButton/LoginButton.module.css'

  it('ne supprime jamais le libellé avec display: none', () => {
    for (const { body } of labelRules(file)) expect(body).not.toMatch(/display:\s*none/)
  })

  it('masque le libellé « lecteur d’écran seulement » : absolu, 1 px, clip-path', () => {
    const hidden = labelRules(file).find(({ body }) => /position:\s*absolute/.test(body))
    expect(hidden, 'règle .label de masquage visuel').toBeDefined()
    expect(hidden.body).toMatch(/width:\s*1px/)
    expect(hidden.body).toMatch(/height:\s*1px/)
    expect(hidden.body).toMatch(/clip-path:/)
  })

  it('affiche le libellé à partir de 1100 px seulement', () => {
    const css = sheet(file)
    expect(css).toMatch(/@media\s*\(min-width:\s*1100px\)\s*\{[^@]*\.label/)
    expect(css).not.toMatch(/min-width:\s*800px/)
  })
})

describe('logo sous la rangée d’icônes sur téléphone', () => {
  it('index.css définit le jeton --header-row', () => {
    expect(sheet('src/index.css')).toMatch(/--header-row:\s*[\d.]+rem/)
  })

  it('Logo.module.css décale le logo sous --header-row sous 640 px', () => {
    const css = sheet('src/components/atoms/Logo/Logo.module.css')
    expect(css).toMatch(/@media\s*\(max-width:\s*639px\)\s*\{[^@]*\.logo[^{]*\{[^}]*top:\s*var\(--header-row\)/)
  })
})
