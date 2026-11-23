import { useMutation } from '@tanstack/react-query'
import { collectFeedbackContext, sendFeedback } from './api'

// Envoi d'un retour. Aucune donnée serveur à rafraîchir ensuite : pas d'invalidation de cache.
// Le contexte est relevé au moment de l'envoi (page et taille de fenêtre courantes).
export function useSendFeedback() {
  return useMutation({
    mutationFn: ({ type, message, screenshot }) =>
      sendFeedback({ type, message, screenshot, context: collectFeedbackContext() }),
  })
}
