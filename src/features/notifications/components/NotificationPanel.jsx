import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import Alert from '../../../components/atoms/Alert/Alert'
import { NotificationItem } from './NotificationItem'
import styles from './NotificationPanel.module.css'

// Panneau déroulant de la cloche : uniquement les non lues renvoyées par /notifications/unread.
// `isLoading` : première charge ; `errorMessage` : le chargement a échoué et rien n'est affiché
// (une relecture qui échoue alors que la liste est déjà là ne passe pas par ici).
export function NotificationPanel({
  id,
  notifications,
  isLoading,
  errorMessage,
  onRetry,
  onOpen,
  onRemove,
  onMarkAll,
  onNavigate,
}) {
  const rootRef = useRef(null)
  // Cible du focus une fois la liste mise à jour : retirer une notification ou tout marquer comme
  // lu supprime le bouton qui avait le focus, qui retomberait sur <body> (WCAG 2.4.3).
  // `null` : rien à faire ; `{ id }` : la voisine à focaliser ; `{ id: null }` : le lien du pied.
  const pendingFocus = useRef(null)

  useEffect(() => {
    const pending = pendingFocus.current
    if (!pending) return
    pendingFocus.current = null
    const root = rootRef.current
    const neighbour = pending.id === null ? null : root?.querySelector(`[data-notification-id="${pending.id}"] button`)
    ;(neighbour ?? root?.querySelector('a'))?.focus()
  }, [notifications])

  const handleRemove = (notification) => {
    const index = notifications.findIndex((candidate) => candidate.id === notification.id)
    const neighbour = notifications[index + 1] ?? notifications[index - 1]
    pendingFocus.current = { id: neighbour?.id ?? null }
    onRemove(notification)
  }

  const handleMarkAll = () => {
    pendingFocus.current = { id: null }
    onMarkAll()
  }

  const isReady = !isLoading && !errorMessage
  const isEmpty = isReady && notifications.length === 0

  return (
    <section ref={rootRef} id={id} className={styles.panel} aria-label="Notifications non lues">
      {isLoading ? (
        <p role="status" className={styles.empty}>
          Chargement…
        </p>
      ) : null}

      {errorMessage ? (
        <div className={styles.errorBox}>
          <Alert variant="error">{errorMessage}</Alert>
          <button type="button" className={styles.action} onClick={onRetry}>
            Réessayer
          </button>
        </div>
      ) : null}

      {isEmpty ? <p className={styles.empty}>Aucune nouvelle notification</p> : null}

      {isReady && !isEmpty ? (
        <ul className={styles.list}>
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onOpen={onOpen}
              onRemove={handleRemove}
            />
          ))}
        </ul>
      ) : null}

      <div className={styles.footer}>
        {isReady && !isEmpty ? (
          <button type="button" className={styles.action} onClick={handleMarkAll}>
            Tout marquer comme lu
          </button>
        ) : null}
        <Link to="/notifications" className={styles.action} onClick={onNavigate}>
          Voir toutes les notifications
        </Link>
      </div>
    </section>
  )
}
