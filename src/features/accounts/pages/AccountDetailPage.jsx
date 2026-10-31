import { useState } from 'react'
import { Link, useParams } from 'react-router'
import Alert from '../../../components/atoms/Alert/Alert'
import FormButton from '../../../components/atoms/FormButton/FormButton'
import ConfirmDialog from '../../../components/molecules/ConfirmDialog/ConfirmDialog'
import { roleLabels } from '../../../utils/roles'
import { useCurrentUser } from '../../auth/hooks'
import { ACCOUNT_KINDS, canManageAccounts, fullName } from '../accountKinds'
import AccountNotFound from '../components/AccountNotFound'
import AccountNotice from '../components/AccountNotice'
import { useAccount, useSetAccountActive } from '../hooks'
import styles from './AccountPages.module.css'

// Détail d'un compte. La chargée de formation peut le modifier, le suspendre ou le réactiver ;
// le formateur le consulte seulement (D54). Tout le contenu est rendu en texte.
const AccountDetailPage = ({ kind }) => {
  const config = ACCOUNT_KINDS[kind]
  const { id } = useParams()
  const { user } = useCurrentUser()
  const canManage = canManageAccounts(user)
  const [confirming, setConfirming] = useState(false)

  const { data: account, isLoading, isError, error, refetch } = useAccount(id)
  const setActive = useSetAccountActive()

  if (isLoading) return <p role="status">Chargement…</p>

  if (isError) {
    return error.status === 404 ? (
      <AccountNotFound backPath={config.basePath} backLabel={`Retour aux ${config.title.toLowerCase()}`} />
    ) : (
      <div className={styles.page}>
        <Alert variant="error">{error.message}</Alert>
        <FormButton onClick={() => refetch()}>Réessayer</FormButton>
      </div>
    )
  }

  const changeStatus = (active) => {
    setActive.reset()
    setActive.mutate({ id: account.id, active }, { onSettled: () => setConfirming(false) })
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{fullName(account)}</h1>

      <AccountNotice />
      {setActive.error && <Alert variant="error">{setActive.error.message}</Alert>}

      <dl className={styles.definition}>
        <dt>E-mail</dt>
        <dd>{account.email}</dd>
        <dt>Rôle</dt>
        <dd>{roleLabels[account.role] ?? account.role}</dd>
        <dt>Statut</dt>
        <dd>{account.isActive ? 'Actif' : 'Suspendu'}</dd>
      </dl>

      <div className={styles.actions}>
        {canManage && (
          <Link className={styles.primaryLink} to={`${config.basePath}/${account.id}/modifier`}>
            Modifier
          </Link>
        )}
        {canManage &&
          (account.isActive ? (
            <button type="button" className={styles.rowButton} onClick={() => setConfirming(true)}>
              Suspendre
            </button>
          ) : (
            <button
              type="button"
              className={styles.rowButton}
              onClick={() => changeStatus(true)}
              disabled={setActive.isPending}
            >
              Réactiver
            </button>
          ))}
        <Link to={config.basePath}>Retour aux {config.title.toLowerCase()}</Link>
      </div>

      {confirming && (
        <ConfirmDialog
          title="Suspendre ce compte ?"
          confirmLabel="Suspendre"
          onConfirm={() => changeStatus(false)}
          onCancel={() => setConfirming(false)}
          disabled={setActive.isPending}
        >
          {`${fullName(account)} ne pourra plus se connecter tant que le compte est suspendu.`}
        </ConfirmDialog>
      )}
    </div>
  )
}

export default AccountDetailPage
