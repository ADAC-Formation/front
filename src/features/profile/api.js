import apiClient from '../../api/Axiosclient'

// Appels sur le compte de l'utilisateur connecté (contrat : back-readonly/docs/tech.md § 1).
// Les erreurs arrivent déjà normalisées en ApiError (intercepteur du client).

// Route annoncée par Charlotte (Q1), absente du back `dev` au 2026-11-09 (P4).
export async function changePassword({ oldPassword, newPassword }) {
  await apiClient.patch('/users/me/password', { oldPassword, newPassword })
}
