// Messages non lus : calculs purs sur les réponses de GET /messages et GET /messages/{id}.

// Somme des `unreadCount` ; une valeur absente ou invalide compte pour zéro.
export function totalUnread(conversations = []) {
  return conversations.reduce((sum, { unreadCount }) => sum + (Number.isInteger(unreadCount) ? unreadCount : 0), 0)
}

export function unreadLabel(count) {
  return count === 1 ? '1 message non lu' : `${count} messages non lus`
}

// Identifiants des messages reçus (pas envoyés par soi) dont `readAt` est nul, dans l'ordre.
export function unreadIncomingIds(messages = [], currentUserId) {
  if (currentUserId == null) return []
  return messages
    .filter((message) => message.sender?.id !== currentUserId && message.readAt == null)
    .map((message) => message.id)
}
