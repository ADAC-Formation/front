import { Link } from 'react-router'

const AccessDeniedPage = () => (
  <section>
    <h1>Accès refusé</h1>
    <p>Vous n&apos;avez pas les droits nécessaires pour consulter cette page.</p>
    <Link to="/">Retour à l&apos;accueil</Link>
  </section>
)

export default AccessDeniedPage
