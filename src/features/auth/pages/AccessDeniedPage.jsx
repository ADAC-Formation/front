import { Link } from 'react-router'
import { PageShell } from '../../../templates/PageShell/PageShell'

// Dans le gabarit de page : le contenu part sous le logo comme sur les autres pages.
const AccessDeniedPage = () => (
  <PageShell>
    <h1>Accès refusé</h1>
    <p>Vous n&apos;avez pas les droits nécessaires pour consulter cette page.</p>
    <Link to="/">Retour à l&apos;accueil</Link>
  </PageShell>
)

export default AccessDeniedPage
