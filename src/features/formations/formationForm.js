import { ROLES } from '../../utils/roles'

// Logique pure du formulaire de formation (création et modification), sans rendu.
// Les listes déroulantes manipulent des textes : les identifiants sont convertis ici (design § 2).

export const EMPTY_VALUES = {
  intitule: '',
  description: '',
  dateDebut: '',
  dateFin: '',
  modalite: '',
  categoryId: '',
  formateurId: '',
}

// Une formation assignée à la chargée de formation correspond à l'option vide « assigné à… ».
export function valuesFromFormation(formation) {
  const assignedToTrainingOfficer = formation.formateur.role === ROLES.SUPER_ADMIN
  return {
    intitule: formation.intitule,
    description: formation.description ?? '',
    dateDebut: formation.dateDebut,
    dateFin: formation.dateFin,
    modalite: formation.modalite,
    categoryId: String(formation.category.id),
    formateurId: assignedToTrainingOfficer ? '' : String(formation.formateur.id),
  }
}

const toId = (value) => (value === '' ? null : Number(value))

// Corps de `POST /formations` ; `PUT` en reprend les champs modifiés (`changedFields`).
export function toRequest(values) {
  return {
    intitule: values.intitule.trim(),
    description: values.description.trim() === '' ? null : values.description.trim(),
    dateDebut: values.dateDebut,
    dateFin: values.dateFin,
    modalite: values.modalite,
    categoryId: toId(values.categoryId),
    formateurId: toId(values.formateurId),
  }
}

// Le back traite un champ absent comme « inchangé » : on n'envoie que ce qui a changé.
// Contrat confirmé par le back (Q11) : à la modification, `formateurId` absent ou `null` = formateur inchangé
// (seule la création traite `null` comme « chargée de formation »). Pour repasser une formation à la chargée de formation, on envoie son identifiant.
export function changedFields(formation, values, { trainingOfficerId = null } = {}) {
  const original = toRequest(valuesFromFormation(formation))
  const edited = toRequest(values)
  const changes = Object.fromEntries(Object.entries(edited).filter(([field, value]) => value !== original[field]))
  if (changes.formateurId === null && trainingOfficerId !== null) changes.formateurId = trainingOfficerId
  return changes
}

// Les champs vides sont signalés par la règle « obligatoire », pas ici.
export function validateDateRange(dateDebut, dateFin) {
  if (dateDebut === '' || dateFin === '') return null
  return dateFin < dateDebut ? 'La date de fin ne peut pas précéder la date de début.' : null
}

// « Au » suit « Du » tant que l'utilisatrice ne l'a pas choisie séparément (formation d'un jour).
export function nextEndDate(previousStart, newStart, currentEnd) {
  return currentEnd === '' || currentEnd === previousStart ? newStart : currentEnd
}
