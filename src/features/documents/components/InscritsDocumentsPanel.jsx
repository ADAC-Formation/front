import Alert from '../../../components/atoms/Alert/Alert'
import { useFormationDocumentTypes } from '../../documentTypes/hooks'
import { useInscriptions } from '../../formations/hooks'
import styles from './Documents.module.css'
import InscritDocumentsDetail from './InscritDocumentsDetail'

// Onglet « Documents stagiaires » du détail d'une formation (G34), pour la chargée de formation et le
// formateur : un bloc par inscrit, dans l'ordre de « Liste stagiaires ». Inscrits et types partagent le
// cache de « Liste stagiaires » : aucun appel de plus. Une erreur des types est signalée ici une fois.
const InscritsDocumentsPanel = ({ formation }) => {
  const inscriptions = useInscriptions(formation.id)
  const types = useFormationDocumentTypes(formation.id)
  const typesAvailable = !types.isError

  return (
    <div className={styles.inscritBlocks}>
      <h2 className={styles.srOnly}>Documents stagiaires</h2>
      {types.isError && (
        <div className={styles.errorBox}>
          <Alert variant="error">{types.error.message}</Alert>
          <button type="button" className={styles.actionButton} onClick={() => types.refetch()}>
            Réessayer
          </button>
        </div>
      )}

      {(inscriptions.isLoading || types.isLoading) && <p role="status">Chargement…</p>}

      {inscriptions.isError && (
        <div className={styles.errorBox}>
          <Alert variant="error">{inscriptions.error.message}</Alert>
          <button type="button" className={styles.actionButton} onClick={() => inscriptions.refetch()}>
            Réessayer
          </button>
        </div>
      )}

      {inscriptions.data?.length === 0 && <p className={styles.empty}>Aucun stagiaire inscrit</p>}

      {!types.isLoading &&
        inscriptions.data?.map(({ id, stagiaire }) => (
          <InscritDocumentsDetail
            key={id}
            inscriptionId={id}
            stagiaire={stagiaire}
            types={types.data ?? []}
            typesAvailable={typesAvailable}
          />
        ))}
    </div>
  )
}

export default InscritsDocumentsPanel
