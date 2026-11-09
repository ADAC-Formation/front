import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteDocument, downloadDocument, listDocuments, uploadDocument } from './api'
import { inscriptionIdOf, validateDocumentFile } from './documentFiles'
import { saveBlob } from './saveBlob'

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

// Tous les dépôts du stagiaire, une liste par formation où il est inscrit (`inscriptionId` connu), partageant
// la clé de `useDocuments` : un dépôt ou une suppression sur la page d'une formation met le résumé à jour.
// `documents` : le plus récent d'abord ; `formationByInscriptionId` : où chaque document a été déposé ;
// `errors` : une erreur par liste en échec (les autres listes restent affichées) ; `refetch` ne relance que celles-ci.
export function useMyDocuments(formations) {
  const enrolled = formations.filter((formation) => inscriptionIdOf(formation) !== null)
  const queries = useQueries({
    queries: enrolled.map((formation) => {
      const target = { inscriptionId: inscriptionIdOf(formation) }
      return { queryKey: documentsKey(target), queryFn: () => listDocuments(target) }
    }),
  })
  const byDate = (a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0)
  return {
    documents: queries.flatMap((query) => query.data ?? []).sort(byDate),
    formationByInscriptionId: new Map(enrolled.map((formation) => [inscriptionIdOf(formation), formation])),
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
