import { useState } from 'react'
import { Link } from 'react-router'
import Alert from '../../../components/atoms/Alert/Alert'
import FormButton from '../../../components/atoms/FormButton/FormButton'
import ConfirmDialog from '../../../components/molecules/ConfirmDialog/ConfirmDialog'
import { useCurrentUser } from '../../auth/hooks'
import { ACCOUNT_KINDS, canManageAccounts, fullName } from '../accountKinds'
import { useAccounts, useSetAccountActive } from '../hooks'
import styles from './AccountPages.module.css'

const FILTERS = [
  { value: 'all', label: 'Tous' },
  { value: 'active', label: 'Actifs' },
  { value: 'suspended', label: 'Suspendus' },
]

// Liste des formateurs ou des stagiaires. La chargée de formation filtre et gère les comptes ;
// le formateur consulte seulement (D54). « Suspendus » est filtré côté client : l'API n'a que
// `?active=true`.
const AccountListPage = ({ kind }) => {
  const config = ACCOUNT_KINDS[kind]
  const { user } = useCurrentUser()
  const canManage = canManageAccounts(user)
  const [filter, setFilter] = useState('all')
  const [toSuspend, setToSuspend] = useState(null)

  const { data, isLoading, isError, error, refetch } = useAccounts(kind, { active: filter === 'active' })
  const setActive = useSetAccountActive()

  const accounts = (data ?? []).filter((account) => filter !== 'suspended' || !account.isActive)

  const close = () => setToSuspend(null)
  const changeStatus = (account, active) => {
    setActive.reset()
    setActive.mutate({ id: account.id, active }, { onSettled: close })
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{config.title}</h1>
        {canManage && (
          <Link className={styles.primaryLink} to={`${config.basePath}/nouveau`}>
            {config.createLabel}
          </Link>
        )}
      </div>

      {canManage && (
        <fieldset className={styles.filters}>
          <legend className={styles.legend}>Statut</legend>
          {FILTERS.map(({ value, label }) => (
            <label key={value} className={styles.filter}>
              <input
                type="radio"
                name={`statut-${kind}`}
                value={value}
                checked={filter === value}
                onChange={() => setFilter(value)}
              />
              {label}
            </label>
          ))}
        </fieldset>
      )}

      {setActive.error && <Alert variant="error">{setActive.error.message}</Alert>}

      {isLoading && <p role="status">Chargement…</p>}

      {isError && (
        <div className={styles.errorBox}>
          <Alert variant="error">{error.message}</Alert>
          <FormButton onClick={() => refetch()}>Réessayer</FormButton>
        </div>
      )}

      {!isLoading && !isError && accounts.length === 0 && <p>{config.emptyLabel}</p>}

      {accounts.length > 0 && (
        <table className={styles.table}>
          <caption className={styles.srOnly}>{config.title}</caption>
          <thead>
            <tr>
              <th scope="col">Nom</th>
              <th scope="col">E-mail</th>
              <th scope="col">Statut</th>
              {canManage && (
                <th scope="col">
                  <span className={styles.srOnly}>Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id}>
                <td data-label="Nom">
                  <Link to={`${config.basePath}/${account.id}`}>{fullName(account)}</Link>
                </td>
                <td data-label="E-mail">{account.email}</td>
                <td data-label="Statut">{account.isActive ? 'Actif' : 'Suspendu'}</td>
                {canManage && (
                  <td data-label="Actions">
                    {account.isActive ? (
                      <button
                        type="button"
                        className={styles.rowButton}
                        aria-label={`Suspendre ${fullName(account)}`}
                        onClick={() => setToSuspend(account)}
                      >
                        Suspendre
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={styles.rowButton}
                        aria-label={`Réactiver ${fullName(account)}`}
                        onClick={() => changeStatus(account, true)}
                        disabled={setActive.isPending}
                      >
                        Réactiver
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

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
