import { ChevronRight, CircleAlert, CircleCheck } from 'lucide-react'
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

// Bloc d'un inscrit dans « Documents stagiaires » (G34), replié à l'arrivée (`<details>` natif : clavier et
// lecteurs d'écran sans code) : la ligne montre son nom et son compte, en vert s'il a tout envoyé, en rouge
// sinon ; dépliée, chaque type avec son état et ses fichiers, puis « Autres documents ». Seuls ses propres
// dépôts comptent (G17). Noms en texte.
const InscritDocumentsDetail = ({ inscriptionId, stagiaire, types, typesAvailable = true }) => {
  const titleId = useId()
  const documents = useDocuments({ inscriptionId })
  const download = useDownloadDocument()
  const name = `${stagiaire.prenom} ${stagiaire.nom}`
  const progress = inscritDocumentProgress(types, documents.data ?? [], stagiaire.id)
  const complete = typesAvailable && isComplete(progress)
  const StatusIcon = complete ? CircleCheck : CircleAlert

  return (
    <section aria-labelledby={titleId} className={styles.inscritBlock}>
      <details className={styles.inscritDetails}>
        <summary className={styles.inscritSummary} data-complete={complete}>
          <ChevronRight className={styles.chevron} size={18} aria-hidden="true" />
          <span id={titleId} className={styles.inscritName}>
            {name}
          </span>
          {documents.isLoading && <span role="status">Chargement…</span>}
          {documents.data && (
            <span className={styles.progress}>
              {typesAvailable && progress.total > 0 && (
                <StatusIcon className={complete ? styles.tick : styles.missingIcon} size={16} aria-hidden="true" />
              )}
              {progressLabel(progress, { typesAvailable })}
            </span>
          )}
        </summary>

        {documents.data && (
          <div className={styles.inscritDetailsBody}>
            {progress.slots.length > 0 && (
              <ul className={styles.typeRows}>
                {progress.slots.map(({ type, documents: received }) => (
                  <TypeRow key={type.id} type={type} documents={received} download={download} />
                ))}
              </ul>
            )}

            {progress.others.length > 0 && (
              <div className={styles.inscritOthers}>
                <h3 className={styles.othersTitle}>Autres documents</h3>
                <FileLinks documents={progress.others} download={download} />
              </div>
            )}

            {progress.slots.length === 0 && progress.others.length === 0 && (
              <p className={styles.empty}>Aucun document envoyé</p>
            )}
          </div>
        )}
      </details>

      {documents.isError && (
        <div className={styles.errorBox}>
          <Alert variant="error">{documents.error.message}</Alert>
          <button type="button" className={styles.actionButton} onClick={() => documents.refetch()}>
            Réessayer
          </button>
        </div>
      )}

      {download.isError && <Alert variant="error">{download.error.message}</Alert>}
    </section>
  )
}

export default InscritDocumentsDetail
