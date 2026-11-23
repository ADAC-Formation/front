import CheckboxPicker from '../../../components/molecules/CheckboxPicker/CheckboxPicker'
import { formatDateRange } from '../formationLabels'
import { useFormations } from '../hooks'

const selectedLabel = (count) => {
  if (count === 0) return 'Aucune formation sélectionnée'
  return count === 1 ? '1 formation sélectionnée' : `${count} formations sélectionnées`
}

const formationLabel = (formation) =>
  `${formation.intitule} — ${formatDateRange(formation.dateDebut, formation.dateFin)}`

// Choix de formations actives en cases à cocher, pour inscrire un stagiaire (J3). Une formation archivée
// n'est jamais proposée (le back la refuse, J7). Composant contrôlé : `selectedIds` / `onChange(ids)` ;
// `excludeIds` : formations à ne pas proposer (déjà suivies).
const FormationPicker = ({ selectedIds, onChange, excludeIds = [], legend = 'Formations' }) => {
  const { data: formations = [], isLoading, isError, refetch } = useFormations({ status: 'ACTIVE' })

  const items = formations
    .filter((formation) => formation.status === 'ACTIVE' && !excludeIds.includes(formation.id))
    .map((formation) => ({ id: formation.id, label: formationLabel(formation) }))

  return (
    <CheckboxPicker
      legend={legend}
      items={items}
      selectedIds={selectedIds}
      onChange={onChange}
      status={{ isLoading, isError, retry: () => refetch() }}
      texts={{
        search: 'Rechercher une formation',
        count: selectedLabel,
        empty: 'Aucune formation active à proposer.',
        noMatch: 'Aucune formation trouvée.',
        loading: 'Chargement des formations…',
        error: 'Impossible de charger les formations.',
      }}
    />
  )
}

export default FormationPicker
