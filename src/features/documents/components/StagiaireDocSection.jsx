import { useId, useMemo, useState } from 'react'
import Alert from '../../../components/atoms/Alert/Alert'
import ConfirmDialog from '../../../components/molecules/ConfirmDialog/ConfirmDialog'
import { useCurrentUser } from '../../auth/hooks'
import { useFormations } from '../../formations/hooks'
import { canDeleteDocument, canUploadOwnDocument, inscriptionIdOf } from '../documentFiles'
import { useDeleteDocument, useDocuments, useDownloadDocument, useUploadDocuments } from '../hooks'
import DocumentDropzone from './DocumentDropzone'
import DocumentList from './DocumentList'
import styles from './Documents.module.css'
import UploadNotices from './UploadNotices'

// Une formation du stagiaire : ses documents (liste, téléchargement) et, si elle est active, la zone de
// dépôt (G10) ; il peut supprimer ses propres dépôts, avec confirmation. Sans `inscriptionId` (non inscrit),
// un simple avis et aucun appel (G11).
// Chaque sous-section garde ses propres états : une erreur ou un dépôt ne touche pas les autres.
const InscriptionDocuments = ({ formation }) => {
  const titleId = useId()
  const inscriptionId = inscriptionIdOf(formation)
  const target = { inscriptionId }
  const documents = useDocuments(target, { enabled: inscriptionId !== null })
  const { upload, isPending: isUploading, result, reset: resetUpload } = useUploadDocuments(target)
  const download = useDownloadDocument()
  const { user } = useCurrentUser()
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
    <section aria-labelledby={titleId} className={styles.subsection}>
      <h3 id={titleId} className={styles.subsectionTitle}>
        {formation.intitule}
      </h3>

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

// Actives d'abord, puis archivées ; l'ordre du back est gardé à l'intérieur de chaque groupe.
const activeFirst = (formations) => [
  ...formations.filter((formation) => formation.status !== 'ARCHIVED'),
  ...formations.filter((formation) => formation.status === 'ARCHIVED'),
]

// Section « Mes documents » du profil du stagiaire (TICKET-028, G8–G12) : une sous-section par formation
// de `GET /formations` (son périmètre). Le nom des fichiers et les messages du back sont rendus en texte.
const StagiaireDocSection = ({ className }) => {
  const formations = useFormations()
  const ordered = useMemo(() => activeFirst(formations.data ?? []), [formations.data])

  return (
    <section className={className}>
      <h2>Mes documents</h2>

      {formations.isLoading && <p role="status">Chargement…</p>}

      {formations.isError && (
        <div className={styles.errorBox}>
          <Alert variant="error">{formations.error.message}</Alert>
          <button type="button" className={styles.actionButton} onClick={() => formations.refetch()}>
            Réessayer
          </button>
        </div>
      )}

      {formations.data?.length === 0 && (
        <p className={styles.empty}>Vous n&apos;êtes inscrit à aucune formation pour le moment</p>
      )}

      {ordered.map((formation) => (
        <InscriptionDocuments key={formation.id} formation={formation} />
      ))}
    </section>
  )
}

export default StagiaireDocSection
