import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createAccount,
  fetchAccount,
  listAccounts,
  setAccountActive,
  updateAccount,
} from './api'

const accountDetailKey = (id) => ['accounts', 'detail', String(id)]
const accountListsKey = (kind) => ['accounts', kind, 'list']

export function useAccounts(kind, { active = false } = {}) {
  return useQuery({
    queryKey: [...accountListsKey(kind), active ? 'active' : 'all'],
    queryFn: () => listAccounts(kind, { active }),
  })
}

export function useAccount(id, { enabled = true } = {}) {
  return useQuery({
    queryKey: accountDetailKey(id),
    queryFn: () => fetchAccount(id),
    enabled,
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
