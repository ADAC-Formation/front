import { describe, expect, it } from 'vitest'
import { hasChanged, toRequest, validateCategoryColor, validateCategoryName } from './categoryForm'

describe('validateCategoryName', () => {
  it('accepte un nom', () => {
    expect(validateCategoryName('Secourisme')).toBeNull()
  })

  it.each(['', '   '])('refuse un nom vide (%j)', (value) => {
    expect(validateCategoryName(value)).toMatch(/obligatoire/i)
  })

  it('accepte 255 caractères et refuse 256', () => {
    expect(validateCategoryName('a'.repeat(255))).toBeNull()
    expect(validateCategoryName('a'.repeat(256))).toMatch(/255/)
  })

  it('compte les caractères après avoir retiré les espaces autour', () => {
    expect(validateCategoryName(`  ${'a'.repeat(255)}  `)).toBeNull()
  })
})

describe('validateCategoryColor', () => {
  it.each(['#12427c', '#271BB4', '#000000', '#FFFFFF'])('accepte %s', (value) => {
    expect(validateCategoryColor(value)).toBeNull()
  })

  it.each(['12427c', '#12427', '#1242789', '#GGGGGG', '#1242 7c', '', 'rouge'])('refuse %j', (value) => {
    expect(validateCategoryColor(value)).toMatch(/#RRGGBB/)
  })

  it('refuse une couleur vide avec un message d’obligation', () => {
    expect(validateCategoryColor('')).toMatch(/couleur/i)
  })
})

describe('toRequest', () => {
  it('retire les espaces autour du nom et met la couleur en majuscules', () => {
    expect(toRequest({ nom: '  Numérique ', couleur: '#12427c' })).toEqual({ nom: 'Numérique', couleur: '#12427C' })
  })

  it('ne garde que nom et couleur', () => {
    expect(Object.keys(toRequest({ nom: 'A', couleur: '#000000', extra: 1 }))).toEqual(['nom', 'couleur'])
  })
})

describe('hasChanged', () => {
  const category = { id: 1, nom: 'Secourisme', couleur: '#D62828', isActive: true }

  it('est faux quand rien ne change', () => {
    expect(hasChanged(category, { nom: 'Secourisme', couleur: '#D62828' })).toBe(false)
  })

  it('est vrai quand le nom change', () => {
    expect(hasChanged(category, { nom: 'Secourisme 2', couleur: '#D62828' })).toBe(true)
  })

  it('est vrai quand la couleur change', () => {
    expect(hasChanged(category, { nom: 'Secourisme', couleur: '#12427C' })).toBe(true)
  })

  it('ignore les espaces autour du nom', () => {
    expect(hasChanged(category, { nom: '  Secourisme ', couleur: '#D62828' })).toBe(false)
  })

  it('ignore la casse de la couleur', () => {
    expect(hasChanged(category, { nom: 'Secourisme', couleur: '#d62828' })).toBe(false)
  })

  it('compare la casse du nom (Secourisme ≠ secourisme)', () => {
    expect(hasChanged(category, { nom: 'secourisme', couleur: '#D62828' })).toBe(true)
  })
})
