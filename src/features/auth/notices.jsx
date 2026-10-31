import { useLocation } from 'react-router'
import Alert from '../../components/atoms/Alert/Alert'

// Bandeaux transmis par navigation (`navigate('/login', { state: { notice } })`) : rien n'est
// stocké dans le navigateur (D31) ; un rechargement de la page efface le bandeau.
const NOTICES = {
  activated: { variant: 'success', text: 'Compte activé avec succès' },
  'password-reset': { variant: 'success', text: 'Mot de passe mis à jour' },
  'session-expired': { variant: 'info', text: 'Votre session a expiré. Veuillez vous reconnecter.' },
}

export const NoticeBanner = () => {
  const { state } = useLocation()
  const notice = NOTICES[state?.notice]

  if (!notice) return null

  return <Alert variant={notice.variant}>{notice.text}</Alert>
}
