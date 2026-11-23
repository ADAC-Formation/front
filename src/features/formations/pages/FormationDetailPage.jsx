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
import MyDocumentsSection from '../../documents/components/MyDocumentsSection'
import SentDocuments from '../../documents/components/SentDocuments'
import FormationNotice from '../components/FormationNotice'
import { formatDateRange, formateurName, modaliteLabel } from '../formationLabels'
import { useAccounts } from '../../accounts/hooks'
import StagiairePicker from '../../messagerie/components/StagiairePicker'
import inscriptionStyles from '../components/Inscriptions.module.css'
import UnenrollDialog from '../components/UnenrollDialog'
import { useArchiveFormation, useEnrollStagiaires, useFormation, useInscriptions } from '../hooks'
import { enrollmentSummary } from '../inscriptionOutcome'
import styles from './FormationPages.module.css'

const inscritsLabel = (count) => `${count} inscrit${count > 1 ? 's' : ''}`

const BACK_TO_LIST = '/formations'
const BACK_LABEL = 'Retour aux formations'

// Stagiaires inscrits, vus par la chargée de formation et le formateur de la formation : pour chacun, une
// coche verte s'il a envoyé un document, et le lien de ses fichiers (G17). Sur une formation active, la
// chargée de formation (`canEnroll`) inscrit des stagiaires (actifs et jamais activés, J8 ; un appel par
// stagiaire, échecs listés par nom) et en désinscrit (J6), jamais sur une formation archivée (J7).
const InscritsSection = ({ formation, canEnroll }) => {
  const { data, isLoading, isError, error, refetch } = useInscriptions(formation.id)
  const [picking, setPicking] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [summary, setSummary] = useState(null)
  const [unenrolling, setUnenrolling] = useState(null)
  const enroll = useEnrollStagiaires()
  // Même cache que `StagiairePicker includePending` : aucun appel de plus, sert à nommer les inscrits.
  const { data: candidates = [] } = useAccounts('stagiaires', { enabled: picking })

  const closePicker = () => {
    setPicking(false)
    setSelectedIds([])
  }

  const submit = () => {
    const nameOf = ({ stagiaireId }) => {
      const candidate = candidates.find((account) => account.id === stagiaireId)
      return candidate ? `${candidate.prenom} ${candidate.nom}` : String(stagiaireId)
    }
    enroll.mutate(
      selectedIds.map((stagiaireId) => ({ formationId: formation.id, stagiaireId })),
      {
        onSuccess: (result) => {
          setSummary(enrollmentSummary(result, { nameOf, enrolledLabel: 'Inscrits' }))
          closePicker()
        },
      },
    )
  }

  return (
    <section className={styles.section}>
      <h2>Stagiaires inscrits</h2>

      {summary?.enrolledText && <Alert variant="success">{summary.enrolledText}</Alert>}
      {summary?.failedText && <Alert variant="error">{summary.failedText}</Alert>}

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
          {data.map(({ id, stagiaire }) => {
            const name = `${stagiaire.prenom} ${stagiaire.nom}`
            return (
              <li key={id}>
                <div className={styles.inscritIdentity}>
                  <span>{name}</span>
                  <span>{stagiaire.email}</span>
                </div>
                <SentDocuments inscriptionId={id} stagiaireId={stagiaire.id} />
                {canEnroll && (
                  <button
                    type="button"
                    className={inscriptionStyles.button}
                    aria-label={`Désinscrire ${name}`}
                    onClick={() => setUnenrolling({ stagiaire, inscriptionId: id })}
                  >
                    Désinscrire
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {canEnroll && !picking && (
        <button
          type="button"
          className={`${inscriptionStyles.button} ${styles.inscritsAction}`}
          onClick={() => {
            setSummary(null)
            enroll.reset()
            setPicking(true)
          }}
        >
          Inscrire des stagiaires
        </button>
      )}

      {canEnroll && picking && (
        <div className={`${inscriptionStyles.picker} ${styles.inscritsAction}`}>
          <StagiairePicker
            selectedIds={selectedIds}
            onChange={setSelectedIds}
            includePending
            excludeIds={(data ?? []).map(({ stagiaire }) => stagiaire.id)}
          />
          <div className={inscriptionStyles.pickerActions}>
            <button type="button" className={inscriptionStyles.button} onClick={closePicker}>
              Annuler
            </button>
            <button
              type="button"
              className={inscriptionStyles.primaryButton}
              onClick={submit}
              disabled={selectedIds.length === 0 || enroll.isPending}
            >
              Inscrire
            </button>
          </div>
        </div>
      )}

      {unenrolling && (
        <UnenrollDialog
          formation={formation}
          stagiaire={unenrolling.stagiaire}
          inscriptionId={unenrolling.inscriptionId}
          onClose={() => setUnenrolling(null)}
        />
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
          {isManager && (
            <>
              <dt>Inscrits</dt>
              <dd>{inscritsLabel(formation.inscriptionsCount)}</dd>
            </>
          )}
        </dl>

        {isManager && <InscritsSection formation={formation} canEnroll={user?.role === ROLES.SUPER_ADMIN && !isArchived} />}

        <DocumentSection key={formation.id} formation={formation} className={styles.section} />

        {user?.role === ROLES.STAGIAIRE && (
          <MyDocumentsSection key={formation.id} formation={formation} className={styles.section} />
        )}

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
