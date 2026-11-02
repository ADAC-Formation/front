// Logique pure du formulaire de catégorie (C3, C5). Règles du back (CreateCategoryRequest /
// UpdateCategoryRequest) : `nom` non vide, 255 caractères au plus ; `couleur` `^#[0-9A-Fa-f]{6}$`.
// Chaque validateur renvoie `null` si la valeur est valide, sinon le message en français.

const NAME_MAX_LENGTH = 255
const COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/

export function validateCategoryName(value) {
  const name = value.trim()
  if (name === '') return 'Le nom est obligatoire.'
  if (name.length > NAME_MAX_LENGTH) return `Le nom ne doit pas dépasser ${NAME_MAX_LENGTH} caractères.`
  return null
}

export function validateCategoryColor(value) {
  if (value.trim() === '') return 'La couleur est obligatoire (format #RRGGBB).'
  return COLOR_PATTERN.test(value) ? null : 'La couleur doit être au format #RRGGBB, par exemple #12427C.'
}

// Corps de POST / PUT /categories : le back remplace nom et couleur, les deux sont toujours envoyés.
export function toRequest({ nom, couleur }) {
  return { nom: nom.trim(), couleur: couleur.toUpperCase() }
}

// Faux si la saisie, une fois normalisée comme à l'envoi, égale la catégorie : pas d'appel inutile.
export function hasChanged(category, values) {
  const request = toRequest(values)
  return request.nom !== category.nom || request.couleur !== category.couleur.toUpperCase()
}
