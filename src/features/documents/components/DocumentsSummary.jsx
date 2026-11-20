import Alert from '../../../components/atoms/Alert/Alert'
import { ROLES } from '../../../utils/roles'
import { useFormations } from '../../formations/hooks'
import { useMyDocuments } from '../hooks'
import DocumentList from './DocumentList'
import styles from './Documents.module.css'

// Textes qui changent selon le rôle : le stagiaire dépose sur ses inscriptions, dans la section « Mes documents »
// de la formation ; le formateur dépose sur ses formations, dans la section « Documents » (NOTES-08).
const COPY = {
  [ROLES.STAGIAIRE]: {
    noFormation: "Vous n'êtes inscrit à aucune formation pour le moment",
    whereToUpload: 'Déposez vos documents depuis la page de chaque formation, dans la section « Mes documents ».',
  },
  [ROLES.ADMIN]: {
    noFormation: 'Aucune formation ne vous est attribuée pour le moment',
    whereToUpload: 'Déposez vos documents depuis la page de chaque formation, dans la section « Documents ».',
  },
}

// Résumé « Mes documents » du profil du stagiaire (TICKET-028, G16) ou du formateur (NOTES-08) : tous les
// dépôts de `user`, le plus récent d'abord, avec la formation où chacun a été déposé (lien vers sa page).
// Lecture seule : on dépose, télécharge et supprime depuis la page de la formation. Le nom des fichiers et
// les messages du back sont rendus en texte. `className` : habillage de section fourni par la page.
const DocumentsSummary = ({ user, className }) => {
  const formations = useFormations()
  const mine = useMyDocuments(formations.data ?? [], user)
  const copy = COPY[user.role] ?? COPY[ROLES.ADMIN]

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
        <p className={styles.empty}>{copy.noFormation}</p>
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
          <p className={styles.empty}>{copy.whereToUpload}</p>
        </>
      )}

      {mine.documents.length > 0 && (
        <DocumentList
          documents={mine.documents}
          showSender={false}
          locationOf={(document) => {
            const formation = mine.formationOf(document)
            return formation && { to: `/formations/${formation.id}`, label: formation.intitule }
          }}
        />
      )}
    </section>
  )
}

export default DocumentsSummary
