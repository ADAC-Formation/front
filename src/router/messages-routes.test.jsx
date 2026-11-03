import { render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { routes } from './router'
import { ThemeProvider } from '../context/ThemeProvider'
import { mockNoSession, mockSession } from '../test/session'
import { mockConversations, mockMarkRead, mockThread } from '../test/messages'
import { mockFormationList } from '../test/formations'

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

describe('routes de la messagerie', () => {
  it('un visiteur est redirigé de /messages vers la connexion', async () => {
    mockNoSession()
    const router = renderApp('/messages')
    expect(await screen.findByRole('heading', { name: 'Connexion' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })

  it('un visiteur est redirigé de /messages/10 vers la connexion', async () => {
    mockNoSession()
    const router = renderApp('/messages/10')
    expect(await screen.findByRole('heading', { name: 'Connexion' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })

  it.each(['SUPER_ADMIN', 'ADMIN', 'STAGIAIRE'])('/messages s\'ouvre pour le rôle %s', async (role) => {
    mockSession(role)
    mockConversations()
    renderApp('/messages')
    expect(await screen.findByRole('heading', { level: 1, name: 'Messages' })).toBeInTheDocument()
  })

  it('/messages/:userId ouvre le fil', async () => {
    mockSession('STAGIAIRE')
    mockConversations()
    mockFormationList([])
    mockThread(10)
    mockMarkRead()
    renderApp('/messages/10')
    expect(await screen.findByText('Rendez-vous lundi ?')).toBeInTheDocument()
  })
})
