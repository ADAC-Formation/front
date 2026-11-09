import { useEffect, useId, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import { Bell } from 'lucide-react'
import { IconButton } from '../../../components/atoms/IconButton/IconButton'
import { useCurrentUser } from '../../auth/hooks'
import { useMarkAllAsRead, useRemoveFromBell, useUnreadNotifications } from '../hooks'
import { useOpenNotification } from '../useOpenNotification'
import { NotificationPanel } from './NotificationPanel'
import styles from './NotificationBell.module.css'

const MAX_BADGE = 99
const ACTION_ERROR = "La notification n'a pas pu être mise à jour. Réessayez."

function bellLabel(count) {
  if (count === 0) return 'Notifications'
  return `Notifications, ${count} non lue${count > 1 ? 's' : ''}`
}

// Cloche de l'en-tête (N2) : rien sans session, donc aucun appel /notifications pour un visiteur.
export function NotificationBell() {
  const { user } = useCurrentUser()
  const { data, isLoading, isError, error, refetch } = useUnreadNotifications({ enabled: Boolean(user) })
  // Une seule région d'annonce : le dernier message l'emporte (nouvelle notification ou échec).
  const [announcement, setAnnouncement] = useState('')
  const announceFailure = () => setAnnouncement(ACTION_ERROR)
  const { open: openNotification } = useOpenNotification({ onError: announceFailure })
  const markAll = useMarkAllAsRead()
  const remove = useRemoveFromBell()
  const { pathname } = useLocation()
  const panelId = useId()
  const wrapperRef = useRef(null)
  const buttonRef = useRef(null)

  // Le panneau est ouvert « sur une page » : changer de page le ferme sans effet de bord.
  const [openedOn, setOpenedOn] = useState(null)
  const isOpen = openedOn === pathname
  const close = () => setOpenedOn(null)

  const count = data?.count ?? 0
  const notifications = data?.notifications ?? []

  // Annonce polie quand le compteur RENVOYÉ PAR LE BACK augmente (jamais à la première charge, ni
  // pour une écriture optimiste ou son retour arrière, ni quand il diminue). État ajusté pendant le
  // rendu plutôt que dans un effet. Sans données (déconnexion), on oublie le compteur précédent.
  const [lastServerCount, setLastServerCount] = useState(null)
  const serverCount = data && !data.optimistic ? data.count : null
  if (!data && lastServerCount !== null) {
    setLastServerCount(null)
  } else if (serverCount !== null && serverCount !== lastServerCount) {
    setLastServerCount(serverCount)
    if (lastServerCount !== null && serverCount > lastServerCount) {
      const added = serverCount - lastServerCount
      setAnnouncement(`${added} nouvelle${added > 1 ? 's' : ''} notification${added > 1 ? 's' : ''}, ${serverCount} non lues`)
    }
  }

  useEffect(() => {
    if (!isOpen) return undefined
    const onMouseDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setOpenedOn(null)
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpenedOn(null)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen])

  if (!user) return null

  const handleOpen = (notification) => {
    close()
    openNotification(notification)
  }

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <IconButton
        ref={buttonRef}
        aria-label={bellLabel(count)}
        aria-expanded={isOpen}
        aria-controls={isOpen ? panelId : undefined}
        onClick={() => setOpenedOn(isOpen ? null : pathname)}
      >
        <Bell aria-hidden="true" />
        {count > 0 ? (
          <span className={styles.badge} aria-hidden="true">
            {count > MAX_BADGE ? `${MAX_BADGE}+` : count}
          </span>
        ) : null}
      </IconButton>

      <div role="status" className={styles.srOnly}>
        {announcement}
      </div>

      {isOpen ? (
        <NotificationPanel
          id={panelId}
          notifications={notifications}
          isLoading={isLoading}
          errorMessage={isError && !data ? error.message : null}
          onRetry={() => refetch()}
          onOpen={handleOpen}
          onRemove={(notification) => remove.mutate(notification.id, { onError: announceFailure })}
          onMarkAll={() => markAll.mutate(undefined, { onError: announceFailure })}
          onNavigate={close}
        />
      ) : null}
    </div>
  )
}
