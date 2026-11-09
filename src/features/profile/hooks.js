import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CURRENT_USER_KEY } from '../auth/hooks'
import { changePassword, updateEmailNotifications } from './api'

// La préférence vit dans la session (`['auth','me']`) : mise à jour optimiste tout de suite, retour
// arrière si le back refuse, puis la réponse du back fait foi (P3).
export function useUpdateEmailNotifications() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateEmailNotifications,
    onMutate: async (enabled) => {
      await queryClient.cancelQueries({ queryKey: CURRENT_USER_KEY })
      const previous = queryClient.getQueryData(CURRENT_USER_KEY)
      if (previous) queryClient.setQueryData(CURRENT_USER_KEY, { ...previous, emailNotificationsEnabled: enabled })
      return { previous }
    },
    onError: (_error, _enabled, context) => {
      if (context?.previous) queryClient.setQueryData(CURRENT_USER_KEY, context.previous)
    },
    onSuccess: (user) => {
      if (user) queryClient.setQueryData(CURRENT_USER_KEY, user)
    },
  })
}

export const useChangePassword = () => useMutation({ mutationFn: changePassword })
