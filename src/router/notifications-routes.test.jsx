import { render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { routes } from './router'
import { ThemeProvider } from '../context/ThemeProvider'
import { mockNoSession, mockSession } from '../test/session'
import { mockNotificationApi } from '../test/notifications'
import { mockConversations, mockMarkRead, mockThread } from '../test/messages'
import { mockFormationList } from '../test/formations'

beforeEach(() => {
  mockNotificationApi()
})

function renderApp(path) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>,
  )
  return router
}

describe('routes des notifications', () => {
  it.each(['SUPER_ADMIN', 'ADMIN', 'STAGIAIRE'])('/notifications affiche l’historique pour %s', async (role) => {
    mockSession(role)
    renderApp('/notifications')
    expect(await screen.findByRole('heading', { level: 1, name: 'Notifications' })).toBeInTheDocument()
    expect(await screen.findByText('Nouveau message de Paul')).toBeInTheDocument()
  })

  it('/notifications exige une session', async () => {
    mockNoSession()
    const router = renderApp('/notifications')
    expect(await screen.findByRole('heading', { name: 'Connexion' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })

  it('/messages/7 (cible d’une notification de message) ne tombe pas sur « adresse inconnue »', async () => {
    mockSession('STAGIAIRE')
    mockConversations()
    mockFormationList([])
    mockThread(7)
    mockMarkRead()
    renderApp('/messages/7')
    expect(await screen.findByText('Rendez-vous lundi ?')).toBeInTheDocument()
    expect(screen.queryByText('Page introuvable')).not.toBeInTheDocument()
  })

  it('/messages/7 exige une session', async () => {
    mockNoSession()
    const router = renderApp('/messages/7')
    expect(await screen.findByRole('heading', { name: 'Connexion' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })

  it('la page /notifications n’est pas dans l’entrée du bundle : chargée à la demande', async () => {
    mockSession('STAGIAIRE')
    renderApp('/notifications')
    // Le chargement différé affiche d'abord l'état de chargement du routeur, puis la page.
    expect(await screen.findByRole('heading', { level: 1, name: 'Notifications' })).toBeInTheDocument()
  })
})
