import { useNavigate } from 'react-router'
import { describeNotification } from './notificationTargets'
import { useMarkAsRead } from './hooks'

// « Ouvrir » une notification, identique dans la cloche et dans l'historique (D-N6) : la marque
// comme lue (sans attendre le back, N4) puis navigue vers l'élément concerné. Un type inconnu est
// marqué comme lu sans navigation. `onError` est appelé si le marquage échoue, même après la
// navigation (la cloche, toujours montée, l'annonce) ; `isError` reste vrai jusqu'au prochain essai.
export function useOpenNotification({ onError } = {}) {
  const navigate = useNavigate()
  const markAsRead = useMarkAsRead()

  const open = (notification) => {
    if (!notification.isRead) markAsRead.mutate(notification.id, { onError })
    const { path } = describeNotification(notification)
    if (path) navigate(path)
  }

  return { open, isError: markAsRead.isError }
}
