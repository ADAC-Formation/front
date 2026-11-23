// Filtres de la liste des conversations, calculés côté navigateur (le back n'en propose aucun).
//   status : « all » (défaut) ou « unread » ;
//   role   : « all » (défaut) ou un rôle du back, appliqué à l'interlocuteur ;
//   search : texte cherché dans « prénom nom » de l'interlocuteur, sans casse ni accents.

import { normalize } from '../../utils/searchText'

export { normalize }

const matchesSearch = ({ participant }, term) =>
  term === '' || normalize(`${participant.prenom} ${participant.nom}`).includes(term)

export function filterConversations(conversations = [], { status = 'all', role = 'all', search = '' } = {}) {
  const term = normalize(search)
  return conversations.filter(
    (conversation) =>
      (status !== 'unread' || conversation.unreadCount > 0) &&
      (role === 'all' || conversation.participant.role === role) &&
      matchesSearch(conversation, term),
  )
}

// Même rôle et même recherche pour « Nouvelle conversation » : la liste des destinataires proposés (comptes
// « prénom nom », pas des conversations) suit les contrôles de la page.
export function filterRecipients(recipients = [], { role = 'all', search = '' } = {}) {
  const term = normalize(search)
  return recipients.filter(
    (recipient) =>
      (role === 'all' || recipient.role === role) &&
      (term === '' || normalize(`${recipient.prenom} ${recipient.nom}`).includes(term)),
  )
}

export function hasActiveFilters({ status = 'all', role = 'all', search = '' } = {}) {
  return status !== 'all' || role !== 'all' || normalize(search) !== ''
}
