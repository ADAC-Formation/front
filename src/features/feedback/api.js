import apiClient from '../../api/Axiosclient'

// Envoi d'un retour (bug ou suggestion) au développeur : POST /feedback, multipart (tech.md § 9).
// Le back envoie un email et ne stocke rien ; l'auteur est l'utilisateur de session, jamais un champ
// envoyé ici. Les erreurs arrivent normalisées en ApiError (intercepteur du client).

// Contexte joint à chaque retour, et seulement celui-ci (spec client-feedback) : chemin de la page
// sans paramètres ni fragment (ils peuvent contenir des identifiants), navigateur, taille de fenêtre,
// version de l'application. `win` est injectable pour les tests.
export function collectFeedbackContext(win = window) {
  return {
    page: win.location.pathname,
    userAgent: win.navigator.userAgent,
    viewport: `${win.innerWidth}x${win.innerHeight}`,
    appVersion: __APP_VERSION__,
  }
}

// On retire l'en-tête JSON par défaut du client pour que le navigateur écrive lui-même le multipart
// et sa limite (même motif que `uploadDocument`).
export async function sendFeedback({ type, message, screenshot, context }) {
  const body = new FormData()
  body.append('type', type)
  body.append('message', message)
  Object.entries(context).forEach(([field, value]) => body.append(field, value))
  if (screenshot) body.append('screenshot', screenshot)
  await apiClient.post('/feedback', body, { headers: { 'Content-Type': undefined } })
}
