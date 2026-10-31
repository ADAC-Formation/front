import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Search } from 'lucide-react'
import Alert from '../../../components/atoms/Alert/Alert'
import BackButton from '../../../components/molecules/BackButton/BackButton'
import ConfirmDialog from '../../../components/molecules/ConfirmDialog/ConfirmDialog'
import { useCurrentUser } from '../../auth/hooks'
import AccountNotice from '../components/AccountNotice'
import AccountRow from '../components/AccountRow'
import { ACCOUNT_KINDS, canManageAccounts, fullName } from '../accountKinds'
import { useAccounts, useSetAccountActive } from '../hooks'
import styles from './AccountPages.module.css'

const FILTERS = [
  { value: 'all', label: 'Tous', color: 'var(--color-soft-orange)' },
  { value: 'active', label: 'Actifs', color: 'var(--color-green)' },
  { value: 'inactive', label: 'Inactifs', color: 'var(--color-grey)' },
]

const SORTS = {
  nom: { label: 'Nom A-Z', key: (account) => account.nom },
  prenom: { label: 'Prénom A-Z', key: (account) => account.prenom },
  email: { label: 'E-mail A-Z', key: (account) => account.email },
}

const matchesSearch = (account, term) =>
  [account.prenom, account.nom, account.email].some((value) => value.toLowerCase().includes(term))

// Liste des formateurs ou des stagiaires, présentée comme la page Formations. La chargée de
// formation filtre et gère les comptes ; le formateur consulte seulement (D54). « Inactifs » est
// filtré côté client : l'API n'a que `?active=true`. « Inactif » regroupe comptes suspendus et
// jamais activés : le back ne les distingue que par le 409 de `reactivate` (D55).
const AccountListPage = ({ kind }) => {
  const config = ACCOUNT_KINDS[kind]
  const { user } = useCurrentUser()
  const canManage = canManageAccounts(user)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('nom')
  const [toSuspend, setToSuspend] = useState(null)

  const { data, isLoading, isError, error, refetch } = useAccounts(kind, { active: filter === 'active' })
  const setActive = useSetAccountActive()

  const accounts = useMemo(() => {
    const term = search.toLowerCase().trim()
    const { key } = SORTS[sortBy]
    return (data ?? [])
      .filter((account) => filter !== 'inactive' || !account.isActive)
      .filter((account) => matchesSearch(account, term))
      .sort((a, b) => key(a).localeCompare(key(b), 'fr'))
  }, [data, filter, search, sortBy])

  const close = () => setToSuspend(null)
  const changeStatus = (account, active) => {
    setActive.reset()
    setActive.mutate({ id: account.id, active }, { onSettled: close })
  }

  const count = accounts.length
  const isEmptyList = !isLoading && !isError && (data ?? []).length === 0
  const hasNoMatch = !isLoading && !isError && !isEmptyList && count === 0

  const rowActions = (account) =>
    canManage &&
    (account.isActive ? (
      <button
        type="button"
        aria-label={`Suspendre ${fullName(account)}`}
        onClick={() => setToSuspend(account)}
      >
        Suspendre
      </button>
    ) : (
      <button
        type="button"
        aria-label={`Réactiver ${fullName(account)}`}
        onClick={() => changeStatus(account, true)}
        disabled={setActive.isPending}
      >
        Réactiver
      </button>
    ))

  return (
    <div className={styles.page}>
      <BackButton to="/admin/gestion" />

      <div className={styles.header}>
        <h1 className={styles.title}>{config.title}</h1>
        {canManage && (
          <Link className={styles.createButton} to={`${config.basePath}/nouveau`}>
            {config.createLabel}
          </Link>
        )}
      </div>

      <p className={styles.intro}>{config.intro}</p>

      <section className={styles.toolbar}>
        <div className={styles.searchContainer}>
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            aria-label={`Rechercher un ${config.singular}`}
            placeholder={`Rechercher un ${config.singular}...`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className={styles.sortContainer}>
          <label htmlFor={`tri-${kind}`}>Organiser par :</label>
          <select id={`tri-${kind}`} value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            {Object.entries(SORTS).map(([value, { label }]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {canManage && (
        <fieldset className={styles.filters}>
          <legend className={styles.srOnly}>Statut</legend>
          {FILTERS.map(({ value, label, color }) => (
            <label key={value} className={styles.pill} style={{ '--pill-color': color }}>
              <input
                type="radio"
                name={`statut-${kind}`}
                value={value}
                checked={filter === value}
                onChange={() => setFilter(value)}
              />
              <span className={styles.pillDot} aria-hidden="true" />
              {label}
            </label>
          ))}
        </fieldset>
      )}

      <div className={styles.notices}>
        <AccountNotice />
        {setActive.error && <Alert variant="error">{setActive.error.message}</Alert>}
      </div>

      <section className={styles.card}>
        {isLoading && <p role="status">Chargement…</p>}

        {isError && (
          <div className={styles.errorBox}>
            <Alert variant="error">{error.message}</Alert>
            <button type="button" className={styles.submitButton} onClick={() => refetch()}>
              Réessayer
            </button>
          </div>
        )}

        {isEmptyList && (
          <div className={styles.emptyState}>
            <h2>{config.emptyLabel}</h2>
          </div>
        )}

        {hasNoMatch && (
          <div className={styles.emptyState}>
            <Search size={28} aria-hidden="true" />
            <h2>{config.emptyLabel} trouvé</h2>
            <p>Essayez avec un autre terme de recherche ou un autre filtre.</p>
          </div>
        )}

        {count > 0 && (
          <>
            <div className={styles.cardHeader}>
              <h2>{config.listTitle}</h2>
              <p>{`${count} ${config.singular}${count !== 1 ? 's' : ''}`}</p>
            </div>

            <ul className={styles.list}>
              {accounts.map((account) => (
                <AccountRow
                  key={account.id}
                  account={account}
                  to={`${config.basePath}/${account.id}`}
                  actions={rowActions(account)}
                />
              ))}
            </ul>
          </>
        )}
      </section>

      {toSuspend && (
        <ConfirmDialog
          title="Suspendre ce compte ?"
          confirmLabel="Suspendre"
          onConfirm={() => changeStatus(toSuspend, false)}
          onCancel={close}
          disabled={setActive.isPending}
        >
          {`${fullName(toSuspend)} ne pourra plus se connecter tant que le compte est suspendu.`}
        </ConfirmDialog>
      )}
    </div>
  )
}

export default AccountListPage
