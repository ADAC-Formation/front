import { Mail } from 'lucide-react'
import { Link } from 'react-router'
import { ACCOUNT_STATUS, accountStatus, accountStatusLabels, fullName } from '../accountKinds'
import styles from './AccountRow.module.css'

// La barre suit le statut (vert = actif, gris = suspendu, orange = jamais activé) ; le texte porte le sens,
// pas la couleur.
const STATUS_COLORS = {
  [ACCOUNT_STATUS.ACTIVE]: 'var(--color-green)',
  [ACCOUNT_STATUS.SUSPENDED]: 'var(--color-grey)',
  [ACCOUNT_STATUS.NEVER_ACTIVATED]: 'var(--color-orange)',
}

// Ligne de liste, même présentation que les formations : barre de couleur, titre, détails. Le nom est un lien
// étendu à toute la ligne ; les actions (si fournies) restent cliquables au-dessus.
const AccountRow = ({ account, to, actions }) => {
  const status = accountStatus(account)

  return (
    <li className={styles.row} style={{ '--accent': STATUS_COLORS[status] }}>
      <span className={styles.bar} aria-hidden="true" />

      <div className={styles.content}>
        <span className={`${styles.status} ${account.isActive ? styles.active : ''}`}>
          {accountStatusLabels[status]}
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
}

export default AccountRow
