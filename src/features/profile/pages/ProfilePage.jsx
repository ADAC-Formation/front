import BackButton from '../../../components/molecules/BackButton/BackButton'
import { PageShell } from '../../../templates/PageShell/PageShell'
import { ROLES } from '../../../utils/roles'
import { useCurrentUser } from '../../auth/hooks'
import DocumentsSummary from '../../documents/components/DocumentsSummary'
import ChangePasswordForm from '../components/ChangePasswordForm'
import EmailNotificationToggle from '../components/EmailNotificationToggle'
import ProfileInfo from '../components/ProfileInfo'
import styles from './ProfilePage.module.css'

// Page de profil (tickets 028, 036, 044 ; G9, G16, P1-P5) : informations, notifications par e-mail (sauf stagiaire),
// mot de passe et, pour le stagiaire et le formateur (NOTES-08), le résumé de « Mes documents » (le dépôt est sur la
// page de chaque formation). La chargée de formation n'a pas ce résumé.
const HAS_OWN_DOCUMENTS = [ROLES.STAGIAIRE, ROLES.ADMIN]
// Le stagiaire n'a pas le réglage des e-mails (NOTES-04, ind. 30) : il doit recevoir les relances, dont le
// questionnaire à froid. Le back n'impose encore rien (`points-pour-charlotte.md`).
const HAS_EMAIL_SETTING = [ROLES.ADMIN, ROLES.SUPER_ADMIN]

const ProfilePage = () => {
  const { user } = useCurrentUser()

  return (
    <PageShell className={styles.page}>
      <BackButton to="/" />
      <h1 className={styles.title}>Mon profil</h1>
      {user && <ProfileInfo user={user} className={styles.section} />}
      {HAS_EMAIL_SETTING.includes(user?.role) && <EmailNotificationToggle className={styles.section} />}
      <ChangePasswordForm className={styles.section} />
      {HAS_OWN_DOCUMENTS.includes(user?.role) && <DocumentsSummary user={user} className={styles.section} />}
    </PageShell>
  )
}

export default ProfilePage
