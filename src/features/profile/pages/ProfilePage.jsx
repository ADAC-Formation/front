import BackButton from '../../../components/molecules/BackButton/BackButton'
import { PageShell } from '../../../templates/PageShell/PageShell'
import { ROLES } from '../../../utils/roles'
import { useCurrentUser } from '../../auth/hooks'
import DocumentsSummary from '../../documents/components/DocumentsSummary'
import ChangePasswordForm from '../components/ChangePasswordForm'
import EmailNotificationToggle from '../components/EmailNotificationToggle'
import ProfileInfo from '../components/ProfileInfo'
import styles from './ProfilePage.module.css'

// Page de profil (tickets 028, 036, 044 ; G9, G16, P1-P5) : informations, notifications par e-mail,
// mot de passe et, pour le seul stagiaire, le résumé de « Mes documents » (le dépôt est sur la page de chaque formation).
const ProfilePage = () => {
  const { user } = useCurrentUser()

  return (
    <PageShell className={styles.page}>
      <BackButton to="/" />
      <h1 className={styles.title}>Mon profil</h1>
      {user && <ProfileInfo user={user} className={styles.section} />}
      <EmailNotificationToggle className={styles.section} />
      <ChangePasswordForm className={styles.section} />
      {user?.role === ROLES.STAGIAIRE && <DocumentsSummary className={styles.section} />}
    </PageShell>
  )
}

export default ProfilePage
