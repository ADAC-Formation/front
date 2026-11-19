import { ROLES } from '../../utils/roles'

// Règles des filtres de la messagerie groupée (décisions H12 et H16), sans rendu ni appel réseau.
// Contrat : back-readonly/docs/tech.md § 7 (`filter.type` = FORMATION | MISSING_DOCS | MANUAL).

export const FILTER_TYPES = {
  FORMATION: 'FORMATION',
  MISSING_DOCS: 'MISSING_DOCS',
  MANUAL: 'MANUAL',
}

// Chargée de formation : les trois filtres ; formateur : « Formation » seulement ; stagiaire : aucun.
export function filterTypesFor(role) {
  if (role === ROLES.SUPER_ADMIN) return [FILTER_TYPES.FORMATION, FILTER_TYPES.MISSING_DOCS, FILTER_TYPES.MANUAL]
  if (role === ROLES.ADMIN) return [FILTER_TYPES.FORMATION]
  return []
}

// Le back répond 404 sur la formation d'un autre formateur : on ne propose que les siennes.
export function formationsOfTrainer(formations, trainerId) {
  if (!formations || trainerId == null) return []
  return formations.filter((formation) => formation.formateur?.id === trainerId)
}

const hasFormation = (filter) => filter.formationId != null && filter.formationId !== ''

// Vrai quand le back peut résoudre les destinataires : aucun appel d'aperçu avant.
export function isFilterComplete(filter) {
  switch (filter?.type) {
    case FILTER_TYPES.FORMATION:
      return hasFormation(filter)
    case FILTER_TYPES.MANUAL:
      return (filter.userIds?.length ?? 0) > 0
    case FILTER_TYPES.MISSING_DOCS:
      return true
    default:
      return false
  }
}

// Seuls les champs du type choisi partent au back : un champ d'un autre type serait refusé ou ignoré.
function filterFields(filter) {
  switch (filter.type) {
    case FILTER_TYPES.FORMATION:
      return { formationId: Number(filter.formationId) }
    case FILTER_TYPES.MANUAL:
      return { userIds: filter.userIds }
    default:
      return {}
  }
}

// Paramètres de GET /messages/group/preview.
export function toPreviewParams(filter) {
  return { filterType: filter.type, ...filterFields(filter) }
}

// Corps de POST /messages/send, branche groupée. Le texte est envoyé tel quel (H9).
export function toSendBody(filter, content) {
  return { content, filter: { type: filter.type, ...filterFields(filter) } }
}
