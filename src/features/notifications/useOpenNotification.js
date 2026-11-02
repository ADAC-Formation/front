import { useNavigate } from 'react-router'
import { describeNotification } from './notificationTargets'
import { useMarkAsRead } from './hooks'

// « Ouvrir » une notification, identique dans la cloche et dans l'historique (D-N6) : la marque
// comme lue (sans attendre le back, N4) puis navigue vers l'élément concerné. Un type inconnu est
// marqué comme lu sans navigation. `isError` : le marquage a échoué (la cloche, toujours montée,
// l'annonce ; la navigation a déjà eu lieu).
export function useOpenNotification() {
  const navigate = useNavigate()
  const markAsRead = useMarkAsRead()

  const open = (notification) => {
    if (!notification.isRead) markAsRead.mutate(notification.id)
    const { path } = describeNotification(notification)
    if (path) navigate(path)
  }

  return { open, isError: markAsRead.isError }
}
