import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { axe } from 'jest-axe'
import { Route, Routes } from 'react-router'
import AccountListPage from './AccountListPage'
import { renderWithProviders } from '../../../test/render'
import { server } from '../../../test/msw/server'
import { API_URL, mockSession } from '../../../test/session'
import { FORMATEURS, STAGIAIRES, apiError, mockAccountList, mockRequest } from '../../../test/accounts'

function renderList(kind, role) {
  mockSession(role)
  return renderWithProviders(
    <Routes>
      <Route path="/admin/:kind" element={<AccountListPage kind={kind} />} />
    </Routes>,
    { route: `/admin/${kind}`, withSession: true },
  )
}

describe('AccountListPage', () => {
  it('affiche un état de chargement puis la liste des formateurs', async () => {
    mockAccountList('formateurs', FORMATEURS)
    renderList('formateurs', 'SUPER_ADMIN')
    expect(screen.getByText('Chargement…')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { level: 1, name: 'Formateurs' })).toBeInTheDocument()
    const row = (await screen.findByRole('link', { name: 'Anne Martin' })).closest('tr')
    expect(within(row).getByText('anne@adac.test')).toBeInTheDocument()
    expect(within(row).getByText('Actif')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Paul Durand' }).closest('tr')).toHaveTextContent('Inactif')
  })

  it('liste les stagiaires', async () => {
    mockAccountList('stagiaires', STAGIAIRES)
    renderList('stagiaires', 'SUPER_ADMIN')
    expect(await screen.findByRole('link', { name: 'Léa Petit' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Stagiaires' })).toBeInTheDocument()
  })

  it('affiche un message quand la liste est vide', async () => {
    mockAccountList('formateurs', [])
    renderList('formateurs', 'SUPER_ADMIN')
    expect(await screen.findByText('Aucun formateur')).toBeInTheDocument()
  })

  it('affiche une erreur annoncée avec « Réessayer »', async () => {
    server.use(http.get(`${API_URL}/users/formateurs`, () => apiError(500, 'Erreur interne')))
    renderList('formateurs', 'SUPER_ADMIN')
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    mockAccountList('formateurs', FORMATEURS)
    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }))
    expect(await screen.findByRole('link', { name: 'Anne Martin' })).toBeInTheDocument()
  })

  describe('SUPER_ADMIN', () => {
    it('propose la création', async () => {
      mockAccountList('formateurs', FORMATEURS)
      renderList('formateurs', 'SUPER_ADMIN')
      const create = await screen.findByRole('link', { name: 'Créer un formateur' })
      expect(create).toHaveAttribute('href', '/admin/formateurs/nouveau')
    })

    it('filtre sur les comptes actifs avec active=true', async () => {
      const calls = mockAccountList('formateurs', FORMATEURS)
      renderList('formateurs', 'SUPER_ADMIN')
      await screen.findByRole('link', { name: 'Paul Durand' })
      await userEvent.click(screen.getByRole('radio', { name: 'Actifs' }))
      await screen.findByRole('link', { name: 'Anne Martin' })
      expect(screen.queryByRole('link', { name: 'Paul Durand' })).not.toBeInTheDocument()
      expect(calls.urls.at(-1)).toContain('active=true')
    })

    it('filtre sur les comptes inactifs côté client', async () => {
      mockAccountList('formateurs', FORMATEURS)
      renderList('formateurs', 'SUPER_ADMIN')
      await screen.findByRole('link', { name: 'Anne Martin' })
      await userEvent.click(screen.getByRole('radio', { name: 'Inactifs' }))
      expect(screen.queryByRole('link', { name: 'Anne Martin' })).not.toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Paul Durand' })).toBeInTheDocument()
    })

    it('suspend un compte après confirmation', async () => {
      mockAccountList('formateurs', FORMATEURS)
      const calls = mockRequest('patch', '/users/10/deactivate', () =>
        HttpResponse.json({ ...FORMATEURS[0], isActive: false }),
      )
      renderList('formateurs', 'SUPER_ADMIN')
      await userEvent.click(await screen.findByRole('button', { name: 'Suspendre Anne Martin' }))
      expect(calls.count).toBe(0)
      const dialog = screen.getByRole('dialog')
      await userEvent.click(within(dialog).getByRole('button', { name: 'Suspendre' }))
      await vi.waitFor(() => expect(calls.count).toBe(1))
      await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    })

    it("n'appelle rien quand la suspension est annulée", async () => {
      mockAccountList('formateurs', FORMATEURS)
      const calls = mockRequest('patch', '/users/10/deactivate', () => HttpResponse.json(FORMATEURS[0]))
      renderList('formateurs', 'SUPER_ADMIN')
      await userEvent.click(await screen.findByRole('button', { name: 'Suspendre Anne Martin' }))
      await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Annuler' }))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(calls.count).toBe(0)
    })

    it('réactive un compte suspendu', async () => {
      mockAccountList('formateurs', FORMATEURS)
      const calls = mockRequest('patch', '/users/11/reactivate', () =>
        HttpResponse.json({ ...FORMATEURS[1], isActive: true }),
      )
      renderList('formateurs', 'SUPER_ADMIN')
      await userEvent.click(await screen.findByRole('button', { name: 'Réactiver Paul Durand' }))
      await vi.waitFor(() => expect(calls.count).toBe(1))
    })

    it("annonce l'erreur quand le back refuse l'action", async () => {
      mockAccountList('formateurs', FORMATEURS)
      mockRequest('patch', '/users/11/reactivate', () => apiError(403, 'Accès refusé'))
      renderList('formateurs', 'SUPER_ADMIN')
      await userEvent.click(await screen.findByRole('button', { name: 'Réactiver Paul Durand' }))
      expect(await screen.findByRole('alert')).toHaveTextContent('Accès refusé')
      expect(screen.getByRole('link', { name: 'Paul Durand' }).closest('tr')).toHaveTextContent('Inactif')
    })
  })

  describe('ADMIN (lecture seule)', () => {
    it('ne propose ni filtre, ni création, ni suspension', async () => {
      mockAccountList('formateurs', [FORMATEURS[0]])
      renderList('formateurs', 'ADMIN')
      await screen.findByRole('link', { name: 'Anne Martin' })
      expect(screen.queryByRole('radio')).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: /Créer/ })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Suspendre|Réactiver/ })).not.toBeInTheDocument()
    })
  })

  it("n'a pas de violation d'accessibilité", async () => {
    mockAccountList('stagiaires', STAGIAIRES)
    const { container } = renderList('stagiaires', 'SUPER_ADMIN')
    await screen.findByRole('link', { name: 'Léa Petit' })
    expect(await axe(container)).toHaveNoViolations()
  })
})
