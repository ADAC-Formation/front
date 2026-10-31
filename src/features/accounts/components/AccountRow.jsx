import { Mail } from 'lucide-react'
import { Link } from 'react-router'
import { fullName } from '../accountKinds'
import styles from './AccountRow.module.css'

// Ligne de liste, même présentation que les formations : barre de couleur, titre, détails.
// La barre et le libellé suivent le statut (vert = actif, gris = inactif). Le nom est un lien
// étendu à toute la ligne ; les actions (si fournies) restent cliquables au-dessus.
const AccountRow = ({ account, to, actions }) => (
  <li
    className={styles.row}
    style={{ '--accent': account.isActive ? 'var(--color-green)' : 'var(--color-grey)' }}
  >
    <span className={styles.bar} aria-hidden="true" />

    <div className={styles.content}>
      <span className={`${styles.status} ${account.isActive ? styles.active : ''}`}>
        {account.isActive ? 'Actif' : 'Inactif'}
      </span>
      <h3 className={styles.name}>
        <Link to={to} className={styles.link}>
          {fullName(account)}
        </Link>
      </h3>
      <div className={styles.detail}>
        <Mail size={18} aria-hidden="true" />
        <span>{account.email}</span>
      </div>
    </div>

    {actions && <div className={styles.actions}>{actions}</div>}
  </li>
)

export default AccountRow
