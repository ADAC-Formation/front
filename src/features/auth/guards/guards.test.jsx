import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router'
import { axe } from 'jest-axe'
import { renderWithProviders } from '../../../test/render'
import { server } from '../../../test/msw/server'
import { API_URL, USERS, mockSession, mockNoSession } from '../../../test/session'
import RequireAuth from './RequireAuth'
import RequireRole from './RequireRole'
import PublicOnly from './PublicOnly'

function renderRoutes(route) {
  return renderWithProviders(
    <Routes>
      <Route element={<PublicOnly />}>
        <Route path="/login" element={<p>page de connexion</p>} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route path="/" element={<p>tableau de bord</p>} />
        <Route path="/formations" element={<p>liste des formations</p>} />
        <Route element={<RequireRole roles={['SUPER_ADMIN', 'ADMIN']} />}>
          <Route path="/admin/gestion" element={<p>gestion</p>} />
        </Route>
        <Route element={<RequireRole roles={['SUPER_ADMIN']} />}>
          <Route path="/formations/categories" element={<p>catégories</p>} />
        </Route>
      </Route>
    </Routes>,
    { route, withSession: true },
  )
}

describe('RequireAuth', () => {
  it('affiche un état de chargement annoncé, sans contenu protégé ni redirection', () => {
    mockSession('STAGIAIRE')
    renderRoutes('/formations')
    expect(screen.getByRole('status')).toHaveTextContent(/chargement/i)
    expect(screen.queryByText('liste des formations')).not.toBeInTheDocument()
    expect(screen.queryByText('page de connexion')).not.toBeInTheDocument()
  })

  it('redirige un visiteur vers /login', async () => {
    mockNoSession()
    renderRoutes('/formations')
    expect(await screen.findByText('page de connexion')).toBeInTheDocument()
  })

  it('laisse passer un utilisateur connecté', async () => {
    mockSession('STAGIAIRE')
    renderRoutes('/formations')
    expect(await screen.findByText('liste des formations')).toBeInTheDocument()
  })

  it('si GET /auth/me échoue en 500 : erreur avec « Réessayer », sans redirection', async () => {
    let calls = 0
    server.use(
      http.get(`${API_URL}/auth/me`, () => {
        calls += 1
        return calls === 1 ? new HttpResponse(null, { status: 500 }) : HttpResponse.json(USERS.STAGIAIRE)
      }),
    )
    renderRoutes('/formations')
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.queryByText('page de connexion')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }))
    expect(await screen.findByText('liste des formations')).toBeInTheDocument()
  })
})

describe('RequireRole', () => {
  it('laisse passer un rôle autorisé', async () => {
    mockSession('SUPER_ADMIN')
    renderRoutes('/formations/categories')
    expect(await screen.findByText('catégories')).toBeInTheDocument()
  })

  it('un formateur accède à la gestion', async () => {
    mockSession('ADMIN')
    renderRoutes('/admin/gestion')
    expect(await screen.findByText('gestion')).toBeInTheDocument()
  })

  it('un stagiaire voit « Accès refusé » sur la gestion, sans redirection', async () => {
    mockSession('STAGIAIRE')
    renderRoutes('/admin/gestion')
    expect(await screen.findByRole('heading', { name: 'Accès refusé' })).toBeInTheDocument()
    expect(screen.queryByText('gestion')).not.toBeInTheDocument()
    expect(screen.queryByText('page de connexion')).not.toBeInTheDocument()
  })

  it('un formateur voit « Accès refusé » sur les catégories', async () => {
    mockSession('ADMIN')
    renderRoutes('/formations/categories')
    expect(await screen.findByRole('heading', { name: 'Accès refusé' })).toBeInTheDocument()
  })

  it("la page « Accès refusé » n'a aucune violation d'accessibilité et propose un retour", async () => {
    mockSession('STAGIAIRE')
    const { container } = renderRoutes('/admin/gestion')
    await screen.findByRole('heading', { name: 'Accès refusé' })
    expect(screen.getByRole('link', { name: /accueil/i })).toHaveAttribute('href', '/')
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('PublicOnly', () => {
  it('laisse un visiteur sur /login', async () => {
    mockNoSession()
    renderRoutes('/login')
    expect(await screen.findByText('page de connexion')).toBeInTheDocument()
  })

  it('redirige un utilisateur connecté de /login vers /', async () => {
    mockSession('STAGIAIRE')
    renderRoutes('/login')
    expect(await screen.findByText('tableau de bord')).toBeInTheDocument()
  })
})
