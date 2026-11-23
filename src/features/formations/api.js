import apiClient from '../../api/Axiosclient'

// Appels vers /formations (contrat : back-readonly/docs/tech.md § 4 et 5). Les erreurs arrivent
// déjà normalisées en ApiError (intercepteur du client).

export async function listFormations({ status } = {}) {
  const params = status ? { status } : undefined
  const { data } = await apiClient.get('/formations', { params })
  return data
}

export async function fetchFormation(id) {
  const { data } = await apiClient.get(`/formations/${id}`)
  return data
}

// Réservé à SUPER_ADMIN et ADMIN : le back refuse le stagiaire (l'e-mail des co-inscrits).
export async function listInscriptions(id) {
  const { data } = await apiClient.get(`/formations/${id}/inscriptions`)
  return data
}

// SUPER_ADMIN seulement (décisions J1–J9). `201` → InscriptionResponse ; `400` formation archivée ;
// `404` stagiaire inconnu ou suspendu (un compte jamais activé est accepté, J2) ; `409` déjà inscrit.
export async function enrollStagiaire(formationId, stagiaireId) {
  const { data } = await apiClient.post(`/formations/${formationId}/inscriptions`, { stagiaireId })
  return data
}

// SUPER_ADMIN seulement. Supprime aussi les documents de l'inscription (J6) ; `409` sur une formation
// archivée (J7) ; idempotent (`204` même si le stagiaire n'était pas inscrit).
export async function unenrollStagiaire(formationId, stagiaireId) {
  await apiClient.delete(`/formations/${formationId}/inscriptions/${stagiaireId}`)
}

export async function archiveFormation(id) {
  const { data } = await apiClient.patch(`/formations/${id}/archive`)
  return data
}

// SUPER_ADMIN seulement. `body` : champs du contrat (voir `toRequest` dans formationForm.js).
export async function createFormation(body) {
  const { data } = await apiClient.post('/formations', body)
  return data
}

// `changes` ne contient que les champs modifiés : le back laisse inchangé un champ absent.
export async function updateFormation(id, changes) {
  const { data } = await apiClient.put(`/formations/${id}`, changes)
  return data
}

// SUPER_ADMIN seulement. Envoie le fichier .xlsx en multipart (champ `file`). On retire l'en-tête
// JSON par défaut du client pour que le navigateur écrive lui-même le multipart et sa limite.
// Tout ou rien : `201` → FormationResponse[] ; `400` → `message` listant les lignes en erreur (F20).
export async function importFormations(file) {
  const body = new FormData()
  body.append('file', file)
  const { data } = await apiClient.post('/formations/import', body, {
    headers: { 'Content-Type': undefined },
  })
  return data
}
