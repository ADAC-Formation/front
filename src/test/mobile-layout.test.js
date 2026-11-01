import { existsSync, statSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { cssSheets, jsxSources, rulesOf, stripComments } from './css-sheets'

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

  it('affiche le libellé à partir de 1150 px seulement', () => {
    const css = sheet(file)
    expect(css).toMatch(/@media\s*\(min-width:\s*1150px\)\s*\{[^@]*\.label/)
    expect(css).not.toMatch(/min-width:\s*800px/)
  })
})

describe('logo sous la rangée d’icônes sur téléphone', () => {
  it('index.css définit le jeton --header-row', () => {
    expect(sheet('src/index.css')).toMatch(/--header-row:\s*[\d.]+rem/)
  })

  it('Logo.module.css décale le logo sous --header-row sous 768 px', () => {
    const css = sheet('src/components/atoms/Logo/Logo.module.css')
    expect(css).toMatch(/@media\s*\(max-width:\s*767px\)\s*\{[^@]*\.logo[^{]*\{[^}]*top:\s*var\(--header-row\)/)
  })
})

describe('taille du logo', () => {
  const css = () => sheet('src/components/atoms/Logo/Logo.module.css')

  it('prend presque toute la largeur sur téléphone (plafond 420 px pour rester sous --page-top)', () => {
    expect(css()).toMatch(/@media\s*\(max-width:\s*767px\)\s*\{[^@]*\.logo[^{]*\{[^}]*width:\s*min\(96vw,\s*420px\)/)
  })

  it('grandit avec la fenêtre sur tablette (66 vw, plafond 580 px)', () => {
    expect(css()).toMatch(/width:\s*clamp\(220px,\s*66vw,\s*580px\)/)
  })
})

describe('logo décoratif', () => {
  it('ne capte pas les clics : son rectangle transparent dépasse sur le contenu', () => {
    const rule = rulesOf(sheet('src/components/atoms/Logo/Logo.module.css')).find(({ selector }) => /^\s*\.logo\s*$/.test(selector))
    expect(rule.body).toMatch(/pointer-events:\s*none/)
  })

  it('les logos sont des WebP légers (D63)', () => {
    const jsx = jsxSources['src/components/atoms/Logo/Logo.jsx']
    expect(jsx).toMatch(/Logo-Blanc\.webp/)
    expect(jsx).toMatch(/Logo-Dark\.webp/)
    expect(existsSync('src/assets/Logo/Logo-Dark.png')).toBe(false)
    expect(existsSync('src/assets/Logo/Logo-Blanc.png')).toBe(false)
    expect(statSync('src/assets/Logo/Logo-Dark.webp').size).toBeLessThan(80 * 1024)
    expect(statSync('src/assets/Logo/Logo-Blanc.webp').size).toBeLessThan(40 * 1024)
  })
})

describe('tuiles du menu Gestion', () => {
  const tiles = 'src/components/molecules/ManagementTiles/ManagementTiles.module.css'
  const menu = 'src/components/Pages/ManagementMenu/ManagementMenu.module.css'
  const before = (css, marker) => css.slice(0, css.indexOf(marker) === -1 ? css.length : css.indexOf(marker))

  it('la grille à trois colonnes n’existe que dans une requête @container en rem', () => {
    const css = sheet(menu)
    expect(css).toMatch(/@container\s*\(min-width:\s*[\d.]+rem\)/)
    expect(before(css, '@container')).not.toMatch(/repeat\(3/)
    expect(css).toMatch(/container-type:\s*inline-size/)
  })

  it('le recouvrement au survol n’existe que sous @media (hover: hover)', () => {
    const css = sheet(tiles)
    expect(css).toMatch(/@media\s*\(hover:\s*hover\)/)
    const base = before(css, '@media (hover: hover)')
    expect(base).not.toMatch(/\.tile:hover/)
    expect(base).not.toMatch(/::after/)
    expect(base).not.toMatch(/opacity:\s*0\s*;/)
  })

  it('le focus clavier révèle les actions (:focus-within)', () => {
    expect(sheet(tiles)).toMatch(/\.tile:focus-within/)
  })

  it('le titre peut passer à la ligne plutôt qu’être coupé', () => {
    expect(sheet(tiles)).toMatch(/overflow-wrap:\s*anywhere/)
  })
})

describe('tuiles du tableau de bord (TileGroup)', () => {
  const file = 'src/components/molecules/TileGroup/TileGroup.module.css'

  it('n’impose plus width: 60 % et déclare un conteneur de requête', () => {
    const css = sheet(file)
    expect(css).not.toMatch(/width:\s*60%/)
    expect(css).toMatch(/container-type:\s*inline-size/)
  })

  it('la grille 2fr 1fr n’existe que dans une requête @container en rem', () => {
    const css = sheet(file)
    expect(css).toMatch(/@container\s*\(min-width:\s*[\d.]+rem\)\s*\{[^@]*2fr 1fr/)
    const base = css.slice(0, css.indexOf('@container'))
    expect(base).not.toMatch(/2fr 1fr/)
  })
})

describe('grands écrans : l’espace est mieux occupé (D62)', () => {
  it('le groupe de tuiles de l’accueil fait jusqu’à 60 rem', () => {
    expect(sheet('src/components/molecules/TileGroup/TileGroup.module.css')).toMatch(/width:\s*min\(100%,\s*60rem\)/)
  })

  it('la grille de Gestion prend toute la largeur du gabarit et le titre ne flotte plus au milieu', () => {
    const css = sheet('src/components/Pages/ManagementMenu/ManagementMenu.module.css')
    const host = rulesOf(css).find(({ selector }) => /\.gridHost/.test(selector))
    expect(host.body).toMatch(/width:\s*100%/)
    const page = rulesOf(css).find(({ selector }) => /^\s*\.gestionPage\s*$/.test(selector))
    expect(page.body).toMatch(/justify-content:\s*flex-start/)
  })
})
