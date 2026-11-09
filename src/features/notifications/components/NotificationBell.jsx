import { useEffect, useId, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import { useMutationState } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import { IconButton } from '../../../components/atoms/IconButton/IconButton'
import { useCurrentUser } from '../../auth/hooks'
import { MARK_AS_READ_KEY, useMarkAllAsRead, useRemoveFromBell, useUnreadNotifications } from '../hooks'
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
  // Chaque annonce a un numéro : le message est remplacé même s'il est identique au précédent, donc relu.
  const [announcement, setAnnouncementState] = useState({ text: '', id: 0 })
  const setAnnouncement = (text) => setAnnouncementState((previous) => ({ text, id: previous.id + 1 }))
  const announceFailure = () => setAnnouncement(ACTION_ERROR)
  const { open: openNotification } = useOpenNotification()
  // Un marquage « lu » refusé est annoncé ici, qu'il vienne de la cloche ou de l'historique (la page a pu
  // être quittée entre-temps) ; chaque nouvel échec est annoncé une fois.
  const failedReads = useMutationState({
    filters: { mutationKey: MARK_AS_READ_KEY, status: 'error' },
    select: (mutation) => mutation.state.submittedAt,
  })
  const lastReadFailure = Math.max(0, ...failedReads)
  const [announcedFailure, setAnnouncedFailure] = useState(lastReadFailure)
  if (lastReadFailure > announcedFailure) {
    setAnnouncedFailure(lastReadFailure)
    setAnnouncement(ACTION_ERROR)
  }
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

  // Annonce polie quand le back renvoie une notification que la cloche n'a jamais vue (jamais à la première
  // charge, ni pour une écriture optimiste ou son retour arrière). On compare les identifiants, pas le
  // total : lire une notification pendant qu'une autre arrive laisse le total inchangé. État ajusté pendant
  // le rendu plutôt que dans un effet. Sans données (déconnexion), on oublie ce qui a été vu.
  const [seenIds, setSeenIds] = useState(null)
  const serverData = data && !data.optimistic ? data : null
  if (!data && seenIds !== null) {
    setSeenIds(null)
  } else if (serverData) {
    const ids = serverData.notifications.map((notification) => notification.id)
    if (seenIds === null) {
      setSeenIds(new Set(ids))
    } else {
      const fresh = ids.filter((id) => !seenIds.has(id))
      if (fresh.length > 0) {
        setSeenIds(new Set([...seenIds, ...ids]))
        const added = fresh.length
        setAnnouncement(`${added} nouvelle${added > 1 ? 's' : ''} notification${added > 1 ? 's' : ''}, ${serverData.count} non lues`)
      }
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
        <span key={announcement.id}>{announcement.text}</span>
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
