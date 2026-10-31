import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router'
import { axe } from 'jest-axe'
import LoginPage from './LoginPage'
import { renderWithProviders } from '../../../test/render'
import { server } from '../../../test/msw/server'
import { API_URL, USERS } from '../../../test/session'

function renderLogin(route = '/login') {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<p>tableau de bord</p>} />
      <Route path="/activation" element={<p>page d'activation</p>} />
      <Route path="/mot-de-passe-oublie" element={<p>page mot de passe oublié</p>} />
    </Routes>,
    { route },
  )
}

function mockLogin(status, body) {
  const calls = { count: 0, body: null }
  server.use(
    http.post(`${API_URL}/auth/login`, async ({ request }) => {
      calls.count += 1
      calls.body = await request.json()
      return HttpResponse.json(body, { status })
    }),
  )
  return calls
}

async function fillAndSubmit(email = 'chargee@adac.test', password = 'Motdepasse1') {
  if (email) await userEvent.type(screen.getByLabelText('Adresse e-mail'), email)
  if (password) await userEvent.type(screen.getByLabelText('Mot de passe'), password)
  await userEvent.click(screen.getByRole('button', { name: /se connecter/i }))
}

describe('LoginPage', () => {
  it('affiche les champs, le lien de récupération et la mention sans inscription', () => {
    renderLogin()
    expect(screen.getByRole('heading', { name: 'Connexion' })).toBeInTheDocument()
    expect(screen.getByLabelText('Adresse e-mail')).toBeInTheDocument()
    expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Mot de passe oublié / Activer mon compte' })).toHaveAttribute(
      'href',
      '/mot-de-passe-oublie',
    )
    expect(screen.getByText('Pas de compte ? Contactez votre administrateur')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /inscri|créer un compte/i })).not.toBeInTheDocument()
  })

  it('champs vides : aucun appel et messages en français', async () => {
    const calls = mockLogin(200, USERS.SUPER_ADMIN)
    renderLogin()
    await userEvent.click(screen.getByRole('button', { name: /se connecter/i }))
    expect(await screen.findByText("L'adresse e-mail est obligatoire.")).toBeInTheDocument()
    expect(screen.getByText('Le mot de passe est obligatoire.')).toBeInTheDocument()
    expect(calls.count).toBe(0)
  })

  it('succès : envoie e-mail + mot de passe et redirige vers /', async () => {
    const calls = mockLogin(200, USERS.SUPER_ADMIN)
    renderLogin()
    await fillAndSubmit()
    expect(await screen.findByText('tableau de bord')).toBeInTheDocument()
    expect(calls.body).toEqual({ email: 'chargee@adac.test', password: 'Motdepasse1' })
  })

  it('401 : affiche « Identifiants invalides », reste sur /login et garde l\'e-mail', async () => {
    mockLogin(401, { status: 401, message: 'Identifiants invalides', details: [] })
    renderLogin()
    await fillAndSubmit()
    expect(await screen.findByRole('alert')).toHaveTextContent('Identifiants invalides')
    expect(screen.getByLabelText('Adresse e-mail')).toHaveValue('chargee@adac.test')
    expect(screen.queryByText('tableau de bord')).not.toBeInTheDocument()
  })

  it('403 : affiche le message du back et un lien vers l\'activation', async () => {
    mockLogin(403, { status: 403, message: 'Compte non activé. Veuillez consulter vos emails.', details: [] })
    renderLogin()
    await fillAndSubmit()
    expect(await screen.findByRole('alert')).toHaveTextContent('Compte non activé. Veuillez consulter vos emails.')
    expect(screen.getByRole('link', { name: 'Activer mon compte' })).toHaveAttribute('href', '/activation')
  })

  it('429 : affiche le message du back', async () => {
    mockLogin(429, { status: 429, message: 'Trop de tentatives. Réessayez dans 15 minutes.', details: [] })
    renderLogin()
    await fillAndSubmit()
    expect(await screen.findByRole('alert')).toHaveTextContent('Trop de tentatives. Réessayez dans 15 minutes.')
  })

  it('serveur injoignable : message de connexion au serveur', async () => {
    server.use(http.post(`${API_URL}/auth/login`, () => HttpResponse.error()))
    renderLogin()
    await fillAndSubmit()
    expect(await screen.findByRole('alert')).toHaveTextContent(/serveur est injoignable/i)
  })

  it.each([
    ['activated', 'Compte activé avec succès'],
    ['password-reset', 'Mot de passe mis à jour'],
    ['session-expired', 'Votre session a expiré. Veuillez vous reconnecter.'],
  ])('affiche le bandeau pour la notice « %s »', (notice, text) => {
    renderLogin({ pathname: '/login', state: { notice } })
    expect(screen.getByText(text)).toBeInTheDocument()
  })

  it("n'affiche aucun bandeau sans notice", () => {
    renderLogin()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it("n'a aucune violation d'accessibilité (jest-axe), avec une erreur affichée", async () => {
    mockLogin(401, { status: 401, message: 'Identifiants invalides', details: [] })
    const { container } = renderLogin({ pathname: '/login', state: { notice: 'activated' } })
    expect(await axe(container)).toHaveNoViolations()
    await fillAndSubmit()
    await screen.findByText('Identifiants invalides')
    expect(await axe(container)).toHaveNoViolations()
  })
})
