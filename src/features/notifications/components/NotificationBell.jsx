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
  const { data } = useUnreadNotifications({ enabled: Boolean(user) })
  const { open: openNotification, isError: openFailed } = useOpenNotification()
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

  // Annonce polie quand le compteur augmente (jamais à la première charge, ni quand il diminue
  // par une action de l'utilisateur). État ajusté pendant le rendu plutôt que dans un effet.
  const [lastCount, setLastCount] = useState(null)
  const [announcement, setAnnouncement] = useState('')
  const loadedCount = data ? data.count : null
  if (loadedCount !== lastCount) {
    setLastCount(loadedCount)
    if (lastCount !== null && loadedCount !== null && loadedCount > lastCount) {
      const added = loadedCount - lastCount
      setAnnouncement(`${added} nouvelle${added > 1 ? 's' : ''} notification${added > 1 ? 's' : ''}, ${loadedCount} non lues`)
    }
  }
  const hasActionError = openFailed || markAll.isError || remove.isError

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
        {hasActionError ? ACTION_ERROR : announcement}
      </div>

      {isOpen ? (
        <NotificationPanel
          id={panelId}
          notifications={notifications}
          onOpen={handleOpen}
          onRemove={(notification) => remove.mutate(notification.id)}
          onMarkAll={() => markAll.mutate()}
          onNavigate={close}
        />
      ) : null}
    </div>
  )
}
