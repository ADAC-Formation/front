import { ROLES } from '../../utils/roles'

// Qui peut écrire à qui (décision H1), sans rendu ni appel réseau.
//   chargée de formation : tout le monde ;
//   formateur            : la chargée de formation + les stagiaires de ses formations ;
//   stagiaire            : la chargée de formation + les formateurs de ses formations.
// Les listes viennent de `useRecipients` (un seul point de lecture, remplaçable par l'endpoint
// demandé à Charlotte, Q14). Le back reste l'autorité : il répond 403 / 404 à un envoi refusé.

const isActive = (user) => user.isActive !== false

// Les chargées de formation connues par ailleurs (conversations, formateur d'une formation).
function knownTrainingOfficers({ conversations = [], formations = [] }) {
  const candidates = [
    ...conversations.map((conversation) => conversation.participant),
    ...formations.map((formation) => formation.formateur),
  ]
  return candidates.filter((user) => user?.role === ROLES.SUPER_ADMIN)
}

function candidatesFor(user, sources) {
  const { formateurs = [], stagiaires = [], formations = [] } = sources
  switch (user.role) {
    case ROLES.SUPER_ADMIN:
      return [...formateurs, ...stagiaires, ...knownTrainingOfficers(sources)]
    case ROLES.ADMIN:
      return [...stagiaires, ...knownTrainingOfficers(sources)]
    case ROLES.STAGIAIRE:
      return [...formations.map((formation) => formation.formateur), ...knownTrainingOfficers(sources)]
    default:
      return []
  }
}

// Comptes actifs, sans soi-même ni doublon, dans l'ordre des sources.
export function allowedRecipients(user, sources) {
  if (!user) return []
  const seen = new Set([user.id])
  return candidatesFor(user, sources).filter((candidate) => {
    if (!candidate || !isActive(candidate) || seen.has(candidate.id)) return false
    seen.add(candidate.id)
    return true
  })
}

// `userId` peut venir de l'adresse (texte).
export function canWriteTo(recipients, userId) {
  const id = Number(userId)
  if (!Number.isInteger(id)) return false
  return recipients.some((recipient) => recipient.id === id)
}
