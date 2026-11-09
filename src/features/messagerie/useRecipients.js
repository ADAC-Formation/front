import { useCurrentUser } from '../auth/hooks'
import { useAccounts } from '../accounts/hooks'
import { useFormations } from '../formations/hooks'
import { ROLES } from '../../utils/roles'
import { allowedRecipients } from './recipients'
import { useConversations } from './hooks'

// Le SEUL endroit qui lit les données des destinataires autorisés (décision H4). Quand Charlotte
// aura ajouté `GET /messages/recipients` (Q14), seul le corps de ce hook change.
//
// En attendant, chaque rôle lit ce que le back lui montre déjà :
//   chargée de formation : formateurs et stagiaires actifs ;
//   formateur            : stagiaires actifs (périmètre fixé par le back) ;
//   stagiaire            : ses formations, donc leurs formateurs.
// Pour le formateur et le stagiaire, la chargée de formation n'est connue que par leurs conversations
// ou comme formateur d'une formation (aucun endpoint ne l'expose, Q14).
// `enabled` évite tout appel tant que « Nouvelle conversation » ou le bouton d'un compte n'en a pas besoin.
export function useRecipients({ enabled = true } = {}) {
  const { user, isLoading: isUserLoading } = useCurrentUser()
  const role = user?.role
  const active = enabled && Boolean(role)

  const conversations = useConversations({ enabled: active })
  const formateurs = useAccounts('formateurs', { active: true, enabled: active && role === ROLES.SUPER_ADMIN })
  const stagiaires = useAccounts('stagiaires', {
    active: true,
    enabled: active && (role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN),
  })
  const formations = useFormations({ enabled: active && role === ROLES.STAGIAIRE })

  const queries = [conversations, formateurs, stagiaires, formations]
  const isLoading = enabled && (isUserLoading || queries.some((query) => query.isLoading))
  const isError = queries.some((query) => query.isError)

  const recipients = allowedRecipients(user, {
    conversations: conversations.data,
    formateurs: formateurs.data,
    stagiaires: stagiaires.data,
    formations: formations.data,
  })

  const refetch = () => queries.filter((query) => query.isError).forEach((query) => query.refetch())
  return { recipients, isLoading, isError, refetch }
}
