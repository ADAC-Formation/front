import { PageShell } from '../../../templates/PageShell/PageShell'
import { ROLES } from '../../../utils/roles'
import { useCurrentUser } from '../../auth/hooks'
import StagiaireDocSection from '../../documents/components/StagiaireDocSection'
import styles from './ProfilePage.module.css'

// Page de profil (TICKET-028, G9). Pour l'instant : le titre et, pour le seul stagiaire, « Mes
// documents ». Les informations, le mot de passe et la bascule e-mail viennent avec TICKET-044.
const ProfilePage = () => {
  const { user } = useCurrentUser()

  return (
    <PageShell className={styles.page}>
      <h1 className={styles.title}>Mon profil</h1>
      {user?.role === ROLES.STAGIAIRE && <StagiaireDocSection className={styles.section} />}
    </PageShell>
  )
}

export default ProfilePage
