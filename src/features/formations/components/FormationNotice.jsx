import { useLocation } from 'react-router'
import Alert from '../../../components/atoms/Alert/Alert'

// Confirmations transmises par navigation (`navigate(path, { state: { notice } })`) : rien n'est
// stocké dans le navigateur (D31) ; un rechargement de la page efface le bandeau.
const NOTICES = {
  'formation-created': 'Formation créée',
  'formation-updated': 'Formation mise à jour',
  'formation-archived': 'Formation archivée',
  // `count` : nombre de formations créées par l'import Excel.
  'formations-imported': (count) => `${count} ${count > 1 ? 'formations importées' : 'formation importée'}`,
}

const FormationNotice = () => {
  const { state } = useLocation()
  const notice = NOTICES[state?.notice]
  const text = typeof notice === 'function' ? notice(state.count ?? 0) : notice

  if (!text) return null

  return <Alert variant="success">{text}</Alert>
}

export default FormationNotice
