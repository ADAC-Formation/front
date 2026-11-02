import { render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { lazyPage } from './lazyPage'
import { routes } from './router'
import { ThemeProvider } from '../context/ThemeProvider'
import { mockNoSession, mockSession } from '../test/session'
import { FORMATEURS, mockAccountList } from '../test/accounts'
import { mockNotificationApi } from '../test/notifications'

// La cloche de l'en-tête interroge /notifications dès qu'une session existe.
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

describe('lazyPage', () => {
  it("résout { Component } depuis l'export par défaut du module", async () => {
    const Page = () => <p>page</p>
    const route = lazyPage(() => Promise.resolve({ default: Page }))
    await expect(route.lazy()).resolves.toEqual({ Component: Page })
  })

  it("laisse l'échec du chargement remonter au routeur", async () => {
    const route = lazyPage(() => Promise.reject(new Error('Failed to fetch dynamically imported module')))
    await expect(route.lazy()).rejects.toThrow('Failed to fetch')
  })
})

describe('routes chargées à la demande', () => {
  it('/login affiche la connexion après le chargement', async () => {
    mockNoSession()
    renderApp('/login')
    expect(await screen.findByRole('heading', { name: 'Connexion' })).toBeInTheDocument()
  })

  it('/formations affiche la page des formations', async () => {
    mockSession('SUPER_ADMIN')
    renderApp('/formations')
    expect(await screen.findByRole('heading', { level: 1, name: 'Formations' })).toBeInTheDocument()
  })

  it('/admin/formateurs affiche la liste des comptes', async () => {
    mockSession('SUPER_ADMIN')
    mockAccountList('formateurs', FORMATEURS)
    renderApp('/admin/formateurs')
    expect(await screen.findByRole('heading', { level: 1, name: 'Formateurs' })).toBeInTheDocument()
  })

  it('un visiteur reste redirigé vers /login', async () => {
    mockNoSession()
    const router = renderApp('/admin/formateurs')
    expect(await screen.findByRole('heading', { name: 'Connexion' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })

  it('un stagiaire voit « Accès refusé » sur /admin/formateurs', async () => {
    mockSession('STAGIAIRE')
    renderApp('/admin/formateurs')
    expect(await screen.findByRole('heading', { name: 'Accès refusé' })).toBeInTheDocument()
  })

  it('un utilisateur connecté sur /login va au tableau de bord', async () => {
    mockSession('STAGIAIRE')
    const router = renderApp('/login')
    expect(await screen.findByRole('link', { name: /formations/i })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/')
  })
})
