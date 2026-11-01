import { render, screen } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { RouterProvider, createMemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { routes } from './router'
import { ThemeProvider } from '../context/ThemeProvider'
import { mockNoSession, mockSession } from '../test/session'
import { FORMATEURS, STAGIAIRES, mockAccountList, mockRequest } from '../test/accounts'
import { FORMATIONS, mockFormationDetail, mockFormationList, mockInscriptions } from '../test/formations'

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
}

function mockFormations() {
  mockFormationList()
  mockFormationDetail(FORMATIONS[0])
  mockInscriptions(101)
}

function mockAccounts() {
  mockAccountList('formateurs', FORMATEURS)
  mockAccountList('stagiaires', STAGIAIRES)
  mockRequest('get', '/users/10', () => HttpResponse.json(FORMATEURS[0]))
  mockRequest('get', '/users/20', () => HttpResponse.json(STAGIAIRES[0]))
}

// Chaque page doit avoir exactement un <main> : celui du Layout (WCAG 1.3.1 / 2.4.1).
const PUBLIC_ROUTES = ['/login', '/activation', '/mot-de-passe-oublie', '/reinitialisation']
const PROTECTED_ROUTES = [
  '/',
  '/admin/gestion',
  '/formations',
  '/admin/formations',
  '/formations/101',
  '/formations/categories',
  '/formations/creer',
  '/admin/formateurs',
  '/admin/formateurs/10',
  '/admin/formateurs/nouveau',
  '/admin/formateurs/10/modifier',
  '/admin/stagiaires',
  '/admin/stagiaires/20',
  '/admin/stagiaires/nouveau',
]

// Le tableau de bord n'a pas de titre : on attend sa tuile (« Gestion » ou « Formations »).
const pageLoaded = (path) =>
  path === '/' ? screen.findByRole('link', { name: /gestion|formations/i }) : screen.findAllByRole('heading')

describe('un seul <main> par page', () => {
  it.each(PUBLIC_ROUTES)('visiteur sur %s', async (path) => {
    mockNoSession()
    renderApp(path)
    await screen.findAllByRole('heading')
    expect(screen.getAllByRole('main')).toHaveLength(1)
  })

  it.each(PROTECTED_ROUTES)('chargée de formation sur %s', async (path) => {
    mockSession('SUPER_ADMIN')
    mockAccounts()
    mockFormations()
    renderApp(path)
    await pageLoaded(path)
    expect(screen.getAllByRole('main')).toHaveLength(1)
  })

  it('stagiaire sur le tableau de bord', async () => {
    mockSession('STAGIAIRE')
    renderApp('/')
    await pageLoaded('/')
    expect(screen.getAllByRole('main')).toHaveLength(1)
  })
})
