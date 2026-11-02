import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  archiveFormation,
  createFormation,
  fetchFormation,
  importFormations,
  listFormations,
  listInscriptions,
  updateFormation,
} from './api'

// Toutes les clés commencent par ['formations'] : une seule invalidation les couvre (design § 2).
const FORMATIONS_KEY = ['formations']
const formationDetailKey = (id) => [...FORMATIONS_KEY, 'detail', String(id)]

export function useFormations({ status } = {}) {
  return useQuery({
    queryKey: [...FORMATIONS_KEY, 'list', status ?? 'all'],
    queryFn: () => listFormations({ status }),
  })
}

export function useFormation(id, { enabled = true } = {}) {
  return useQuery({
    queryKey: formationDetailKey(id),
    queryFn: () => fetchFormation(id),
    enabled,
  })
}

export function useInscriptions(id, { enabled = true } = {}) {
  return useQuery({
    queryKey: [...formationDetailKey(id), 'inscriptions'],
    queryFn: () => listInscriptions(id),
    enabled,
  })
}

export function useArchiveFormation(id) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => archiveFormation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FORMATIONS_KEY }),
  })
}

export function useCreateFormation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createFormation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FORMATIONS_KEY }),
  })
}

export function useUpdateFormation(id) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (changes) => updateFormation(id, changes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FORMATIONS_KEY }),
  })
}

export function useImportFormations() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: importFormations,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FORMATIONS_KEY }),
  })
}
