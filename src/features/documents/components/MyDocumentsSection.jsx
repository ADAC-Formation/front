import { useId, useState } from 'react'
import Alert from '../../../components/atoms/Alert/Alert'
import ConfirmDialog from '../../../components/molecules/ConfirmDialog/ConfirmDialog'
import { slotFileName, splitBySlot } from '../../documentTypes/documentSlots'
import { useFormationDocumentTypes } from '../../documentTypes/hooks'
import { useCurrentUser } from '../../auth/hooks'
import { canDeleteDocument, canUploadOwnDocument, inscriptionIdOf } from '../documentFiles'
import { useDeleteDocument, useDocuments, useDownloadDocument, useUploadDocuments } from '../hooks'
import DocumentDropzone from './DocumentDropzone'
import DocumentList from './DocumentList'
import DocumentSlot from './DocumentSlot'
import styles from './Documents.module.css'
import UploadNotices from './UploadNotices'

// Section « Mes documents » du détail d'une formation, pour le stagiaire inscrit (TICKET-028, G16) :
// d'abord un créneau par document à envoyer pour la formation (rouge tant que rien n'est déposé, vert
// ensuite), puis « Autres documents » : la zone de dépôt libre et tout ce qui n'est dans aucun créneau,
// en neutre. Dépôt seulement si la formation est active (G10), suppression de ses propres dépôts avec
// confirmation (G15). Sans `inscriptionId` (stagiaire non inscrit), un simple avis et aucun appel (G11).
// Le nom des fichiers et les messages du back sont rendus en texte. `className` : habillage de section
// fourni par la page ; `titleClassName` : habillage du titre (masqué visuellement dans un onglet, G34).
const MyDocumentsSection = ({ formation, className, titleClassName }) => {
  const titleId = useId()
  const { user } = useCurrentUser()
  const inscriptionId = inscriptionIdOf(formation)
  const target = { inscriptionId }
  const enabled = inscriptionId !== null
  const documents = useDocuments(target, { enabled })
  const types = useFormationDocumentTypes(formation.id, { enabled })
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

  // Un dépôt depuis un créneau part sous « <type> - <fichier> » : c'est ce nom qui le rattache au créneau.
  const handleSlotFiles = (type, files) => {
    clearMessages()
    upload(files.map((file) => new File([file], slotFileName(type.nom, file.name) ?? file.name, { type: file.type })))
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
  const canUpload = canUploadOwnDocument(formation)
  const { slots, others } = splitBySlot(types.data ?? [], documents.data ?? [])
  const hasSlots = slots.length > 0
  const listProps = {
    canDelete: (document) => canDeleteDocument(user, formation, document),
    onDownload: handleDownload,
    onDelete: askDelete,
    downloadingId,
  }

  return (
    <section aria-labelledby={titleId} className={className}>
      <h2 id={titleId} className={titleClassName}>
        Mes documents
      </h2>

      {inscriptionId === null && <p className={styles.empty}>Dépôt indisponible pour le moment</p>}

      {inscriptionId !== null && (
        <>
          <div className={styles.notices}>
            <UploadNotices result={result} />
            {download.isError && <Alert variant="error">{download.error.message}</Alert>}
            {remove.isError && <Alert variant="error">{remove.error.message}</Alert>}
            {deleted && <Alert variant="success">Document supprimé</Alert>}
            {types.isError && <Alert variant="error">{types.error.message}</Alert>}
          </div>

          {hasSlots && (
            <div className={styles.slots}>
              <h3 className={styles.othersTitle}>Documents à envoyer</h3>
              {slots.map(({ type, documents: sent }) => (
                <DocumentSlot
                  key={type.id}
                  type={type}
                  documents={sent}
                  onUpload={canUpload ? handleSlotFiles : undefined}
                  listProps={listProps}
                />
              ))}
            </div>
          )}

          <div className={hasSlots ? styles.others : undefined}>
            {hasSlots && <h3 className={styles.othersTitle}>Autres documents</h3>}
            {hasSlots && <p className={styles.empty}>Vous pouvez envoyer d’autres documents si vous le souhaitez.</p>}

            {canUpload && (
              <div className={styles.upload}>
                <DocumentDropzone onFiles={handleFiles} isPending={isUploading} />
              </div>
            )}

            {documents.isLoading && <p role="status">Chargement…</p>}

            {documents.isError && (
              <div className={styles.errorBox}>
                <Alert variant="error">{documents.error.message}</Alert>
                <button type="button" className={styles.actionButton} onClick={() => documents.refetch()}>
                  Réessayer
                </button>
              </div>
            )}

            {documents.data && !hasSlots && documents.data.length === 0 && (
              <p className={styles.empty}>Aucun document déposé pour cette formation</p>
            )}

            {others.length > 0 && <DocumentList documents={others} showSender={false} {...listProps} />}
          </div>

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
