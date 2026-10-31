import { Link } from 'react-router'
import Alert from '../../../components/atoms/Alert/Alert'
import styles from '../pages/AccountPages.module.css'

// Un 404 du back : compte inexistant (ou hors de la portée du formateur).
const AccountNotFound = ({ backPath, backLabel }) => (
  <div className={styles.page}>
    <Alert variant="error">Compte introuvable</Alert>
    <Link to={backPath}>{backLabel}</Link>
  </div>
)

export default AccountNotFound
