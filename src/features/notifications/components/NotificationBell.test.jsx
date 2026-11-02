import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { useLocation } from 'react-router'
import { renderWithProviders } from '../../../test/render'
import { mockNoSession, mockSession } from '../../../test/session'
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
const itemButton = (text) => screen.getByRole('button', { name: new RegExp(`^(Message|Formation|Notification).*${text}`) })

async function openPanel(user) {
  await user.click(await bellButton())
  return screen.getByRole('region', { name: 'Notifications non lues' })
}

describe('NotificationBell — session', () => {
  it('est absente sans session, sans aucun appel /notifications', async () => {
    mockNoSession()
    const calls = mockNotificationApi()
    renderBell()
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 150)) })
    expect(screen.queryByRole('button', { name: /Notifications/ })).not.toBeInTheDocument()
    expect(calls.unread).toBe(0)
  })

  it('est présente avec une session, quel que soit le rôle', async () => {
    for (const role of ['SUPER_ADMIN', 'ADMIN', 'STAGIAIRE']) {
      mockSession(role)
      mockNotificationApi()
      const { unmount } = renderBell()
      expect(await bellButton()).toBeInTheDocument()
      unmount()
    }
  })
})

describe('NotificationBell — badge', () => {
  beforeEach(() => mockSession('STAGIAIRE'))

  it('affiche le nombre de non lues et le nomme pour les lecteurs d’écran', async () => {
    mockNotificationApi()
    renderBell()
    const button = await bellButton('Notifications, 3 non lues')
    expect(within(button).getByText('3')).toBeInTheDocument()
  })

  it('masque le badge à zéro', async () => {
    mockNotificationApi({ notifications: [NOTIFICATIONS[3]] })
    renderBell()
    const button = await bellButton('Notifications')
    expect(button).toHaveAccessibleName('Notifications')
    expect(within(button).queryByText(/\d/)).not.toBeInTheDocument()
  })

  it('affiche « 99+ » au-delà de 99', async () => {
    mockNotificationApi({ unreadCount: 120 })
    renderBell()
    const button = await bellButton('Notifications, 120 non lues')
    expect(within(button).getByText('99+')).toBeInTheDocument()
  })
})

