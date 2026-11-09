import Alert from '../../../components/atoms/Alert/Alert'
import { useFormations } from '../../formations/hooks'
import { useMyDocuments } from '../hooks'
import DocumentList from './DocumentList'
import styles from './Documents.module.css'

// Résumé « Mes documents » du profil du stagiaire (TICKET-028, G16) : tous ses dépôts, le plus récent
// d'abord, avec la formation où chacun a été déposé (lien vers sa page). Lecture seule : on dépose,
// télécharge et supprime depuis la page de la formation. Le nom des fichiers et les messages du back sont
// rendus en texte. `className` : habillage de section fourni par la page.
const DocumentsSummary = ({ className }) => {
  const formations = useFormations()
  const mine = useMyDocuments(formations.data ?? [])
  const formationOf = (document) => mine.formationByInscriptionId.get(document.inscriptionId)

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

      {mine.isLoading && formations.data?.length > 0 && <p role="status">Chargement…</p>}

      {mine.errors.length > 0 && (
        <div className={styles.errorBox}>
          {mine.errors.map((error, index) => (
            <Alert key={index} variant="error">
              {error.message}
            </Alert>
          ))}
          <button type="button" className={styles.actionButton} onClick={mine.refetch}>
            Réessayer
          </button>
        </div>
      )}

      {mine.isSettled && mine.documents.length === 0 && mine.errors.length === 0 && formations.data?.length > 0 && (
        <>
          <p className={styles.empty}>Aucun document déposé pour le moment</p>
          <p className={styles.empty}>
            Déposez vos documents depuis la page de chaque formation, dans la section « Mes documents ».
          </p>
        </>
      )}

      {mine.documents.length > 0 && (
        <DocumentList
          documents={mine.documents}
          showSender={false}
          locationOf={(document) => {
            const formation = formationOf(document)
            return formation && { to: `/formations/${formation.id}`, label: formation.intitule }
          }}
        />
      )}
    </section>
  )
}

export default DocumentsSummary
