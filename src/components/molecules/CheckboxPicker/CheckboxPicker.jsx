import { useId, useState } from 'react'
import Alert from '../../atoms/Alert/Alert'
import { normalize } from '../../../utils/searchText'
import styles from './CheckboxPicker.module.css'

// Liste de cases à cocher natives avec recherche (sans casse ni accents), dans un `fieldset` nommé.
// Composant contrôlé : `selectedIds` / `onChange(ids)`. La sélection survit à la recherche (seules les cases
// affichées changent) ; « Tout sélectionner » (facultatif) agit sur les résultats affichés. Les libellés sont
// rendus en texte. Utilisé par StagiairePicker et FormationPicker.
//   items : [{ id, label }] ; texts : { search, count(n), empty, noMatch, loading, error } ;
//   status : { isLoading, isError, retry }.
const CheckboxPicker = ({ legend, items, selectedIds, onChange, texts, status, selectAll = false }) => {
  const searchId = useId()
  const [search, setSearch] = useState('')

  const term = normalize(search)
  const shown = items.filter((item) => term === '' || normalize(item.label).includes(term))

  const toggle = (id) =>
    onChange(selectedIds.includes(id) ? selectedIds.filter((selectedId) => selectedId !== id) : [...selectedIds, id])

  const selectAllShown = () =>
    onChange([...selectedIds, ...shown.map((item) => item.id).filter((id) => !selectedIds.includes(id))])

  const isReady = !status.isLoading && !status.isError

  return (
    <fieldset className={styles.picker}>
      <legend className={styles.legend}>{legend}</legend>

      {status.isLoading && <p role="status">{texts.loading}</p>}

      {status.isError && (
        <div className={styles.feedback}>
          <Alert>{texts.error}</Alert>
          <button type="button" className={styles.button} onClick={status.retry}>
            Réessayer
          </button>
        </div>
      )}

      {isReady && items.length === 0 && <p className={styles.empty}>{texts.empty}</p>}

      {isReady && items.length > 0 && (
        <>
          <div className={styles.toolbar}>
            <div className={styles.search}>
              <label htmlFor={searchId} className={styles.searchLabel}>
                {texts.search}
              </label>
              <input
                id={searchId}
                type="search"
                className={styles.searchInput}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            {selectAll && shown.length > 0 && (
              <button type="button" className={styles.button} onClick={selectAllShown}>
                Tout sélectionner
              </button>
            )}
          </div>

          <p role="status" className={styles.count}>
            {texts.count(selectedIds.length)}
          </p>

          {shown.length === 0 ? (
            <p className={styles.empty}>{texts.noMatch}</p>
          ) : (
            <ul className={styles.list}>
              {shown.map((item) => (
                <li key={item.id}>
                  <label className={styles.option}>
                    <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggle(item.id)} />
                    {item.label}
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

export default CheckboxPicker
