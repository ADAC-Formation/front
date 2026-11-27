import { useId } from 'react'
import Alert from '../../../components/atoms/Alert/Alert'
import { ROLES } from '../../../utils/roles'
import { useFormations } from '../../formations/hooks'
import { FILTER_TYPES, filterTypesFor, formationsOfTrainer } from '../groupFilters'
import StagiairePicker from './StagiairePicker'
import styles from './GroupFilters.module.css'

const TYPE_LABELS = {
  [FILTER_TYPES.FORMATION]: 'Formation',
  [FILTER_TYPES.MANUAL]: 'Sélection libre',
}

// Formations actives (H17) ; le formateur ne voit que les siennes : le back répond 404 sur celles des autres.
const FormationSelect = ({ user, value, onChange }) => {
  const selectId = useId()
  const { data = [], isLoading, isError, refetch } = useFormations({ status: 'ACTIVE' })
  const formations = user.role === ROLES.ADMIN ? formationsOfTrainer(data, user.id) : data

  if (isLoading) return <p role="status">Chargement des formations…</p>

  if (isError) {
    return (
      <div className={styles.feedback}>
        <Alert>Impossible de charger les formations.</Alert>
        <button type="button" className={styles.button} onClick={() => refetch()}>
          Réessayer
        </button>
      </div>
    )
  }

  if (formations.length === 0) return <p className={styles.empty}>Aucune formation active.</p>

  return (
    <div className={styles.field}>
      <label htmlFor={selectId} className={styles.label}>
        Formation concernée
      </label>
      <select id={selectId} className={styles.select} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Choisir une formation</option>
        {formations.map((formation) => (
          <option key={formation.id} value={formation.id}>
            {formation.intitule}
          </option>
        ))}
      </select>
    </div>
  )
}

// Choix des destinataires d'un message groupé (décisions H12, H14, H16, H17). Composant contrôlé :
// `filter` = { type, formationId, userIds } et `onChange(nextFilter)`. Changer de type repart d'un filtre
// vide (ni formation ni sélection d'un autre type). La chargée de formation a « Formation » et « Sélection libre », le formateur
// « Formation » seulement.
const GroupFilters = ({ user, filter, onChange }) => {
  const titleId = useId()
  const groupName = useId()
  const types = filterTypesFor(user.role)

  return (
    <section className={styles.filters} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.title}>
        Choisir les destinataires
      </h2>

      <div role="radiogroup" aria-labelledby={titleId} className={styles.types}>
        {types.map((type) => (
          <label key={type} className={styles.type}>
            <input
              type="radio"
              name={groupName}
              checked={filter.type === type}
              onChange={() => onChange({ type, formationId: '', userIds: [] })}
            />
            {TYPE_LABELS[type]}
          </label>
        ))}
      </div>

      {filter.type === FILTER_TYPES.FORMATION && (
        <FormationSelect
          user={user}
          value={filter.formationId}
          onChange={(formationId) => onChange({ ...filter, formationId })}
        />
      )}

      {filter.type === FILTER_TYPES.MANUAL && (
        <StagiairePicker selectedIds={filter.userIds} onChange={(userIds) => onChange({ ...filter, userIds })} />
      )}
    </section>
  )
}

export default GroupFilters
