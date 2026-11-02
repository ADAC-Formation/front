import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse, delay } from 'msw'
import { useLocation } from 'react-router'
import { renderWithProviders } from '../../../test/render'
import { server } from '../../../test/msw/server'
import { API_URL, mockSession } from '../../../test/session'
import { NOTIFICATIONS, mockNotificationApi } from '../../../test/notifications'
import { NotificationBell } from './NotificationBell'

function LocationProbe() {
  return <p data-testid="path">{useLocation().pathname}</p>
}

function renderBell() {
  return renderWithProviders(
    <>
      <NotificationBell />
      <LocationProbe />
    </>,
    { withSession: true },
  )
}

const bellButton = (name = /^Notifications/) => screen.findByRole('button', { name })
const panelOf = () => screen.getByRole('region', { name: 'Notifications non lues' })
const openButton = (text) => screen.getByRole('button', { name: new RegExp(`^(Message|Formation|Notification).*${text}`) })
const ERROR_TEXT = /n['’]a pas pu être mise à jour/

beforeEach(() => mockSession('STAGIAIRE'))

describe('panneau : chargement et erreur (spec « Erreurs et chargement »)', () => {
  it('annonce le chargement au lieu de « Aucune nouvelle notification »', async () => {
    mockNotificationApi()
    server.use(
      http.get(`${API_URL}/notifications/unread`, async () => {
        await delay(500)
        return HttpResponse.json({ count: 1, notifications: [NOTIFICATIONS[0]] })
      }),
    )
    const user = userEvent.setup()
    renderBell()
    await user.click(await bellButton())

    expect(within(panelOf()).getByText('Chargement…')).toBeInTheDocument()
    expect(within(panelOf()).queryByText('Aucune nouvelle notification')).not.toBeInTheDocument()
    expect(await within(panelOf()).findByText('Nouveau message de Marie')).toBeInTheDocument()
  })

  it('affiche l’erreur et « Réessayer » quand le chargement échoue, puis relance la requête', async () => {
    mockNotificationApi({ failReads: true })
    const user = userEvent.setup()
    renderBell()
    await user.click(await bellButton())

    const panel = panelOf()
    expect(await within(panel).findByRole('alert')).toBeInTheDocument()
    expect(within(panel).queryByText('Aucune nouvelle notification')).not.toBeInTheDocument()
    expect(within(panel).queryByRole('button', { name: 'Tout marquer comme lu' })).not.toBeInTheDocument()

    mockNotificationApi()
    await user.click(within(panel).getByRole('button', { name: 'Réessayer' }))

    expect(await within(panel).findByText('Nouveau message de Marie')).toBeInTheDocument()
    expect(within(panel).queryByRole('alert')).not.toBeInTheDocument()
  })

  it('garde les notifications affichées quand seule une relecture échoue', async () => {
    const calls = mockNotificationApi()
    const user = userEvent.setup()
    renderBell()
    await user.click(await bellButton())
    await within(panelOf()).findByText('Nouveau message de Marie')

    mockNotificationApi({ failReads: true, notifications: calls.state })
    await act(async () => { window.dispatchEvent(new Event('visibilitychange')) })
    await new Promise((resolve) => setTimeout(resolve, 150))

    expect(within(panelOf()).getByText('Nouveau message de Marie')).toBeInTheDocument()
    expect(within(panelOf()).queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('focus clavier dans le panneau', () => {
  it('« ✕ » envoie le focus sur la notification suivante', async () => {
    mockNotificationApi()
    const user = userEvent.setup()
    renderBell()
    await user.click(await bellButton())
    await screen.findByText('Nouveau message de Marie')

    within(panelOf()).getByRole('button', { name: 'Retirer de la cloche : Nouveau message de Marie' }).focus()
    await user.keyboard('{Enter}')

    await waitFor(() => expect(screen.queryByText('Nouveau message de Marie')).not.toBeInTheDocument())
    await waitFor(() => expect(openButton('Nouveau document dans Excel avancé')).toHaveFocus())
  })

  it('« ✕ » sur la dernière notification envoie le focus sur la précédente', async () => {
    mockNotificationApi()
    const user = userEvent.setup()
    renderBell()
    await user.click(await bellButton())
    await screen.findByText('La formation Excel avancé a été modifiée')

    within(panelOf()).getByRole('button', { name: 'Retirer de la cloche : La formation Excel avancé a été modifiée' }).focus()
    await user.keyboard('{Enter}')

    await waitFor(() => expect(openButton('Nouveau document dans Excel avancé')).toHaveFocus())
  })

  it('retirer la seule notification envoie le focus sur « Voir toutes les notifications »', async () => {
    mockNotificationApi({ notifications: [NOTIFICATIONS[0]] })
    const user = userEvent.setup()
    renderBell()
    await user.click(await bellButton())
    await screen.findByText('Nouveau message de Marie')

    within(panelOf()).getByRole('button', { name: 'Retirer de la cloche : Nouveau message de Marie' }).focus()
    await user.keyboard('{Enter}')

    const link = await within(panelOf()).findByRole('link', { name: 'Voir toutes les notifications' })
    await waitFor(() => expect(link).toHaveFocus())
  })

  it('« Tout marquer comme lu » envoie le focus sur « Voir toutes les notifications »', async () => {
    mockNotificationApi()
    const user = userEvent.setup()
    renderBell()
    await user.click(await bellButton())
    await screen.findByText('Nouveau message de Marie')

    within(panelOf()).getByRole('button', { name: 'Tout marquer comme lu' }).focus()
    await user.keyboard('{Enter}')

    const link = await within(panelOf()).findByRole('link', { name: 'Voir toutes les notifications' })
    await waitFor(() => expect(link).toHaveFocus())
    expect(document.activeElement).not.toBe(document.body)
  })
})

describe('annonces : erreurs et nouvelles notifications', () => {
  const NEW = { id: 9, type: 'NEW_MESSAGE', content: 'Encore', entityType: 'MESSAGE', entityId: 4, isRead: false, deletedFromBell: false, createdAt: '2026-11-02T11:00:00' }

  it('annonce l’erreur d’une action qui échoue, sans la présenter comme une nouvelle notification', async () => {
    mockNotificationApi({ failWrites: true })
    const user = userEvent.setup()
    renderBell()
    await user.click(await bellButton())
    await user.click(await screen.findByRole('button', { name: 'Tout marquer comme lu' }))

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(ERROR_TEXT))
    await bellButton('Notifications, 3 non lues')
    expect(screen.getByRole('status')).not.toHaveTextContent(/nouvelle/)
  })

  it('annonce encore une vraie nouvelle notification après un échec', async () => {
    const calls = mockNotificationApi({ failWrites: true })
    const user = userEvent.setup()
    renderBell()
    await user.click(await bellButton())
    await user.click(await screen.findByRole('button', { name: 'Tout marquer comme lu' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(ERROR_TEXT))
    await bellButton('Notifications, 3 non lues')

    calls.state.push(NEW)
    await act(async () => { window.dispatchEvent(new Event('visibilitychange')) })

    await bellButton('Notifications, 4 non lues')
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('1 nouvelle notification'))
  })

  it('n’annonce pas comme nouvelle la notification rétablie après un échec de marquage', async () => {
    mockNotificationApi({ failWrites: true })
    const user = userEvent.setup()
    renderBell()
    await user.click(await bellButton())
    await screen.findByText('Nouveau message de Marie')
    await user.click(openButton('Nouveau message de Marie'))

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(ERROR_TEXT))
    await bellButton('Notifications, 3 non lues')
    expect(screen.getByRole('status')).not.toHaveTextContent(/nouvelle/)
    expect(screen.getByTestId('path')).toHaveTextContent('/messages/7')
  })
})
