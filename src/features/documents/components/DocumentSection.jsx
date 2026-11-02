import { useState } from 'react'
import Alert from '../../../components/atoms/Alert/Alert'
import ConfirmDialog from '../../../components/molecules/ConfirmDialog/ConfirmDialog'
import { useCurrentUser } from '../../auth/hooks'
import { canDeleteDocument, canUploadDocument } from '../documentFiles'
import { useDeleteDocument, useDocuments, useDownloadDocument, useUploadDocuments } from '../hooks'
import DocumentDropzone from './DocumentDropzone'
import DocumentList from './DocumentList'
import styles from './Documents.module.css'
import UploadNotices from './UploadNotices'

// Section « Documents » du détail d'une formation (TICKET-027, G1–G6). Droits affichés = droits du
// back : dépôt et suppression selon le rôle, l'auteur et l'état de la formation (documentFiles).
// Tout ce qui vient du back (noms de fichiers, messages) est rendu en texte. `className` : habillage
// de section fourni par la page.
const DocumentSection = ({ formation, className }) => {
  const { user } = useCurrentUser()
  const documents = useDocuments({ formationId: formation.id })
  const { upload, isPending: isUploading, result, reset: resetUpload } = useUploadDocuments({ formationId: formation.id })
  const download = useDownloadDocument()
  const remove = useDeleteDocument()
  const [deleting, setDeleting] = useState(null)
  const [deleted, setDeleted] = useState(false)

  const clearMessages = () => {
    resetUpload()
    download.reset()
    remove.reset()
    setDeleted(false)
  }

  const handleFiles = (files) => {
    clearMessages()
    upload(files)
  }

  const handleDownload = (document) => {
    clearMessages()
    download.mutate(document)
  }

  const askDelete = (document) => {
    clearMessages()
    setDeleting(document)
  }

  const confirmDelete = () => {
    remove.mutate(deleting.id, {
      onSuccess: () => setDeleted(true),
      onSettled: () => setDeleting(null),
    })
  }

  const downloadingId = download.isPending ? download.variables.id : null

  return (
    <section className={className}>
      <h2>Documents</h2>

      {canUploadDocument(user, formation) && (
        <div className={styles.upload}>
          <DocumentDropzone onFiles={handleFiles} isPending={isUploading} />
        </div>
      )}

      <div className={styles.notices}>
        <UploadNotices result={result} />
        {download.isError && <Alert variant="error">{download.error.message}</Alert>}
        {remove.isError && <Alert variant="error">{remove.error.message}</Alert>}
        {deleted && <Alert variant="success">Document supprimé</Alert>}
      </div>

      {documents.isLoading && <p role="status">Chargement…</p>}

      {documents.isError && (
        <div className={styles.errorBox}>
          <Alert variant="error">{documents.error.message}</Alert>
          <button type="button" className={styles.actionButton} onClick={() => documents.refetch()}>
            Réessayer
          </button>
        </div>
      )}

      {documents.data?.length === 0 && (
        <p className={styles.empty}>Aucun document disponible pour le moment</p>
      )}

      {documents.data?.length > 0 && (
        <DocumentList
          documents={documents.data}
          canDelete={(document) => canDeleteDocument(user, formation, document)}
          onDownload={handleDownload}
          onDelete={askDelete}
          downloadingId={downloadingId}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Supprimer ce document ?"
          confirmLabel="Supprimer"
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
          disabled={remove.isPending}
        >
          {`« ${deleting.fileName} » sera supprimé définitivement. Cette action est irréversible.`}
        </ConfirmDialog>
      )}
    </section>
  )
}

export default DocumentSection
