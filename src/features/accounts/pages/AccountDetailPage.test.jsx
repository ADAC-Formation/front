import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse } from 'msw'
import { axe } from 'jest-axe'
import { Route, Routes } from 'react-router'
import AccountDetailPage from './AccountDetailPage'
import { renderWithProviders } from '../../../test/render'
import { mockDocumentApi } from '../../../test/documents'
import {
  FORMATIONS,
  INSCRITS,
  mockEnroll,
  mockFormationList,
  mockInscriptions,
  mockUnenroll,
  mockUserInscriptions,
} from '../../../test/formations'
import { mockSession } from '../../../test/session'
import { FORMATEURS, STAGIAIRES, apiError, mockAccountList, mockRequest } from '../../../test/accounts'
import { mockConversations } from '../../../test/messages'

// Le formateur lit ses stagiaires pour savoir s'il peut leur écrire (bouton « Envoyer un message »).
// Section « Documents » du stagiaire : la chargée de formation lit `GET /users/{id}/inscriptions` (`enrolments`,
// Q16) ; le formateur parcourt les formations (`formations`) et leurs inscrits.
function renderDetail(
  kind,
  id,
  role,
  { state, formations = [], enrolments = [], enrolmentsError, scopedStagiaires = STAGIAIRES } = {},
) {
  mockSession(role)
  if (kind === 'stagiaires') {
    mockFormationList(formations)
    if (role === 'SUPER_ADMIN') mockUserInscriptions(id, enrolments, { errorStatus: enrolmentsError })
  }
  if (role === 'ADMIN') {
    mockConversations([])
    mockAccountList('stagiaires', scopedStagiaires)
  }
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

  it('affiche le libellé « Stagiaire » et le statut « Jamais activé »', async () => {
    mockAccount(STAGIAIRES[1])
    renderDetail('stagiaires', 21, 'SUPER_ADMIN')
    expect(await screen.findByRole('heading', { level: 1, name: 'Omar Benali' })).toBeInTheDocument()
    expect(screen.getByText('Stagiaire')).toBeInTheDocument()
    expect(screen.getByText('Jamais activé')).toBeInTheDocument()
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
      expect(await screen.findByText('Suspendu')).toBeInTheDocument()
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
      expect(screen.getByText('Suspendu')).toBeInTheDocument()
    })
  })

  describe('statut « Jamais activé » et code d\'activation (Q8.3)', () => {
    const suspendu = { ...STAGIAIRES[0], id: 22, prenom: 'Sam', nom: 'Roux', email: 'sam@adac.test', isActive: false, activated: true }
    const resendButton = () => screen.findByRole('button', { name: "Renvoyer le code d'activation" })

    it('propose « Renvoyer le code d\'activation » à la place de « Réactiver » pour un compte jamais activé', async () => {
      mockAccount(STAGIAIRES[1])
      renderDetail('stagiaires', 21, 'SUPER_ADMIN')
      expect(await resendButton()).toBeInTheDocument()
      expect(screen.getByText('Jamais activé')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Réactiver' })).not.toBeInTheDocument()
    })

    it('un compte suspendu garde « Réactiver » et n\'a pas de renvoi de code', async () => {
      mockAccount(suspendu)
      renderDetail('stagiaires', 22, 'SUPER_ADMIN')
      expect(await screen.findByRole('button', { name: 'Réactiver' })).toBeInTheDocument()
      expect(screen.getByText('Suspendu')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: "Renvoyer le code d'activation" })).not.toBeInTheDocument()
    })

    it('envoie l\'e-mail du compte à /auth/resend-activation puis annonce le succès', async () => {
      mockAccount(STAGIAIRES[1])
      const calls = mockRequest('post', '/auth/resend-activation', () =>
        HttpResponse.json({ message: 'Si cet email existe, un code vous a été envoyé.' }),
      )
      renderDetail('stagiaires', 21, 'SUPER_ADMIN')
      await userEvent.click(await resendButton())
      expect(await screen.findByText("Un nouveau code d'activation a été envoyé à Omar Benali.")).toBeInTheDocument()
      expect(calls.body).toEqual({ email: 'omar@adac.test' })
    })

    it('annonce la limite de 3 codes sur 15 minutes (429) avec le message du back', async () => {
      mockAccount(STAGIAIRES[1])
      mockRequest('post', '/auth/resend-activation', () => apiError(429, 'Trop de demandes. Réessayez dans 15 minutes.'))
      renderDetail('stagiaires', 21, 'SUPER_ADMIN')
      await userEvent.click(await resendButton())
      expect(await screen.findByRole('alert')).toHaveTextContent('Trop de demandes. Réessayez dans 15 minutes.')
      expect(screen.queryByText(/Un nouveau code/)).not.toBeInTheDocument()
    })

    it('le formateur (lecture seule) ne voit pas le renvoi de code', async () => {
      mockAccount(STAGIAIRES[1])
      renderDetail('stagiaires', 21, 'ADMIN')
      await screen.findByRole('heading', { level: 1, name: 'Omar Benali' })
      expect(screen.getByText('Jamais activé')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: "Renvoyer le code d'activation" })).not.toBeInTheDocument()
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

  describe('documents du stagiaire (G17)', () => {
    const lea = INSCRITS[0].stagiaire // id 20
    const sent = {
      id: 701,
      fileName: 'Carte-identite.pdf',
      fileUrl: 'https://supabase.test/storage/701',
      fileSize: 2048,
      mimeType: 'application/pdf',
      uploadedBy: lea,
      formationId: null,
      inscriptionId: 1,
      createdAt: '2026-03-01T10:00:00',
    }
    const stagiaire = STAGIAIRES[0]

    it.each(['SUPER_ADMIN', 'ADMIN'])('%s voit ce que le stagiaire a envoyé, par formation', async (role) => {
      mockAccount(stagiaire)
      mockInscriptions(101)
      mockDocumentApi([sent])
      renderDetail('stagiaires', 20, role, {
        formations: [FORMATIONS[0]],
        enrolments: [{ id: 1, formation: FORMATIONS[0] }],
      })
      const section = (await screen.findByRole('heading', { level: 2, name: 'Documents' })).closest('section')
      expect(await within(section).findByRole('link', { name: 'Premiers secours PSC1' })).toHaveAttribute(
        'href',
        '/formations/101',
      )
      expect(await within(section).findByRole('button', { name: 'Télécharger Carte-identite.pdf' })).toBeInTheDocument()
    })

    it('n’affiche pas la section pour un formateur', async () => {
      mockAccount(FORMATEURS[0])
      renderDetail('formateurs', 10, 'SUPER_ADMIN')
      await screen.findByRole('heading', { level: 1, name: 'Anne Martin' })
      expect(screen.queryByRole('heading', { level: 2, name: 'Documents' })).not.toBeInTheDocument()
    })

    it('n’a aucune violation d’accessibilité (jest-axe)', async () => {
      mockAccount(stagiaire)
      mockInscriptions(101)
      mockDocumentApi([sent])
      const { container } = renderDetail('stagiaires', 20, 'SUPER_ADMIN', {
        formations: [FORMATIONS[0]],
        enrolments: [{ id: 1, formation: FORMATIONS[0] }],
      })
      await screen.findByRole('button', { name: 'Télécharger Carte-identite.pdf' })
      expect(await axe(container)).toHaveNoViolations()
    })
  })

  it("n'a pas de violation d'accessibilité", async () => {
    mockAccount(FORMATEURS[0])
    const { container } = renderDetail('formateurs', 10, 'SUPER_ADMIN')
    await screen.findByRole('heading', { level: 1 })
    expect(await axe(container)).toHaveNoViolations()
  })

  describe('« Envoyer un message »', () => {
    const messageLink = () => screen.queryByRole('link', { name: 'Envoyer un message' })
    const settle = () => new Promise((resolve) => setTimeout(resolve, 80))

    it('mène à la conversation avec un formateur actif (chargée de formation)', async () => {
      mockAccount(FORMATEURS[0])
      renderDetail('formateurs', 10, 'SUPER_ADMIN')
      expect(await screen.findByRole('link', { name: 'Envoyer un message' })).toHaveAttribute('href', '/messages/10')
    })

    it('mène à la conversation avec un stagiaire actif (chargée de formation)', async () => {
      mockAccount(STAGIAIRES[0])
      renderDetail('stagiaires', 20, 'SUPER_ADMIN')
      expect(await screen.findByRole('link', { name: 'Envoyer un message' })).toHaveAttribute('href', '/messages/20')
    })

    it("n'est pas proposé pour un compte suspendu", async () => {
      mockAccount(STAGIAIRES[1])
      renderDetail('stagiaires', 21, 'SUPER_ADMIN')
      await screen.findByRole('heading', { level: 1, name: 'Omar Benali' })
      expect(messageLink()).not.toBeInTheDocument()
    })

    it('le formateur peut écrire à un stagiaire de ses formations', async () => {
      mockAccount(STAGIAIRES[0])
      renderDetail('stagiaires', 20, 'ADMIN')
      expect(await screen.findByRole('link', { name: 'Envoyer un message' })).toHaveAttribute('href', '/messages/20')
    })

    it('le formateur ne le voit pas pour un stagiaire hors de ses formations', async () => {
      mockAccount(STAGIAIRES[0])
      renderDetail('stagiaires', 20, 'ADMIN', { scopedStagiaires: [] })
      await screen.findByRole('heading', { level: 1, name: 'Léa Petit' })
      await settle()
      expect(messageLink()).not.toBeInTheDocument()
    })

    it("le formateur ne le voit pas sur la fiche d'un autre formateur", async () => {
      mockAccount(FORMATEURS[0])
      renderDetail('formateurs', 10, 'ADMIN')
      await screen.findByRole('heading', { level: 1, name: 'Anne Martin' })
      await settle()
      expect(messageLink()).not.toBeInTheDocument()
    })
  })
  describe('formations du stagiaire (J5)', () => {
    const [secours, excel, postures] = FORMATIONS // 101 active, 102 active, 103 archivée
    const lea = STAGIAIRES[0] // id 20
    const sentByLea = {
      id: 701,
      fileName: 'Carte-identite.pdf',
      fileSize: 2048,
      mimeType: 'application/pdf',
      uploadedBy: { id: 20, prenom: 'Léa', nom: 'Petit' },
      formationId: null,
      inscriptionId: 1,
      createdAt: '2026-03-01T10:00:00',
    }

    // La chargée de formation : `enrolments` = réponse de `GET /users/20/inscriptions`.
    function renderManager(enrolments, { documents = [] } = {}) {
      mockAccount(lea)
      mockDocumentApi(documents)
      return renderDetail('stagiaires', 20, 'SUPER_ADMIN', { formations: FORMATIONS, enrolments })
    }

    const formationsSection = async () =>
      (await screen.findByRole('heading', { level: 2, name: 'Formations' })).closest('section')

    it('liste ses formations avec un lien, « Désinscrire » seulement sur une formation active', async () => {
      renderManager([
        { id: 1, formation: secours },
        { id: 3, formation: postures },
      ])
      const section = await formationsSection()
      expect(await within(section).findByRole('link', { name: 'Premiers secours PSC1' })).toHaveAttribute(
        'href',
        '/formations/101',
      )
      expect(within(section).getByRole('link', { name: 'Gestes et postures' })).toHaveAttribute('href', '/formations/103')
      expect(within(section).getByText('Archivée')).toBeInTheDocument()
      expect(within(section).getByRole('button', { name: 'Désinscrire de Premiers secours PSC1' })).toBeInTheDocument()
      expect(within(section).queryByRole('button', { name: 'Désinscrire de Gestes et postures' })).not.toBeInTheDocument()
    })

    it('place la section « Formations » avant « Documents »', async () => {
      renderManager([{ id: 1, formation: secours }])
      await formationsSection()
      const names = screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)
      expect(names.indexOf('Formations')).toBeGreaterThan(-1)
      expect(names.indexOf('Formations')).toBeLessThan(names.indexOf('Documents'))
    })

    it('dit quand il n’est inscrit à aucune formation', async () => {
      renderManager([])
      const section = await formationsSection()
      expect(await within(section).findByText('Ce stagiaire n’est inscrit à aucune formation')).toBeInTheDocument()
    })

    it('propose « Réessayer » sur une erreur de chargement', async () => {
      mockAccount(lea)
      mockDocumentApi([])
      renderDetail('stagiaires', 20, 'SUPER_ADMIN', { formations: FORMATIONS, enrolmentsError: 500 })
      const section = await formationsSection()
      expect(await within(section).findByRole('alert')).toHaveTextContent('Erreur serveur')
      mockUserInscriptions(20, [])
      await userEvent.click(within(section).getByRole('button', { name: 'Réessayer' }))
      expect(await within(section).findByText('Ce stagiaire n’est inscrit à aucune formation')).toBeInTheDocument()
    })

    describe('« Inscrire à une formation »', () => {
      it('propose les formations actives qu’il ne suit pas, inscrit puis affiche le récapitulatif', async () => {
        const enrolCalls = mockEnroll()
        renderManager([{ id: 1, formation: secours }])
        const section = await formationsSection()
        await userEvent.click(await within(section).findByRole('button', { name: 'Inscrire à une formation' }))

        const picker = within(section).getByRole('group', { name: 'Inscrire à une formation' })
        const excelBox = await within(picker).findByRole('checkbox', { name: /Excel niveau 1/ })
        expect(within(picker).queryByRole('checkbox', { name: /Premiers secours/ })).not.toBeInTheDocument()
        expect(within(picker).queryByRole('checkbox', { name: /Gestes et postures/ })).not.toBeInTheDocument()

        await userEvent.click(excelBox)
        await userEvent.click(within(section).getByRole('button', { name: 'Inscrire' }))

        expect(await within(section).findByText('Inscrit à : Excel niveau 1.')).toBeInTheDocument()
        expect(enrolCalls.bodies).toEqual([{ formationId: 102, stagiaireId: 20 }])
        expect(within(section).queryByRole('group', { name: 'Inscrire à une formation' })).not.toBeInTheDocument()
        await within(section).findByRole('link', { name: 'Premiers secours PSC1' })
      })

      it('filtre les formations par catégorie (NOTES-26, J12)', async () => {
        renderManager([])
        const section = await formationsSection()
        await userEvent.click(await within(section).findByRole('button', { name: 'Inscrire à une formation' }))
        await within(section).findByRole('checkbox', { name: /Excel niveau 1/ })
        await userEvent.selectOptions(within(section).getByRole('combobox', { name: 'Catégorie' }), 'Secourisme')
        expect(within(section).getByRole('checkbox', { name: /Premiers secours PSC1/ })).toBeInTheDocument()
        expect(within(section).queryByRole('checkbox', { name: /Excel niveau 1/ })).not.toBeInTheDocument()
      })

      it('désactive « Inscrire » tant qu’aucune formation n’est cochée', async () => {
        renderManager([])
        const section = await formationsSection()
        await userEvent.click(await within(section).findByRole('button', { name: 'Inscrire à une formation' }))
        await within(section).findByRole('checkbox', { name: /Excel niveau 1/ })
        expect(within(section).getByRole('button', { name: 'Inscrire' })).toBeDisabled()
      })

      it('liste les échecs avec leur raison (J4)', async () => {
        mockEnroll({ errors: { 102: { status: 400, message: 'Formation archivée, inscription impossible' } } })
        renderManager([])
        const section = await formationsSection()
        await userEvent.click(await within(section).findByRole('button', { name: 'Inscrire à une formation' }))
        await userEvent.click(await within(section).findByRole('checkbox', { name: /Premiers secours PSC1/ }))
        await userEvent.click(within(section).getByRole('checkbox', { name: /Excel niveau 1/ }))
        await userEvent.click(within(section).getByRole('button', { name: 'Inscrire' }))

        expect(await within(section).findByText('Inscrit à : Premiers secours PSC1.')).toBeInTheDocument()
        expect(
          within(section).getByText('Inscription impossible : Excel niveau 1 (Formation archivée, inscription impossible).'),
        ).toBeInTheDocument()
        await within(section).findByText('Ce stagiaire n’est inscrit à aucune formation')
      })

      it('« Annuler » referme la liste sans appel', async () => {
        const enrolCalls = mockEnroll()
        renderManager([])
        const section = await formationsSection()
        await userEvent.click(await within(section).findByRole('button', { name: 'Inscrire à une formation' }))
        await userEvent.click(await within(section).findByRole('checkbox', { name: /Excel niveau 1/ }))
        await userEvent.click(within(section).getByRole('button', { name: 'Annuler' }))
        expect(within(section).queryByRole('group', { name: 'Inscrire à une formation' })).not.toBeInTheDocument()
        expect(enrolCalls.bodies).toEqual([])
      })

      it('n’a aucune violation d’accessibilité, liste ouverte (jest-axe)', async () => {
        const { container } = renderManager([{ id: 1, formation: secours }])
        const section = await formationsSection()
        await userEvent.click(await within(section).findByRole('button', { name: 'Inscrire à une formation' }))
        await within(section).findByRole('checkbox', { name: /Excel niveau 1/ })
        expect(await axe(container)).toHaveNoViolations()
      })
    })

    describe('« Désinscrire »', () => {
      it('confirme en annonçant la perte de ses documents, puis désinscrit', async () => {
        const unenrolCalls = mockUnenroll()
        renderManager([{ id: 1, formation: secours }], { documents: [sentByLea] })
        const section = await formationsSection()
        await screen.findByRole('button', { name: 'Télécharger Carte-identite.pdf' }) // documents connus de la page
        await userEvent.click(within(section).getByRole('button', { name: 'Désinscrire de Premiers secours PSC1' }))

        const dialog = screen.getByRole('dialog', { name: 'Désinscrire Léa Petit de « Premiers secours PSC1 » ?' })
        expect(
          within(dialog).getByText('Son document déposé sur cette formation sera supprimé définitivement.'),
        ).toBeInTheDocument()
        await userEvent.click(within(dialog).getByRole('button', { name: 'Désinscrire' }))

        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
        expect(unenrolCalls.paths).toEqual([{ formationId: 101, stagiaireId: 20 }])
        await within(section).findByRole('link', { name: 'Premiers secours PSC1' })
      })

      it('affiche l’erreur dans la confirmation sans la fermer', async () => {
        mockUnenroll({ errorStatus: 409 })
        renderManager([{ id: 1, formation: secours }])
        const section = await formationsSection()
        await userEvent.click(await within(section).findByRole('button', { name: 'Désinscrire de Premiers secours PSC1' }))
        const dialog = screen.getByRole('dialog')
        await userEvent.click(within(dialog).getByRole('button', { name: 'Désinscrire' }))
        expect(await within(dialog).findByRole('alert')).toHaveTextContent('Formation archivée, désinscription impossible')
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      it('« Annuler » n’appelle rien et rend le focus au bouton', async () => {
        const unenrolCalls = mockUnenroll()
        renderManager([{ id: 1, formation: secours }])
        const section = await formationsSection()
        const button = await within(section).findByRole('button', { name: 'Désinscrire de Premiers secours PSC1' })
        await userEvent.click(button)
        await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Annuler' }))
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        expect(button).toHaveFocus()
        expect(unenrolCalls.paths).toEqual([])
      })
    })

    it('le formateur voit ses formations sans action', async () => {
      mockAccount(lea)
      mockInscriptions(101)
      mockInscriptions(102, [])
      mockDocumentApi([])
      renderDetail('stagiaires', 20, 'ADMIN', { formations: [secours, excel] })
      const section = await formationsSection()
      expect(await within(section).findByRole('link', { name: 'Premiers secours PSC1' })).toBeInTheDocument()
      expect(within(section).queryByRole('button', { name: /Désinscrire|Inscrire/ })).not.toBeInTheDocument()
    })
  })
})
