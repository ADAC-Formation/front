import apiClient from '../../api/Axiosclient'

// Appels vers /users (contrat : back-readonly/docs/tech.md § 2). Les erreurs arrivent déjà
// normalisées en ApiError (intercepteur du client). `kind` vaut « formateurs » ou « stagiaires ».

export async function listAccounts(kind, { active } = {}) {
  const params = active ? { active: true } : undefined
  const { data } = await apiClient.get(`/users/${kind}`, { params })
  return data
}

export async function fetchAccount(id) {
  const { data } = await apiClient.get(`/users/${id}`)
  return data
}

// Un stagiaire est créé sans formation pour l'instant (le choix arrive avec feature/formations).
export async function createAccount(kind, { nom, prenom, email }) {
  const body = kind === 'stagiaires' ? { nom, prenom, email, formationIds: [] } : { nom, prenom, email }
  const { data } = await apiClient.post(`/users/${kind}`, body)
  return data
}

// `changes` ne contient que les champs modifiés : le back laisse inchangé un champ absent.
export async function updateAccount(id, changes) {
  const { data } = await apiClient.put(`/users/${id}`, changes)
  return data
}

export async function setAccountActive(id, active) {
  const { data } = await apiClient.patch(`/users/${id}/${active ? 'reactivate' : 'deactivate'}`)
  return data
}
