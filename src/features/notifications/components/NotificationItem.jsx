import { Bell, BookOpen, MessageSquare, X } from 'lucide-react'
import { describeNotification } from '../notificationTargets'
import styles from './NotificationItem.module.css'

const ICONS = { message: MessageSquare, formation: BookOpen, other: Bell }

const dateFormat = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

// Une notification. Le type est porté par une icône ET par un libellé lu par les lecteurs d'écran
// (jamais par la couleur seule). `content` est du texte : React l'échappe, jamais de HTML (XSS).
// `onRemove` : bouton « ✕ » de la cloche (retire de la cloche, pas de l'historique).
// `showStatus` : historique, où lues et non lues cohabitent.
export function NotificationItem({ notification, onOpen, onRemove, showStatus = false }) {
  const { kind, label } = describeNotification(notification)
  const Icon = ICONS[kind]
  const date = new Date(notification.createdAt)

  return (
    <li className={styles.item} data-unread={!notification.isRead} data-notification-id={notification.id}>
      <button type="button" className={styles.open} onClick={() => onOpen(notification)}>
        <Icon size={18} aria-hidden="true" className={styles.icon} data-kind={kind} />
        <span className={styles.text}>
          <span className={styles.srOnly}>{label} : </span>
          <span className={styles.content}>{notification.content}</span>
          <time className={styles.date} dateTime={notification.createdAt}>
            {dateFormat.format(date)}
          </time>
          {showStatus ? (
            <span className={styles.status}>
              {notification.isRead ? <span className={styles.srOnly}> (lue)</span> : <span> · Non lue</span>}
            </span>
          ) : null}
        </span>
      </button>
      {onRemove ? (
        <button
          type="button"
          className={styles.remove}
          aria-label={`Retirer de la cloche : ${notification.content}`}
          onClick={() => onRemove(notification)}
        >
          <X size={16} aria-hidden="true" />
        </button>
      ) : null}
    </li>
  )
}
