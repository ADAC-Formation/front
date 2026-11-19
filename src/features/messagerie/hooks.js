import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchThread,
  listConversations,
  markThreadRead,
  previewGroupRecipients,
  sendGroupMessage,
  sendMessage,
} from './api'
import { isFilterComplete, toPreviewParams } from './groupFilters'
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

// Les mêmes personnes cochées dans un autre ordre = les mêmes destinataires = une seule requête en cache.
const previewKey = (filter) => {
  const params = toPreviewParams(filter)
  return params.userIds ? { ...params, userIds: [...params.userIds].sort((a, b) => a - b) } : params
}

// Aperçu des destinataires : seulement quand le filtre est complet (aucun appel avant). `retry: false` : un
// `400` « aucun destinataire » est une réponse normale à afficher tout de suite, pas une panne à retenter.
// Clé hors de ['messages'] : envoyer le message ne doit pas redemander l'aperçu.
export function useGroupPreview(filter) {
  const complete = isFilterComplete(filter)
  return useQuery({
    queryKey: ['group-preview', complete ? previewKey(filter) : null],
    queryFn: () => previewGroupRecipients(filter),
    enabled: complete,
    retry: false,
  })
}

// `mutate({ filter, content })` ; renvoie le message créé (`recipients` = tous les destinataires résolus).
export function useSendGroupMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: sendGroupMessage,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MESSAGES_KEY }),
  })
}

// `mutate({ messages, currentUserId })` ; renvoie les ids effectivement marqués. La liste est rechargée
// seulement si des messages ont été marqués.
export function useMarkThreadRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ messages, currentUserId }) => markThreadRead(messages, currentUserId),
    onSuccess: (markedIds) => {
      if (markedIds.length > 0) queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY })
    },
  })
}
