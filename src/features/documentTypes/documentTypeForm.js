// Logique pure du formulaire de type de document (G19 à G31). Règles du back (CreateDocumentTypeRequest,
// design.md § 4) : `nom` non vide, 255 au plus ; `aide` 500 au plus ; portée « toutes » sans catégorie,
// « certaines » avec au moins une ; `deadlineDays` (0 à 365) et `deadlineAnchor` ensemble ou aucun.
// Chaque validateur renvoie un objet `{ champ: message }` : vide quand le formulaire est valide.

const NAME_MAX_LENGTH = 255
const HELP_MAX_LENGTH = 500
const DEADLINE_MAX_DAYS = 365
const WHOLE_NUMBER = /^\d+$/

export function emptyValues() {
  return {
    nom: '',
    aide: '',
    isSensitive: false,
    scope: 'all',
    categoryIds: [],
    deadlineAnchor: '',
    deadlineDays: '',
    allowedFormats: [],
  }
}

function validateDeadlineDays(value) {
  const days = String(value).trim()
  if (days === '') return 'Indiquez le nombre de jours.'
  if (!WHOLE_NUMBER.test(days) || Number(days) > DEADLINE_MAX_DAYS) {
    return `Le nombre de jours doit être un entier entre 0 et ${DEADLINE_MAX_DAYS}.`
  }
  return null
}

export function validateDocumentType(values) {
  const errors = {}
  const nom = values.nom.trim()
  if (nom === '') errors.nom = 'Le nom est obligatoire.'
  else if (nom.length > NAME_MAX_LENGTH) errors.nom = `Le nom ne doit pas dépasser ${NAME_MAX_LENGTH} caractères.`

  if (values.aide.trim().length > HELP_MAX_LENGTH) {
    errors.aide = `Le texte d’aide ne doit pas dépasser ${HELP_MAX_LENGTH} caractères.`
  }
  if (values.scope === 'categories' && values.categoryIds.length === 0) {
    errors.categoryIds = 'Choisissez au moins une catégorie.'
  }
  if (values.deadlineAnchor !== '') {
    const message = validateDeadlineDays(values.deadlineDays)
    if (message) errors.deadlineDays = message
  }
  return errors
}

// Corps de POST / PUT /document-types : le back remplace tout, tous les champs sont toujours envoyés.
export function toRequest(values) {
  const appliesToAllFormations = values.scope === 'all'
  const hasDeadline = values.deadlineAnchor !== ''
  return {
    nom: values.nom.trim(),
    aide: values.aide.trim() === '' ? null : values.aide.trim(),
    isSensitive: values.isSensitive,
    appliesToAllFormations,
    categoryIds: appliesToAllFormations ? [] : values.categoryIds,
    deadlineDays: hasDeadline ? Number(values.deadlineDays) : null,
    deadlineAnchor: hasDeadline ? values.deadlineAnchor : null,
    allowedFormats: values.allowedFormats,
  }
}

// Valeurs du formulaire d’un type existant (DocumentTypeResponse).
export function fromType(type) {
  return {
    nom: type.nom,
    aide: type.aide ?? '',
    isSensitive: type.isSensitive,
    scope: type.appliesToAllFormations ? 'all' : 'categories',
    categoryIds: type.categories.map((category) => category.id),
    deadlineAnchor: type.deadlineAnchor ?? '',
    deadlineDays: type.deadlineDays === null || type.deadlineDays === undefined ? '' : String(type.deadlineDays),
    allowedFormats: type.allowedFormats ?? [],
  }
}
