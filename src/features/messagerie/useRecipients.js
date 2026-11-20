import { useQuery } from '@tanstack/react-query'
import { useCurrentUser } from '../auth/hooks'
import { useAccounts } from '../accounts/hooks'
import { useFormations } from '../formations/hooks'
import { ROLES } from '../../utils/roles'
import { listRecipients } from './api'
import { allowedRecipients } from './recipients'
import { useConversations } from './hooks'

// Le SEUL endroit qui lit les données des destinataires autorisés (décision H4). Chaque rôle lit ce que le
// back lui montre déjà (règle H1) :
//   chargée de formation : formateurs et stagiaires actifs ;
//   formateur            : stagiaires actifs (périmètre fixé par le back) ;
//   stagiaire            : ses formations, donc leurs formateurs.
// Le formateur et le stagiaire trouvent en plus la chargée de formation avec `GET /messages/recipients` (Q14,
// mergé dans le back). Ce que cet endpoint renvoie dépasse H1 (tout formateur ou stagiaire actif) : on n'en
// garde que la chargée de formation, décision de Manon du 2026-11-20 (H19).
// `enabled` évite tout appel tant que « Nouvelle conversation » ou le bouton d'un compte n'en a pas besoin.
export function useRecipients({ enabled = true } = {}) {
  const { user, isLoading: isUserLoading } = useCurrentUser()
  const role = user?.role
  const active = enabled && Boolean(role)

  const contacts = useQuery({
    queryKey: ['recipients'],
    queryFn: listRecipients,
    enabled: active && (role === ROLES.ADMIN || role === ROLES.STAGIAIRE),
  })
  const conversations = useConversations({ enabled: active })
  const formateurs = useAccounts('formateurs', { active: true, enabled: active && role === ROLES.SUPER_ADMIN })
  const stagiaires = useAccounts('stagiaires', {
    active: true,
    enabled: active && (role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN),
  })
  const formations = useFormations({ enabled: active && role === ROLES.STAGIAIRE })

  const queries = [contacts, conversations, formateurs, stagiaires, formations]
  const isLoading = enabled && (isUserLoading || queries.some((query) => query.isLoading))
  const isError = queries.some((query) => query.isError)

  const recipients = allowedRecipients(user, {
    contacts: contacts.data,
    conversations: conversations.data,
    formateurs: formateurs.data,
    stagiaires: stagiaires.data,
    formations: formations.data,
  })

  const refetch = () => queries.filter((query) => query.isError).forEach((query) => query.refetch())
  return { recipients, isLoading, isError, refetch }
}
