import apiClient from '../../api/Axiosclient'
import { unreadIncomingIds } from './unread'

// Appels vers /messages (contrat : back-readonly/docs/tech.md § 7). Les erreurs arrivent déjà
// normalisées en ApiError (intercepteur du client).

// Conversations, la plus récente en premier ; `conversationId` est l'id de l'autre participant.
export async function listConversations() {
  const { data } = await apiClient.get('/messages')
  return data
}

// Messages du fil avec l'utilisateur `userId`, du plus ancien au plus récent.
export async function fetchThread(userId) {
  const { data } = await apiClient.get(`/messages/${userId}`)
  return data
}

// Message individuel : exactement un destinataire (le champ `filter` du groupé n'est pas utilisé ici).
export async function sendMessage({ recipientId, content }) {
  const { data } = await apiClient.post('/messages/send', { recipientIds: [recipientId], content })
  return data
}

// Le back ne sait marquer qu'un message à la fois (Q15 demande un endpoint de fil) : un PATCH par
// message reçu non lu, en parallèle. Un échec n'empêche ni les autres ni l'affichage du fil.
// Renvoie le nombre de messages que le back a bien marqués. Seul point à changer quand Q15 sera traitée.
export async function markThreadRead(messages, currentUserId) {
  const ids = unreadIncomingIds(messages, currentUserId)
  const results = await Promise.allSettled(ids.map((id) => apiClient.patch(`/messages/${id}/read`)))
  return results.filter((result) => result.status === 'fulfilled').length
}
