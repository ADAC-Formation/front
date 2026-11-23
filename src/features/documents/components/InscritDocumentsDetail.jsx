import { CircleAlert, CircleCheck } from 'lucide-react'
import { useId } from 'react'
import Alert from '../../../components/atoms/Alert/Alert'
import { useDocuments, useDownloadDocument } from '../hooks'
import { inscritDocumentProgress, isComplete, progressLabel } from '../inscritProgress'
import styles from './Documents.module.css'

const FileLinks = ({ documents, download }) => (
  <ul className={styles.sentList}>
    {documents.map((document) => (
      <li key={document.id}>
        <button
          type="button"
          className={styles.linkButton}
          aria-label={`Télécharger ${document.fileName}`}
          disabled={download.isPending && download.variables.id === document.id}
          onClick={() => {
            download.reset()
            download.mutate(document)
          }}
        >
          {document.fileName}
        </button>
      </li>
    ))}
  </ul>
)

// Ligne d'un type : son nom, l'état écrit (« Reçu » / « Manquant ») et les fichiers reçus.
const TypeRow = ({ type, documents, download }) => {
  const nameId = useId()
  const received = documents.length > 0
  const Icon = received ? CircleCheck : CircleAlert
  return (
    <li aria-labelledby={nameId} className={styles.typeRow} data-status={received ? 'sent' : 'missing'}>
      <div className={styles.typeRowHeader}>
        <span id={nameId} className={styles.typeName}>
          {type.nom}
        </span>
        <span className={styles.slotStatus}>
          <Icon className={received ? styles.tick : styles.missingIcon} size={16} aria-hidden="true" />
          {received ? 'Reçu' : 'Manquant'}
        </span>
      </div>
      {received && <FileLinks documents={documents} download={download} />}
    </li>
  )
}

// Bloc d'un inscrit dans « Documents stagiaires » (G34) : son compte, chaque type à envoyer avec son état
// et ses fichiers, puis « Autres documents ». Seuls ses propres dépôts comptent (G17). Noms en texte.
const InscritDocumentsDetail = ({ inscriptionId, stagiaire, types, typesAvailable = true }) => {
  const titleId = useId()
  const documents = useDocuments({ inscriptionId })
  const download = useDownloadDocument()
  const name = `${stagiaire.prenom} ${stagiaire.nom}`
  const progress = inscritDocumentProgress(types, documents.data ?? [], stagiaire.id)
  const complete = typesAvailable && isComplete(progress)

  return (
    <section aria-labelledby={titleId} className={styles.inscritBlock}>
      <div className={styles.inscritBlockHeader}>
        <h3 id={titleId} className={styles.inscritName}>
          {name}
        </h3>
        {documents.data && (
          <p className={styles.progress} data-complete={complete}>
            {progressLabel(progress, { typesAvailable })}
          </p>
        )}
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

      {documents.data && (
        <>
          {progress.slots.length > 0 && (
            <ul className={styles.typeRows}>
              {progress.slots.map(({ type, documents: received }) => (
                <TypeRow key={type.id} type={type} documents={received} download={download} />
              ))}
            </ul>
          )}

          {progress.others.length > 0 && (
            <div className={styles.inscritOthers}>
              <h4 className={styles.othersTitle}>Autres documents</h4>
              <FileLinks documents={progress.others} download={download} />
            </div>
          )}

          {progress.slots.length === 0 && progress.others.length === 0 && (
            <p className={styles.empty}>Aucun document envoyé</p>
          )}
        </>
      )}

      {download.isError && <Alert variant="error">{download.error.message}</Alert>}
    </section>
  )
}

export default InscritDocumentsDetail
