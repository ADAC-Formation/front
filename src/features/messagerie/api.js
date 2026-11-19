import apiClient from '../../api/Axiosclient'
import { toPreviewParams, toSendBody } from './groupFilters'

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

// Destinataires d'un envoi groupé, sans envoyer (GET /messages/group/preview, tech.md § 7). `userIds` est
// répété (`userIds=4&userIds=7`) : c'est ainsi que Spring lit une liste, pas `userIds[]=4` (défaut d'axios).
export async function previewGroupRecipients(filter) {
  const { data } = await apiClient.get('/messages/group/preview', {
    params: toPreviewParams(filter),
    paramsSerializer: { indexes: null },
  })
  return data
}

// Message groupé : `{ content, filter }` à la place de `recipientIds` (exactement l'un des deux). Le message
// renvoyé liste tous les destinataires (`recipients`) : on n'en lit que le nombre (H15).
export async function sendGroupMessage({ filter, content }) {
  const { data } = await apiClient.post('/messages/send', toSendBody(filter, content))
  return data
}

// Marque tout le fil comme lu en un seul appel (Q15, tech.md § 7) : `conversationId` est l'id de l'autre
// participant ; le back marque les messages non lus reçus de cette personne (idempotent, 204, 404 si inconnue).
export async function markConversationRead(conversationId) {
  await apiClient.patch(`/messages/conversations/${conversationId}/read`)
}
