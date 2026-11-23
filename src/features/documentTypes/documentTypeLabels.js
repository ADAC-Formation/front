// Libellés français du catalogue des types de document : formats, repères de délai, résumés.

export const FORMATS = ['pdf', 'jpg', 'jpeg', 'png', 'docx', 'xlsx'].map((value) => ({
  value,
  label: value.toUpperCase(),
}))

export const DEADLINE_ANCHOR_LABELS = {
  BEFORE_START: 'Jours avant le début',
  AFTER_END: 'Jours après la fin',
}

const DEADLINE_SUFFIXES = {
  BEFORE_START: 'avant le début',
  AFTER_END: 'après la fin',
}

export const DEFAULT_FORMATS_LABEL = 'Règle générale'

export function scopeLabel(type) {
  if (type.appliesToAllFormations) return 'Toutes les formations'
  return type.categories.map((category) => category.nom).join(', ')
}

export function deadlineLabel(type) {
  if (type.deadlineDays === null || type.deadlineDays === undefined || !type.deadlineAnchor) return null
  const unit = type.deadlineDays > 1 ? 'jours' : 'jour'
  return `${type.deadlineDays} ${unit} ${DEADLINE_SUFFIXES[type.deadlineAnchor]}`
}

export function formatsLabel(allowedFormats) {
  if (!allowedFormats || allowedFormats.length === 0) return DEFAULT_FORMATS_LABEL
  return allowedFormats.map((format) => format.toUpperCase()).join(', ')
}

// Tri par nom sans tenir compte de la casse ni des accents (G30) ; ne modifie pas la liste reçue.
export function sortByName(types) {
  return [...types].sort((a, b) => a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' }))
}

// Qui fournit un document (G35) : le stagiaire sur son inscription, ou l'ADAC sur la formation. Un type lu
// avant ce champ est une pièce du stagiaire.
export const PROVIDER_CHOICES = [
  { value: 'STAGIAIRE', label: 'Le stagiaire' },
  { value: 'ADAC', label: 'L’ADAC' },
]

export function providerLabel(type) {
  return type.providedBy === 'ADAC' ? 'Fourni par l’ADAC' : 'Fourni par le stagiaire'
}
