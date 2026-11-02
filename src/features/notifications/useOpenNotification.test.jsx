import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLocation } from 'react-router'
import { renderWithProviders } from '../../test/render'
import { NOTIFICATIONS, mockNotificationApi } from '../../test/notifications'
import { useOpenNotification } from './useOpenNotification'

const byId = (id) => NOTIFICATIONS.find((n) => n.id === id)

function Probe({ notification }) {
  const { open, isError } = useOpenNotification()
  const { pathname } = useLocation()
  return (
    <div>
      <p data-testid="path">{pathname}</p>
      <button onClick={() => open(notification)}>ouvrir</button>
      {isError ? <p>échec</p> : null}
    </div>
  )
}

describe('useOpenNotification', () => {
  it('marque un message comme lu puis ouvre la conversation', async () => {
    const calls = mockNotificationApi()
    const user = userEvent.setup()
    renderWithProviders(<Probe notification={byId(1)} />)

    await user.click(screen.getByRole('button', { name: 'ouvrir' }))

    await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/messages/7'))
    expect(calls.read).toEqual([1])
  })

  it('ouvre le détail de la formation', async () => {
    mockNotificationApi()
    const user = userEvent.setup()
    renderWithProviders(<Probe notification={byId(2)} />)

    await user.click(screen.getByRole('button', { name: 'ouvrir' }))

    await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/formations/12'))
  })

  it("n'envoie pas de PATCH pour une notification déjà lue, mais navigue", async () => {
    const calls = mockNotificationApi()
    const user = userEvent.setup()
    renderWithProviders(<Probe notification={byId(4)} />)

    await user.click(screen.getByRole('button', { name: 'ouvrir' }))

    await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/messages/9'))
    expect(calls.read).toEqual([])
  })

  it('marque comme lue sans naviguer quand le type est inconnu', async () => {
    const calls = mockNotificationApi({
      notifications: [{ ...byId(1), id: 50, entityType: 'AUTRE', entityId: 1 }],
    })
    const user = userEvent.setup()
    renderWithProviders(<Probe notification={{ ...byId(1), id: 50, entityType: 'AUTRE', entityId: 1 }} />)

    await user.click(screen.getByRole('button', { name: 'ouvrir' }))

    await waitFor(() => expect(calls.read).toEqual([50]))
    expect(screen.getByTestId('path')).toHaveTextContent('/')
    expect(screen.getByTestId('path').textContent).toBe('/')
  })

  it("navigue quand même et signale l'échec si le marquage échoue", async () => {
    mockNotificationApi({ failWrites: true })
    const user = userEvent.setup()
    renderWithProviders(<Probe notification={byId(1)} />)

    await user.click(screen.getByRole('button', { name: 'ouvrir' }))

    await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/messages/7'))
    expect(await screen.findByText('échec')).toBeInTheDocument()
  })
})
