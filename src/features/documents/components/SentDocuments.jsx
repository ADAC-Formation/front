import { CircleCheck, CircleDashed } from 'lucide-react'
import Alert from '../../../components/atoms/Alert/Alert'
import { useDocuments, useDownloadDocument } from '../hooks'
import styles from './Documents.module.css'

// Ce qu'un stagiaire a envoyé sur son inscription, vu par le formateur ou la chargée de formation (G17) :
// une coche verte et « Documents envoyés » s'il a déposé au moins un document (même définition que les
// « documents manquants » du back), sinon « Aucun document envoyé » ; un lien par fichier qui le télécharge.
// Seuls comptent les documents déposés par le stagiaire lui-même (pas ceux que la chargée de formation a
// ciblés pour lui). Le nom des fichiers et les messages du back sont rendus en texte. Le statut est dit
// en texte, la couleur ne porte pas seule l'information.
const SentDocuments = ({ inscriptionId, stagiaireId, className }) => {
  const documents = useDocuments({ inscriptionId })
  const download = useDownloadDocument()
  const sent = (documents.data ?? []).filter((document) => document.uploadedBy?.id === stagiaireId)

  return (
    <div className={`${styles.sent} ${className ?? ''}`}>
      {documents.isLoading && <p role="status">Chargement…</p>}

      {documents.isError && (
        <div className={styles.errorBox}>
          <Alert variant="error">{documents.error.message}</Alert>
          <button type="button" className={styles.actionButton} onClick={() => documents.refetch()}>
            Réessayer
          </button>
        </div>
      )}

      {documents.data && sent.length > 0 && (
        <p className={styles.sentStatus}>
          <CircleCheck className={styles.tick} size={18} aria-hidden="true" />
          Documents envoyés
        </p>
      )}

      {documents.data && sent.length === 0 && (
        <p className={styles.sentStatus}>
          <CircleDashed className={styles.noTick} size={18} aria-hidden="true" />
          Aucun document envoyé
        </p>
      )}

      {sent.length > 0 && (
        <ul className={styles.sentList}>
          {sent.map((document) => (
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
      )}

      {download.isError && <Alert variant="error">{download.error.message}</Alert>}
    </div>
  )
}

export default SentDocuments
