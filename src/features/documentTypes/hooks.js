import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createDocumentType,
  listDocumentTypes,
  listFormationDocumentTypes,
  setDocumentTypeActive,
  updateDocumentType,
} from './api'

export function useDocumentTypes({ active = false, enabled = true } = {}) {
  return useQuery({
    queryKey: ['document-types', 'list', active ? 'active' : 'all'],
    queryFn: () => listDocumentTypes({ active }),
    enabled,
  })
}

// Types à envoyer pour une formation. Clé hors de `['document-types', 'list']` : une modification du
// catalogue (`['document-types']`) la recharge aussi.
export function useFormationDocumentTypes(formationId, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['document-types', 'formation', formationId],
    queryFn: () => listFormationDocumentTypes(formationId),
    enabled,
  })
}

// Après une écriture, les listes sont rechargées depuis le back (jamais d'état optimiste).
function useRefreshDocumentTypes() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['document-types'] })
}

export function useCreateDocumentType() {
  const refresh = useRefreshDocumentTypes()
  return useMutation({ mutationFn: createDocumentType, onSuccess: refresh })
}

export function useUpdateDocumentType(id) {
  const refresh = useRefreshDocumentTypes()
  return useMutation({ mutationFn: (body) => updateDocumentType(id, body), onSuccess: refresh })
}

export function useSetDocumentTypeActive() {
  const refresh = useRefreshDocumentTypes()
  return useMutation({ mutationFn: ({ id, active }) => setDocumentTypeActive(id, active), onSuccess: refresh })
}
