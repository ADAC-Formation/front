import { useId, useMemo, useState } from 'react'
import Alert from '../../../components/atoms/Alert/Alert'
import BackButton from '../../../components/molecules/BackButton/BackButton'
import { PageShell } from '../../../templates/PageShell/PageShell'
import { NotificationItem } from '../components/NotificationItem'
import { useNotifications } from '../hooks'
import { useOpenNotification } from '../useOpenNotification'
import styles from './NotificationsPage.module.css'

const STATUSES = [
  { value: 'all', label: 'Toutes' },
  { value: 'unread', label: 'Non lues' },
  { value: 'read', label: 'Lues' },
]

// Le back ne trie pas selon `sort` : le tri par date se fait ici, sur les 200 notifications reçues.
// Une notification sans date (contrat violé) passe après les autres, quel que soit le sens.
const byDate = (direction) => (a, b) => {
  if (!a.createdAt || !b.createdAt) return Number(!a.createdAt) - Number(!b.createdAt)
  return direction * (Date.parse(a.createdAt) - Date.parse(b.createdAt))
}

const SORTS = {
  newest: { label: 'Plus récentes d’abord', compare: byDate(-1) },
  oldest: { label: 'Plus anciennes d’abord', compare: byDate(1) },
}

// Historique complet (N6) : lues et non lues, jamais de suppression (le back conserve tout).
// Cliquer une notification a le même effet que dans la cloche.
const NotificationsPage = () => {
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState('newest')
  const sortId = useId()

  const { data, isLoading, isError, error, refetch } = useNotifications(status)
  const { open } = useOpenNotification()

  const notifications = useMemo(() => [...(data ?? [])].sort(SORTS[sort].compare), [data, sort])
  const isEmpty = !isLoading && !isError && notifications.length === 0

  return (
    <PageShell className={styles.page}>
      <BackButton to="/" />
      <h1 className={styles.title}>Notifications</h1>
      <p className={styles.note}>
        Votre historique : les 200 notifications les plus récentes sont affichées, lues ou non.
      </p>

      <div className={styles.toolbar}>
        <fieldset className={styles.filters}>
          <legend className={styles.srOnly}>Statut</legend>
          {STATUSES.map(({ value, label }) => (
            <label key={value} className={styles.pill}>
              <input
                type="radio"
                name="statut-notifications"
                value={value}
                checked={status === value}
                onChange={() => setStatus(value)}
              />
              <span>{label}</span>
            </label>
          ))}
        </fieldset>

        <div className={styles.sort}>
          <label htmlFor={sortId}>Organiser par :</label>
          <select id={sortId} value={sort} onChange={(event) => setSort(event.target.value)}>
            {Object.entries(SORTS).map(([value, { label }]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <section className={styles.card}>
        {isLoading && <p role="status">Chargement…</p>}

        {isError && (
          <div className={styles.errorBox}>
            <Alert variant="error">{error.message}</Alert>
            <button type="button" className={styles.retry} onClick={() => refetch()}>
              Réessayer
            </button>
          </div>
        )}

        {isEmpty && <p className={styles.empty}>Aucune notification</p>}

        {notifications.length > 0 && (
          <ul className={styles.list}>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onOpen={open}
                showStatus
              />
            ))}
          </ul>
        )}
      </section>
    </PageShell>
  )
}

export default NotificationsPage
