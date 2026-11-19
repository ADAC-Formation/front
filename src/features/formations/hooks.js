import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { listUserInscriptions } from '../accounts/api'
import { useCurrentUser } from '../auth/hooks'
import { ROLES } from '../../utils/roles'
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

export function useFormations({ status, enabled = true } = {}) {
  return useQuery({
    queryKey: [...FORMATIONS_KEY, 'list', status ?? 'all'],
    queryFn: () => listFormations({ status }),
    enabled,
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

// Les formations où un stagiaire est inscrit (G17), au format `{ enrolled: [{ formation, inscriptionId }], isLoading,
// errors, refetch }`.
//   Chargée de formation : un seul appel `GET /users/{id}/inscriptions` (Q16). Le back le réserve à elle.
//   Formateur : le back lui répond 403 ; on lit donc la liste d'inscrits de chaque formation qu'il peut consulter
//   (même clé de cache que `useInscriptions`). Un 403 / 404 (formation hors de son périmètre) est ignoré ; toute
//   autre erreur est rendue dans `errors` sans masquer les autres formations, et `refetch` ne relance que les
//   listes en échec.
// Sans session connue, rien n'est demandé.
const isOutOfScope = (error) => error?.status === 403 || error?.status === 404

export function useStagiaireInscriptions(stagiaireId) {
  const { user, isLoading: isLoadingUser } = useCurrentUser()
  const isManager = user?.role === ROLES.SUPER_ADMIN
  const isTrainer = user?.role === ROLES.ADMIN

  const direct = useQuery({
    queryKey: ['users', String(stagiaireId), 'inscriptions'],
    queryFn: () => listUserInscriptions(stagiaireId),
    enabled: isManager,
  })

  const formations = useFormations({ enabled: isTrainer })
  const list = formations.data ?? []
  const queries = useQueries({
    queries: list.map((formation) => ({ ...inscriptionsQuery(formation.id), enabled: isTrainer })),
  })
  const failed = queries.filter((query) => query.isError && !isOutOfScope(query.error))

  if (isManager) {
    return {
      enrolled: (direct.data ?? []).map(({ id, formation }) => ({ formation, inscriptionId: id })),
      isLoading: direct.isLoading,
      errors: direct.isError ? [direct.error] : [],
      refetch: () => direct.refetch(),
    }
  }

  const enrolled = []
  queries.forEach((query, index) => {
    const inscription = query.data?.find((candidate) => candidate.stagiaire?.id === stagiaireId)
    if (inscription) enrolled.push({ formation: list[index], inscriptionId: inscription.id })
  })

  return {
    enrolled,
    isLoading: isLoadingUser || formations.isLoading || queries.some((query) => query.isLoading),
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
