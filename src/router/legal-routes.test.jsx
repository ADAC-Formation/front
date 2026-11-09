import { render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { routes } from './router'
import { ThemeProvider } from '../context/ThemeProvider'
import { mockNoSession, mockSession } from '../test/session'
import { mockNotificationApi } from '../test/notifications'

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

const legalTitle = () => screen.findByRole('heading', { level: 1, name: 'Mentions légales et confidentialité' })

describe('route /mentions-legales', () => {
  it('est lisible par un visiteur sans session, sans redirection vers la connexion', async () => {
    mockNoSession()
    const router = renderApp('/mentions-legales')
    expect(await legalTitle()).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/mentions-legales')
  })

  it('est lisible par un utilisateur connecté', async () => {
    mockSession('STAGIAIRE')
    mockNotificationApi()
    renderApp('/mentions-legales')
    expect(await legalTitle()).toBeInTheDocument()
  })

  it('le pied de page est présent sur la page de connexion et mène aux mentions légales', async () => {
    mockNoSession()
    const router = renderApp('/login')
    await screen.findByRole('heading', { name: 'Connexion' })
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    await router.navigate('/mentions-legales')
    expect(await legalTitle()).toBeInTheDocument()
  })
})
