import { Navigate, Outlet } from 'react-router'
import Alert from '../../../components/atoms/Alert/Alert'
import FormButton from '../../../components/atoms/FormButton/FormButton'
import { useCurrentUser } from '../hooks'
import SessionLoader from './SessionLoader'

// Garde de routes : tout ce qui est dessous exige une session (D9). Le back reste l'autorité.
const RequireAuth = () => {
  const { user, isLoading, isError, refetch } = useCurrentUser()

  if (isLoading) return <SessionLoader />

  // Erreur autre que 401 (réseau, 500) : ne pas rediriger, sinon boucle /login <-> /.
  if (isError) {
    return (
      <div>
        <Alert variant="error">
          Impossible de vérifier votre session. Vérifiez votre connexion et réessayez.
        </Alert>
        <FormButton onClick={() => refetch()}>Réessayer</FormButton>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return <Outlet />
}

export default RequireAuth
