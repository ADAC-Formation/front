import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchNotifications,
  fetchUnreadNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  removeNotificationFromBell,
} from './api'

export const NOTIFICATIONS_KEY = ['notifications']
export const UNREAD_KEY = [...NOTIFICATIONS_KEY, 'unread']
const historyKey = (status) => [...NOTIFICATIONS_KEY, 'all', status]

// Interrogation de la cloche (N3) : dans la fourchette 30–60 s du contrat, en pause quand
// l'onglet est masqué, relancée au retour sur l'onglet. Pas de WebSocket ni de SSE.
export const UNREAD_POLL_INTERVAL_MS = 45_000

export const unreadNotificationsOptions = {
  queryKey: UNREAD_KEY,
  queryFn: fetchUnreadNotifications,
  refetchInterval: UNREAD_POLL_INTERVAL_MS,
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: true,
}

// `enabled` doit être faux sans session : aucun appel /notifications pour un visiteur.
export function useUnreadNotifications({ enabled = true } = {}) {
  return useQuery({ ...unreadNotificationsOptions, enabled })
}

// Historique. `status` : 'all' | 'unread' | 'read' (filtre envoyé au back, N6).
export function useNotifications(status = 'all') {
  return useQuery({ queryKey: historyKey(status), queryFn: () => fetchNotifications(status) })
}

// Mise à jour optimiste de la cloche (N4) : on applique `update` au cache `unread` tout de suite,
// on restaure l'instantané si le back échoue, puis on recharge tout ce qui concerne les notifications.
function useOptimisticBellMutation(mutationFn, update) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onMutate: async (variable) => {
      await queryClient.cancelQueries({ queryKey: UNREAD_KEY })
      const previous = queryClient.getQueryData(UNREAD_KEY)
      if (previous) queryClient.setQueryData(UNREAD_KEY, update(previous, variable))
      return { previous }
    },
    onError: (_error, _variable, context) => {
      if (context?.previous) queryClient.setQueryData(UNREAD_KEY, context.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  })
}

// Le `count` du back est le total réel (la liste est plafonnée à 50) : on le décrémente sans
// jamais passer sous zéro ; la liste se complète au rafraîchissement suivant.
function withoutNotification(unread, id) {
  return {
    count: Math.max(0, unread.count - 1),
    notifications: unread.notifications.filter((notification) => notification.id !== id),
  }
}

export function useMarkAsRead() {
  return useOptimisticBellMutation(markNotificationAsRead, withoutNotification)
}

export function useRemoveFromBell() {
  return useOptimisticBellMutation(removeNotificationFromBell, withoutNotification)
}

export function useMarkAllAsRead() {
  return useOptimisticBellMutation(markAllNotificationsAsRead, () => ({ count: 0, notifications: [] }))
}
