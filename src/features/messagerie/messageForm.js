// Validation du message (D13) : le back impose un contenu non vide de 5000 caractères au plus
// (`SendMessageRequest`) ; le front le vérifie avant tout appel (décision H9).

export const MAX_MESSAGE_LENGTH = 5000
// Le compteur n'apparaît qu'à l'approche de la limite.
export const REMAINING_WARNING_THRESHOLD = 500

export function validateMessage(content) {
  if (content.trim() === '') return 'Le message est obligatoire.'
  if (content.length > MAX_MESSAGE_LENGTH) {
    return `Le message ne doit pas dépasser ${MAX_MESSAGE_LENGTH} caractères.`
  }
  return null
}

export function remainingCharacters(content) {
  return MAX_MESSAGE_LENGTH - content.length
}
