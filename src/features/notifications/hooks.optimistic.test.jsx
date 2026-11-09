import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse, delay } from 'msw'
import { renderWithProviders } from '../../test/render'
import { server } from '../../test/msw/server'
import { API_URL } from '../../test/session'
import { NOTIFICATIONS, mockNotificationApi } from '../../test/notifications'
import { useMarkAllAsRead, useMarkAsRead, useRemoveFromBell, useUnreadNotifications } from './hooks'

// Ces tests vérifient la cloche PENDANT que la relecture qui suit une écriture n'a pas répondu :
// sans cela, la relecture rétablit l'état du serveur et masque un retour arrière manquant.

function Probe({ onCount }) {

  const { data } = useUnreadNotifications()
  const markAsRead = useMarkAsRead()
  const markAll = useMarkAllAsRead()
  const remove = useRemoveFromBell()
  if (!data) return <p>chargement</p>
  onCount?.(data.count)
  return (
    <div>
      <p data-testid="count">{data.count}</p>
      <ul>
        {data.notifications.map((n) => (
          <li key={n.id}>{n.content}</li>
        ))}
      </ul>
      <button onClick={() => markAsRead.mutate(1)}>lire 1</button>
      <button onClick={() => markAsRead.mutate(77)}>lire 77</button>
      <button onClick={() => remove.mutate(1)}>retirer 1</button>
      <button onClick={() => markAll.mutate()}>tout lire</button>
      {markAsRead.isError || markAll.isError || remove.isError ? <p>échec</p> : null}
    </div>
  )
}

// Après l'échec d'une écriture, la relecture (invalidation) met 2 s à répondre.
function slowRefetchAfterLoad() {
  server.use(
    http.get(`${API_URL}/notifications/unread`, async () => {
      await delay(2000)
      return HttpResponse.json({ count: 3, notifications: NOTIFICATIONS.slice(0, 3) })
    }),
  )
}

describe('retour arrière après un échec (relecture encore en cours)', () => {
  it('« marquer comme lue » rétablit la notification et le compteur', async () => {
    mockNotificationApi({ failWrites: true })
    const user = userEvent.setup()
    renderWithProviders(<Probe />)
    await screen.findByTestId('count')
    slowRefetchAfterLoad()

    await user.click(screen.getByRole('button', { name: 'lire 1' }))
    await screen.findByText('échec')

    expect(screen.getByTestId('count')).toHaveTextContent('3')
    expect(screen.getByText('Nouveau message de Marie')).toBeInTheDocument()
  })

  it('« tout marquer comme lu » rétablit la liste et le compteur', async () => {
    mockNotificationApi({ failWrites: true })
    const user = userEvent.setup()
    renderWithProviders(<Probe />)
    await screen.findByTestId('count')
    slowRefetchAfterLoad()

    await user.click(screen.getByRole('button', { name: 'tout lire' }))
    await screen.findByText('échec')

    expect(screen.getByTestId('count')).toHaveTextContent('3')
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  it('« retirer de la cloche » rétablit la notification et le compteur', async () => {
    mockNotificationApi({ failWrites: true })
    const user = userEvent.setup()
    renderWithProviders(<Probe />)
    await screen.findByTestId('count')
    slowRefetchAfterLoad()

    await user.click(screen.getByRole('button', { name: 'retirer 1' }))
    await screen.findByText('échec')

    expect(screen.getByTestId('count')).toHaveTextContent('3')
    expect(screen.getByText('Nouveau message de Marie')).toBeInTheDocument()
  })
})

describe('état de la mutation', () => {
  it("passe en échec sans attendre la relecture (l'annonce de l'erreur ne doit pas traîner)", async () => {
    mockNotificationApi({ failWrites: true })
    const user = userEvent.setup()
    renderWithProviders(<Probe />)
    await screen.findByTestId('count')
    slowRefetchAfterLoad() // la relecture met 2 s

    await user.click(screen.getByRole('button', { name: 'lire 1' }))

    // Bien avant la fin de la relecture.
    expect(await screen.findByText('échec', {}, { timeout: 800 })).toBeInTheDocument()
  })
})

describe('compteur optimiste', () => {
  it('ne baisse pas pour une non lue déjà retirée de la cloche (le back ne la compte pas)', async () => {
    const removedUnread = { ...NOTIFICATIONS[0], id: 77, content: 'Retirée de la cloche', deletedFromBell: true }
    mockNotificationApi({ notifications: [NOTIFICATIONS[1], removedUnread] })
    server.use(
      http.patch(`${API_URL}/notifications/:id/read`, async () => {
        await delay(300)
        return HttpResponse.json({})
      }),
    )
    const seen = []
    const user = userEvent.setup()
    renderWithProviders(<Probe onCount={(count) => seen.push(count)} />)
    await screen.findByTestId('count')
    expect(screen.getByTestId('count')).toHaveTextContent('1')

    await user.click(screen.getByRole('button', { name: 'lire 77' }))
    await new Promise((resolve) => setTimeout(resolve, 450))

    expect(screen.getByTestId('count')).toHaveTextContent('1')
    expect(seen).not.toContain(0)
  })

  it('baisse toujours d’un pour une notification qui est dans la cloche', async () => {
    mockNotificationApi()
    server.use(
      http.patch(`${API_URL}/notifications/:id/read`, async () => {
        await delay(300)
        return HttpResponse.json({})
      }),
    )
    const user = userEvent.setup()
    renderWithProviders(<Probe />)
    await screen.findByTestId('count')

    await user.click(screen.getByRole('button', { name: 'lire 1' }))

    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('2'))
  })
})
