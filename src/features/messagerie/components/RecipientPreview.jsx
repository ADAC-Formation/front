import { useId } from 'react'
import Alert from '../../../components/atoms/Alert/Alert'
import { displayName } from '../messageLabels'
import styles from './RecipientPreview.module.css'

const countLabel = (count) => (count === 1 ? '1 destinataire' : `${count} destinataires`)

// Aperçu des destinataires d'un envoi groupé (US-014 AC-03, décisions H15 et H16). Présentationnel : la page
// passe le résultat de `useGroupPreview`. Le nom seul est affiché, jamais l'e-mail (D31). Une liste vide ou un
// `400` du back (« aucun destinataire ») donnent le même message, pas une erreur : l'envoi reste simplement impossible.
const RecipientPreview = ({ recipients = [], isLoading = false, error = null, onRetry }) => {
  const titleId = useId()
  const hasNoRecipient = error?.status === 400 || (!isLoading && !error && recipients.length === 0)
  const hasFailed = Boolean(error) && error.status !== 400

  return (
    <section className={styles.preview} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.title}>
        Destinataires
      </h2>

      {isLoading && <p role="status">Chargement des destinataires…</p>}

      {hasFailed && (
        <div className={styles.feedback}>
          <Alert>Impossible de charger les destinataires.</Alert>
          <button type="button" className={styles.retry} onClick={() => onRetry?.()}>
            Réessayer
          </button>
        </div>
      )}

      {hasNoRecipient && (
        <p role="status" className={styles.empty}>
          Aucun destinataire correspondant
        </p>
      )}

      {!isLoading && !error && recipients.length > 0 && (
        <>
          <p role="status" className={styles.count}>
            {countLabel(recipients.length)}
          </p>
          {/* Liste défilante : atteignable au clavier pour pouvoir la parcourir (WCAG 2.1.1). */}
          <ul className={styles.list} aria-label="Destinataires" tabIndex={0}>
            {recipients.map((recipient) => (
              <li key={recipient.id}>{displayName(recipient)}</li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

export default RecipientPreview
