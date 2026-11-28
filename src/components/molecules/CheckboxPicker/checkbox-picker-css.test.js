// NOTES-26 : une liste déroulante prend la largeur de sa plus longue option (« Difficultés budgétaires,
// surendettement et dinero ») ; à 390 px elle élargissait la grille du formulaire de création du stagiaire, et
// les champs Nom / Prénom débordaient de l'écran. Une largeur en pourcentage la rend compressible (CSS Sizing) :
// elle ne pèse plus dans la largeur minimale de la grille.
import { describe, expect, it } from 'vitest'
import { cssSheets, stripComments } from '../../../test/css-sheets'

const css = stripComments(cssSheets['src/components/molecules/CheckboxPicker/CheckboxPicker.module.css'])
const body = (selector) => css.match(new RegExp(`\\${selector}\\s*\\{([^}]*)\\}`))[1]

describe('CheckboxPicker : champs de la barre d’outils', () => {
  it.each(['.search', '.searchInput'])('%s peut rétrécir sous la largeur de son contenu (min-width: 0)', (selector) => {
    expect(body(selector)).toMatch(/min-width\s*:\s*0\s*;/)
  })

  it('.searchInput a une largeur en pourcentage (compressible, ne fixe pas la largeur minimale)', () => {
    expect(body('.searchInput')).toMatch(/(?<!-)width\s*:\s*100%\s*;/)
  })
})
