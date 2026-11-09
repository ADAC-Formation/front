import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
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

const inscriptionsQuery = (id) => ({
  queryKey: [...formationDetailKey(id), 'inscriptions'],
  queryFn: () => listInscriptions(id),
})

export function useInscriptions(id, { enabled = true } = {}) {
  return useQuery({ ...inscriptionsQuery(id), enabled })
}

// Les formations où un stagiaire est inscrit, parmi celles que l'appelant peut consulter (G17). Le back
// n'a pas d'appel « inscriptions d'un compte » : on lit la liste d'inscrits de chaque formation de
// l'appelant (même clé de cache que `useInscriptions`). Un 403 / 404 (formation hors périmètre du
// formateur) est ignoré ; toute autre erreur est rendue dans `errors` sans masquer les autres formations.
// `enrolled` : [{ formation, inscriptionId }] dans l'ordre du back ; `refetch` ne relance que les listes en échec.
const isOutOfScope = (error) => error?.status === 403 || error?.status === 404

export function useStagiaireInscriptions(stagiaireId) {
  const formations = useFormations()
  const list = formations.data ?? []
  const queries = useQueries({ queries: list.map((formation) => inscriptionsQuery(formation.id)) })
  const failed = queries.filter((query) => query.isError && !isOutOfScope(query.error))

  const enrolled = []
  queries.forEach((query, index) => {
    const inscription = query.data?.find((candidate) => candidate.stagiaire?.id === stagiaireId)
    if (inscription) enrolled.push({ formation: list[index], inscriptionId: inscription.id })
  })

  return {
    enrolled,
    isLoading: formations.isLoading || queries.some((query) => query.isLoading),
    errors: [...(formations.isError ? [formations.error] : []), ...failed.map((query) => query.error)],
    refetch: () => {
      if (formations.isError) formations.refetch()
      failed.forEach((query) => query.refetch())
    },
  }
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