describe('NotificationBell — panneau', () => {
  beforeEach(() => mockSession('STAGIAIRE'))

  it('s’ouvre et liste les non lues', async () => {
    mockNotificationApi()
    const user = userEvent.setup()
    renderBell()
    const button = await bellButton('Notifications, 3 non lues')
    expect(button).toHaveAttribute('aria-expanded', 'false')

    const panel = await openPanel(user)

    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(within(panel).getAllByRole('listitem')).toHaveLength(3)
    expect(within(panel).getByText('Nouveau message de Marie')).toBeInTheDocument()
    expect(within(panel).queryByText('Nouveau message de Paul')).not.toBeInTheDocument()
  })

  it('affiche « Aucune nouvelle notification » quand il est vide', async () => {
    mockNotificationApi({ notifications: [NOTIFICATIONS[3]] })
    const user = userEvent.setup()
    renderBell()
    const panel = await openPanel(user)
    expect(within(panel).getByText('Aucune nouvelle notification')).toBeInTheDocument()
  })

  it('affiche le contenu en texte, jamais en HTML', async () => {
    const hostile = { ...NOTIFICATIONS[0], content: '<img src=x onerror=alert(1)>' }
    mockNotificationApi({ notifications: [hostile] })
    const user = userEvent.setup()
    renderBell()
    const panel = await openPanel(user)
    expect(within(panel).getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument()
    expect(panel.querySelector('img')).toBeNull()
  })

  it('une icône neutre et aucun plantage pour un entityType inconnu', async () => {
    const unknown = { ...NOTIFICATIONS[0], entityType: 'AUTRE', content: 'Quelque chose' }
    mockNotificationApi({ notifications: [unknown] })
    const user = userEvent.setup()
    renderBell()
    const panel = await openPanel(user)
    expect(within(panel).getByRole('button', { name: /^Notification.*Quelque chose/ })).toBeInTheDocument()
  })

  it('porte le type en texte et pas seulement par l’icône', async () => {
    mockNotificationApi()
    const user = userEvent.setup()
    renderBell()
    await openPanel(user)
    expect(itemButton('Nouveau message de Marie')).toHaveAccessibleName(/^Message/)
    expect(itemButton('Nouveau document dans Excel avancé')).toHaveAccessibleName(/^Formation/)
  })
})

describe('NotificationBell — ouvrir une notification', () => {
  beforeEach(() => mockSession('STAGIAIRE'))

  it('marque comme lue, retire du panneau, décrémente le badge et navigue', async () => {
    const calls = mockNotificationApi()
    const user = userEvent.setup()
    renderBell()
    await openPanel(user)

    await user.click(itemButton('Nouveau message de Marie'))

    await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/messages/7'))
    expect(calls.read).toEqual([1])
    await bellButton('Notifications, 2 non lues')
    // Le panneau se ferme à la navigation.
    expect(screen.queryByRole('region', { name: 'Notifications non lues' })).not.toBeInTheDocument()
  })

  it('ouvre le détail de la formation pour une notification de formation', async () => {
    mockNotificationApi()
    const user = userEvent.setup()
    renderBell()
    await openPanel(user)
    await user.click(itemButton('Nouveau document dans Excel avancé'))
    await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/formations/12'))
  })

  it('rétablit la notification et annonce l’erreur quand le marquage échoue', async () => {
    mockNotificationApi({ failWrites: true })
    const user = userEvent.setup()
    renderBell()
    await openPanel(user)

    await user.click(itemButton('Nouveau message de Marie'))

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/n’a pas pu être mise à jour|n'a pas pu être mise à jour/))
    await bellButton('Notifications, 3 non lues')
  })
})

describe('NotificationBell — retirer et tout lire', () => {
  beforeEach(() => mockSession('STAGIAIRE'))

  it('« ✕ » retire de la cloche (DELETE) et décrémente le badge', async () => {
    const calls = mockNotificationApi()
    const user = userEvent.setup()
    renderBell()
    const panel = await openPanel(user)

    await user.click(within(panel).getByRole('button', { name: 'Retirer de la cloche : Nouveau message de Marie' }))

    await waitFor(() => expect(calls.remove).toEqual([1]))
    expect(within(panel).queryByText('Nouveau message de Marie')).not.toBeInTheDocument()
    await bellButton('Notifications, 2 non lues')
    // Reste dans l'historique côté back.
    expect(calls.state.find((n) => n.id === 1).deletedFromBell).toBe(true)
  })

  it('« Tout marquer comme lu » vide le panneau et le badge', async () => {
    const calls = mockNotificationApi()
    const user = userEvent.setup()
    renderBell()
    const panel = await openPanel(user)

    await user.click(within(panel).getByRole('button', { name: 'Tout marquer comme lu' }))

    await waitFor(() => expect(calls.readAll).toBe(1))
    expect(await within(panel).findByText('Aucune nouvelle notification')).toBeInTheDocument()
    await bellButton('Notifications')
  })

  it('« Voir toutes les notifications » mène à l’historique et ferme le panneau', async () => {
    mockNotificationApi()
    const user = userEvent.setup()
    renderBell()
    const panel = await openPanel(user)

    const link = within(panel).getByRole('link', { name: 'Voir toutes les notifications' })
    expect(link).toHaveAttribute('href', '/notifications')
    await user.click(link)

    await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/notifications'))
    expect(screen.queryByRole('region', { name: 'Notifications non lues' })).not.toBeInTheDocument()
  })
})

describe('NotificationBell — fermeture et focus', () => {
  beforeEach(() => mockSession('STAGIAIRE'))

  it('Échap ferme le panneau et rend le focus à la cloche', async () => {
    mockNotificationApi()
    const user = userEvent.setup()
    renderBell()
    const button = await bellButton()
    await openPanel(user)

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('region', { name: 'Notifications non lues' })).not.toBeInTheDocument()
    expect(button).toHaveFocus()
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  it('un clic à l’extérieur ferme le panneau', async () => {
    mockNotificationApi()
    const user = userEvent.setup()
    renderBell()
    await openPanel(user)

    await user.click(screen.getByTestId('path'))

    expect(screen.queryByRole('region', { name: 'Notifications non lues' })).not.toBeInTheDocument()
  })

  it('la cloche rouvre et referme le panneau', async () => {
    mockNotificationApi()
    const user = userEvent.setup()
    renderBell()
    const button = await bellButton()
    await user.click(button)
    expect(screen.getByRole('region', { name: 'Notifications non lues' })).toBeInTheDocument()
    await user.click(button)
    expect(screen.queryByRole('region', { name: 'Notifications non lues' })).not.toBeInTheDocument()
  })
})

describe('NotificationBell — annonces', () => {
  beforeEach(() => mockSession('STAGIAIRE'))

  it('annonce poliment une nouvelle notification, pas la première charge', async () => {
    const calls = mockNotificationApi()
    renderBell()
    await bellButton('Notifications, 3 non lues')
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('')

    calls.state.push({ id: 9, type: 'NEW_MESSAGE', content: 'Encore', entityType: 'MESSAGE', entityId: 4, isRead: false, deletedFromBell: false, createdAt: '2026-11-02T11:00:00' })
    await act(async () => { window.dispatchEvent(new Event('visibilitychange')) })

    await bellButton('Notifications, 4 non lues')
    await waitFor(() => expect(status).toHaveTextContent('1 nouvelle notification'))
  })

  it('n’annonce pas une diminution provoquée par l’utilisateur', async () => {
    mockNotificationApi()
    const user = userEvent.setup()
    renderBell()
    const panel = await openPanel(user)
    await user.click(within(panel).getByRole('button', { name: 'Tout marquer comme lu' }))
    await bellButton('Notifications')
    expect(screen.getByRole('status')).toHaveTextContent('')
  })
})

describe('NotificationBell — accessibilité', () => {
  it('ne présente aucune violation jest-axe, panneau ouvert', async () => {
    mockSession('STAGIAIRE')
    mockNotificationApi()
    const user = userEvent.setup()
    const { container } = renderBell()
    await openPanel(user)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('ne présente aucune violation jest-axe, panneau vide', async () => {
    mockSession('STAGIAIRE')
    mockNotificationApi({ notifications: [] })
    const user = userEvent.setup()
    const { container } = renderBell()
    await openPanel(user)
    expect(await axe(container)).toHaveNoViolations()
  })
})
