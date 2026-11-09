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
function useOptimisticBellMutation(mutationFn, update, mutationKey) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey,
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
    // Sans `return` : TanStack Query attend la promesse renvoyée par `onSettled` avant de passer la
    // mutation en succès / échec. Renvoyer la relecture retarderait d'autant l'annonce d'un échec.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })
    },
  })
}

// Les écritures optimistes portent `optimistic: true` : la cloche ne s'en sert pas pour annoncer
// « nouvelle notification » (ni à l'aller, ni au retour arrière). Seules les réponses du back comptent.
//
// Le `count` du back est le total réel des non lues encore dans la cloche (la liste est plafonnée à
// 50). Une notification absente de la liste alors que `count` tient dans la liste n'est pas comptée
// (ex. non lue déjà retirée de la cloche, ouverte depuis l'historique) : on ne touche à rien. Sinon
// on décrémente, sans passer sous zéro ; la liste se complète au rafraîchissement suivant.
function withoutNotification(unread, id) {
  const isListed = unread.notifications.some((notification) => notification.id === id)
  const maybeCounted = unread.count > unread.notifications.length
  if (!isListed && !maybeCounted) return unread
  return {
    count: Math.max(0, unread.count - 1),
    notifications: unread.notifications.filter((notification) => notification.id !== id),
    optimistic: true,
  }
}

// Clé commune : la cloche (toujours montée) annonce l'échec d'un marquage lancé de n'importe où.
export const MARK_AS_READ_KEY = [...NOTIFICATIONS_KEY, 'mark-as-read']

export function useMarkAsRead() {
  return useOptimisticBellMutation(markNotificationAsRead, withoutNotification, MARK_AS_READ_KEY)
}

export function useRemoveFromBell() {
  return useOptimisticBellMutation(removeNotificationFromBell, withoutNotification)
}

export function useMarkAllAsRead() {
  return useOptimisticBellMutation(markAllNotificationsAsRead, () => ({
    count: 0,
    notifications: [],
    optimistic: true,
  }))
}
