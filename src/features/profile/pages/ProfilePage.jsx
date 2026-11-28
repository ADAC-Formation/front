import BackButton from '../../../components/molecules/BackButton/BackButton'
import { PageShell } from '../../../templates/PageShell/PageShell'
import { ROLES } from '../../../utils/roles'
import { useCurrentUser } from '../../auth/hooks'
import DocumentsSummary from '../../documents/components/DocumentsSummary'
import ChangePasswordForm from '../components/ChangePasswordForm'
import PersonalDataSection from '../components/PersonalDataSection'
import ProfileInfo from '../components/ProfileInfo'
import styles from './ProfilePage.module.css'

// Page de profil (tickets 028, 044 ; G9, G16, P1-P7) : informations, mot de passe, pour le stagiaire et le formateur
// (NOTES-08) le résumé de « Mes documents » (le dépôt est sur la page de chaque formation), et « Mes données
// personnelles » (RGPD). Aucun réglage des e-mails : ils sont toujours envoyés, à tous les rôles (NOTES-04, P7).
const HAS_OWN_DOCUMENTS = [ROLES.STAGIAIRE, ROLES.ADMIN]

const ProfilePage = () => {
  const { user } = useCurrentUser()

  return (
    <PageShell className={styles.page}>
      <BackButton to="/" />
      <h1 className={styles.title}>Mon profil</h1>
      {user && <ProfileInfo user={user} className={styles.section} />}
      <ChangePasswordForm className={styles.section} />
      {HAS_OWN_DOCUMENTS.includes(user?.role) && <DocumentsSummary user={user} className={styles.section} />}
      <PersonalDataSection className={styles.section} />
    </PageShell>
  )
}

export default ProfilePage
