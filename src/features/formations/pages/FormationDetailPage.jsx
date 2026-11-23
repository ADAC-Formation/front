import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import Alert from '../../../components/atoms/Alert/Alert'
import BackButton from '../../../components/molecules/BackButton/BackButton'
import ConfirmDialog from '../../../components/molecules/ConfirmDialog/ConfirmDialog'
import Tabs from '../../../components/molecules/Tabs/Tabs'
import { PageShell } from '../../../templates/PageShell/PageShell'
import { MANAGEMENT_ROLES, ROLES } from '../../../utils/roles'
import { useCurrentUser } from '../../auth/hooks'
import AccessDeniedPage from '../../auth/pages/AccessDeniedPage'
import DocumentSection from '../../documents/components/DocumentSection'
import InscritsDocumentsPanel from '../../documents/components/InscritsDocumentsPanel'
import MyDocumentsSection from '../../documents/components/MyDocumentsSection'
import FormationNotice from '../components/FormationNotice'
import InscritsPanel from '../components/InscritsPanel'
import { formatDateRange, formateurName, modaliteLabel } from '../formationLabels'
import { useArchiveFormation, useFormation } from '../hooks'
import styles from './FormationPages.module.css'

const inscritsLabel = (count) => `${count} inscrit${count > 1 ? 's' : ''}`

const BACK_TO_LIST = '/formations'
const BACK_LABEL = 'Retour aux formations'

// Onglets sous les informations (G34) : la chargée de formation et le formateur suivent les inscrits et
// leurs documents ; le stagiaire voit les documents de l'ADAC et dépose les siens. Le premier est ouvert.
const sectionTabs = (formation, { isManager, canEnroll }) => {
  const adac = {
    id: 'adac',
    label: 'Documents ADAC',
    panel: <DocumentSection key={formation.id} formation={formation} titleClassName={styles.srOnly} />,
  }
  if (isManager) {
    return [
      { id: 'inscrits', label: 'Liste stagiaires', panel: <InscritsPanel formation={formation} canEnroll={canEnroll} /> },
      { id: 'documents-stagiaires', label: 'Documents stagiaires', panel: <InscritsDocumentsPanel formation={formation} /> },
      adac,
    ]
  }
  return [
    adac,
    {
      id: 'mes-documents',
      label: 'Mes documents',
      panel: <MyDocumentsSection key={formation.id} formation={formation} titleClassName={styles.srOnly} />,
    },
  ]
}

// Détail d'une formation : les informations (et, pour la chargée de formation, « Modifier » et « Archiver »),
// puis les onglets (G34). Le formateur et le stagiaire consultent seulement. La liste nominative des inscrits
// n'est demandée qu'aux rôles de gestion (le back la refuse au stagiaire, F3). Contenu du back rendu en texte.
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
          {isManager && (
            <>
              <dt>Inscrits</dt>
              <dd>{inscritsLabel(formation.inscriptionsCount)}</dd>
            </>
          )}
        </dl>

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

        <Tabs
          key={formation.id}
          label="Sections de la formation"
          className={styles.tabs}
          tabs={sectionTabs(formation, {
            isManager,
            canEnroll: user?.role === ROLES.SUPER_ADMIN && !isArchived,
          })}
        />
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
