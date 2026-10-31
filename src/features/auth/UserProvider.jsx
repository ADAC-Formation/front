import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { setUnauthorizedHandler } from '../../api/Axiosclient'
import { endSession } from './hooks'

// Branche le 401 du client API sur l'application (D12, D51) : session vidée puis redirection
// vers /login avec la notice « session expirée », sans rechargement de la page.
// L'utilisateur courant lui-même est lu par `useCurrentUser` (requête GET /auth/me) :
// aucun contexte parallèle à maintenir. Doit être monté sous le routeur.
const UserProvider = ({ children }) => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  useEffect(() => {
    setUnauthorizedHandler(() => {
      endSession(queryClient)
      navigate('/login', { replace: true, state: { notice: 'session-expired' } })
    })
    return () => setUnauthorizedHandler(null)
  }, [queryClient, navigate])

  return children
}

export default UserProvider
