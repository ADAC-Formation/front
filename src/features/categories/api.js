import apiClient from '../../api/Axiosclient'

// Appels vers /categories (contrat : back-readonly/docs/tech.md § 3). Les erreurs arrivent déjà
// normalisées en ApiError (intercepteur du client). Aucune suppression n'existe côté back.

export async function listCategories({ active } = {}) {
  const params = active ? { active: true } : undefined
  const { data } = await apiClient.get('/categories', { params })
  return data
}

// SUPER_ADMIN seulement. `body` : { nom, couleur } (voir `toRequest` dans categoryForm.js) ;
// `409` si le nom est déjà utilisé.
export async function createCategory(body) {
  const { data } = await apiClient.post('/categories', body)
  return data
}

// `PUT` remplace le nom et la couleur : les deux sont toujours envoyés.
export async function updateCategory(id, body) {
  const { data } = await apiClient.put(`/categories/${id}`, body)
  return data
}

export async function setCategoryActive(id, active) {
  const { data } = await apiClient.patch(`/categories/${id}/${active ? 'activate' : 'deactivate'}`)
  return data
}
