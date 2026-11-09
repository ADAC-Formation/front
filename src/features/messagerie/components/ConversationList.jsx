import { Link } from 'react-router'
import Alert from '../../../components/atoms/Alert/Alert'
import { useCurrentUser } from '../../auth/hooks'
import { useConversations } from '../hooks'
import { filterConversations, hasActiveFilters } from '../conversationFilters'
import { displayName, formatMessageDate } from '../messageLabels'
import { unreadLabel } from '../unread'
import styles from './ConversationList.module.css'

function ConversationRow({ conversation, isActive, currentUserId }) {
  const { conversationId, participant, lastMessage, unreadCount } = conversation
  const isUnread = unreadCount > 0

  return (
    <li className={styles.item} data-unread={isUnread ? 'true' : undefined}>
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
          {lastMessage.sender?.id === currentUserId && <span className={styles.you}>Vous : </span>}
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
}

// Liste des conversations (plus récente d'abord, ordre du back). Le contenu est rendu en texte.
// `activeUserId` : conversation ouverte ; `filters` : { status, role, search } (voir conversationFilters.js).
const ConversationList = ({ activeUserId, filters = {} }) => {
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
    return <p className={styles.empty}>Aucune conversation pour le moment</p>
  }

  const shown = filterConversations(conversations, filters)
  if (shown.length === 0) {
    const onlyUnread = filters.status === 'unread' && !hasActiveFilters({ ...filters, status: 'all' })
    return onlyUnread ? (
      <p className={styles.empty}>Aucune conversation non lue</p>
    ) : (
      <p role="status" className={styles.empty}>
        Aucune conversation trouvée. Essayez un autre terme ou un autre filtre.
      </p>
    )
  }

  return (
    <>
      <div className={styles.cardHeader}>
        <h2>Conversations</h2>
        <p>{`${shown.length} conversation${shown.length !== 1 ? 's' : ''}`}</p>
      </div>
      <ul className={styles.list}>
        {shown.map((conversation) => (
          <ConversationRow
            key={conversation.conversationId}
            conversation={conversation}
            isActive={String(conversation.conversationId) === String(activeUserId)}
            currentUserId={user?.id}
          />
        ))}
      </ul>
    </>
  )
}

export default ConversationList
