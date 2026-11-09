import Alert from '../../../components/atoms/Alert/Alert'
import { useCurrentUser } from '../../auth/hooks'
import { useUpdateEmailNotifications } from '../hooks'
import styles from './ProfileSections.module.css'

// « Notifications par e-mail » (P3) : enregistré dès le changement, sans bouton.
const EmailNotificationToggle = ({ className }) => {
  const { user } = useCurrentUser()
  const update = useUpdateEmailNotifications()

  // Sans session connue, l'état de l'interrupteur serait faux : on attend l'utilisateur.
  if (!user) return null

  return (
    <section className={className} aria-labelledby="profile-email-title">
      <h2 id="profile-email-title">Notifications par e-mail</h2>
      <label className={styles.switch}>
        <input
          type="checkbox"
          role="switch"
          checked={Boolean(user.emailNotificationsEnabled)}
          onChange={(event) => update.mutate(event.target.checked)}
        />
        Recevoir les notifications par e-mail
      </label>
      <p className={styles.note}>Les e-mails de sécurité (activation, réinitialisation) sont toujours envoyés.</p>
      {update.isError && <Alert variant="error">{update.error.message}</Alert>}
      {update.isSuccess && <Alert variant="success">Préférences enregistrées</Alert>}
    </section>
  )
}

export default EmailNotificationToggle
