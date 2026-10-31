import { isRouteErrorResponse, useRouteError } from 'react-router'
import Alert from '../components/atoms/Alert/Alert'
import FormButton from '../components/atoms/FormButton/FormButton'
import BackButton from '../components/molecules/BackButton/BackButton'
import { reloadPage } from './reloadPage'
import styles from './RouteError.module.css'

// Écran d'erreur de route : remplace l'écran du routeur (en anglais). Cas principal : le code d'une
// page n'a pas pu être téléchargé (réseau coupé, fichier remplacé par un déploiement pendant que
// l'onglet était ouvert). Recharger l'application récupère la nouvelle version.
const RouteError = () => {
  const error = useRouteError()

  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <main className={styles.page}>
        <h1>Page introuvable</h1>
        <p>Cette adresse ne correspond à aucune page du portail.</p>
        <BackButton to="/">Retour à l’accueil</BackButton>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Une erreur est survenue</h1>
      <Alert variant="error">
        Cette page n'a pas pu être chargée. Vérifiez votre connexion, puis réessayez.
      </Alert>
      <FormButton onClick={reloadPage}>Réessayer</FormButton>
    </main>
  )
}

export default RouteError
