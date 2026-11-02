import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteDocument, downloadDocument, listDocuments, uploadDocument } from './api'
import { validateDocumentFile } from './documentFiles'
import { saveBlob } from './saveBlob'

// Clé de la liste : formation `['documents', formationId]` (027), inscription
// `['documents', 'inscription', inscriptionId]` (028) ; les deux commencent par `['documents']`.
const documentsKey = ({ formationId, inscriptionId }) =>
  formationId != null ? ['documents', formationId] : ['documents', 'inscription', inscriptionId]

// `target` : `{ formationId }` ou `{ inscriptionId }`. `enabled: false` : aucun appel (ex. stagiaire sans
// `inscriptionId`, G11).
export function useDocuments(target, { enabled = true } = {}) {
  return useQuery({
    queryKey: documentsKey(target),
    queryFn: () => listDocuments(target),
    enabled,
  })
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
  return { upload: mutation.mutateAsync, isPending: mutation.isPending, result: mutation.data, reset: mutation.reset }
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
