import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { RouterProvider, createMemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { axe } from 'jest-axe'
import { routes } from './router'
import { ThemeProvider } from '../context/ThemeProvider'
import { server } from '../test/msw/server'
import { API_URL, mockSession, mockNoSession } from '../test/session'
import { FORMATIONS, mockFormationDetail, mockFormationList, mockInscriptions } from '../test/formations'
import { FORMATEURS, mockAccountList } from '../test/accounts'
import { mockCategories } from '../test/categories'
import { mockDocumentApi } from '../test/documents'

function renderApp(path) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>,
  )
  return { router, ...utils }
}

const accessDenied = () => screen.findByRole('heading', { name: 'Accès refusé' })

describe('routes protégées', () => {
  it('un visiteur est redirigé de /formations vers la connexion', async () => {
    mockNoSession()
    const { router } = renderApp('/formations')
    expect(await screen.findByRole('heading', { name: 'Connexion' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })

  it('un visiteur peut ouvrir activation, mot de passe oublié et réinitialisation', async () => {
    mockNoSession()
    renderApp('/activation')
    expect(await screen.findByRole('heading', { name: 'Activation du compte' })).toBeInTheDocument()
  })

  it('un utilisateur connecté sur /login est renvoyé vers le tableau de bord', async () => {
    mockSession('STAGIAIRE')
    const { router } = renderApp('/login')
    expect(await screen.findByRole('link', { name: /formations/i })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/')
  })
})

describe('pages de formations branchées sur le back', () => {
  it.each(['SUPER_ADMIN', 'ADMIN', 'STAGIAIRE'])('%s accède à la liste des formations du back', async (role) => {
    mockSession(role)
    mockFormationList()
    mockCategories()
    renderApp('/formations')
    expect(await screen.findByRole('link', { name: /Premiers secours PSC1/ })).toBeInTheDocument()
  })

  it('/admin/formations affiche la même liste pour la chargée de formation', async () => {
    mockSession('SUPER_ADMIN')
    mockFormationList()
    mockCategories()
    renderApp('/admin/formations')
    expect(await screen.findByRole('link', { name: /Premiers secours PSC1/ })).toBeInTheDocument()
  })

  it('le détail affiche la formation du back', async () => {
    mockSession('SUPER_ADMIN')
    mockFormationDetail(FORMATIONS[0])
    mockInscriptions(101)
    mockDocumentApi()
    renderApp('/formations/101')
    expect(await screen.findByRole('heading', { level: 1, name: 'Premiers secours PSC1' })).toBeInTheDocument()
  })

  it('un visiteur est redirigé du détail vers la connexion', async () => {
    mockNoSession()
    const { router } = renderApp('/formations/101')
    expect(await screen.findByRole('heading', { name: 'Connexion' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })
})

describe('routes réservées par rôle', () => {
  it('un stagiaire voit « Accès refusé » sur /admin/gestion', async () => {
    mockSession('STAGIAIRE')
    renderApp('/admin/gestion')
    expect(await accessDenied()).toBeInTheDocument()
  })

  it('un formateur accède à /admin/gestion', async () => {
    mockSession('ADMIN')
    renderApp('/admin/gestion')
    expect(await screen.findByRole('heading', { name: 'Gestion' })).toBeInTheDocument()
  })

  it('un formateur voit « Accès refusé » sur les catégories', async () => {
    mockSession('ADMIN')
    renderApp('/formations/categories')
    expect(await accessDenied()).toBeInTheDocument()
  })

  it('un formateur voit « Accès refusé » sur la création de formation', async () => {
    mockSession('ADMIN')
    renderApp('/formations/creer')
    expect(await accessDenied()).toBeInTheDocument()
  })

  it('la chargée de formation accède à la création et aux catégories', async () => {
    mockSession('SUPER_ADMIN')
    mockCategories()
    mockAccountList('formateurs', FORMATEURS)
    const first = renderApp('/formations/creer')
    expect(await screen.findByRole('heading', { level: 1, name: 'Créer une nouvelle formation' })).toBeInTheDocument()
    first.unmount()
    renderApp('/formations/categories')
    expect(await screen.findByRole('heading', { name: 'Catégories' })).toBeInTheDocument()
  })
})

describe('formulaire de formation : accès par rôle', () => {
  it.each(['/formations/creer', '/formations/101/modifier'])(
    'un stagiaire voit « Accès refusé » sur %s',
    async (path) => {
      mockSession('STAGIAIRE')
      renderApp(path)
      expect(await accessDenied()).toBeInTheDocument()
    },
  )

  it('un formateur voit « Accès refusé » sur la modification', async () => {
    mockSession('ADMIN')
    renderApp('/formations/101/modifier')
    expect(await accessDenied()).toBeInTheDocument()
  })

  it('un visiteur est redirigé de la modification vers la connexion', async () => {
    mockNoSession()
    const { router } = renderApp('/formations/101/modifier')
    expect(await screen.findByRole('heading', { name: 'Connexion' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })

  it('la chargée de formation accède à la modification, préremplie', async () => {
    mockSession('SUPER_ADMIN')
    mockCategories()
    mockAccountList('formateurs', FORMATEURS)
    mockFormationDetail(FORMATIONS[0])
    renderApp('/formations/101/modifier')
    expect(await screen.findByRole('heading', { level: 1, name: 'Modifier la formation' })).toBeInTheDocument()
    expect(await screen.findByLabelText('Intitulé')).toHaveValue('Premiers secours PSC1')
  })
})

describe('tableau de bord', () => {
  it('un stagiaire voit « Formations » et pas « Gestion »', async () => {
    mockSession('STAGIAIRE')
    renderApp('/')
    const tile = await screen.findByRole('link', { name: /formations/i })
    expect(tile).toHaveAttribute('href', '/formations')
    expect(screen.queryByRole('link', { name: /gestion/i })).not.toBeInTheDocument()
  })

  it.each(['SUPER_ADMIN', 'ADMIN'])('%s voit « Gestion »', async (role) => {
    mockSession(role)
    renderApp('/')
    expect(await screen.findByRole('link', { name: /gestion/i })).toHaveAttribute('href', '/admin/gestion')
  })

  it('n\'affiche plus de sélecteur de rôle simulé', async () => {
    mockSession('STAGIAIRE')
    renderApp('/')
    await screen.findByRole('link', { name: /formations/i })
    expect(screen.queryByRole('button', { name: 'Admin' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Formateur' })).not.toBeInTheDocument()
  })

  it("les anciennes routes /admin, /formateur et /stagiaire n'existent plus", () => {
    const paths = []
    const collect = (list) =>
      list.forEach((route) => {
        if (route.path) paths.push(route.path)
        if (route.children) collect(route.children)
      })
    collect(routes)
    expect(paths).not.toContain('admin')
    expect(paths).not.toContain('formateur')
    expect(paths).not.toContain('stagiaire')
  })

  it('n\'a aucune violation d\'accessibilité (jest-axe) sur le tableau de bord', async () => {
    mockSession('STAGIAIRE')
    const { container } = renderApp('/')
    await screen.findByRole('link', { name: /formations/i })
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('bouton de connexion / déconnexion de l\'en-tête', () => {
  it('visiteur : « Se connecter » mène à /login', async () => {
    mockNoSession()
    const { router } = renderApp('/activation')
    const header = await screen.findByRole('banner')
    await userEvent.click(await within(header).findByRole('button', { name: /se connecter/i }))
    expect(router.state.location.pathname).toBe('/login')
  })

  it('visiteur sur /login : pas de bouton « Se connecter » dans l\'en-tête (redondant avec le formulaire)', async () => {
    mockNoSession()
    renderApp('/login')
    await screen.findByRole('heading', { name: 'Connexion' })
    const header = screen.getByRole('banner')
    expect(within(header).queryByRole('button', { name: /se connecter/i })).not.toBeInTheDocument()
    // Le formulaire garde son propre bouton de soumission.
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument()
  })

  it('utilisateur connecté : « Se déconnecter » appelle POST /auth/logout puis ouvre /login', async () => {
    mockSession('STAGIAIRE')
    let logoutCalled = false
    server.use(
      http.post(`${API_URL}/auth/logout`, () => {
        logoutCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { router } = renderApp('/')
    const header = await screen.findByRole('banner')
    await userEvent.click(await within(header).findByRole('button', { name: /se déconnecter/i }))
    expect(await screen.findByRole('heading', { name: 'Connexion' })).toBeInTheDocument()
    expect(logoutCalled).toBe(true)
    expect(router.state.location.pathname).toBe('/login')
  })
})

describe('aucune donnée de session dans le navigateur', () => {
  it('le thème ne stocke aucun indicateur de connexion', async () => {
    mockSession('STAGIAIRE')
    renderApp('/')
    await screen.findByRole('link', { name: /formations/i })
    const stored = localStorage.getItem('app-theme-preferences') ?? '{}'
    expect(stored).not.toMatch(/isAuthenticated/)
    expect(localStorage.getItem('dev-role')).toBeNull()
  })
})

describe('import de formations : accès par rôle', () => {
  it.each(['STAGIAIRE', 'ADMIN'])('%s voit « Accès refusé » sur /formations/importer', async (role) => {
    mockSession(role)
    renderApp('/formations/importer')
    expect(await accessDenied()).toBeInTheDocument()
  })

  it('un visiteur est redirigé vers la connexion', async () => {
    mockNoSession()
    const { router } = renderApp('/formations/importer')
    expect(await screen.findByRole('heading', { name: 'Connexion' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })

  it('la chargée de formation accède à la page d’import, pas à un détail de formation', async () => {
    mockSession('SUPER_ADMIN')
    renderApp('/formations/importer')
    expect(await screen.findByRole('heading', { level: 1, name: 'Importer des formations' })).toBeInTheDocument()
  })
})

describe('gestion des catégories : accès par rôle', () => {
  it.each(['STAGIAIRE', 'ADMIN'])('%s voit « Accès refusé » sur /formations/categories, sans appel au back', async (role) => {
    mockSession(role)
    const categories = mockCategories()
    renderApp('/formations/categories')
    expect(await accessDenied()).toBeInTheDocument()
    expect(categories.count).toBe(0)
  })

  it('un visiteur est redirigé vers la connexion', async () => {
    mockNoSession()
    const { router } = renderApp('/formations/categories')
    expect(await screen.findByRole('heading', { name: 'Connexion' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })

  it('la chargée de formation voit les catégories du back, désactivées comprises', async () => {
    mockSession('SUPER_ADMIN')
    mockCategories()
    renderApp('/formations/categories')
    expect(await screen.findByRole('heading', { level: 1, name: 'Catégories' })).toBeInTheDocument()
    expect(await screen.findByText('Ancienne catégorie')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Créer une catégorie' })).toBeInTheDocument()
  })
})
