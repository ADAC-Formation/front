import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse } from 'msw'
import { axe } from 'jest-axe'
import { Route, Routes, useLocation } from 'react-router'
import AccountFormPage from './AccountFormPage'
import AccountListPage from './AccountListPage'
import { renderWithProviders } from '../../../test/render'
import { mockSession } from '../../../test/session'
import { FORMATEURS, STAGIAIRES, apiError, mockAccountList, mockRequest } from '../../../test/accounts'

function Where() {
  const location = useLocation()
  return <p data-testid="path">{location.pathname}</p>
}

function renderForm(route) {
  mockSession('SUPER_ADMIN')
  return renderWithProviders(
    <>
      <Routes>
        <Route path="/admin/formateurs" element={<AccountListPage kind="formateurs" />} />
        <Route path="/admin/formateurs/nouveau" element={<AccountFormPage kind="formateurs" />} />
        <Route path="/admin/formateurs/:id" element={<p>page de détail</p>} />
        <Route path="/admin/formateurs/:id/modifier" element={<AccountFormPage kind="formateurs" />} />
        <Route path="/admin/stagiaires/nouveau" element={<AccountFormPage kind="stagiaires" />} />
        <Route path="/admin/stagiaires" element={<AccountListPage kind="stagiaires" />} />
      </Routes>
      <Where />
    </>,
    { route, withSession: true },
  )
}

const fill = async (label, value) => {
  const field = screen.getByLabelText(label)
  await userEvent.clear(field)
  if (value) await userEvent.type(field, value)
}

