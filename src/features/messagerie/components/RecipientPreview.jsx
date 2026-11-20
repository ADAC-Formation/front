import { useId } from 'react'
import Alert from '../../../components/atoms/Alert/Alert'
import { displayName } from '../messageLabels'
import styles from './RecipientPreview.module.css'

const countLabel = (count) => (count === 1 ? '1 destinataire' : `${count} destinataires`)

// Aperçu des destinataires d'un envoi groupé (US-014 AC-03, décisions H15 et H16). Présentationnel : la page
// passe le résultat de `useGroupPreview`. Avec `onToggle`, chaque personne a une case (cochée sauf si son id est dans
// `excludedIds`, H20) et le décompte devient « X sur Y destinataires » dès qu'on en décoche. Le nom seul est affiché, jamais l'e-mail (D31). Un groupe vide (le back
// répond `200 []`, H18) affiche « Aucun destinataire correspondant » et l'envoi reste impossible ; toute erreur,
// `400` compris, est une vraie erreur avec « Réessayer ».
const RecipientPreview = ({ recipients = [], isLoading = false, error = null, onRetry, excludedIds, onToggle }) => {
  const titleId = useId()
  const hasNoRecipient = !isLoading && !error && recipients.length === 0
  const hasFailed = Boolean(error)
  const selectable = Boolean(onToggle)
  const keptCount = recipients.filter((recipient) => !excludedIds?.has(recipient.id)).length

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
            {keptCount === recipients.length ? countLabel(recipients.length) : `${keptCount} sur ${countLabel(recipients.length)}`}
          </p>
          {/* Liste défilante : atteignable au clavier pour pouvoir la parcourir (WCAG 2.1.1). */}
          <ul className={styles.list} aria-label="Destinataires" tabIndex={0}>
            {recipients.map((recipient) => (
              <li key={recipient.id}>
                {selectable ? (
                  <label className={styles.option}>
                    <input
                      type="checkbox"
                      checked={!excludedIds?.has(recipient.id)}
                      onChange={() => onToggle(recipient.id)}
                    />
                    {displayName(recipient)}
                  </label>
                ) : (
                  displayName(recipient)
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

export default RecipientPreview
