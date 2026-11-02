import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient } from '@tanstack/react-query'
import { http, HttpResponse, delay } from 'msw'
import { renderWithProviders } from '../../test/render'
import { server } from '../../test/msw/server'
import { API_URL } from '../../test/session'
import { mockNotificationApi } from '../../test/notifications'
import { endSession } from '../auth/hooks'
import {
  UNREAD_POLL_INTERVAL_MS,
  unreadNotificationsOptions,
  useMarkAllAsRead,
  useMarkAsRead,
  useNotifications,
  useRemoveFromBell,
  useUnreadNotifications,
} from './hooks'

function UnreadProbe({ enabled = true }) {
  const { data, isLoading, isError } = useUnreadNotifications({ enabled })
  const markAsRead = useMarkAsRead()
  const markAll = useMarkAllAsRead()
  const remove = useRemoveFromBell()
  if (isLoading) return <p>chargement</p>
  if (isError) return <p>erreur</p>
  if (!data) return <p>désactivé</p>
  return (
    <div>
      <p data-testid="count">{data.count}</p>
      <ul>
        {data.notifications.map((n) => (
          <li key={n.id}>
            {n.content}
            <button onClick={() => markAsRead.mutate(n.id)}>lire {n.id}</button>
            <button onClick={() => remove.mutate(n.id)}>retirer {n.id}</button>
          </li>
        ))}
      </ul>
      <button onClick={() => markAll.mutate()}>tout lire</button>
      {markAsRead.isError || markAll.isError || remove.isError ? <p>échec de l'action</p> : null}
    </div>
  )
}

function HistoryProbe({ status }) {
  const { data, isLoading } = useNotifications(status)
  if (isLoading) return <p>chargement</p>
  return (
    <ul>
      {data.map((n) => (
        <li key={n.id}>{n.content}</li>
      ))}
    </ul>
  )
}

describe('useUnreadNotifications', () => {
  it('renvoie le compteur et les non lues', async () => {
    mockNotificationApi()
    renderWithProviders(<UnreadProbe />)
    expect(await screen.findByTestId('count')).toHaveTextContent('3')
    expect(screen.getByText('Nouveau message de Marie')).toBeInTheDocument()
  })

  it("n'envoie aucune requête quand il est désactivé", () => {
    const calls = mockNotificationApi()
    renderWithProviders(<UnreadProbe enabled={false} />)
    expect(screen.getByText('désactivé')).toBeInTheDocument()
    expect(calls.unread).toBe(0)
  })

  it("s'interroge toutes les 45 s, en pause quand l'onglet est masqué, et au retour sur l'onglet", () => {
    expect(UNREAD_POLL_INTERVAL_MS).toBe(45_000)
    expect(unreadNotificationsOptions.refetchInterval).toBe(45_000)
    expect(unreadNotificationsOptions.refetchIntervalInBackground).toBe(false)
    expect(unreadNotificationsOptions.refetchOnWindowFocus).toBe(true)
  })

  describe('avec horloge simulée', () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('relance la requête après 45 s', async () => {
      const calls = mockNotificationApi()
      renderWithProviders(<UnreadProbe />)
      await screen.findByTestId('count')
      expect(calls.unread).toBe(1)

      await act(async () => {
        await vi.advanceTimersByTimeAsync(UNREAD_POLL_INTERVAL_MS + 100)
      })
      await waitFor(() => expect(calls.unread).toBeGreaterThanOrEqual(2))
    })
  })
})

