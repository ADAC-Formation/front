import { useId, useState } from 'react'
import { Link } from 'react-router'
import Alert from '../../../components/atoms/Alert/Alert'
import { roleLabels } from '../../../utils/roles'
import { useRecipients } from '../useRecipients'
import { displayName } from '../messageLabels'
import styles from './NewConversation.module.css'

// « Nouvelle conversation » : les destinataires autorisés pour le rôle (décision H1). Rien n'est
// chargé tant que le panneau n'est pas ouvert. Choisir quelqu'un ouvre son fil (`/messages/:id`).
const NewConversation = () => {
  const [open, setOpen] = useState(false)
  const titleId = useId()
  const { recipients, isLoading, isError, refetch } = useRecipients({ enabled: open })

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        Nouvelle conversation
      </button>

      {open && (
        <section className={styles.panel} aria-labelledby={titleId}>
          <h2 id={titleId} className={styles.title}>
            Nouvelle conversation
          </h2>

          {isLoading && <p role="status">Chargement des destinataires…</p>}

          {isError && (
            <div className={styles.feedback}>
              <Alert>Impossible de charger les destinataires.</Alert>
              <button type="button" className={styles.retry} onClick={refetch}>
                Réessayer
              </button>
            </div>
          )}

          {!isLoading && !isError && recipients.length === 0 && (
            <p className={styles.empty}>Aucun destinataire disponible pour le moment.</p>
          )}

          {!isLoading && !isError && recipients.length > 0 && (
            <ul className={styles.list}>
              {recipients.map((recipient) => (
                <li key={recipient.id}>
                  <Link to={`/messages/${recipient.id}`} className={styles.link}>
                    {displayName(recipient)} — {roleLabels[recipient.role]}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}

export default NewConversation