describe('AccountFormPage — création', () => {
  const submit = () => userEvent.click(screen.getByRole('button', { name: 'Créer le compte' }))

  async function fillValid() {
    await fill('Nom', 'Roux')
    await fill('Prénom', 'Zoé')
    await fill('Adresse e-mail', 'zoe@adac.test')
  }

  it('demande le prénom avant le nom', async () => {
    renderForm('/admin/formateurs/nouveau')
    await screen.findByRole('heading', { level: 1 })
    const labels = screen.getAllByRole('textbox').map((field) => field.labels[0].textContent)
    expect(labels).toEqual(['Prénom', 'Nom', 'Adresse e-mail'])
  })

  it('propose un retour vers la liste', async () => {
    renderForm('/admin/stagiaires/nouveau')
    expect(await screen.findByRole('link', { name: 'Retour aux stagiaires' })).toHaveAttribute(
      'href',
      '/admin/stagiaires',
    )
  })

  it('affiche les trois champs obligatoires', async () => {
    renderForm('/admin/formateurs/nouveau')
    expect(await screen.findByRole('heading', { level: 1, name: 'Créer un formateur' })).toBeInTheDocument()
    for (const label of ['Nom', 'Prénom', 'Adresse e-mail']) {
      expect(screen.getByLabelText(label)).toBeRequired()
    }
  })

  it("n'appelle pas le back quand un champ est vide ou l'e-mail invalide", async () => {
    const calls = mockRequest('post', '/users/formateurs', () => HttpResponse.json(FORMATEURS[0], { status: 201 }))
    renderForm('/admin/formateurs/nouveau')
    await screen.findByRole('heading', { level: 1 })
    await fill('Adresse e-mail', 'pas-un-email')
    await submit()
    expect(await screen.findByText('Le nom est obligatoire.')).toBeInTheDocument()
    expect(screen.getByText('Le prénom est obligatoire.')).toBeInTheDocument()
    expect(screen.getByText("L'adresse e-mail n'est pas valide.")).toBeInTheDocument()
    expect(calls.count).toBe(0)
  })

  it('crée un formateur et revient à la liste avec une confirmation', async () => {
    const calls = mockRequest('post', '/users/formateurs', () =>
      HttpResponse.json({ ...FORMATEURS[0], id: 12, prenom: 'Zoé', nom: 'Roux' }, { status: 201 }),
    )
    mockAccountList('formateurs', FORMATEURS)
    renderForm('/admin/formateurs/nouveau')
    await screen.findByRole('heading', { level: 1 })
    await fillValid()
    await submit()
    expect(await screen.findByText("Compte créé, e-mail d'activation envoyé")).toBeInTheDocument()
    expect(screen.getByTestId('path')).toHaveTextContent('/admin/formateurs')
    expect(await screen.findByRole('link', { name: 'Anne Martin' })).toBeInTheDocument()
    expect(calls.body).toEqual({ nom: 'Roux', prenom: 'Zoé', email: 'zoe@adac.test' })
  })

  it('crée un stagiaire sans formation', async () => {
    const calls = mockRequest('post', '/users/stagiaires', () =>
      HttpResponse.json({ ...STAGIAIRES[0], id: 22 }, { status: 201 }),
    )
    mockAccountList('stagiaires', STAGIAIRES)
    renderForm('/admin/stagiaires/nouveau')
    await screen.findByRole('heading', { level: 1, name: 'Créer un stagiaire' })
    await fillValid()
    await submit()
    expect(await screen.findByText("Compte créé, e-mail d'activation envoyé")).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: 'Léa Petit' })).toBeInTheDocument()
    expect(calls.body).toEqual({ nom: 'Roux', prenom: 'Zoé', email: 'zoe@adac.test', formationIds: [] })
  })

  it("affiche le 409 en ligne et conserve les valeurs saisies", async () => {
    mockRequest('post', '/users/formateurs', () => apiError(409, 'Cet email est déjà utilisé'))
    renderForm('/admin/formateurs/nouveau')
    await screen.findByRole('heading', { level: 1 })
    await fillValid()
    await submit()
    expect(await screen.findByText('Cet email est déjà utilisé')).toBeInTheDocument()
    expect(screen.getByLabelText('Adresse e-mail')).toHaveValue('zoe@adac.test')
    expect(screen.getByLabelText('Nom')).toHaveValue('Roux')
    expect(screen.getByTestId('path')).toHaveTextContent('/admin/formateurs/nouveau')
  })

  it("n'a pas de violation d'accessibilité", async () => {
    const { container } = renderForm('/admin/formateurs/nouveau')
    await screen.findByRole('heading', { level: 1 })
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('AccountFormPage — modification', () => {
  const submit = () => userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

  function mockAccount(account) {
    mockRequest('get', `/users/${account.id}`, () => HttpResponse.json(account))
  }

  it('propose un retour vers le détail', async () => {
    mockAccount(FORMATEURS[0])
    renderForm('/admin/formateurs/10/modifier')
    expect(await screen.findByRole('link', { name: 'Retour' })).toHaveAttribute('href', '/admin/formateurs/10')
  })

  it('préremplit le formulaire avec le compte', async () => {
    mockAccount(FORMATEURS[0])
    renderForm('/admin/formateurs/10/modifier')
    expect(await screen.findByRole('heading', { level: 1, name: 'Modifier Anne Martin' })).toBeInTheDocument()
    expect(screen.getByLabelText('Nom')).toHaveValue('Martin')
    expect(screen.getByLabelText('Prénom')).toHaveValue('Anne')
    expect(screen.getByLabelText('Adresse e-mail')).toHaveValue('anne@adac.test')
  })

  it("n'envoie que le champ modifié puis revient au détail", async () => {
    mockAccount(FORMATEURS[0])
    const calls = mockRequest('put', '/users/10', () => HttpResponse.json({ ...FORMATEURS[0], prenom: 'Annie' }))
    renderForm('/admin/formateurs/10/modifier')
    await screen.findByRole('heading', { level: 1 })
    await fill('Prénom', 'Annie')
    await submit()
    expect(await screen.findByText('page de détail')).toBeInTheDocument()
    expect(calls.body).toEqual({ prenom: 'Annie' })
  })

  it("avertit qu'un compte actif devra se reconnecter si l'e-mail change", async () => {
    mockAccount(FORMATEURS[0])
    renderForm('/admin/formateurs/10/modifier')
    await screen.findByRole('heading', { level: 1 })
    expect(screen.queryByText(/devra se reconnecter/)).not.toBeInTheDocument()
    await fill('Adresse e-mail', 'nouvelle@adac.test')
    expect(await screen.findByText(/devra se reconnecter/)).toBeInTheDocument()
  })

  it("n'avertit pas pour un compte suspendu", async () => {
    mockAccount(FORMATEURS[1])
    renderForm('/admin/formateurs/11/modifier')
    await screen.findByRole('heading', { level: 1 })
    await fill('Adresse e-mail', 'nouvelle@adac.test')
    expect(screen.queryByText(/devra se reconnecter/)).not.toBeInTheDocument()
  })

  it("affiche le 409 en ligne", async () => {
    mockAccount(FORMATEURS[0])
    mockRequest('put', '/users/10', () => apiError(409, 'Cet email est déjà utilisé'))
    renderForm('/admin/formateurs/10/modifier')
    await screen.findByRole('heading', { level: 1 })
    await fill('Adresse e-mail', 'paul@adac.test')
    await submit()
    expect(await screen.findByText('Cet email est déjà utilisé')).toBeInTheDocument()
    expect(screen.getByLabelText('Adresse e-mail')).toHaveValue('paul@adac.test')
  })

  it('affiche « Compte introuvable » sur un 404', async () => {
    mockRequest('get', '/users/99', () => apiError(404, 'Introuvable'))
    renderForm('/admin/formateurs/99/modifier')
    expect(await screen.findByText('Compte introuvable')).toBeInTheDocument()
  })

  it("n'a pas de violation d'accessibilité", async () => {
    mockAccount(FORMATEURS[0])
    const { container } = renderForm('/admin/formateurs/10/modifier')
    await screen.findByRole('heading', { level: 1 })
    expect(await axe(container)).toHaveNoViolations()
  })
})
