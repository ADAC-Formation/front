import { useId, useMemo } from 'react'
import Alert from '../../../components/atoms/Alert/Alert'
import { useFormations } from '../../formations/hooks'
import { canUploadOwnDocument, inscriptionIdOf } from '../documentFiles'
import { useDocuments, useDownloadDocument, useUploadDocuments } from '../hooks'
import DocumentDropzone from './DocumentDropzone'
import DocumentList from './DocumentList'
import styles from './Documents.module.css'
import UploadNotices from './UploadNotices'

// Une formation du stagiaire : ses documents (liste, téléchargement) et, si elle est active, la zone de
// dépôt (G10). Sans `inscriptionId` (back pas encore adapté, Q13), un simple avis et aucun appel (G11).
// Chaque sous-section garde ses propres états : une erreur ou un dépôt ne touche pas les autres.
const InscriptionDocuments = ({ formation }) => {
  const titleId = useId()
  const inscriptionId = inscriptionIdOf(formation)
  const target = { inscriptionId }
  const documents = useDocuments(target, { enabled: inscriptionId !== null })
  const { upload, isPending: isUploading, result, reset: resetUpload } = useUploadDocuments(target)
  const download = useDownloadDocument()

  const handleFiles = (files) => {
    download.reset()
    upload(files)
  }

  const handleDownload = (document) => {
    resetUpload()
    download.mutate(document)
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
              onDownload={handleDownload}
              downloadingId={downloadingId}
              showSender={false}
            />
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
