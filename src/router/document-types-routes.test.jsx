import { render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { routes } from './router'
import { ThemeProvider } from '../context/ThemeProvider'
import { mockNoSession, mockSession } from '../test/session'
import { mockCategories } from '../test/categories'
import { mockDocumentTypeApi } from '../test/documentTypes'
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

const accessDenied = () => screen.findByRole('heading', { name: 'Accès refusé' })
const PATHS = ['/admin/documents', '/admin/documents/nouveau', '/admin/documents/2/modifier']

describe('routes des types de document', () => {
  it('un visiteur est renvoyé vers la connexion', async () => {
    mockNoSession()
    const router = renderApp('/admin/documents')
    expect(await screen.findByRole('heading', { name: 'Connexion' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })

  it.each(['ADMIN', 'STAGIAIRE'].flatMap((role) => PATHS.map((path) => [role, path])))(
    'un %s est refusé sur %s',
    async (role, path) => {
      mockSession(role)
      renderApp(path)
      expect(await accessDenied()).toBeInTheDocument()
    },
  )

  describe('chargée de formation (SUPER_ADMIN)', () => {
    it('accède à la liste, au formulaire de création et à celui de modification', async () => {
      mockSession('SUPER_ADMIN')
      mockCategories()
      mockDocumentTypeApi()
      const router = renderApp('/admin/documents')
      expect(await screen.findByRole('heading', { level: 1, name: 'Types de document' })).toBeInTheDocument()

      await router.navigate('/admin/documents/nouveau')
      expect(await screen.findByRole('heading', { level: 1, name: 'Nouveau type de document' })).toBeInTheDocument()

      await router.navigate('/admin/documents/2/modifier')
      expect(await screen.findByRole('heading', { level: 1, name: /Modifier Certificat médical/ })).toBeInTheDocument()
    })
  })
})
