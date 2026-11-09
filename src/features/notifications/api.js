import apiClient from '../../api/Axiosclient'

// Appels vers /notifications (contrat : back-readonly/docs/tech.md § 8). Les erreurs arrivent déjà
// normalisées en ApiError (intercepteur du client).

// Non lues de la cloche : { count, notifications } (50 plus récentes, `count` = total réel).
export async function fetchUnreadNotifications() {
  const { data } = await apiClient.get('/notifications/unread')
  return data
}

// Historique (200 plus récentes, plus récentes d'abord). `status` : 'all' | 'unread' | 'read'.
// « all » n'envoie aucun paramètre ; le back ignore `sort`, le tri se fait côté client.
export async function fetchNotifications(status = 'all') {
  const params = status === 'all' ? undefined : { read: status === 'read' }
  const { data } = await apiClient.get('/notifications', { params })
  return data
}

export async function markNotificationAsRead(id) {
  const { data } = await apiClient.patch(`/notifications/${id}/read`)
  return data
}

export async function markAllNotificationsAsRead() {
  await apiClient.patch('/notifications/read-all')
}

// Retire la notification de la cloche seulement : elle reste dans l'historique.
export async function removeNotificationFromBell(id) {
  await apiClient.delete(`/notifications/${id}`)
}
