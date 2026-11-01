import apiClient from '../../api/Axiosclient'

// Appels vers /categories (contrat : back-readonly/docs/tech.md § 3). Lecture seule pour
// l'instant ; la gestion (création, modification, activation) arrive avec le ticket 049.

export async function listCategories({ active } = {}) {
  const params = active ? { active: true } : undefined
  const { data } = await apiClient.get('/categories', { params })
  return data
}
