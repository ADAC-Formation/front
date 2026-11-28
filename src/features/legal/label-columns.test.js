// NOTES-04 : « Contact pour vos données personnelles » est un long libellé. Dans les listes libellé / valeur, la
// colonne des libellés est plafonnée pour ne jamais écraser la valeur sur téléphone (vu à 390 px).
import { describe, expect, it } from 'vitest'
import { cssSheets, stripComments } from '../../test/css-sheets'

const columnsOf = (file, selector) => {
  const css = stripComments(cssSheets[file])
  const body = css.match(new RegExp(`\\${selector}\\s*\\{([^}]*)\\}`))[1]
  return body.match(/grid-template-columns\s*:\s*([^;]+);/)[1].trim()
}

describe('Listes libellé / valeur', () => {
  it.each([
    ['src/features/legal/pages/LegalPage.module.css', '.facts'],
    ['src/features/profile/components/ProfileSections.module.css', '.info'],
  ])('%s %s : colonne des libellés plafonnée (fit-content), jamais max-content', (file, selector) => {
    expect(columnsOf(file, selector)).toBe('fit-content(40%) minmax(0, 1fr)')
  })
})
