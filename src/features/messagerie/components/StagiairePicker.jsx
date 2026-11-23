import CheckboxPicker from '../../../components/molecules/CheckboxPicker/CheckboxPicker'
import { ACCOUNT_STATUS, accountStatus } from '../../accounts/accountKinds'
import { useAccounts } from '../../accounts/hooks'
import { displayName } from '../messageLabels'

const selectedLabel = (count) => {
  if (count === 0) return 'Aucun stagiaire sélectionné'
  return count === 1 ? '1 sélectionné' : `${count} sélectionnés`
}

// Choix de stagiaires en cases à cocher (« Sélection libre » du message groupé, H14). Le nom seul est
// affiché, jamais l'e-mail (D31). Composant contrôlé : `selectedIds` / `onChange(ids)`.
//   Par défaut : les stagiaires actifs (`GET /users/stagiaires?active=true`).
//   `includePending` (inscription, J8) : aussi les comptes jamais activés, jamais les suspendus.
//   `excludeIds` : stagiaires à ne pas proposer (déjà inscrits).
const StagiairePicker = ({ selectedIds, onChange, includePending = false, excludeIds = [] }) => {
  const { data: stagiaires = [], isLoading, isError, refetch } = useAccounts('stagiaires', { active: !includePending })

  const items = stagiaires
    .filter((stagiaire) => !includePending || accountStatus(stagiaire) !== ACCOUNT_STATUS.SUSPENDED)
    .filter((stagiaire) => !excludeIds.includes(stagiaire.id))
    .map((stagiaire) => ({ id: stagiaire.id, label: displayName(stagiaire) }))

  return (
    <CheckboxPicker
      legend="Stagiaires"
      items={items}
      selectedIds={selectedIds}
      onChange={onChange}
      selectAll
      status={{ isLoading, isError, retry: () => refetch() }}
      texts={{
        search: 'Rechercher un stagiaire',
        count: selectedLabel,
        empty: includePending ? 'Aucun stagiaire à inscrire.' : 'Aucun stagiaire actif.',
        noMatch: 'Aucun stagiaire trouvé.',
        loading: 'Chargement des stagiaires…',
        error: 'Impossible de charger les stagiaires.',
      }}
    />
  )
}

export default StagiairePicker
