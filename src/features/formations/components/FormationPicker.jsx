import CheckboxPicker from '../../../components/molecules/CheckboxPicker/CheckboxPicker'
import { formatDateRange } from '../formationLabels'
import { useFormations } from '../hooks'

const selectedLabel = (count) => {
  if (count === 0) return 'Aucune formation sélectionnée'
  return count === 1 ? '1 formation sélectionnée' : `${count} formations sélectionnées`
}

const formationLabel = (formation) =>
  `${formation.intitule} — ${formatDateRange(formation.dateDebut, formation.dateFin)}`

// Catégories des formations proposées seulement (une catégorie sans formation à proposer viderait la liste),
// sans doublon, par ordre alphabétique (J12).
const categoryOptions = (formations) =>
  [...new Map(formations.filter((f) => f.category).map((f) => [f.category.id, f.category.nom])).entries()]
    .map(([id, nom]) => ({ value: String(id), label: nom }))
    .sort((a, b) => a.label.localeCompare(b.label, 'fr'))

// Choix de formations actives en cases à cocher, pour inscrire un stagiaire (J3). Une formation archivée
// n'est jamais proposée (le back la refuse, J7). Composant contrôlé : `selectedIds` / `onChange(ids)` ;
// `excludeIds` : formations à ne pas proposer (déjà suivies). Filtre « Catégorie » avant la recherche
// (NOTES-26, J12). `error` : message de validation de la page (NOTES-25) ; `empty` : remplace le texte
// « aucune formation active ».
const FormationPicker = ({ selectedIds, onChange, excludeIds = [], legend = 'Formations', error, empty }) => {
  const { data: formations = [], isLoading, isError, refetch } = useFormations({ status: 'ACTIVE' })

  const proposed = formations.filter((formation) => formation.status === 'ACTIVE' && !excludeIds.includes(formation.id))
  const items = proposed.map((formation) => ({
    id: formation.id,
    label: formationLabel(formation),
    categoryId: formation.category ? String(formation.category.id) : null,
  }))

  return (
    <CheckboxPicker
      legend={legend}
      items={items}
      selectedIds={selectedIds}
      onChange={onChange}
      error={error}
      filter={{
        label: 'Catégorie',
        allLabel: 'Toutes les catégories',
        options: categoryOptions(proposed),
        matches: (item, categoryId) => item.categoryId === categoryId,
      }}
      status={{ isLoading, isError, retry: () => refetch() }}
      texts={{
        search: 'Rechercher une formation',
        count: selectedLabel,
        empty: empty ?? 'Aucune formation active à proposer.',
        noMatch: 'Aucune formation trouvée.',
        loading: 'Chargement des formations…',
        error: 'Impossible de charger les formations.',
      }}
    />
  )
}

export default FormationPicker
