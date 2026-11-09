// Filtres de la liste des conversations, calculés côté navigateur (le back n'en propose aucun).
//   status : « all » (défaut) ou « unread » ;
//   role   : « all » (défaut) ou un rôle du back, appliqué à l'interlocuteur ;
//   search : texte cherché dans « prénom nom » de l'interlocuteur, sans casse ni accents.

// « Léa » → « lea » : minuscules et accents retirés pour comparer.
const normalize = (text) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

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

export function hasActiveFilters({ status = 'all', role = 'all', search = '' } = {}) {
  return status !== 'all' || role !== 'all' || normalize(search) !== ''
}
