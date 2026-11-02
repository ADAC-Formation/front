import { ROLES } from '../../utils/roles'

// Règles des documents de formation (G2–G4), sans rendu : types et taille acceptés (le back
// revérifie, signature comprise), libellés, et droits de dépôt et de suppression (tech.md § 6).

export const MAX_FILE_SIZE = 10 * 1024 * 1024
export const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'docx']
export const ACCEPT_ATTRIBUTE = ALLOWED_EXTENSIONS.map((extension) => `.${extension}`).join(',')

const KINDS = { pdf: 'PDF', jpg: 'Image', jpeg: 'Image', png: 'Image', docx: 'Word' }

function extensionOf(fileName) {
  const dot = fileName.lastIndexOf('.')
  return dot === -1 ? '' : fileName.slice(dot + 1).toLowerCase()
}

// Renvoie le message du refus, ou `null` si le fichier peut être envoyé.
export function validateDocumentFile(file) {
  if (!ALLOWED_EXTENSIONS.includes(extensionOf(file.name))) {
    return 'Format non autorisé (PDF, JPG, PNG ou DOCX).'
  }
  if (file.size === 0) return 'Le fichier est vide.'
  if (file.size > MAX_FILE_SIZE) return 'Fichier trop volumineux (10 Mo au maximum).'
  return null
}

const decimal = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`
  return `${decimal.format(bytes / (1024 * 1024))} Mo`
}

const longDate = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' })

// `createdAt` : LocalDateTime ISO 8601 du back.
export function formatDocumentDate(createdAt) {
  const date = new Date(createdAt ?? NaN)
  return Number.isNaN(date.getTime()) ? '' : longDate.format(date)
}

export const documentKind = (fileName) => KINDS[extensionOf(fileName)] ?? 'Fichier'

const isActive = (formation) => formation.status !== 'ARCHIVED'

// Stagiaire (028) : dépôt sur sa propre inscription, tant que la formation est active et que son
// identifiant d'inscription est connu (G10, G11).
export const canUploadOwnDocument = (formation) => isActive(formation) && inscriptionIdOf(formation) !== null

// Chargée de formation : toute formation active. Formateur : la sienne seulement. Jamais le stagiaire.
export function canUploadDocument(user, formation) {
  if (!user || !isActive(formation)) return false
  if (user.role === ROLES.SUPER_ADMIN) return true
  return user.role === ROLES.ADMIN && formation.formateur?.id === user.id
}

// Chargée de formation : tout. Formateur : ses propres envois, quelle que soit la formation. Jamais le stagiaire.
export function canDeleteDocument(user, formation, document) {
  if (!user || !isActive(formation)) return false
  if (user.role === ROLES.SUPER_ADMIN) return true
  return user.role === ROLES.ADMIN && document.uploadedBy?.id === user.id
}

// Identifiant d'inscription du stagiaire sur la formation, ou `null` : seul point du front qui le lit
// (G8, G11). Le back ne l'envoie pas encore (demande Q13) ; si le contrat change, seule cette fonction
// et la source des formations changent.
export function inscriptionIdOf(formation) {
  const id = formation?.inscriptionId
  return typeof id === 'number' && Number.isFinite(id) ? id : null
}
