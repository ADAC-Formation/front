import BackButton from '../../../components/molecules/BackButton/BackButton'
import Alert from '../../../components/atoms/Alert/Alert'
import styles from '../pages/AccountPages.module.css'

// Un 404 du back : compte inexistant (ou hors de la portée du formateur).
const AccountNotFound = ({ backPath, backLabel }) => (
  <div className={styles.page}>
    <BackButton to={backPath}>{backLabel}</BackButton>
    <Alert variant="error">Compte introuvable</Alert>
  </div>
)

export default AccountNotFound
