import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse } from 'msw'
import { axe } from 'jest-axe'
import { Route, Routes } from 'react-router'
import AccountDetailPage from './AccountDetailPage'
import { renderWithProviders } from '../../../test/render'
import { mockSession } from '../../../test/session'
import { FORMATEURS, STAGIAIRES, apiError, mockRequest } from '../../../test/accounts'

function renderDetail(kind, id, role, { state } = {}) {
  mockSession(role)
  return renderWithProviders(
    <Routes>
      <Route path={`/admin/${kind}/:id`} element={<AccountDetailPage kind={kind} />} />
    </Routes>,
    { route: state ? { pathname: `/admin/${kind}/${id}`, state } : `/admin/${kind}/${id}`, withSession: true },
  )
}

const mockAccount = (account) =>
  mockRequest('get', `/users/${account.id}`, () => HttpResponse.json(account))

describe('AccountDetailPage', () => {
  it('affiche les informations du formateur avec le libellé de rôle', async () => {
    mockAccount(FORMATEURS[0])
    renderDetail('formateurs', 10, 'SUPER_ADMIN')
    expect(await screen.findByRole('heading', { level: 1, name: 'Anne Martin' })).toBeInTheDocument()
    expect(screen.getByText('anne@adac.test')).toBeInTheDocument()
    expect(screen.getByText('Formateur')).toBeInTheDocument()
    expect(screen.getByText('Actif')).toBeInTheDocument()
  })

  it('affiche le libellé « Stagiaire » et le statut suspendu', async () => {
    mockAccount(STAGIAIRES[1])
    renderDetail('stagiaires', 21, 'SUPER_ADMIN')
    expect(await screen.findByRole('heading', { level: 1, name: 'Omar Benali' })).toBeInTheDocument()
    expect(screen.getByText('Stagiaire')).toBeInTheDocument()
    expect(screen.getByText('Inactif')).toBeInTheDocument()
  })

  it('rend les contenus en texte, jamais en HTML', async () => {
    mockAccount({ ...FORMATEURS[0], prenom: '<b>Anne</b>' })
    renderDetail('formateurs', 10, 'SUPER_ADMIN')
    expect(await screen.findByRole('heading', { level: 1, name: '<b>Anne</b> Martin' })).toBeInTheDocument()
    expect(document.querySelector('h1 b')).toBeNull()
  })

  it('affiche « Compte introuvable » avec un lien de retour sur un 404', async () => {
    mockRequest('get', '/users/99', () => apiError(404, 'Introuvable'))
    renderDetail('formateurs', 99, 'ADMIN')
    expect(await screen.findByText('Compte introuvable')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Retour aux formateurs' })).toHaveAttribute('href', '/admin/formateurs')
  })

  it('propose un retour vers la liste', async () => {
    mockAccount(FORMATEURS[0])
    renderDetail('formateurs', 10, 'ADMIN')
    expect(await screen.findByRole('link', { name: 'Retour aux formateurs' })).toHaveAttribute(
      'href',
      '/admin/formateurs',
    )
  })

  it('affiche la confirmation transmise par la navigation', async () => {
    mockAccount(FORMATEURS[0])
    renderDetail('formateurs', 10, 'SUPER_ADMIN', { state: { notice: 'account-updated' } })
    expect(await screen.findByText('Compte mis à jour')).toBeInTheDocument()
  })

  describe('SUPER_ADMIN', () => {
    it('propose Modifier vers le formulaire', async () => {
      mockAccount(FORMATEURS[0])
      renderDetail('formateurs', 10, 'SUPER_ADMIN')
      const edit = await screen.findByRole('link', { name: 'Modifier' })
      expect(edit).toHaveAttribute('href', '/admin/formateurs/10/modifier')
    })

    it('suspend après confirmation et met le statut à jour', async () => {
      mockAccount(FORMATEURS[0])
      const calls = mockRequest('patch', '/users/10/deactivate', () =>
        HttpResponse.json({ ...FORMATEURS[0], isActive: false }),
      )
      renderDetail('formateurs', 10, 'SUPER_ADMIN')
      await userEvent.click(await screen.findByRole('button', { name: 'Suspendre' }))
      expect(calls.count).toBe(0)
      await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Suspendre' }))
      expect(await screen.findByText('Inactif')).toBeInTheDocument()
      expect(await screen.findByRole('button', { name: 'Réactiver' })).toBeInTheDocument()
    })

    it('réactive un compte suspendu', async () => {
      mockAccount(FORMATEURS[1])
      mockRequest('patch', '/users/11/reactivate', () =>
        HttpResponse.json({ ...FORMATEURS[1], isActive: true }),
      )
      renderDetail('formateurs', 11, 'SUPER_ADMIN')
      await userEvent.click(await screen.findByRole('button', { name: 'Réactiver' }))
      expect(await screen.findByText('Actif')).toBeInTheDocument()
    })

    it("annonce l'erreur du back sans changer le statut", async () => {
      mockAccount(FORMATEURS[1])
      mockRequest('patch', '/users/11/reactivate', () => apiError(403, 'Accès refusé'))
      renderDetail('formateurs', 11, 'SUPER_ADMIN')
      await userEvent.click(await screen.findByRole('button', { name: 'Réactiver' }))
      expect(await screen.findByRole('alert')).toHaveTextContent('Accès refusé')
      expect(screen.getByText('Inactif')).toBeInTheDocument()
    })
  })

  describe('ADMIN (lecture seule)', () => {
    it('ne propose aucune action de gestion', async () => {
      mockAccount(FORMATEURS[0])
      renderDetail('formateurs', 10, 'ADMIN')
      await screen.findByRole('heading', { level: 1, name: 'Anne Martin' })
      expect(screen.queryByRole('link', { name: 'Modifier' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Suspendre|Réactiver/ })).not.toBeInTheDocument()
    })
  })

  it("n'a pas de violation d'accessibilité", async () => {
    mockAccount(FORMATEURS[0])
    const { container } = renderDetail('formateurs', 10, 'SUPER_ADMIN')
    await screen.findByRole('heading', { level: 1 })
    expect(await axe(container)).toHaveNoViolations()
  })
})
