import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { useLocation } from 'react-router'
import { renderWithProviders } from '../../../test/render'
import { mockNotificationApi } from '../../../test/notifications'
import NotificationsPage from './NotificationsPage'

function LocationProbe() {
  return <p data-testid="path">{useLocation().pathname}</p>
}

function renderPage() {
  return renderWithProviders(
    <>
      <NotificationsPage />
      <LocationProbe />
    </>,
  )
}

const itemTexts = () => screen.getAllByRole('listitem').map((item) => item.textContent)

describe('NotificationsPage — historique', () => {
  it('affiche un titre de niveau 1', async () => {
    mockNotificationApi()
    renderPage()
    expect(await screen.findByRole('heading', { level: 1, name: 'Notifications' })).toBeInTheDocument()
  })

  it('liste toutes les notifications, lues et non lues, sans paramètre', async () => {
    const calls = mockNotificationApi()
    renderPage()
    expect(await screen.findByText('Nouveau message de Marie')).toBeInTheDocument()
    expect(screen.getByText('Nouveau message de Paul')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
    expect(new URL(calls.listUrls[0]).search).toBe('')
  })

  it('distingue les lues des non lues en texte', async () => {
    mockNotificationApi()
    renderPage()
    await screen.findByText('Nouveau message de Marie')
    const [marie] = screen.getAllByRole('listitem')
    expect(marie).toHaveTextContent('Non lue')
    const paul = screen.getByText('Nouveau message de Paul').closest('li')
    expect(paul).not.toHaveTextContent('Non lue')
    expect(paul).toHaveTextContent('(lue)')
  })

  it('annonce le plafond de 200 notifications', async () => {
    mockNotificationApi()
    renderPage()
    expect(await screen.findByText(/200 notifications les plus récentes/)).toBeInTheDocument()
  })

  it("n'offre aucune suppression", async () => {
    mockNotificationApi()
    renderPage()
    await screen.findByText('Nouveau message de Marie')
    expect(screen.queryByRole('button', { name: /supprimer|retirer/i })).not.toBeInTheDocument()
  })
})

describe('NotificationsPage — filtre et tri', () => {
  it('« Non lues » envoie ?read=false', async () => {
    const calls = mockNotificationApi()
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Nouveau message de Paul')

    await user.click(screen.getByRole('radio', { name: 'Non lues' }))

    await waitFor(() => expect(screen.queryByText('Nouveau message de Paul')).not.toBeInTheDocument())
    expect(new URL(calls.listUrls.at(-1)).searchParams.get('read')).toBe('false')
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  it('« Lues » envoie ?read=true, puis « Toutes » retire le paramètre', async () => {
    const calls = mockNotificationApi()
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Nouveau message de Paul')

    await user.click(screen.getByRole('radio', { name: 'Lues' }))
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(1))
    expect(new URL(calls.listUrls.at(-1)).searchParams.get('read')).toBe('true')

    await user.click(screen.getByRole('radio', { name: 'Toutes' }))
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(4))
    expect(new URL(calls.listUrls.at(-1)).search).toBe('')
  })

  it('trie du plus récent au plus ancien par défaut, et inverse sans nouvel appel', async () => {
    const calls = mockNotificationApi()
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Nouveau message de Marie')
    const newestFirst = itemTexts()
    expect(newestFirst[0]).toContain('Marie')
    expect(newestFirst[3]).toContain('Paul')
    const callsBefore = calls.list

    await user.selectOptions(screen.getByLabelText('Organiser par :'), 'Plus anciennes d’abord')

    await waitFor(() => expect(itemTexts()[0]).toContain('Paul'))
    expect(itemTexts()[3]).toContain('Marie')
    expect(calls.list).toBe(callsBefore)
  })
})

describe('NotificationsPage — ouvrir une notification', () => {
  it('marque comme lue et navigue, comme la cloche', async () => {
    const calls = mockNotificationApi()
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Nouveau message de Marie')

    await user.click(screen.getByRole('button', { name: /^Message.*Nouveau message de Marie/ }))

    await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/messages/7'))
    expect(calls.read).toEqual([1])
  })

  it("n'envoie pas de PATCH pour une notification déjà lue", async () => {
    const calls = mockNotificationApi()
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Nouveau message de Paul')

    await user.click(screen.getByRole('button', { name: /^Message.*Nouveau message de Paul/ }))

    await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/messages/9'))
    expect(calls.read).toEqual([])
  })
})

describe('NotificationsPage — états', () => {
  it('annonce le chargement', () => {
    mockNotificationApi()
    renderPage()
    expect(screen.getByRole('status')).toHaveTextContent('Chargement')
  })

  it('affiche « Aucune notification » quand la liste est vide', async () => {
    mockNotificationApi({ notifications: [] })
    renderPage()
    expect(await screen.findByText('Aucune notification')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('affiche l’erreur et relance la requête avec « Réessayer »', async () => {
    mockNotificationApi({ failReads: true })
    const user = userEvent.setup()
    renderPage()
    expect(await screen.findByRole('alert')).toBeInTheDocument()

    mockNotificationApi()
    await user.click(screen.getByRole('button', { name: 'Réessayer' }))

    expect(await screen.findByText('Nouveau message de Marie')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('affiche le contenu en texte, jamais en HTML', async () => {
    mockNotificationApi({
      notifications: [{ id: 1, type: 'NEW_MESSAGE', content: '<b>gras</b>', entityType: 'MESSAGE', entityId: 7, isRead: false, createdAt: '2026-11-02T10:00:00' }],
    })
    renderPage()
    const item = await screen.findByRole('listitem')
    expect(within(item).getByText('<b>gras</b>')).toBeInTheDocument()
    expect(item.querySelector('b')).toBeNull()
  })

  it('ne présente aucune violation jest-axe', async () => {
    mockNotificationApi()
    const { container } = renderPage()
    await screen.findByText('Nouveau message de Marie')
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('NotificationsPage — données incomplètes', () => {
  it('trie et affiche une liste où createdAt manque, sans planter', async () => {
    mockNotificationApi({
      notifications: [
        { id: 1, type: 'NEW_MESSAGE', content: 'Sans date', entityType: 'MESSAGE', entityId: 7, isRead: false, createdAt: null },
        { id: 2, type: 'NEW_MESSAGE', content: 'Avec date', entityType: 'MESSAGE', entityId: 8, isRead: false, createdAt: '2026-11-02T10:00:00' },
      ],
    })
    const user = userEvent.setup()
    renderPage()
    expect(await screen.findByText('Avec date')).toBeInTheDocument()
    expect(screen.getByText('Sans date')).toBeInTheDocument()
    // Les notifications sans date passent après les datées, dans les deux sens de tri.
    expect(itemTexts()[0]).toContain('Avec date')
    await user.selectOptions(screen.getByLabelText('Organiser par :'), 'Plus anciennes d’abord')
    await waitFor(() => expect(screen.getByLabelText('Organiser par :')).toHaveValue('oldest'))
    expect(itemTexts()[0]).toContain('Avec date')
    expect(itemTexts()[1]).toContain('Sans date')
  })
})
