import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteDocument, downloadDocument, listDocuments, uploadDocument } from './api'
import { inscriptionIdOf, validateDocumentFile } from './documentFiles'
import { saveBlob } from './saveBlob'
import { ROLES } from '../../utils/roles'

// Clé de la liste : formation `['documents', formationId]` (027), inscription
// `['documents', 'inscription', inscriptionId]` (028) ; les deux commencent par `['documents']`.
const documentsKey = ({ formationId, inscriptionId }) =>
  formationId != null ? ['documents', formationId] : ['documents', 'inscription', inscriptionId]

// `target` : `{ formationId }` ou `{ inscriptionId }`. `enabled: false` : aucun appel (ex. stagiaire non
// inscrit, sans `inscriptionId`, G11).
export function useDocuments(target, { enabled = true } = {}) {
  return useQuery({
    queryKey: documentsKey(target),
    queryFn: () => listDocuments(target),
    enabled,
  })
}

// Où lire les dépôts d'un utilisateur, selon son rôle (tech.md § 6) : le stagiaire dépose sur ses inscriptions
// (formations sans `inscriptionId` ignorées, G11) ; le formateur dépose sur ses formations, dont la liste
// contient aussi les documents des autres : on ne garde que les siens (NOTES-08).
function sourcesOf(formations, user) {
  if (user?.role === ROLES.STAGIAIRE) {
    return formations
      .filter((formation) => inscriptionIdOf(formation) !== null)
      .map((formation) => ({ formation, target: { inscriptionId: inscriptionIdOf(formation) } }))
  }
  return formations.map((formation) => ({ formation, target: { formationId: formation.id } }))
}

const isUploadedBy = (user) => (document) => user?.role === ROLES.STAGIAIRE || document.uploadedBy?.id === user?.id

// Tous les dépôts de `user` (stagiaire ou formateur), une liste par formation, partageant la clé de
// `useDocuments` : un dépôt ou une suppression sur la page d'une formation met le résumé à jour.
// `documents` : le plus récent d'abord ; `formationOf(document)` : où il a été déposé ;
// `errors` : une erreur par liste en échec (les autres listes restent affichées) ; `refetch` ne relance que celles-ci.
export function useMyDocuments(formations, user) {
  const sources = sourcesOf(formations, user)
  const queries = useQueries({
    queries: sources.map(({ target }) => ({ queryKey: documentsKey(target), queryFn: () => listDocuments(target) })),
  })
  const byDate = (a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0)
  const formationOf = (document) =>
    sources.find(({ target }) =>
      target.inscriptionId != null
        ? target.inscriptionId === document.inscriptionId
        : target.formationId === document.formationId,
    )?.formation
  return {
    documents: queries
      .flatMap((query) => query.data ?? [])
      .filter(isUploadedBy(user))
      .sort(byDate),
    formationOf,
    isLoading: queries.some((query) => query.isLoading),
    isSettled: queries.every((query) => !query.isLoading),
    errors: queries.filter((query) => query.isError).map((query) => query.error),
    refetch: () => queries.filter((query) => query.isError).forEach((query) => query.refetch()),
  }
}

// Envoie les fichiers l'un après l'autre (G4) : un refus (contrôle du front ou erreur du back) est
// noté avec le nom du fichier et n'arrête jamais les suivants. La liste est rechargée une seule fois à
// la fin, même si tout a échoué (le back fait foi). `result` : { uploaded, rejections: [{ name, message }] }.
export function useUploadDocuments(target) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (files) => {
      const rejections = []
      let uploaded = 0
      for (const file of files) {
        const refusal = validateDocumentFile(file)
        if (refusal) {
          rejections.push({ name: file.name, message: refusal })
          continue
        }
        try {
          await uploadDocument(file, target)
          uploaded += 1
        } catch (error) {
          rejections.push({ name: file.name, message: error.message })
        }
      }
      return { uploaded, rejections }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: documentsKey(target) }),
  })
  return { upload: mutation.mutate, isPending: mutation.isPending, result: mutation.data, reset: mutation.reset }
}

// Aucune mise à jour optimiste : la liste vient toujours du back. Un 404 (déjà supprimé) la recharge aussi.
export function useDeleteDocument() {
  const queryClient = useQueryClient()
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['documents'] })
  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: refresh,
    onError: (error) => (error.status === 404 ? refresh() : undefined),
  })
}

// `document` : { id, fileName } ; le fichier est enregistré sous son nom d'origine.
export function useDownloadDocument() {
  return useMutation({
    mutationFn: async ({ id, fileName }) => saveBlob(await downloadDocument(id), fileName),
  })
}
