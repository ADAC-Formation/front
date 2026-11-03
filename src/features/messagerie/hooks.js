import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchThread, listConversations, markThreadRead, sendMessage } from './api'
import { totalUnread } from './unread'

// Toutes les clés commencent par ['messages'] : une seule invalidation couvre la liste et les fils.
const MESSAGES_KEY = ['messages']
const CONVERSATIONS_KEY = [...MESSAGES_KEY, 'conversations']
const threadKey = (userId) => [...MESSAGES_KEY, 'thread', String(userId)]

// Sondage de la liste et du fil ouvert (D21, D22, H7) : en pause onglet masqué, rechargement au focus.
export const POLL_INTERVAL_MS = 45000
const POLLING = {
  refetchInterval: POLL_INTERVAL_MS,
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: true,
}

export function useConversations({ enabled = true } = {}) {
  return useQuery({
    queryKey: CONVERSATIONS_KEY,
    queryFn: listConversations,
    enabled,
    ...POLLING,
  })
}

// Total des non lus (tuile « Messages ») : lit la même requête que la liste, aucun appel de plus.
export function useUnreadCount() {
  const { data } = useConversations()
  return totalUnread(data)
}

export function useThread(userId, { enabled = true } = {}) {
  return useQuery({
    queryKey: threadKey(userId),
    queryFn: () => fetchThread(userId),
    enabled,
    ...POLLING,
  })
}

export function useSendMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: sendMessage,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MESSAGES_KEY }),
  })
}

// `mutate({ messages, currentUserId })`. La liste est rechargée seulement si des messages ont été marqués.
export function useMarkThreadRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ messages, currentUserId }) => markThreadRead(messages, currentUserId),
    onSuccess: (markedCount) => {
      if (markedCount > 0) queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY })
    },
  })
}
