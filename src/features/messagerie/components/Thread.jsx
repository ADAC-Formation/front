import { useEffect, useRef } from 'react'
import Alert from '../../../components/atoms/Alert/Alert'
import { useCurrentUser } from '../../auth/hooks'
import { useMarkThreadRead, useThread } from '../hooks'
import { displayName, formatMessageDate } from '../messageLabels'
import { unreadIncomingIds } from '../unread'
import styles from './Thread.module.css'

// Fil avec l'utilisateur `userId`, du plus ancien au plus récent. Le contenu est rendu en texte
// (jamais en HTML) ; les sauts de ligne sont conservés par la feuille de style. L'appelant fournit
// `key={userId}` : changer de fil recrée le composant et repart d'une mémoire de lecture vide.
const Thread = ({ userId }) => {
  const { user } = useCurrentUser()
  const { data: messages, dataUpdatedAt, isLoading, isError, refetch } = useThread(userId)
  const { mutateAsync: markRead } = useMarkThreadRead()
  const listRef = useRef(null)
  const alreadyMarked = useRef(new Set())

  // Ouvrir le fil le marque comme lu en un appel quand il contient des messages reçus non lus (H5, Q15). Un
  // message non lu arrivé pendant que le fil est ouvert déclenche un nouvel appel (le back est idempotent).
  useEffect(() => {
    if (!messages || !user) return
    const pending = messages.filter((message) => !alreadyMarked.current.has(message.id))
    const ids = unreadIncomingIds(pending, user.id)
    if (ids.length === 0) return
    ids.forEach((id) => alreadyMarked.current.add(id))
    // Un marquage refusé est oublié : le rechargement suivant (`dataUpdatedAt` change même si les messages
    // sont identiques) le retente, au plus une fois par rechargement.
    markRead({ conversationId: userId }).catch(() => ids.forEach((id) => alreadyMarked.current.delete(id)))
  }, [messages, dataUpdatedAt, user, userId, markRead])

  // Le plus récent reste visible : seulement quand le nombre de messages change.
  const messageCount = messages?.length ?? 0
  useEffect(() => {
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [messageCount])

  if (isLoading) return <p role="status">Chargement du fil de discussion…</p>

  if (isError) {
    return (
      <div className={styles.feedback}>
        <Alert>Impossible de charger le fil de discussion.</Alert>
        <button type="button" className={styles.retry} onClick={() => refetch()}>
          Réessayer
        </button>
      </div>
    )
  }

  if (messages.length === 0) {
    return <p className={styles.empty}>Aucun message pour le moment. Écrivez le premier ci-dessous.</p>
  }

  return (
    // NOTES-34 (A7, WCAG 2.1.1) : le fil défile seul ; focalisable pour le faire défiler au clavier.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- zone de défilement (axe : scrollable-region-focusable)
    <ol ref={listRef} className={styles.list} aria-label="Messages" tabIndex={0}>
      {messages.map((message) => {
        const isMine = message.sender?.id === user?.id
        return (
          <li key={message.id} className={`${styles.message} ${isMine ? styles.mine : ''}`}>
            <p className={styles.meta}>
              <span className={styles.author}>{isMine ? 'Vous' : displayName(message.sender)}</span>
              {/* La mention est un texte ; `recipients` n'est jamais lu : il porte l'e-mail de chacun (H15). */}
              {message.isGroup && <span className={styles.groupTag}>Message groupé</span>}
              <time dateTime={message.createdAt} className={styles.date}>
                {formatMessageDate(message.createdAt)}
              </time>
            </p>
            <p className={styles.content}>{message.content}</p>
          </li>
        )
      })}
    </ol>
  )
}

export default Thread
