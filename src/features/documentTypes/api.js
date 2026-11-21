import apiClient from '../../api/Axiosclient'

// Appels vers /document-types (contrat : openspec/changes/document-types-catalogue/design.md § 3 et
// back-readonly/docs/tech.md « Types de document »). SUPER_ADMIN seulement. Les erreurs arrivent
// déjà normalisées en ApiError (intercepteur du client). Aucune suppression n'existe côté back.

export async function listDocumentTypes({ active } = {}) {
  const params = active ? { active: true } : undefined
  const { data } = await apiClient.get('/document-types', { params })
  return data
}

// `body` : voir `toRequest` dans documentTypeForm.js ; `409` si le nom est déjà utilisé.
export async function createDocumentType(body) {
  const { data } = await apiClient.post('/document-types', body)
  return data
}

// `PUT` remplace tous les champs : le corps est toujours complet.
export async function updateDocumentType(id, body) {
  const { data } = await apiClient.put(`/document-types/${id}`, body)
  return data
}

export async function setDocumentTypeActive(id, active) {
  const { data } = await apiClient.patch(`/document-types/${id}/${active ? 'activate' : 'deactivate'}`)
  return data
}
