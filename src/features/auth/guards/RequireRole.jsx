import { Outlet } from 'react-router'
import { useCurrentUser } from '../hooks'
import AccessDeniedPage from '../pages/AccessDeniedPage'

// Garde de rôle, à placer sous RequireAuth. Aide d'interface : le back reste l'autorité (403/404).
const RequireRole = ({ roles }) => {
  const { user } = useCurrentUser()

  if (!user || !roles.includes(user.role)) return <AccessDeniedPage />

  return <Outlet />
}

export default RequireRole
