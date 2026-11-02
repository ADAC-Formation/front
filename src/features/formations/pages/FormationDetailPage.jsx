import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import Alert from '../../../components/atoms/Alert/Alert'
import BackButton from '../../../components/molecules/BackButton/BackButton'
import ConfirmDialog from '../../../components/molecules/ConfirmDialog/ConfirmDialog'
import { PageShell } from '../../../templates/PageShell/PageShell'
import { MANAGEMENT_ROLES, ROLES } from '../../../utils/roles'
import { useCurrentUser } from '../../auth/hooks'
import AccessDeniedPage from '../../auth/pages/AccessDeniedPage'
import DocumentSection from '../../documents/components/DocumentSection'
import FormationNotice from '../components/FormationNotice'
import { formatDateRange, formateurName, modaliteLabel } from '../formationLabels'
import { useArchiveFormation, useFormation, useInscriptions } from '../hooks'
import styles from './FormationPages.module.css'

const inscritsLabel = (count) => `${count} inscrit${count > 1 ? 's' : ''}`

const BACK_TO_LIST = '/formations'
const BACK_LABEL = 'Retour aux formations'

const InscritsSection = ({ formationId }) => {
  const { data, isLoading, isError, error, refetch } = useInscriptions(formationId)

  return (
    <section className={styles.section}>
      <h2>Stagiaires inscrits</h2>

      {isLoading && <p role="status">Chargement…</p>}

      {isError && (
        <div className={styles.errorBox}>
          <Alert variant="error">{error.message}</Alert>
          <button type="button" className={styles.submitButton} onClick={() => refetch()}>
            Réessayer
          </button>
        </div>
      )}

      {data?.length === 0 && <p className={styles.sectionNote}>Aucun stagiaire inscrit</p>}

      {data?.length > 0 && (
        <ul className={styles.inscrits}>
          {data.map(({ id, stagiaire }) => (
            <li key={id}>
              <span>{`${stagiaire.prenom} ${stagiaire.nom}`}</span>
              <span>{stagiaire.email}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// Détail d'une formation. La chargée de formation peut l'archiver ; le formateur et le stagiaire
// consultent seulement. La liste nominative des inscrits n'est demandée qu'aux rôles de gestion
// (le back la refuse au stagiaire, F3). Tout le contenu venu du back est rendu en texte.
const FormationDetailPage = () => {
  const { formationId } = useParams()
  const navigate = useNavigate()
  const { user } = useCurrentUser()
  const [confirming, setConfirming] = useState(false)

  const { data: formation, isLoading, isError, error, refetch } = useFormation(formationId)
  const archive = useArchiveFormation(formationId)

  if (isLoading) {
    return (
      <PageShell className={styles.page}>
        <p role="status">Chargement…</p>
      </PageShell>
    )
  }

  if (isError) {
    if (error.status === 403) return <AccessDeniedPage />

    return (
      <PageShell className={styles.page}>
        <BackButton to={BACK_TO_LIST}>{BACK_LABEL}</BackButton>
        <div className={styles.errorState}>
          <Alert variant="error">
            {error.status === 404 ? 'Formation introuvable ou non accessible' : error.message}
          </Alert>
          {error.status !== 404 && (
            <button type="button" className={styles.submitButton} onClick={() => refetch()}>
              Réessayer
            </button>
          )}
        </div>
      </PageShell>
    )
  }

  const isArchived = formation.status === 'ARCHIVED'
  const isManager = MANAGEMENT_ROLES.includes(user?.role)
  const canArchive = user?.role === ROLES.SUPER_ADMIN && !isArchived
  const hasConflict = archive.error?.status === 409

  const confirmArchive = () => {
    archive.mutate(undefined, {
      onSuccess: () => navigate(BACK_TO_LIST, { state: { notice: 'formation-archived' } }),
      onSettled: () => setConfirming(false),
    })
  }

  const reload = () => {
    archive.reset()
    refetch()
  }

  return (
    <PageShell className={styles.page}>
      <BackButton to={BACK_TO_LIST}>{BACK_LABEL}</BackButton>

      <div className={styles.notices}>
        <FormationNotice />
      </div>

      <article className={styles.card} style={{ '--category-color': formation.category.couleur }}>
        <p className={styles.category}>
          <span className={styles.categoryDot} aria-hidden="true" />
          {formation.category.nom}
        </p>

        <div className={styles.titleRow}>
          <h1 className={styles.title}>{formation.intitule}</h1>
          {isArchived && <span className={styles.badge}>Archivée</span>}
        </div>

        {formation.description && <p className={styles.description}>{formation.description}</p>}

        <dl className={`${styles.definition} ${styles.section}`}>
          <dt>Dates</dt>
          <dd>{formatDateRange(formation.dateDebut, formation.dateFin)}</dd>
          <dt>Modalité</dt>
          <dd>{modaliteLabel(formation.modalite)}</dd>
          <dt>Formateur</dt>
          <dd>{formateurName(formation.formateur)}</dd>
          <dt>Inscrits</dt>
          <dd>{inscritsLabel(formation.inscriptionsCount)}</dd>
        </dl>

        {isManager && <InscritsSection formationId={formationId} />}

        <DocumentSection key={formation.id} formation={formation} className={styles.section} />

        {archive.error && (
          <div className={styles.notices}>
            {hasConflict ? (
              <>
                <Alert variant="error">Cette formation a été modifiée entre-temps. Rechargez la page.</Alert>
                <button type="button" className={styles.secondaryButton} onClick={reload}>
                  Recharger
                </button>
              </>
            ) : (
              <Alert variant="error">{archive.error.message}</Alert>
            )}
          </div>
        )}

        {canArchive && (
          <div className={styles.actions}>
            <Link className={styles.secondaryButton} to={`/formations/${formation.id}/modifier`}>
              Modifier
            </Link>
            <button type="button" className={styles.secondaryButton} onClick={() => setConfirming(true)}>
              Archiver
            </button>
          </div>
        )}
      </article>

      {confirming && (
        <ConfirmDialog
          title="Archiver cette formation ?"
          confirmLabel="Archiver"
          onConfirm={confirmArchive}
          onCancel={() => setConfirming(false)}
          disabled={archive.isPending}
        >
          {`« ${formation.intitule} » passera en lecture seule et ne pourra plus être modifiée.`}
        </ConfirmDialog>
      )}
    </PageShell>
  )
}

export default FormationDetailPage
