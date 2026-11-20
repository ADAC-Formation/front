import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { resendActivation } from '../auth/api'
import {
  createAccount,
  fetchAccount,
  importAccounts,
  listAccounts,
  setAccountActive,
  updateAccount,
} from './api'

const accountDetailKey = (id) => ['accounts', 'detail', String(id)]
const accountListsKey = (kind) => ['accounts', kind, 'list']

export function useAccounts(kind, { active = false, enabled = true } = {}) {
  return useQuery({
    queryKey: [...accountListsKey(kind), active ? 'active' : 'all'],
    queryFn: () => listAccounts(kind, { active }),
    enabled,
  })
}

export function useAccount(id, { enabled = true } = {}) {
  return useQuery({
    queryKey: accountDetailKey(id),
    queryFn: () => fetchAccount(id),
    enabled,
  })
}

// Import Excel (NOTES-09) : formateurs et stagiaires à la fois, on recharge les deux listes.
export function useImportAccounts() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: importAccounts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountListsKey('formateurs') })
      queryClient.invalidateQueries({ queryKey: accountListsKey('stagiaires') })
    },
  })
}

export function useCreateAccount(kind) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values) => createAccount(kind, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountListsKey(kind) }),
  })
}

const EDITABLE_FIELDS = ['nom', 'prenom', 'email']

// Ne garde que les champs réellement modifiés (le back traite un champ absent comme « inchangé »).
function changedFields(original, values) {
  return Object.fromEntries(
    EDITABLE_FIELDS.filter((field) => values[field] !== original[field]).map((field) => [
      field,
      values[field],
    ]),
  )
}

// Les listes et le détail reflètent la réponse du back, jamais un état optimiste.
function useRefreshAccounts() {
  const queryClient = useQueryClient()
  return (account) => {
    queryClient.setQueryData(accountDetailKey(account.id), account)
    queryClient.invalidateQueries({ queryKey: ['accounts'], predicate: (query) => query.queryKey[1] !== 'detail' })
  }
}

export function useUpdateAccount(id) {
  const refresh = useRefreshAccounts()
  return useMutation({
    mutationFn: ({ original, values }) => updateAccount(id, changedFields(original, values)),
    onSuccess: refresh,
  })
}

export function useSetAccountActive() {
  const refresh = useRefreshAccounts()
  return useMutation({
    mutationFn: ({ id, active }) => setAccountActive(id, active),
    onSuccess: refresh,
  })
}

// Renvoie un code d'activation à un compte jamais activé (POST /auth/resend-activation, 3 codes par 15 min).
// Rien à recharger : le compte reste « jamais activé » jusqu'à ce que la personne active son compte.
export function useResendActivation() {
  return useMutation({ mutationFn: ({ email }) => resendActivation({ email }) })
}
