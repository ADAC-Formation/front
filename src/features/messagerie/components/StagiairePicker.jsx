import { useId, useState } from 'react'
import Alert from '../../../components/atoms/Alert/Alert'
import { useAccounts } from '../../accounts/hooks'
import { normalize } from '../conversationFilters'
import { displayName } from '../messageLabels'
import styles from './StagiairePicker.module.css'

const selectedLabel = (count) => {
  if (count === 0) return 'Aucun stagiaire sélectionné'
  return count === 1 ? '1 sélectionné' : `${count} sélectionnés`
}

// « Sélection libre » (décision H14) : les stagiaires actifs en cases à cocher natives, avec recherche par
// nom (sans casse ni accents). Composant contrôlé : `selectedIds` / `onChange(ids)`. La sélection survit à
// la recherche (seules les cases affichées changent) et « Tout sélectionner » agit sur les résultats affichés.
// Le nom seul est affiché, jamais l'e-mail (D31).
const StagiairePicker = ({ selectedIds, onChange }) => {
  const searchId = useId()
  const [search, setSearch] = useState('')
  const { data: stagiaires = [], isLoading, isError, refetch } = useAccounts('stagiaires', { active: true })

  const term = normalize(search)
  const shown = stagiaires.filter((stagiaire) => term === '' || normalize(displayName(stagiaire)).includes(term))

  const toggle = (id) =>
    onChange(selectedIds.includes(id) ? selectedIds.filter((selectedId) => selectedId !== id) : [...selectedIds, id])

  const selectAllShown = () =>
    onChange([...selectedIds, ...shown.map((stagiaire) => stagiaire.id).filter((id) => !selectedIds.includes(id))])

  return (
    <fieldset className={styles.picker}>
      <legend className={styles.legend}>Stagiaires</legend>

      {isLoading && <p role="status">Chargement des stagiaires…</p>}

      {isError && (
        <div className={styles.feedback}>
          <Alert>Impossible de charger les stagiaires.</Alert>
          <button type="button" className={styles.button} onClick={() => refetch()}>
            Réessayer
          </button>
        </div>
      )}

      {!isLoading && !isError && stagiaires.length === 0 && <p className={styles.empty}>Aucun stagiaire actif.</p>}

      {!isLoading && !isError && stagiaires.length > 0 && (
        <>
          <div className={styles.toolbar}>
            <div className={styles.search}>
              <label htmlFor={searchId} className={styles.searchLabel}>
                Rechercher un stagiaire
              </label>
              <input
                id={searchId}
                type="search"
                className={styles.searchInput}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            {shown.length > 0 && (
              <button type="button" className={styles.button} onClick={selectAllShown}>
                Tout sélectionner
              </button>
            )}
          </div>

          <p role="status" className={styles.count}>
            {selectedLabel(selectedIds.length)}
          </p>

          {shown.length === 0 ? (
            <p className={styles.empty}>Aucun stagiaire trouvé.</p>
          ) : (
            <ul className={styles.list}>
              {shown.map((stagiaire) => (
                <li key={stagiaire.id}>
                  <label className={styles.option}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(stagiaire.id)}
                      onChange={() => toggle(stagiaire.id)}
                    />
                    {displayName(stagiaire)}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </fieldset>
  )
}

export default StagiairePicker
