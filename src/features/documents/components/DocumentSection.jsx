import { useState } from 'react'
import Alert from '../../../components/atoms/Alert/Alert'
import ConfirmDialog from '../../../components/molecules/ConfirmDialog/ConfirmDialog'
import { useCurrentUser } from '../../auth/hooks'
import { slotFileName, splitBySlot, typesProvidedBy } from '../../documentTypes/documentSlots'
import { useFormationDocumentTypes } from '../../documentTypes/hooks'
import { ROLES } from '../../../utils/roles'
import { canDeleteDocument, canUploadDocument } from '../documentFiles'
import { useDeleteDocument, useDocuments, useDownloadDocument, useUploadDocuments } from '../hooks'
import DocumentDropzone from './DocumentDropzone'
import DocumentList from './DocumentList'
import DocumentSlot from './DocumentSlot'
import styles from './Documents.module.css'
import UploadNotices from './UploadNotices'

// Section « Documents » du détail d'une formation (TICKET-027, G1–G6). Droits affichés = droits du
// back : dépôt et suppression selon le rôle, l'auteur et l'état de la formation (documentFiles).
// Tout ce qui vient du back (noms de fichiers, messages) est rendu en texte. `className` : habillage
// de section fourni par la page ; `titleClassName` : habillage du titre (masqué visuellement dans un onglet, G34).
// Pour la chargée de formation et le formateur, les pièces que l'ADAC doit déposer viennent d'abord, un créneau
// rouge ou vert par type « fourni par l'ADAC » (G35), puis « Autres documents ». Le stagiaire voit la liste simple
// et les types ne sont pas demandés pour lui.
const DocumentSection = ({ formation, className, titleClassName }) => {
  const { user } = useCurrentUser()
  const isStagiaire = user?.role === ROLES.STAGIAIRE
  const documents = useDocuments({ formationId: formation.id })
  const types = useFormationDocumentTypes(formation.id, { enabled: Boolean(user) && !isStagiaire })
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

  // Un dépôt depuis un créneau part sous « <type> - <fichier> » : c'est ce nom qui le rattache au créneau (G33).
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
  const canUpload = canUploadDocument(user, formation)
  const adacTypes = isStagiaire ? [] : typesProvidedBy(types.data ?? [], 'ADAC')
  const { slots, others } = splitBySlot(adacTypes, documents.data ?? [])
  const hasSlots = slots.length > 0
  const deposited = slots.filter((slot) => slot.documents.length > 0).length
  const listed = hasSlots ? others : (documents.data ?? [])
  const listProps = {
    canDelete: (document) => !isStagiaire && canDeleteDocument(user, formation, document),
    onDownload: handleDownload,
    onDelete: askDelete,
    downloadingId,
  }

  return (
    <section className={className}>
      <h2 className={titleClassName}>Documents de la formation</h2>

      <div className={styles.notices}>
        <UploadNotices result={result} />
        {download.isError && <Alert variant="error">{download.error.message}</Alert>}
        {remove.isError && <Alert variant="error">{remove.error.message}</Alert>}
        {deleted && <Alert variant="success">Document supprimé</Alert>}
        {types.isError && <Alert variant="error">{types.error.message}</Alert>}
      </div>

      {hasSlots && documents.data && (
        <div className={styles.slots}>
          <div className={styles.slotsHeader}>
            <h3 className={styles.othersTitle}>Pièces à fournir par l’ADAC</h3>
            <p className={styles.progress} data-complete={deposited === slots.length}>
              {`${deposited}/${slots.length} pièces déposées`}
            </p>
          </div>
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

        {documents.data && listed.length === 0 && (
          <p className={styles.empty}>Aucun document disponible pour le moment</p>
        )}

        {listed.length > 0 && <DocumentList documents={listed} {...listProps} />}
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
    </section>
  )
}

export default DocumentSection
