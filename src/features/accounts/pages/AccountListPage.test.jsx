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
    const row = (await screen.findByRole('link', { name: 'Anne Martin' })).closest('li')
    expect(within(row).getByText('anne@adac.test')).toBeInTheDocument()
    expect(within(row).getByText('Actif')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Paul Durand' }).closest('li')).toHaveTextContent('Suspendu')
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

  it('propose un retour vers le menu Gestion', async () => {
    mockAccountList('formateurs', FORMATEURS)
    renderList('formateurs', 'ADMIN')
    expect(await screen.findByRole('link', { name: 'Retour' })).toHaveAttribute('href', '/admin/gestion')
  })

  it('ne propose pas l’import Excel au formateur (NOTES-09)', async () => {
    mockAccountList('formateurs', FORMATEURS)
    renderList('formateurs', 'ADMIN')
    await screen.findByRole('link', { name: 'Anne Martin' })
    expect(screen.queryByRole('link', { name: 'Importer depuis Excel' })).not.toBeInTheDocument()
  })

  describe('recherche et tri', () => {
    it('filtre par prénom, nom ou e-mail sans appel supplémentaire', async () => {
      const calls = mockAccountList('formateurs', FORMATEURS)
      renderList('formateurs', 'SUPER_ADMIN')
      await screen.findByRole('link', { name: 'Anne Martin' })
      const search = screen.getByRole('searchbox', { name: 'Rechercher un formateur' })
      await userEvent.type(search, 'durand')
      expect(screen.queryByRole('link', { name: 'Anne Martin' })).not.toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Paul Durand' })).toBeInTheDocument()
      await userEvent.clear(search)
      await userEvent.type(search, 'ANNE@adac')
      expect(screen.getByRole('link', { name: 'Anne Martin' })).toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'Paul Durand' })).not.toBeInTheDocument()
      expect(calls.count).toBe(1)
    })

    it('affiche un état vide quand la recherche ne trouve rien', async () => {
      mockAccountList('formateurs', FORMATEURS)
      renderList('formateurs', 'SUPER_ADMIN')
      await screen.findByRole('link', { name: 'Anne Martin' })
      await userEvent.type(screen.getByRole('searchbox'), 'zzz')
      expect(screen.getByText('Aucun formateur trouvé')).toBeInTheDocument()
    })

    it('affiche le nombre de comptes', async () => {
      mockAccountList('stagiaires', STAGIAIRES)
      renderList('stagiaires', 'SUPER_ADMIN')
      expect(await screen.findByText('2 stagiaires')).toBeInTheDocument()
    })

    it('organise par nom, prénom ou e-mail', async () => {
      mockAccountList('formateurs', FORMATEURS)
      renderList('formateurs', 'SUPER_ADMIN')
      await screen.findByRole('link', { name: 'Anne Martin' })
      const names = () => screen.getAllByRole('listitem').map((item) => within(item).getByRole('link').textContent)
      expect(names()).toEqual(['Paul Durand', 'Anne Martin']) // nom A-Z : Durand < Martin
      await userEvent.selectOptions(screen.getByLabelText('Organiser par :'), 'prenom')
      expect(names()).toEqual(['Anne Martin', 'Paul Durand'])
      await userEvent.selectOptions(screen.getByLabelText('Organiser par :'), 'email')
      expect(names()).toEqual(['Anne Martin', 'Paul Durand']) // anne@ < paul@
    })
  })

  describe('SUPER_ADMIN', () => {
    it('propose la création', async () => {
      mockAccountList('formateurs', FORMATEURS)
      renderList('formateurs', 'SUPER_ADMIN')
      const create = await screen.findByRole('link', { name: 'Créer un formateur' })
      expect(create).toHaveAttribute('href', '/admin/formateurs/nouveau')
    })

    it.each(['formateurs', 'stagiaires'])('propose l’import Excel des comptes (%s, NOTES-09)', async (kind) => {
      mockAccountList(kind, kind === 'formateurs' ? FORMATEURS : STAGIAIRES)
      renderList(kind, 'SUPER_ADMIN')
      const link = await screen.findByRole('link', { name: 'Importer depuis Excel' })
      expect(link).toHaveAttribute('href', '/admin/comptes/importer')
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
      expect(screen.getByRole('link', { name: 'Paul Durand' }).closest('li')).toHaveTextContent('Suspendu')
    })
  })

  describe('statuts et code d\'activation (Q8.3)', () => {
    const suspendu = { ...STAGIAIRES[0], id: 22, prenom: 'Sam', nom: 'Roux', email: 'sam@adac.test', isActive: false, activated: true }
    const row = (name) => screen.getByRole('link', { name }).closest('li')

    it('distingue « Actif », « Suspendu » et « Jamais activé »', async () => {
      mockAccountList('stagiaires', [...STAGIAIRES, suspendu])
      renderList('stagiaires', 'SUPER_ADMIN')
      await screen.findByRole('link', { name: 'Léa Petit' })
      expect(row('Léa Petit')).toHaveTextContent('Actif')
      expect(row('Sam Roux')).toHaveTextContent('Suspendu')
      expect(row('Omar Benali')).toHaveTextContent('Jamais activé')
    })

    it('propose « Renvoyer le code » (pas « Réactiver ») pour un compte jamais activé, et l\'inverse pour un suspendu', async () => {
      mockAccountList('stagiaires', [...STAGIAIRES, suspendu])
      renderList('stagiaires', 'SUPER_ADMIN')
      await screen.findByRole('link', { name: 'Omar Benali' })
      expect(screen.getByRole('button', { name: 'Renvoyer le code à Omar Benali' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Réactiver Omar Benali' })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Réactiver Sam Roux' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Renvoyer le code à Sam Roux' })).not.toBeInTheDocument()
    })

    it('renvoie le code à l\'e-mail du compte et annonce le succès', async () => {
      mockAccountList('stagiaires', STAGIAIRES)
      const calls = mockRequest('post', '/auth/resend-activation', () =>
        HttpResponse.json({ message: 'Si cet email existe, un code vous a été envoyé.' }),
      )
      renderList('stagiaires', 'SUPER_ADMIN')
      await userEvent.click(await screen.findByRole('button', { name: 'Renvoyer le code à Omar Benali' }))
      expect(await screen.findByText("Un nouveau code d'activation a été envoyé à Omar Benali.")).toBeInTheDocument()
      expect(calls.body).toEqual({ email: 'omar@adac.test' })
    })

    it('annonce le refus du back (429) sans message de succès', async () => {
      mockAccountList('stagiaires', STAGIAIRES)
      mockRequest('post', '/auth/resend-activation', () => apiError(429, 'Trop de demandes. Réessayez dans 15 minutes.'))
      renderList('stagiaires', 'SUPER_ADMIN')
      await userEvent.click(await screen.findByRole('button', { name: 'Renvoyer le code à Omar Benali' }))
      expect(await screen.findByRole('alert')).toHaveTextContent('Trop de demandes. Réessayez dans 15 minutes.')
      expect(screen.queryByText(/Un nouveau code/)).not.toBeInTheDocument()
    })

    it('« Inactifs » regroupe les comptes suspendus et jamais activés', async () => {
      mockAccountList('stagiaires', [...STAGIAIRES, suspendu])
      renderList('stagiaires', 'SUPER_ADMIN')
      await userEvent.click(await screen.findByRole('radio', { name: 'Inactifs' }))
      expect(screen.getByRole('link', { name: 'Omar Benali' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Sam Roux' })).toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'Léa Petit' })).not.toBeInTheDocument()
    })

    it('le formateur (lecture seule) ne voit pas « Renvoyer le code »', async () => {
      mockAccountList('stagiaires', STAGIAIRES)
      renderList('stagiaires', 'ADMIN')
      await screen.findByRole('link', { name: 'Omar Benali' })
      expect(screen.queryByRole('button', { name: /Renvoyer le code/ })).not.toBeInTheDocument()
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
