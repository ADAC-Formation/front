import { Link } from 'react-router'
import Alert from '../../../components/atoms/Alert/Alert'
import { useStagiaireInscriptions } from '../../formations/hooks'
import styles from './Documents.module.css'
import SentDocuments from './SentDocuments'

// Section « Documents » du profil d'un stagiaire, vue par le formateur ou la chargée de formation (G17) :
// pour chaque formation où il est inscrit et que l'appelant peut consulter, ce qu'il y a envoyé, avec un
// lien vers la formation. Le back ne donne pas les inscriptions d'un compte : on les cherche dans les
// listes d'inscrits des formations de l'appelant (voir `useStagiaireInscriptions`). `className` :
// habillage de section fourni par la page.
const StagiaireDocumentsSection = ({ stagiaireId, className }) => {
  const { enrolled, isLoading, errors, refetch } = useStagiaireInscriptions(stagiaireId)

  return (
    <section className={className}>
      <h2>Documents</h2>

      {isLoading && <p role="status">Chargement…</p>}

      {errors.length > 0 && (
        <div className={styles.errorBox}>
          {errors.map((error, index) => (
            <Alert key={index} variant="error">
              {error.message}
            </Alert>
          ))}
          <button type="button" className={styles.actionButton} onClick={refetch}>
            Réessayer
          </button>
        </div>
      )}

      {!isLoading && errors.length === 0 && enrolled.length === 0 && (
        <p className={styles.empty}>Ce stagiaire n&apos;est inscrit à aucune formation que vous pouvez consulter</p>
      )}

      {enrolled.map(({ formation, inscriptionId }) => (
        <section key={formation.id} className={styles.subsection} aria-labelledby={`stagiaire-formation-${formation.id}`}>
          <h3 id={`stagiaire-formation-${formation.id}`} className={styles.subsectionTitle}>
            <Link to={`/formations/${formation.id}`}>{formation.intitule}</Link>
          </h3>
          <SentDocuments inscriptionId={inscriptionId} stagiaireId={stagiaireId} />
        </section>
      ))}
    </section>
  )
}

export default StagiaireDocumentsSection
