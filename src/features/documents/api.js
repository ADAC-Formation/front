import apiClient from '../../api/Axiosclient'
import { ApiError } from '../../api/ApiError'

// Appels vers /documents (contrat : back-readonly/docs/tech.md § 6). Les erreurs arrivent déjà
// normalisées en ApiError (intercepteur du client).

export async function listDocuments(formationId) {
  const { data } = await apiClient.get('/documents', { params: { formationId } })
  return data
}

// Un fichier par requête, multipart (champs `file` et `formationId`). On retire l'en-tête JSON par
// défaut du client pour que le navigateur écrive lui-même le multipart et sa limite.
export async function uploadDocument(file, formationId) {
  const body = new FormData()
  body.append('file', file)
  body.append('formationId', String(formationId))
  const { data } = await apiClient.post('/documents', body, { headers: { 'Content-Type': undefined } })
  return data
}

export async function deleteDocument(id) {
  await apiClient.delete(`/documents/${id}`)
}

// Messages français quand le back refuse un téléchargement : avec `responseType: 'blob'`, le corps
// d'erreur arrive en Blob et l'intercepteur n'en lit pas le `message` (G1).
const DOWNLOAD_ERRORS = {
  403: "Vous n'avez pas accès à ce document.",
  404: 'Document introuvable : il a peut-être été supprimé.',
}

// Renvoie le binaire du document (proxy du back, derrière la session) ; jamais `fileUrl`.
export async function downloadDocument(id) {
  try {
    const { data } = await apiClient.get(`/documents/${id}/download`, { responseType: 'blob' })
    return data
  } catch (error) {
    const message = DOWNLOAD_ERRORS[error.status]
    if (!message) throw error
    throw new ApiError({ status: error.status, message, details: error.details })
  }
}
