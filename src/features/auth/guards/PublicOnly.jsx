import { Navigate, Outlet } from 'react-router'
import { useCurrentUser } from '../hooks'
import SessionLoader from './SessionLoader'

// Pages réservées aux visiteurs (connexion…) : un utilisateur connecté est renvoyé vers le tableau de bord.
const PublicOnly = () => {
  const { user, isLoading } = useCurrentUser()

  if (isLoading) return <SessionLoader />
  if (user) return <Navigate to="/" replace />

  return <Outlet />
}

export default PublicOnly
