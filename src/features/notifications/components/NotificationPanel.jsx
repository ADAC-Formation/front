import { Link } from 'react-router'
import { NotificationItem } from './NotificationItem'
import styles from './NotificationPanel.module.css'

// Panneau déroulant de la cloche : uniquement les non lues renvoyées par /notifications/unread.
export function NotificationPanel({ id, notifications, onOpen, onRemove, onMarkAll, onNavigate }) {
  const isEmpty = notifications.length === 0

  return (
    <section id={id} className={styles.panel} aria-label="Notifications non lues">
      {isEmpty ? (
        <p className={styles.empty}>Aucune nouvelle notification</p>
      ) : (
        <ul className={styles.list}>
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onOpen={onOpen}
              onRemove={onRemove}
            />
          ))}
        </ul>
      )}
      <div className={styles.footer}>
        {isEmpty ? null : (
          <button type="button" className={styles.action} onClick={onMarkAll}>
            Tout marquer comme lu
          </button>
        )}
        <Link to="/notifications" className={styles.action} onClick={onNavigate}>
          Voir toutes les notifications
        </Link>
      </div>
    </section>
  )
}
