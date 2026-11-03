import { Link } from 'react-router'
import Alert from '../../../components/atoms/Alert/Alert'
import { useCurrentUser } from '../../auth/hooks'
import { useConversations } from '../hooks'
import { displayName, formatMessageDate } from '../messageLabels'
import { unreadLabel } from '../unread'
import styles from './ConversationList.module.css'

// Liste des conversations (plus récente d'abord, ordre du back). Le contenu est rendu en texte.
// `activeUserId` : conversation ouverte ; `emptyAction` : action proposée quand la liste est vide.
const ConversationList = ({ activeUserId, emptyAction }) => {
  const { user } = useCurrentUser()
  const { data: conversations, isLoading, isError, refetch } = useConversations()

  if (isLoading) return <p role="status">Chargement des conversations…</p>

  if (isError) {
    return (
      <div className={styles.feedback}>
        <Alert>Impossible de charger les conversations.</Alert>
        <button type="button" className={styles.retry} onClick={() => refetch()}>
          Réessayer
        </button>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className={styles.feedback}>
        <p className={styles.empty}>Aucune conversation pour le moment</p>
        {emptyAction}
      </div>
    )
  }

  return (
    <ul className={styles.list}>
      {conversations.map(({ conversationId, participant, lastMessage, unreadCount }) => {
        const isActive = String(conversationId) === String(activeUserId)
        const isUnread = unreadCount > 0
        return (
          <li key={conversationId} className={styles.item} data-unread={isUnread ? 'true' : undefined}>
            <Link
              to={`/messages/${conversationId}`}
              className={styles.link}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className={styles.header}>
                <span className={styles.name}>{displayName(participant)}</span>
                <span className={styles.date}>{formatMessageDate(lastMessage.createdAt)}</span>
              </span>
              <span className={styles.preview}>
                {lastMessage.sender.id === user?.id && <span className={styles.you}>Vous : </span>}
                {lastMessage.content}
              </span>
              {isUnread && (
                <span className={styles.unreadBadge}>
                  <span aria-hidden="true" className={styles.dot} />
                  <span className={styles.unreadText}>{unreadLabel(unreadCount)}</span>
                </span>
              )}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

export default ConversationList
