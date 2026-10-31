import { useLocation } from 'react-router'
import Alert from '../../../components/atoms/Alert/Alert'

// Confirmations transmises par navigation (`navigate(path, { state: { notice } })`) : rien n'est
// stocké dans le navigateur (D31) ; un rechargement de la page efface le bandeau.
const NOTICES = {
  'account-created': "Compte créé, e-mail d'activation envoyé",
  'account-updated': 'Compte mis à jour',
}

const AccountNotice = () => {
  const { state } = useLocation()
  const text = NOTICES[state?.notice]

  if (!text) return null

  return <Alert variant="success">{text}</Alert>
}

export default AccountNotice