describe('mises à jour de la cloche', () => {
  it('marquer comme lue retire la notification et décrémente le compteur avant la réponse du back', async () => {
    const calls = mockNotificationApi()
    // Réponse volontairement lente : l'effet doit être visible avant elle.
    server.use(
      http.patch(`${API_URL}/notifications/:id/read`, async ({ params }) => {
        calls.read.push(Number(params.id))
        await delay(300)
        return HttpResponse.json({ id: Number(params.id), isRead: true })
      }),
    )
    const user = userEvent.setup()
    renderWithProviders(<UnreadProbe />)
    await screen.findByTestId('count')

    await user.click(screen.getByRole('button', { name: 'lire 1' }))

    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('2'))
    expect(screen.queryByText('Nouveau message de Marie')).not.toBeInTheDocument()
    await waitFor(() => expect(calls.read).toEqual([1]))
  })

  it("rétablit la notification et le compteur quand l'écriture échoue", async () => {
    mockNotificationApi({ failWrites: true })
    const user = userEvent.setup()
    renderWithProviders(<UnreadProbe />)
    await screen.findByTestId('count')

    await user.click(screen.getByRole('button', { name: 'lire 1' }))

    expect(await screen.findByText("échec de l'action")).toBeInTheDocument()
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('3'))
    expect(screen.getByText('Nouveau message de Marie')).toBeInTheDocument()
  })

  it('« tout marquer comme lu » vide la cloche', async () => {
    const calls = mockNotificationApi()
    const user = userEvent.setup()
    renderWithProviders(<UnreadProbe />)
    await screen.findByTestId('count')

    await user.click(screen.getByRole('button', { name: 'tout lire' }))

    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('0'))
    expect(calls.readAll).toBe(1)
    expect(screen.queryByText('Nouveau message de Marie')).not.toBeInTheDocument()
  })

  it("retirer de la cloche envoie DELETE et ne touche pas l'historique", async () => {
    const calls = mockNotificationApi()
    const user = userEvent.setup()
    renderWithProviders(
      <>
        <UnreadProbe />
        <HistoryProbe />
      </>,
    )
    await screen.findByTestId('count')

    await user.click(screen.getByRole('button', { name: 'retirer 2' }))

    await waitFor(() => expect(calls.remove).toEqual([2]))
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('2'))
    // La notification reste dans l'historique (une seule occurrence : celle de la liste).
    expect(await screen.findAllByText('Nouveau document dans Excel avancé')).toHaveLength(1)
  })

  it("rafraîchit l'historique après une lecture", async () => {
    mockNotificationApi()
    const user = userEvent.setup()
    renderWithProviders(
      <>
        <UnreadProbe />
        <HistoryProbe status="unread" />
      </>,
    )
    await screen.findByTestId('count')
    expect(await screen.findAllByText('Nouveau message de Marie')).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: 'lire 1' }))

    await waitFor(() => expect(screen.queryAllByText('Nouveau message de Marie')).toHaveLength(0))
  })
})

describe('useNotifications (historique)', () => {
  it("n'envoie aucun paramètre pour « all »", async () => {
    const calls = mockNotificationApi()
    renderWithProviders(<HistoryProbe status="all" />)
    expect(await screen.findByText('Nouveau message de Paul')).toBeInTheDocument()
    expect(new URL(calls.listUrls[0]).search).toBe('')
  })

  it('envoie ?read=false pour « unread »', async () => {
    const calls = mockNotificationApi()
    renderWithProviders(<HistoryProbe status="unread" />)
    await screen.findByText('Nouveau message de Marie')
    expect(screen.queryByText('Nouveau message de Paul')).not.toBeInTheDocument()
    expect(new URL(calls.listUrls[0]).searchParams.get('read')).toBe('false')
  })

  it('envoie ?read=true pour « read »', async () => {
    const calls = mockNotificationApi()
    renderWithProviders(<HistoryProbe status="read" />)
    await screen.findByText('Nouveau message de Paul')
    expect(new URL(calls.listUrls[0]).searchParams.get('read')).toBe('true')
  })
})

describe('fin de session', () => {
  it('vide toutes les données de notifications du cache', () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(['notifications', 'unread'], { count: 1, notifications: [] })
    queryClient.setQueryData(['notifications', 'all', 'all'], [])
    queryClient.setQueryData(['auth', 'me'], { id: 1 })

    endSession(queryClient)

    expect(queryClient.getQueryData(['notifications', 'unread'])).toBeUndefined()
    expect(queryClient.getQueryData(['notifications', 'all', 'all'])).toBeUndefined()
    expect(queryClient.getQueryData(['auth', 'me'])).toBeNull()
  })
})
