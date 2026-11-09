import { displayName, formatMessageDate } from './messageLabels'

describe('formatMessageDate', () => {
  it('met en forme un OffsetDateTime du back', () => {
    expect(formatMessageDate('2026-11-03T09:45:10.02948Z')).toMatch(/2026/)
  })

  it.each([undefined, null, '', 'pas une date'])('renvoie une chaîne vide pour %s au lieu de planter', (value) => {
    expect(formatMessageDate(value)).toBe('')
  })
})

describe('displayName', () => {
  it('assemble prénom et nom', () => {
    expect(displayName({ prenom: 'Anne', nom: 'Martin' })).toBe('Anne Martin')
  })

  it.each([null, undefined])('désigne un compte absent (%s) comme « Expéditeur inconnu »', (value) => {
    expect(displayName(value)).toBe('Expéditeur inconnu')
  })
})
