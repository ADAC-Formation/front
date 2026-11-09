import apiClient from '../../api/Axiosclient'

// Appels sur le compte de l'utilisateur connecté (contrat : back-readonly/docs/tech.md § 1).
// Les erreurs arrivent déjà normalisées en ApiError (intercepteur du client).

// Préférence de notification par e-mail ; renvoie l'utilisateur mis à jour (UserResponse).
export async function updateEmailNotifications(emailNotificationsEnabled) {
  const { data } = await apiClient.patch('/users/me', { emailNotificationsEnabled })
  return data
}

// Route annoncée par Charlotte (Q1), absente du back `dev` au 2026-11-09 (P4).
export async function changePassword({ oldPassword, newPassword }) {
  await apiClient.patch('/users/me/password', { oldPassword, newPassword })
}
