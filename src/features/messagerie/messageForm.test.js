import { MAX_MESSAGE_LENGTH, REMAINING_WARNING_THRESHOLD, remainingCharacters, validateMessage } from './messageForm'

describe('validateMessage', () => {
  it('refuse un message vide', () => {
    expect(validateMessage('')).toBe('Le message est obligatoire.')
  })

  it("refuse un message fait d'espaces et de retours à la ligne", () => {
    expect(validateMessage('   \n\t ')).toBe('Le message est obligatoire.')
  })

  it('accepte un message court', () => {
    expect(validateMessage('Bonjour')).toBeNull()
  })

  it('accepte exactement 5000 caractères', () => {
    expect(MAX_MESSAGE_LENGTH).toBe(5000)
    expect(validateMessage('a'.repeat(5000))).toBeNull()
  })

  it('refuse 5001 caractères', () => {
    expect(validateMessage('a'.repeat(5001))).toBe('Le message ne doit pas dépasser 5000 caractères.')
  })
})

describe('remainingCharacters', () => {
  it('compte les caractères restants', () => {
    expect(remainingCharacters('abc')).toBe(4997)
  })

  it('devient négatif au-delà de la limite', () => {
    expect(remainingCharacters('a'.repeat(5002))).toBe(-2)
  })

  it("expose un seuil d'avertissement strictement positif et inférieur à la limite", () => {
    expect(REMAINING_WARNING_THRESHOLD).toBeGreaterThan(0)
    expect(REMAINING_WARNING_THRESHOLD).toBeLessThan(MAX_MESSAGE_LENGTH)
  })
})
