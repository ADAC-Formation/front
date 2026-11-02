import apiClient from '../../api/Axiosclient'
import { ApiError } from '../../api/ApiError'

// Appels vers /documents (contrat : back-readonly/docs/tech.md § 6). Les erreurs arrivent déjà
// normalisées en ApiError (intercepteur du client).

// Cible d'un document : `{ formationId }` (supports d'une formation) ou `{ inscriptionId }` (documents
// du stagiaire, 028), jamais les deux : le back exige exactement un des deux (tech.md § 6).
function assertTarget({ formationId, inscriptionId }) {
  if ((formationId == null) === (inscriptionId == null)) {
    throw new TypeError('Cible de document invalide : fournir formationId ou inscriptionId, pas les deux')
  }
}

const targetParams = ({ formationId, inscriptionId }) =>
  formationId != null ? { formationId } : { inscriptionId }

export async function listDocuments(target) {
  assertTarget(target)
  const { data } = await apiClient.get('/documents', { params: targetParams(target) })
  return data
}

// Un fichier par requête, multipart (champs `file` et `formationId` ou `inscriptionId`). On retire
// l'en-tête JSON par défaut du client pour que le navigateur écrive lui-même le multipart et sa limite.
export async function uploadDocument(file, target) {
  assertTarget(target)
  const body = new FormData()
  body.append('file', file)
  const [field, value] = Object.entries(targetParams(target))[0]
  body.append(field, String(value))
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
