import { roleLabels } from '../../../utils/roles'
import styles from './ProfileSections.module.css'

// « Mes informations » (P1, P2) : lecture seule, rendues en texte. `className` : habillage de section de la page.
const ProfileInfo = ({ user, className }) => (
  <section className={className} aria-labelledby="profile-info-title">
    <h2 id="profile-info-title">Mes informations</h2>
    <dl className={styles.info}>
      <dt>Nom</dt>
      <dd>
        {user.prenom} {user.nom}
      </dd>
      <dt>Adresse e-mail</dt>
      <dd>{user.email}</dd>
      <dt>Rôle</dt>
      <dd>{roleLabels[user.role] ?? user.role}</dd>
    </dl>
  </section>
)

export default ProfileInfo
