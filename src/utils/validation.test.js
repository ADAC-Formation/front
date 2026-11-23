import {
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  validateCode,
  validateRequired,
  validateFeedbackMessage,
  validateFeedbackImage,
} from './validation'

describe('validateRequired', () => {
  it('refuse une valeur vide ou faite d\'espaces', () => {
    expect(validateRequired('', 'Le mot de passe')).toBe('Le mot de passe est obligatoire.')
    expect(validateRequired('   ', 'Le mot de passe')).toBe('Le mot de passe est obligatoire.')
  })
  it('accepte une valeur renseignée', () => {
    expect(validateRequired('x', 'Le mot de passe')).toBeNull()
  })
})

describe('validateEmail', () => {
  it('refuse un e-mail vide', () => {
    expect(validateEmail('')).toBe("L'adresse e-mail est obligatoire.")
  })
  it.each(['abc', 'abc@', '@exemple.fr', 'a b@exemple.fr', 'abc@exemple'])(
    'refuse %s',
    (value) => {
      expect(validateEmail(value)).toBe("L'adresse e-mail n'est pas valide.")
    },
  )
  it('accepte un e-mail valide, avec espaces autour', () => {
    expect(validateEmail(' nom.prenom@exemple.fr ')).toBeNull()
  })
})

describe('validatePassword', () => {
  it('refuse un mot de passe vide', () => {
    expect(validatePassword('')).toBe('Le mot de passe est obligatoire.')
  })
  it('refuse 7 caractères', () => {
    expect(validatePassword('Abcdef1')).toBe('Le mot de passe doit contenir au moins 8 caractères.')
  })
  it('accepte exactement 8 et 72 caractères', () => {
    expect(validatePassword('Abcdefg1')).toBeNull()
    expect(validatePassword('A1' + 'a'.repeat(70))).toBeNull()
  })
  it('refuse 73 caractères', () => {
    expect(validatePassword('A1' + 'a'.repeat(71))).toBe(
      'Le mot de passe ne doit pas dépasser 72 caractères.',
    )
  })
  it('refuse sans majuscule', () => {
    expect(validatePassword('abcdefg1')).toBe('Le mot de passe doit contenir au moins une majuscule.')
  })
  it('refuse sans chiffre', () => {
    expect(validatePassword('Abcdefgh')).toBe('Le mot de passe doit contenir au moins un chiffre.')
  })
})

describe('validatePasswordConfirmation', () => {
  it('refuse une confirmation vide', () => {
    expect(validatePasswordConfirmation('Abcdefg1', '')).toBe('Veuillez confirmer le mot de passe.')
  })
  it('refuse une confirmation différente', () => {
    expect(validatePasswordConfirmation('Abcdefg1', 'Abcdefg2')).toBe(
      'Les mots de passe ne correspondent pas.',
    )
  })
  it('accepte une confirmation identique', () => {
    expect(validatePasswordConfirmation('Abcdefg1', 'Abcdefg1')).toBeNull()
  })
})

describe('validateCode', () => {
  it('refuse un code vide', () => {
    expect(validateCode('')).toBe('Le code de vérification est obligatoire.')
  })
  it.each(['12345', '1234567', 'abcdef', '12 456'])('refuse %s', (value) => {
    expect(validateCode(value)).toBe('Le code doit contenir 6 chiffres.')
  })
  it('accepte 6 chiffres', () => {
    expect(validateCode('123456')).toBeNull()
  })
})

describe('validateFeedbackMessage', () => {
  it('refuse un message vide ou de moins de 10 caractères, espaces exclus', () => {
    expect(validateFeedbackMessage('')).toBe('Le message est obligatoire.')
    expect(validateFeedbackMessage('   court   ')).toBe('Le message doit contenir au moins 10 caractères.')
  })
  it('accepte de 10 à 2000 caractères', () => {
    expect(validateFeedbackMessage('a'.repeat(10))).toBeNull()
    expect(validateFeedbackMessage('a'.repeat(2000))).toBeNull()
  })
  it('refuse plus de 2000 caractères', () => {
    expect(validateFeedbackMessage('a'.repeat(2001))).toBe('Le message ne doit pas dépasser 2000 caractères.')
  })
})

describe('validateFeedbackImage', () => {
  const image = (type, size) => ({ type, size })
  const THREE_MB = 3 * 1024 * 1024

  it('accepte l’absence d’image', () => {
    expect(validateFeedbackImage(null)).toBeNull()
    expect(validateFeedbackImage(undefined)).toBeNull()
  })
  it('accepte png, jpeg et webp jusqu’à 3 Mo', () => {
    expect(validateFeedbackImage(image('image/png', THREE_MB))).toBeNull()
    expect(validateFeedbackImage(image('image/jpeg', 1000))).toBeNull()
    expect(validateFeedbackImage(image('image/webp', 1000))).toBeNull()
  })
  it('refuse une image de plus de 3 Mo', () => {
    expect(validateFeedbackImage(image('image/png', THREE_MB + 1))).toBe('Image trop lourde (3 Mo maximum).')
  })
  it('refuse un autre format', () => {
    expect(validateFeedbackImage(image('application/pdf', 1000))).toBe('Format non accepté : png, jpeg ou webp.')
    expect(validateFeedbackImage(image('image/gif', 1000))).toBe('Format non accepté : png, jpeg ou webp.')
  })
})
