import { useState } from 'react'
import { Link, useParams } from 'react-router'
import Alert from '../../../components/atoms/Alert/Alert'
import BackButton from '../../../components/molecules/BackButton/BackButton'
import ConfirmDialog from '../../../components/molecules/ConfirmDialog/ConfirmDialog'
import { roleLabels } from '../../../utils/roles'
import { useCurrentUser } from '../../auth/hooks'
import StagiaireDocumentsSection from '../../documents/components/StagiaireDocumentsSection'
import { ACCOUNT_KINDS, canManageAccounts, fullName } from '../accountKinds'
import AccountNotFound from '../components/AccountNotFound'
import AccountNotice from '../components/AccountNotice'
import { useAccount, useSetAccountActive } from '../hooks'
import styles from './AccountPages.module.css'
import { PageShell } from '../../../templates/PageShell/PageShell'

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

  if (isLoading) {
    return (
      <PageShell className={styles.page}>
        <p role="status">Chargement…</p>
      </PageShell>
    )
  }

  if (isError) {
    return error.status === 404 ? (
      <AccountNotFound backPath={config.basePath} backLabel={`Retour aux ${config.title.toLowerCase()}`} />
    ) : (
      <PageShell className={styles.page}>
        <Alert variant="error">{error.message}</Alert>
        <button type="button" className={styles.submitButton} onClick={() => refetch()}>
          Réessayer
        </button>
      </PageShell>
    )
  }

  const changeStatus = (active) => {
    setActive.reset()
    setActive.mutate({ id: account.id, active }, { onSettled: () => setConfirming(false) })
  }

  return (
    <PageShell className={styles.page}>
      <BackButton to={config.basePath}>Retour aux {config.title.toLowerCase()}</BackButton>

      <div className={styles.header}>
        <h1 className={styles.title}>{fullName(account)}</h1>
        {canManage && (
          <Link className={styles.createButton} to={`${config.basePath}/${account.id}/modifier`}>
            Modifier
          </Link>
        )}
      </div>

      <div className={styles.notices}>
        <AccountNotice />
        {setActive.error && <Alert variant="error">{setActive.error.message}</Alert>}
      </div>

      <section className={styles.card}>
        <dl className={styles.definition}>
          <dt>E-mail</dt>
          <dd>{account.email}</dd>
          <dt>Rôle</dt>
          <dd>{roleLabels[account.role] ?? account.role}</dd>
          <dt>Statut</dt>
          <dd>{account.isActive ? 'Actif' : 'Inactif'}</dd>
        </dl>

        {canManage && (
          <div className={styles.actions}>
            {account.isActive ? (
              <button type="button" className={styles.secondaryButton} onClick={() => setConfirming(true)}>
                Suspendre
              </button>
            ) : (
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => changeStatus(true)}
                disabled={setActive.isPending}
              >
                Réactiver
              </button>
            )}
          </div>
        )}
      </section>

      {kind === 'stagiaires' && <StagiaireDocumentsSection stagiaireId={account.id} className={styles.card} />}

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
    </PageShell>
  )
}

export default AccountDetailPage
