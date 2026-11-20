import { useId } from 'react'
import { Link } from 'react-router'
import Alert from '../../../components/atoms/Alert/Alert'
import { roleLabels } from '../../../utils/roles'
import { useRecipients } from '../useRecipients'
import { displayName } from '../messageLabels'
import { filterRecipients } from '../conversationFilters'
import styles from './NewConversation.module.css'

// Panneau « Nouvelle conversation » : les destinataires autorisés pour le rôle (décision H1). Il est
// monté seulement quand la page l'ouvre (bouton de l'en-tête) : rien n'est chargé avant. Choisir
// quelqu'un ouvre son fil (`/messages/:id`) et ferme le panneau. Le rôle et la recherche de la page s'appliquent
// aussi à cette liste (`filters`).
const NewConversation = ({ onClose, filters }) => {
  const titleId = useId()
  const { recipients: allRecipients, isLoading, isError, refetch } = useRecipients()
  const recipients = filterRecipients(allRecipients, filters)

  return (
    <section className={styles.panel} aria-labelledby={titleId}>
      <div className={styles.header}>
        <h2 id={titleId} className={styles.title}>
          Nouvelle conversation
        </h2>
        <button type="button" className={styles.close} onClick={onClose}>
          Fermer
        </button>
      </div>

      {isLoading && <p role="status">Chargement des destinataires…</p>}

      {isError && (
        <div className={styles.feedback}>
          <Alert>Impossible de charger les destinataires.</Alert>
          <button type="button" className={styles.retry} onClick={refetch}>
            Réessayer
          </button>
        </div>
      )}

      {!isLoading && !isError && allRecipients.length === 0 && (
        <p className={styles.empty}>Aucun destinataire disponible pour le moment.</p>
      )}

      {!isLoading && !isError && allRecipients.length > 0 && recipients.length === 0 && (
        <p className={styles.empty}>Aucun destinataire ne correspond à la recherche ou au rôle choisi.</p>
      )}

      {!isLoading && !isError && recipients.length > 0 && (
        <ul className={styles.list}>
          {recipients.map((recipient) => (
            <li key={recipient.id}>
              <Link to={`/messages/${recipient.id}`} className={styles.link} onClick={onClose}>
                {displayName(recipient)} — {roleLabels[recipient.role]}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default NewConversation
