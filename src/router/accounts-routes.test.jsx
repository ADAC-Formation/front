import { render, screen } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { RouterProvider, createMemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { routes } from './router'
import { ThemeProvider } from '../context/ThemeProvider'
import { mockNoSession, mockSession } from '../test/session'
import { FORMATEURS, STAGIAIRES, mockAccountList, mockRequest } from '../test/accounts'
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

const accessDenied = () => screen.findByRole('heading', { name: 'Accès refusé' })

describe('routes des comptes', () => {
  it('un visiteur est renvoyé vers la connexion', async () => {
    mockNoSession()
    const router = renderApp('/admin/formateurs')
    expect(await screen.findByRole('heading', { name: 'Connexion' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })

  it.each(['/admin/formateurs', '/admin/stagiaires', '/admin/stagiaires/20', '/admin/formateurs/nouveau'])(
    'un stagiaire voit « Accès refusé » sur %s',
    async (path) => {
      mockSession('STAGIAIRE')
      renderApp(path)
      expect(await accessDenied()).toBeInTheDocument()
    },
  )

  describe('formateur (ADMIN)', () => {
    it('accède à la liste des formateurs', async () => {
      mockSession('ADMIN')
      mockAccountList('formateurs', FORMATEURS)
      renderApp('/admin/formateurs')
      expect(await screen.findByRole('heading', { level: 1, name: 'Formateurs' })).toBeInTheDocument()
    })

    it('accède à la liste des stagiaires et au détail', async () => {
      mockSession('ADMIN')
      mockAccountList('stagiaires', STAGIAIRES)
      mockRequest('get', '/users/20', () => HttpResponse.json(STAGIAIRES[0]))
      mockFormationList([]) // la section « Documents » du détail d'un stagiaire (G17)
      const router = renderApp('/admin/stagiaires')
      expect(await screen.findByRole('heading', { level: 1, name: 'Stagiaires' })).toBeInTheDocument()
      await router.navigate('/admin/stagiaires/20')
      expect(await screen.findByRole('heading', { level: 1, name: 'Léa Petit' })).toBeInTheDocument()
    })

    it.each(['/admin/formateurs/nouveau', '/admin/stagiaires/nouveau', '/admin/formateurs/10/modifier'])(
      'voit « Accès refusé » sur %s',
      async (path) => {
        mockSession('ADMIN')
        renderApp(path)
        expect(await accessDenied()).toBeInTheDocument()
      },
    )
  })

  describe('chargée de formation (SUPER_ADMIN)', () => {
    it('accède aux formulaires de création', async () => {
      mockSession('SUPER_ADMIN')
      const router = renderApp('/admin/formateurs/nouveau')
      expect(await screen.findByRole('heading', { level: 1, name: 'Créer un formateur' })).toBeInTheDocument()
      await router.navigate('/admin/stagiaires/nouveau')
      expect(await screen.findByRole('heading', { level: 1, name: 'Créer un stagiaire' })).toBeInTheDocument()
    })

    it('accède au formulaire de modification', async () => {
      mockSession('SUPER_ADMIN')
      mockRequest('get', '/users/10', () => HttpResponse.json(FORMATEURS[0]))
      renderApp('/admin/formateurs/10/modifier')
      expect(await screen.findByRole('heading', { level: 1, name: 'Modifier Anne Martin' })).toBeInTheDocument()
    })
  })
})

describe('menu Gestion', () => {
  it('propose les liens de création des comptes à la chargée de formation', async () => {
    mockSession('SUPER_ADMIN')
    renderApp('/admin/gestion')
    await screen.findByRole('heading', { name: 'Gestion' })
    const hrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href'))
    expect(hrefs).toContain('/admin/formateurs/nouveau')
    expect(hrefs).toContain('/admin/stagiaires/nouveau')
    expect(hrefs).toContain('/admin/formateurs')
    expect(hrefs).toContain('/admin/stagiaires')
  })

  it('retire les liens de création des comptes pour le formateur, sans toucher aux listes', async () => {
    mockSession('ADMIN')
    renderApp('/admin/gestion')
    await screen.findByRole('heading', { name: 'Gestion' })
    const hrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href'))
    expect(hrefs).not.toContain('/admin/formateurs/nouveau')
    expect(hrefs).not.toContain('/admin/stagiaires/nouveau')
    expect(hrefs).toContain('/admin/formateurs')
    expect(hrefs).toContain('/admin/stagiaires')
  })
})
