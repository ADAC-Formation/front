import { useId, useState } from 'react'
import Alert from '../../../components/atoms/Alert/Alert'
import ConfirmDialog from '../../../components/molecules/ConfirmDialog/ConfirmDialog'
import { useCurrentUser } from '../../auth/hooks'
import { canDeleteDocument, canUploadOwnDocument, inscriptionIdOf } from '../documentFiles'
import { useDeleteDocument, useDocuments, useDownloadDocument, useUploadDocuments } from '../hooks'
import DocumentDropzone from './DocumentDropzone'
import DocumentList from './DocumentList'
import styles from './Documents.module.css'
import UploadNotices from './UploadNotices'

// Section « Mes documents » du détail d'une formation, pour le stagiaire inscrit (TICKET-028, G16) : ses
// dépôts sur cette formation (liste, téléchargement), la zone de dépôt si la formation est active (G10) et
// la suppression de ses propres dépôts, avec confirmation (G15). Sans `inscriptionId` (stagiaire non
// inscrit), un simple avis et aucun appel (G11). Le nom des fichiers et les messages du back sont rendus
// en texte. `className` : habillage de section fourni par la page.
const MyDocumentsSection = ({ formation, className }) => {
  const titleId = useId()
  const { user } = useCurrentUser()
  const inscriptionId = inscriptionIdOf(formation)
  const target = { inscriptionId }
  const documents = useDocuments(target, { enabled: inscriptionId !== null })
  const { upload, isPending: isUploading, result, reset: resetUpload } = useUploadDocuments(target)
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
    <section aria-labelledby={titleId} className={className}>
      <h2 id={titleId}>Mes documents</h2>

      {inscriptionId === null && <p className={styles.empty}>Dépôt indisponible pour le moment</p>}

      {inscriptionId !== null && (
        <>
          {canUploadOwnDocument(formation) && (
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
            <p className={styles.empty}>Aucun document déposé pour cette formation</p>
          )}

          {documents.data?.length > 0 && (
            <DocumentList
              documents={documents.data}
              canDelete={(document) => canDeleteDocument(user, formation, document)}
              onDownload={handleDownload}
              onDelete={askDelete}
              downloadingId={downloadingId}
              showSender={false}
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
        </>
      )}
    </section>
  )
}

export default MyDocumentsSection
