import BackButton from '../../../components/molecules/BackButton/BackButton'
import { PageShell } from '../../../templates/PageShell/PageShell'
import { ROLES } from '../../../utils/roles'
import { useCurrentUser } from '../../auth/hooks'
import DocumentsSummary from '../../documents/components/DocumentsSummary'
import styles from './ProfilePage.module.css'

// Page de profil (TICKET-028, G9, G16). Pour l'instant : le titre et, pour le seul stagiaire, le résumé de
// « Mes documents » (le dépôt est sur la page de chaque formation). Les informations, le mot de passe et la bascule e-mail viennent avec TICKET-044.
const ProfilePage = () => {
  const { user } = useCurrentUser()

  return (
    <PageShell className={styles.page}>
      <BackButton to="/" />
      <h1 className={styles.title}>Mon profil</h1>
      {user?.role === ROLES.STAGIAIRE && <DocumentsSummary className={styles.section} />}
    </PageShell>
  )
}

export default ProfilePage
