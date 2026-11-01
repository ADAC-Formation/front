import { describe, expect, it } from 'vitest'
import { cssSheets, rulesOf, stripComments } from '../../../test/css-sheets'

const FILE = 'src/features/formations/pages/FormationPages.module.css'
const rules = rulesOf(stripComments(cssSheets[FILE]))

describe('pages de formations : états d’erreur', () => {
  it('le message d’erreur est séparé du bouton « Retour » par une marge', () => {
    const rule = rules.find(({ selector }) => selector.trim() === '.errorState')
    expect(rule, '.errorState').toBeDefined()
    expect(rule.body).toMatch(/margin-top:\s*1\.5rem/)
  })
})
