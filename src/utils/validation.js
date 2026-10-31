// Validateurs purs (D13). Chaque fonction renvoie `null` si la valeur est valide,
// sinon le message d'erreur en français. Le back reste l'autorité (erreurs 400 affichées).

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const CODE_PATTERN = /^\d{6}$/
const PASSWORD_MIN_LENGTH = 8
const PASSWORD_MAX_LENGTH = 72

export function validateRequired(value, label) {
  return value.trim() === '' ? `${label} est obligatoire.` : null
}

export function validateEmail(value) {
  const email = value.trim()
  if (email === '') return "L'adresse e-mail est obligatoire."
  return EMAIL_PATTERN.test(email) ? null : "L'adresse e-mail n'est pas valide."
}

export function validatePassword(value) {
  if (value === '') return 'Le mot de passe est obligatoire.'
  if (value.length < PASSWORD_MIN_LENGTH) {
    return `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`
  }
  if (value.length > PASSWORD_MAX_LENGTH) {
    return `Le mot de passe ne doit pas dépasser ${PASSWORD_MAX_LENGTH} caractères.`
  }
  if (!/[A-Z]/.test(value)) return 'Le mot de passe doit contenir au moins une majuscule.'
  if (!/\d/.test(value)) return 'Le mot de passe doit contenir au moins un chiffre.'
  return null
}

export function validatePasswordConfirmation(password, confirmation) {
  if (confirmation === '') return 'Veuillez confirmer le mot de passe.'
  return password === confirmation ? null : 'Les mots de passe ne correspondent pas.'
}

export function validateCode(value) {
  const code = value.trim()
  if (code === '') return 'Le code de vérification est obligatoire.'
  return CODE_PATTERN.test(code) ? null : 'Le code doit contenir 6 chiffres.'
}
