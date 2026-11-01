import BackButton from '../../../components/molecules/BackButton/BackButton'
import Alert from '../../../components/atoms/Alert/Alert'
import styles from '../pages/AccountPages.module.css'
import { PageShell } from '../../../templates/PageShell/PageShell'

// Un 404 du back : compte inexistant (ou hors de la portée du formateur).
const AccountNotFound = ({ backPath, backLabel }) => (
  <PageShell className={styles.page}>
    <BackButton to={backPath}>{backLabel}</BackButton>
    <Alert variant="error">Compte introuvable</Alert>
  </PageShell>
)

export default AccountNotFound
