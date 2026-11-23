import { useState } from 'react'
import Alert from '../../../components/atoms/Alert/Alert'
import { useAccounts } from '../../accounts/hooks'
import InscritDocumentCount from '../../documents/components/InscritDocumentCount'
import { useFormationDocumentTypes } from '../../documentTypes/hooks'
import StagiairePicker from '../../messagerie/components/StagiairePicker'
import { useEnrollStagiaires, useInscriptions } from '../hooks'
import { enrollmentSummary } from '../inscriptionOutcome'
import styles from '../pages/FormationPages.module.css'
import inscriptionStyles from './Inscriptions.module.css'
import UnenrollDialog from './UnenrollDialog'

// Onglet « Liste stagiaires » du détail d'une formation (G34), vu par la chargée de formation et le
// formateur : pour chaque inscrit, son nom, son e-mail et « X/Y documents reçus » (le détail est dans
// « Documents stagiaires »). Sur une formation active, la chargée de formation (`canEnroll`) inscrit des
// stagiaires (actifs et jamais activés, J8 ; un appel par stagiaire, échecs listés par nom) et en
// désinscrit (J6), jamais sur une formation archivée (J7). Les types partagent le cache de « Documents stagiaires ».
const InscritsPanel = ({ formation, canEnroll }) => {
  const { data, isLoading, isError, error, refetch } = useInscriptions(formation.id)
  const types = useFormationDocumentTypes(formation.id)
  const [picking, setPicking] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [summary, setSummary] = useState(null)
  const [unenrolling, setUnenrolling] = useState(null)
  const enroll = useEnrollStagiaires()
  // Même cache que `StagiairePicker includePending` : aucun appel de plus, sert à nommer les inscrits.
  const { data: candidates = [] } = useAccounts('stagiaires', { enabled: picking })
  const typesAvailable = !types.isError

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
    <section aria-labelledby={`inscrits-${formation.id}`}>
      <h2 id={`inscrits-${formation.id}`} className={styles.srOnly}>
        Stagiaires inscrits
      </h2>

      {summary?.enrolledText && <Alert variant="success">{summary.enrolledText}</Alert>}
      {summary?.failedText && <Alert variant="error">{summary.failedText}</Alert>}

      {types.isError && (
        <div className={styles.errorBox}>
          <Alert variant="error">{types.error.message}</Alert>
          <button type="button" className={styles.submitButton} onClick={() => types.refetch()}>
            Réessayer
          </button>
        </div>
      )}

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
                {types.isLoading ? (
                  <p role="status">Chargement…</p>
                ) : (
                  <InscritDocumentCount
                    inscriptionId={id}
                    stagiaireId={stagiaire.id}
                    types={types.data ?? []}
                    typesAvailable={typesAvailable}
                  />
                )}
                {canEnroll && (
                  <button
                    type="button"
                    className={`${inscriptionStyles.button} ${styles.inscritAction}`}
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

export default InscritsPanel
