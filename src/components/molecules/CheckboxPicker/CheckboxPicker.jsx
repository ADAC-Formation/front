import { useId, useState } from 'react'
import Alert from '../../atoms/Alert/Alert'
import { normalize } from '../../../utils/searchText'
import styles from './CheckboxPicker.module.css'

// Liste de cases à cocher natives avec recherche (sans casse ni accents), dans un `fieldset` nommé.
// Composant contrôlé : `selectedIds` / `onChange(ids)`. La sélection survit à la recherche (seules les cases
// affichées changent) ; « Tout sélectionner » (facultatif) agit sur les résultats affichés. Les libellés sont
// rendus en texte. Utilisé par StagiairePicker et FormationPicker.
//   items : [{ id, label, ... }] ; texts : { search, count(n), empty, noMatch, loading, error } ;
//   status : { isLoading, isError, retry }.
//   filter (facultatif, NOTES-26) : liste déroulante avant la recherche, qui se combine avec elle ; la sélection
//     masquée reste sélectionnée. { label, allLabel, options: [{ value, label }], matches(item, value) }.
//   error (facultatif, NOTES-25) : message relié au groupe par `aria-describedby`.
const CheckboxPicker = ({ legend, items, selectedIds, onChange, texts, status, selectAll = false, filter, error }) => {
  const searchId = useId()
  const filterId = useId()
  const errorId = useId()
  const [search, setSearch] = useState('')
  const [filterValue, setFilterValue] = useState('')

  const term = normalize(search)
  const shown = items.filter(
    (item) =>
      (!filter || filterValue === '' || filter.matches(item, filterValue)) &&
      (term === '' || normalize(item.label).includes(term)),
  )

  const toggle = (id) =>
    onChange(selectedIds.includes(id) ? selectedIds.filter((selectedId) => selectedId !== id) : [...selectedIds, id])

  const selectAllShown = () =>
    onChange([...selectedIds, ...shown.map((item) => item.id).filter((id) => !selectedIds.includes(id))])

  const isReady = !status.isLoading && !status.isError

  return (
    <fieldset className={styles.picker} aria-describedby={error ? errorId : undefined}>
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
            {filter && (
              <div className={styles.search}>
                <label htmlFor={filterId} className={styles.searchLabel}>
                  {filter.label}
                </label>
                <select
                  id={filterId}
                  className={styles.searchInput}
                  value={filterValue}
                  onChange={(event) => setFilterValue(event.target.value)}
                >
                  <option value="">{filter.allLabel}</option>
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
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

      {error && (
        <Alert variant="error" id={errorId}>
          {error}
        </Alert>
      )}
    </fieldset>
  )
}

export default CheckboxPicker
