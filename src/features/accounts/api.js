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

// Formations où un compte est inscrit (Q16, tech.md § 2) : `[{ id, formation }]`. Réservé à la chargée de
// formation : le back répond 403 au formateur.
export async function listUserInscriptions(userId) {
  const { data } = await apiClient.get(`/users/${userId}/inscriptions`)
  return data
}

// Import de comptes par fichier Excel (NOTES-09, tech.md § POST /api/users/import) : ligne par ligne,
// `{ created: UserResponse[], errors: [{ ligne, colonne, message }] }`. Multipart : le navigateur écrit
// lui-même l'en-tête et sa limite.
export async function importAccounts(file) {
  const body = new FormData()
  body.append('file', file)
  const { data } = await apiClient.post('/users/import', body, { headers: { 'Content-Type': undefined } })
  return data
}
