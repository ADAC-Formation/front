// Contrôle du fichier avant envoi (F21) : extension et taille seulement. Le nombre de lignes
// (1000) et le contenu sont vérifiés par le back, dont le message s'affiche.

export const MAX_IMPORT_BYTES = 2 * 1024 * 1024

export const NOT_XLSX_MESSAGE = 'Seuls les fichiers .xlsx sont acceptés.'
export const TOO_LARGE_MESSAGE = 'Le fichier dépasse la taille maximale de 2 Mo.'

// Renvoie le message d'erreur, ou null si le fichier est valide (ou absent).
export function checkImportFile(file) {
  if (!file) return null
  if (!file.name.toLowerCase().endsWith('.xlsx')) return NOT_XLSX_MESSAGE
  if (file.size > MAX_IMPORT_BYTES) return TOO_LARGE_MESSAGE
  return null
}
