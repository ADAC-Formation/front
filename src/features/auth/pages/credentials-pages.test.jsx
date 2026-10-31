import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router'
import { axe } from 'jest-axe'
import ActivationPage from './ActivationPage'
import ForgotPasswordPage from './ForgotPasswordPage'
import ResetPasswordPage from './ResetPasswordPage'
import { NoticeBanner } from '../notices'
import { renderWithProviders } from '../../../test/render'
import { server } from '../../../test/msw/server'
import { API_URL } from '../../../test/session'

function renderPage(route) {
  return renderWithProviders(
    <Routes>
      <Route path="/activation" element={<ActivationPage />} />
      <Route path="/mot-de-passe-oublie" element={<ForgotPasswordPage />} />
      <Route path="/reinitialisation" element={<ResetPasswordPage />} />
      <Route
        path="/login"
        element={
          <>
            <p>page de connexion</p>
            <NoticeBanner />
          </>
        }
      />
    </Routes>,
    { route },
  )
}

// Enregistre un handler et mémorise les appels reçus.
function mockPost(path, status, body) {
  const calls = { count: 0, body: null }
  server.use(
    http.post(`${API_URL}${path}`, async ({ request }) => {
      calls.count += 1
      calls.body = await request.json()
      return HttpResponse.json(body, { status })
    }),
  )
  return calls
}

const INVALID_CODE = { status: 400, message: 'Code invalide ou expiré', details: [] }

async function fillCodeForm({ email, code = '123456', password = 'Motdepasse1', confirmation = password }) {
  if (email) {
    await userEvent.clear(screen.getByLabelText('Adresse e-mail'))
    await userEvent.type(screen.getByLabelText('Adresse e-mail'), email)
  }
  if (code) await userEvent.type(screen.getByLabelText('Code de vérification'), code)
  if (password) await userEvent.type(screen.getByLabelText('Nouveau mot de passe'), password)
  if (confirmation) await userEvent.type(screen.getByLabelText('Confirmation du mot de passe'), confirmation)
}

