import { useState } from 'react'
import { Link } from 'react-router'
import Alert from '../../../components/atoms/Alert/Alert'
import { useEnrollStagiaires, useFormations, useStagiaireInscriptions } from '../hooks'
import { enrollmentSummary } from '../inscriptionOutcome'
import FormationPicker from './FormationPicker'
import UnenrollDialog from './UnenrollDialog'
import styles from './Inscriptions.module.css'

const PICKER_LEGEND = 'Inscrire à une formation'

// Section « Formations » du profil d'un stagiaire (J5) : ses formations, chacune avec un lien. La chargée de
// formation (`canManage`) l'inscrit à d'autres formations actives (un appel par formation, récapitulatif J4)
// et le désinscrit d'une formation active ; une formation archivée n'a aucune action (J7). Le formateur lit
// la liste seulement. `className` : habillage de section fourni par la page.
const StagiaireFormationsSection = ({ stagiaire, canManage, className }) => {
  const { enrolled, isLoading, errors, refetch } = useStagiaireInscriptions(stagiaire.id)
  const [picking, setPicking] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [summary, setSummary] = useState(null)
  const [unenrolling, setUnenrolling] = useState(null)
  const enroll = useEnrollStagiaires()
  const { data: activeFormations = [] } = useFormations({ status: 'ACTIVE', enabled: picking })

  const closePicker = () => {
    setPicking(false)
    setSelectedIds([])
  }

  const submit = () => {
    const intituleOf = ({ formationId }) => activeFormations.find((formation) => formation.id === formationId)?.intitule
    enroll.mutate(
      selectedIds.map((formationId) => ({ formationId, stagiaireId: stagiaire.id })),
      {
        onSuccess: (result) => {
          setSummary(enrollmentSummary(result, { nameOf: intituleOf, enrolledLabel: 'Inscrit à' }))
          closePicker()
        },
      },
    )
  }

  return (
    <section className={`${styles.section} ${className ?? ''}`}>
      <h2>Formations</h2>

      {summary?.enrolledText && <Alert variant="success">{summary.enrolledText}</Alert>}
      {summary?.failedText && <Alert variant="error">{summary.failedText}</Alert>}

      {isLoading && <p role="status">Chargement…</p>}

      {errors.length > 0 && (
        <div className={styles.errorBox}>
          {errors.map((error, index) => (
            <Alert key={index} variant="error">
              {error.message}
            </Alert>
          ))}
          <button type="button" className={styles.button} onClick={refetch}>
            Réessayer
          </button>
        </div>
      )}

      {!isLoading && errors.length === 0 && enrolled.length === 0 && (
        <p className={styles.empty}>Ce stagiaire n’est inscrit à aucune formation</p>
      )}

      {enrolled.length > 0 && (
        <ul className={styles.list}>
          {enrolled.map(({ formation, inscriptionId }) => {
            const isArchived = formation.status === 'ARCHIVED'
            return (
              <li key={formation.id} className={styles.row}>
                <Link to={`/formations/${formation.id}`}>{formation.intitule}</Link>
                {isArchived && <span className={styles.badge}>Archivée</span>}
                {canManage && !isArchived && (
                  <button
                    type="button"
                    className={styles.button}
                    aria-label={`Désinscrire de ${formation.intitule}`}
                    onClick={() => setUnenrolling({ formation, inscriptionId })}
                  >
                    Désinscrire
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {canManage && !picking && (
        <button
          type="button"
          className={styles.button}
          onClick={() => {
            setSummary(null)
            enroll.reset()
            setPicking(true)
          }}
        >
          {PICKER_LEGEND}
        </button>
      )}

      {canManage && picking && (
        <div className={styles.picker}>
          <FormationPicker
            legend={PICKER_LEGEND}
            selectedIds={selectedIds}
            onChange={setSelectedIds}
            excludeIds={enrolled.map(({ formation }) => formation.id)}
          />
          <div className={styles.pickerActions}>
            <button type="button" className={styles.button} onClick={closePicker}>
              Annuler
            </button>
            <button
              type="button"
              className={styles.primaryButton}
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
          formation={unenrolling.formation}
          stagiaire={stagiaire}
          inscriptionId={unenrolling.inscriptionId}
          onClose={() => setUnenrolling(null)}
        />
      )}
    </section>
  )
}

export default StagiaireFormationsSection
