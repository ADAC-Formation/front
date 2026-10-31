import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import {
  activate,
  fetchCurrentUser,
  forgotPassword,
  login,
  logout,
  resendActivation,
  resetPassword,
} from './api'

// La session est une requête TanStack Query, pas un état parallèle : une seule source de vérité.
export const CURRENT_USER_KEY = ['auth', 'me']
const SESSION_STALE_TIME = 5 * 60 * 1000

export function useCurrentUser() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: CURRENT_USER_KEY,
    queryFn: fetchCurrentUser,
    staleTime: SESSION_STALE_TIME,
  })
  return { user: data ?? null, isLoading, isError, error, refetch }
}

// Termine la session : annule les requêtes en cours, supprime toute donnée mise en cache
// (pour qu'un utilisateur ne voie jamais celles du précédent) et passe l'utilisateur à null.
export function endSession(queryClient) {
  queryClient.cancelQueries()
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== CURRENT_USER_KEY[0] })
  queryClient.setQueryData(CURRENT_USER_KEY, null)
}

export function useLogin() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: login,
    onSuccess: (user) => {
      queryClient.setQueryData(CURRENT_USER_KEY, user)
      navigate('/', { replace: true })
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: logout,
    // Succès ou échec (ex. 401 : session déjà expirée), l'utilisateur est déconnecté côté front.
    onSettled: () => {
      endSession(queryClient)
      navigate('/login', { replace: true })
    },
  })
}

// Succès → retour à la connexion avec un bandeau (transmis par la navigation, rien n'est stocké).
function useBackToLogin(mutationFn, notice) {
  const navigate = useNavigate()
  return useMutation({
    mutationFn,
    onSuccess: () => navigate('/login', { replace: true, state: { notice } }),
  })
}

export const useActivate = () => useBackToLogin(activate, 'activated')
export const useResetPassword = () => useBackToLogin(resetPassword, 'password-reset')
export const useResendActivation = () => useMutation({ mutationFn: resendActivation })
export const useForgotPassword = () => useMutation({ mutationFn: forgotPassword })
