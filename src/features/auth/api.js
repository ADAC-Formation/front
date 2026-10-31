import apiClient from '../../api/Axiosclient'

// Appels vers /auth (contrat : back-readonly/docs/tech.md § 1). Les erreurs arrivent
// déjà normalisées en ApiError (intercepteur du client).

// Utilisateur courant ; un 401 est le cas normal d'un visiteur non connecté → null.
export async function fetchCurrentUser() {
  try {
    const { data } = await apiClient.get('/auth/me')
    return data
  } catch (error) {
    if (error.status === 401) return null
    throw error
  }
}

export async function login({ email, password }) {
  const { data } = await apiClient.post('/auth/login', { email, password })
  return data
}

export async function logout() {
  await apiClient.post('/auth/logout')
}

export async function activate({ email, code, newPassword }) {
  const { data } = await apiClient.post('/auth/activate', { email, code, newPassword })
  return data
}

export async function resendActivation({ email }) {
  const { data } = await apiClient.post('/auth/resend-activation', { email })
  return data
}

export async function forgotPassword({ email }) {
  const { data } = await apiClient.post('/auth/forgot-password', { email })
  return data
}

export async function resetPassword({ email, code, newPassword }) {
  const { data } = await apiClient.post('/auth/reset-password', { email, code, newPassword })
  return data
}
