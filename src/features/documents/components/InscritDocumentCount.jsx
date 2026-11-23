import { CircleCheck, CircleDashed } from 'lucide-react'
import Alert from '../../../components/atoms/Alert/Alert'
import { useDocuments } from '../hooks'
import { inscritDocumentProgress, isComplete, progressLabel } from '../inscritProgress'
import styles from './Documents.module.css'

// Compte des documents reçus d'un inscrit (« 8/10 documents reçus »), sur sa ligne de « Liste stagiaires »
// (G34). `types` : types à envoyer pour la formation ; `typesAvailable` faux si leur lecture a échoué
// (on compte alors les fichiers envoyés). La coche verte accompagne le texte, elle ne porte pas seule l'état.
const InscritDocumentCount = ({ inscriptionId, stagiaireId, types, typesAvailable = true }) => {
  const documents = useDocuments({ inscriptionId })

  if (documents.isLoading) return <p role="status" className={styles.progress}>Chargement…</p>

  if (documents.isError) {
    return (
      <div className={styles.errorBox}>
        <Alert variant="error">{documents.error.message}</Alert>
        <button type="button" className={styles.actionButton} onClick={() => documents.refetch()}>
          Réessayer
        </button>
      </div>
    )
  }

  const progress = inscritDocumentProgress(types, documents.data ?? [], stagiaireId)
  const complete = typesAvailable && isComplete(progress)
  const Icon = complete ? CircleCheck : CircleDashed

  return (
    <p className={styles.progress} data-complete={complete}>
      <Icon className={complete ? styles.tick : styles.noTick} size={18} aria-hidden="true" />
      <span>{progressLabel(progress, { typesAvailable })}</span>
    </p>
  )
}

export default InscritDocumentCount