describe('ActivationPage', () => {
  const submit = () => userEvent.click(screen.getByRole('button', { name: "Activer mon compte" }))

  it('préremplit l\'e-mail depuis ?email= et le laisse modifiable', async () => {
    renderPage('/activation?email=nom@exemple.fr')
    const email = screen.getByLabelText('Adresse e-mail')
    expect(email).toHaveValue('nom@exemple.fr')
    await userEvent.type(email, 'x')
    expect(email).toHaveValue('nom@exemple.frx')
  })

  it.each([
    ['trop court', 'Abcdef1', 'Le mot de passe doit contenir au moins 8 caractères.'],
    ['sans majuscule', 'abcdefg1', 'Le mot de passe doit contenir au moins une majuscule.'],
    ['sans chiffre', 'Abcdefgh', 'Le mot de passe doit contenir au moins un chiffre.'],
    ['trop long', 'A1' + 'a'.repeat(71), 'Le mot de passe ne doit pas dépasser 72 caractères.'],
  ])('mot de passe %s : aucun appel et message précis', async (_label, password, message) => {
    const calls = mockPost('/auth/activate', 200, { message: 'ok' })
    renderPage('/activation')
    await fillCodeForm({ email: 'nom@exemple.fr', password })
    await submit()
    expect(await screen.findByText(message)).toBeInTheDocument()
    expect(calls.count).toBe(0)
  })

  it('confirmation différente : aucun appel et message', async () => {
    const calls = mockPost('/auth/activate', 200, { message: 'ok' })
    renderPage('/activation')
    await fillCodeForm({ email: 'nom@exemple.fr', confirmation: 'Autremotdepasse1' })
    await submit()
    expect(await screen.findByText('Les mots de passe ne correspondent pas.')).toBeInTheDocument()
    expect(calls.count).toBe(0)
  })

  it('succès : envoie {email, code, newPassword} puis redirige vers /login avec le bandeau', async () => {
    const calls = mockPost('/auth/activate', 200, { message: 'Compte activé avec succès' })
    renderPage('/activation?email=nom@exemple.fr')
    await fillCodeForm({})
    await submit()
    expect(await screen.findByText('page de connexion')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Compte activé avec succès')
    expect(calls.body).toEqual({ email: 'nom@exemple.fr', code: '123456', newPassword: 'Motdepasse1' })
  })

  it('400 : affiche « Code invalide ou expiré », propose « Renvoyer un code » et vide les mots de passe', async () => {
    mockPost('/auth/activate', 400, INVALID_CODE)
    renderPage('/activation?email=nom@exemple.fr')
    await fillCodeForm({})
    await submit()
    expect(await screen.findByRole('alert')).toHaveTextContent('Code invalide ou expiré')
    expect(screen.getByRole('button', { name: 'Renvoyer un code' })).toBeInTheDocument()
    expect(screen.getByLabelText('Code de vérification')).toHaveValue('123456')
    expect(screen.getByLabelText('Nouveau mot de passe')).toHaveValue('')
    expect(screen.getByLabelText('Confirmation du mot de passe')).toHaveValue('')
  })

  it('renvoi du code accepté : le message du back est annoncé', async () => {
    const calls = mockPost('/auth/resend-activation', 200, { message: 'Si cet email existe, un code vous a été envoyé.' })
    renderPage('/activation?email=nom@exemple.fr')
    await userEvent.click(screen.getByRole('button', { name: 'Renvoyer un code' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Si cet email existe, un code vous a été envoyé.')
    expect(calls.body).toEqual({ email: 'nom@exemple.fr' })
  })

  it('renvoi du code limité (429) : le message du back est affiché', async () => {
    mockPost('/auth/resend-activation', 429, { status: 429, message: 'Trop de demandes. Réessayez dans 15 minutes.', details: [] })
    renderPage('/activation?email=nom@exemple.fr')
    await userEvent.click(screen.getByRole('button', { name: 'Renvoyer un code' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Trop de demandes. Réessayez dans 15 minutes.')
    expect(screen.getByLabelText('Code de vérification')).toBeEnabled()
  })

  it('renvoi sans e-mail valide : aucun appel et message sur le champ e-mail', async () => {
    const calls = mockPost('/auth/resend-activation', 200, { message: 'ok' })
    renderPage('/activation')
    await userEvent.click(screen.getByRole('button', { name: 'Renvoyer un code' }))
    expect(await screen.findByText("L'adresse e-mail est obligatoire.")).toBeInTheDocument()
    expect(calls.count).toBe(0)
  })

  it("n'a aucune violation d'accessibilité (jest-axe), avec erreurs affichées", async () => {
    const { container } = renderPage('/activation')
    expect(await axe(container)).toHaveNoViolations()
    await submit()
    await screen.findByText("L'adresse e-mail est obligatoire.")
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('ForgotPasswordPage', () => {
  const submit = () => userEvent.click(screen.getByRole('button', { name: 'Recevoir un code' }))

  it('e-mail invalide : aucun appel et message', async () => {
    const calls = mockPost('/auth/forgot-password', 200, { message: 'x' })
    renderPage('/mot-de-passe-oublie')
    await userEvent.type(screen.getByLabelText('Adresse e-mail'), 'pas-un-email')
    await submit()
    expect(await screen.findByText("L'adresse e-mail n'est pas valide.")).toBeInTheDocument()
    expect(calls.count).toBe(0)
  })

  it('affiche toujours le même message générique et propose de passer à la réinitialisation', async () => {
    const calls = mockPost('/auth/forgot-password', 200, { message: 'Si cet email existe, un code vous a été envoyé.' })
    renderPage('/mot-de-passe-oublie')
    await userEvent.type(screen.getByLabelText('Adresse e-mail'), 'inconnu@exemple.fr')
    await submit()
    expect(await screen.findByRole('status')).toHaveTextContent('Si cet email existe, un code vous a été envoyé.')
    expect(calls.body).toEqual({ email: 'inconnu@exemple.fr' })
    expect(screen.getByRole('link', { name: /j'ai déjà un code/i })).toHaveAttribute(
      'href',
      '/reinitialisation?email=inconnu%40exemple.fr',
    )
  })

  it("n'a aucune violation d'accessibilité (jest-axe)", async () => {
    const { container } = renderPage('/mot-de-passe-oublie')
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('ResetPasswordPage', () => {
  const submit = () => userEvent.click(screen.getByRole('button', { name: 'Changer le mot de passe' }))

  it('succès : envoie {email, code, newPassword} puis redirige vers /login avec le bandeau', async () => {
    const calls = mockPost('/auth/reset-password', 200, { message: 'Mot de passe mis à jour avec succès' })
    renderPage('/reinitialisation?email=nom@exemple.fr')
    await fillCodeForm({})
    await submit()
    expect(await screen.findByText('page de connexion')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Mot de passe mis à jour')
    expect(calls.body).toEqual({ email: 'nom@exemple.fr', code: '123456', newPassword: 'Motdepasse1' })
  })

  it('applique la règle de mot de passe avant tout envoi', async () => {
    const calls = mockPost('/auth/reset-password', 200, { message: 'ok' })
    renderPage('/reinitialisation?email=nom@exemple.fr')
    await fillCodeForm({ password: 'abc' })
    await submit()
    expect(await screen.findByText('Le mot de passe doit contenir au moins 8 caractères.')).toBeInTheDocument()
    expect(calls.count).toBe(0)
  })

  it('400 : message en ligne, champs conservés sauf les mots de passe', async () => {
    mockPost('/auth/reset-password', 400, INVALID_CODE)
    renderPage('/reinitialisation?email=nom@exemple.fr')
    await fillCodeForm({})
    await submit()
    expect(await screen.findByRole('alert')).toHaveTextContent('Code invalide ou expiré')
    expect(screen.getByLabelText('Adresse e-mail')).toHaveValue('nom@exemple.fr')
    expect(screen.getByLabelText('Code de vérification')).toHaveValue('123456')
    expect(screen.getByLabelText('Nouveau mot de passe')).toHaveValue('')
  })

  it("n'a aucune violation d'accessibilité (jest-axe)", async () => {
    const { container } = renderPage('/reinitialisation')
    expect(await axe(container)).toHaveNoViolations()
  })
})
