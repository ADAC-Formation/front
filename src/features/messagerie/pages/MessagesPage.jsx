import { useParams } from 'react-router'
import Alert from '../../../components/atoms/Alert/Alert'
import BackButton from '../../../components/molecules/BackButton/BackButton'
import { PageShell } from '../../../templates/PageShell/PageShell'
import { useCurrentUser } from '../../auth/hooks'
import ConversationList from '../components/ConversationList'
import MessageComposer from '../components/MessageComposer'
import NewConversation from '../components/NewConversation'
import Thread from '../components/Thread'
import { useConversations, useThread } from '../hooks'
import { displayName } from '../messageLabels'
import { canWriteTo } from '../recipients'
import { useRecipients } from '../useRecipients'
import styles from './MessagesPage.module.css'

// Nom de l'interlocuteur : liste des conversations, sinon messages du fil, sinon destinataires.
function participantName(userId, { conversations, messages, recipients, me }) {
  const id = Number(userId)
  const fromConversation = conversations?.find((c) => c.conversationId === id)?.participant
  const fromMessages = messages
    ?.flatMap((message) => [message.sender, ...message.recipients])
    .find((person) => person.id === id && person.id !== me?.id)
  const person = fromConversation ?? fromMessages ?? recipients.find((r) => r.id === id)
  return person ? displayName(person) : 'Conversation'
}

// Volet de droite pour `/messages/:userId` (décisions H1, H8). L'appelant fournit `key={userId}`.
const ThreadPane = ({ userId }) => {
  const { user } = useCurrentUser()
  const thread = useThread(userId)
  const { data: conversations } = useConversations()
  const { recipients, isLoading: isCheckingRights, isError: rightsFailed, refetch } = useRecipients()

  const messages = thread.data
  const canWrite = canWriteTo(recipients, userId)
  const hasMessages = (messages?.length ?? 0) > 0
  const threadMissing =
    (thread.isError && thread.error.status === 404) || (messages !== undefined && !hasMessages)

  // Personne à qui l'on ne peut pas écrire et aucun historique : rien à montrer.
  if (!canWrite && !isCheckingRights && !rightsFailed && threadMissing) {
    return (
      <div className={styles.notFound}>
        <div className={styles.backSlot}>
          <BackButton to="/messages" />
        </div>
        <p role="status">Conversation introuvable</p>
      </div>
    )
  }

  let footer = null
  if (isCheckingRights) {
    footer = <p role="status">Vérification des droits d&apos;écriture…</p>
  } else if (rightsFailed) {
    footer = (
      <div className={styles.feedback}>
        <Alert>Impossible de vérifier vos droits d&apos;écriture.</Alert>
        <button type="button" className={styles.retry} onClick={refetch}>
          Réessayer
        </button>
      </div>
    )
  } else if (canWrite) {
    footer = <MessageComposer recipientId={Number(userId)} />
  } else if (hasMessages) {
    footer = <p className={styles.readOnly}>Vous ne pouvez pas écrire à cette personne</p>
  }

  return (
    <div className={styles.thread}>
      <div className={styles.backSlot}>
        <BackButton to="/messages" />
      </div>
      <h2 className={styles.threadTitle}>
        {participantName(userId, { conversations, messages, recipients, me: user })}
      </h2>
      <Thread userId={userId} />
      {footer}
    </div>
  )
}

const MessagesPage = () => {
  const { userId } = useParams()

  return (
    <PageShell className={styles.page}>
      <h1 className={styles.title}>Messages</h1>

      <div className={styles.host}>
        <div className={styles.layout} data-view={userId ? 'thread' : 'list'}>
          <section className={styles.listPane} aria-label="Conversations">
            <NewConversation />
            <ConversationList activeUserId={userId} />
          </section>

          <section className={styles.threadPane} aria-label="Fil de discussion">
            {userId ? (
              <ThreadPane key={userId} userId={userId} />
            ) : (
              <p className={styles.placeholder}>Sélectionnez une conversation pour afficher les messages.</p>
            )}
          </section>
        </div>
      </div>
    </PageShell>
  )
}

export default MessagesPage
