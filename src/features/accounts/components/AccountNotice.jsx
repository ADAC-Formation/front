import { useLocation } from 'react-router'
import Alert from '../../../components/atoms/Alert/Alert'

// Confirmations transmises par navigation (`navigate(path, { state: { notice } })`) : rien n'est
// stocké dans le navigateur (D31) ; un rechargement de la page efface le bandeau.
const NOTICES = {
  'account-created': "Compte créé, e-mail d'activation envoyé",
  'account-updated': 'Compte mis à jour',
}

// `enrolledIn` : intitulés des formations où le stagiaire vient d'être inscrit à sa création (J10).
const AccountNotice = () => {
  const { state } = useLocation()
  const text = NOTICES[state?.notice]

  if (!text) return null

  const enrolledIn = state.enrolledIn ?? []
  return (
    <Alert variant="success">
      <span>{text}</span>
      {enrolledIn.length > 0 && (
        <>
          <br />
          <span>{`Inscrit à : ${enrolledIn.join(', ')}.`}</span>
        </>
      )}
    </Alert>
  )
}

export default AccountNotice
