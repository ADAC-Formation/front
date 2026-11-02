import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { Route, Routes } from 'react-router'
import FormationDetailPage from './FormationDetailPage'
import FormationListPage from './FormationListPage'
import { renderWithProviders } from '../../../test/render'
import { mockCategories } from '../../../test/categories'
import { mockDocumentApi } from '../../../test/documents'
import { mockSession } from '../../../test/session'
import {
  FORMATIONS,
  mockArchive,
  mockFormationDetail,
  mockFormationList,
  mockInscriptions,
} from '../../../test/formations'

const [secours, excel, postures] = FORMATIONS

function renderDetail(role, formation, { notice } = {}) {
  mockSession(role)
  mockCategories() // la liste des formations, où l'on revient, charge les catégories du filtre
  mockDocumentApi() // la section « Documents » du détail
  const route = notice
    ? { pathname: `/formations/${formation.id}`, state: { notice } }
    : `/formations/${formation.id}`
  return renderWithProviders(
    <Routes>
      <Route path="/formations/:formationId" element={<FormationDetailPage />} />
      <Route path="/formations" element={<FormationListPage />} />
    </Routes>,
    { route, withSession: true },
  )
}

const archiveButton = () => screen.queryByRole('button', { name: 'Archiver' })

describe('FormationDetailPage', () => {
  it('affiche un état de chargement puis les informations de la formation', async () => {
    mockFormationDetail(secours)
    mockInscriptions(101)
    renderDetail('SUPER_ADMIN', secours)
    expect(screen.getByText('Chargement…')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { level: 1, name: 'Premiers secours PSC1' })).toBeInTheDocument()
    expect(screen.getByText('Secourisme')).toBeInTheDocument()
    expect(screen.getByText('Gestes de premiers secours.')).toBeInTheDocument()
    expect(screen.getByText('du 10 mars 2026 au 12 mars 2026')).toBeInTheDocument()
    expect(screen.getByText('Présentiel')).toBeInTheDocument()
    expect(screen.getByText('Formateur Dev')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Retour aux formations' })).toHaveAttribute('href', '/formations')
  })

  it("n'affiche pas de description absente et indique l'absence d'inscrits", async () => {
    mockFormationDetail(excel)
    mockInscriptions(102, [])
    renderDetail('SUPER_ADMIN', excel)
    await screen.findByRole('heading', { level: 1, name: 'Excel niveau 1' })
    expect(screen.queryByText('null')).not.toBeInTheDocument()
    expect(await screen.findByText('Aucun stagiaire inscrit')).toBeInTheDocument()
  })

  it('rend le contenu du back en texte, jamais en HTML', async () => {
    const hostile = { ...secours, description: '<script>alert(1)</script><b>gras</b>' }
    mockFormationDetail(hostile)
    mockInscriptions(101)
    const { container } = renderDetail('SUPER_ADMIN', hostile)
    expect(await screen.findByText('<script>alert(1)</script><b>gras</b>')).toBeInTheDocument()
    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelector('b')).toBeNull()
  })

  it('affiche le badge « Archivée » sans action sur une formation archivée', async () => {
    mockFormationDetail(postures)
    mockInscriptions(103)
    renderDetail('SUPER_ADMIN', postures)
    await screen.findByRole('heading', { level: 1, name: 'Gestes et postures' })
    expect(screen.getByText('Archivée')).toBeInTheDocument()
    expect(screen.getByText('Ancienne catégorie')).toBeInTheDocument()
    expect(archiveButton()).not.toBeInTheDocument()
  })

  it('affiche « Formation introuvable ou non accessible » sur un 404', async () => {
    mockFormationDetail(secours, { errorStatus: 404 })
    renderDetail('ADMIN', secours)
    expect(await screen.findByText('Formation introuvable ou non accessible')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Retour aux formations' })).toHaveAttribute('href', '/formations')
  })

  it("espace le message d'erreur du bouton « Retour »", async () => {
    mockFormationDetail(secours, { errorStatus: 404 })
    renderDetail('ADMIN', secours)
    const message = await screen.findByText('Formation introuvable ou non accessible')
    expect(message.parentElement.className).toMatch(/errorState/)
  })

  it('affiche « Accès refusé » sur un 403', async () => {
    mockFormationDetail(secours, { errorStatus: 403 })
    renderDetail('STAGIAIRE', secours)
    expect(await screen.findByRole('heading', { name: 'Accès refusé' })).toBeInTheDocument()
  })

  it('affiche une autre erreur avec « Réessayer »', async () => {
    mockFormationDetail(secours, { errorStatus: 500 })
    renderDetail('SUPER_ADMIN', secours)
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    mockFormationDetail(secours)
    mockInscriptions(101)
    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Premiers secours PSC1' })).toBeInTheDocument()
  })

  describe('documents', () => {
    it.each(['SUPER_ADMIN', 'ADMIN', 'STAGIAIRE'])('%s voit les documents de la formation', async (role) => {
      mockFormationDetail(secours)
      mockInscriptions(101)
      renderDetail(role, secours)
      expect(await screen.findByRole('heading', { level: 2, name: 'Documents' })).toBeInTheDocument()
      expect(await screen.findByText('Support de cours.pdf')).toBeInTheDocument()
      expect(screen.queryByText(/arriveront bientôt/)).not.toBeInTheDocument()
    })

    it('propose le dépôt à la chargée de formation seulement, ici', async () => {
      mockFormationDetail(secours)
      mockInscriptions(101)
      renderDetail('SUPER_ADMIN', secours)
      expect(await screen.findByRole('group', { name: 'Zone de dépôt de documents' })).toBeInTheDocument()
    })

    it('n’a aucune violation d’accessibilité avec les documents (jest-axe)', async () => {
      mockFormationDetail(secours)
      mockInscriptions(101)
      const { container } = renderDetail('SUPER_ADMIN', secours)
      await screen.findByText('Support de cours.pdf')
      await screen.findByRole('group', { name: 'Zone de dépôt de documents' })
      expect(await axe(container)).toHaveNoViolations()
    })
  })

  describe('inscrits', () => {
    it('liste les stagiaires pour la chargée de formation', async () => {
      mockFormationDetail(secours)
      mockInscriptions(101)
      renderDetail('SUPER_ADMIN', secours)
      const section = (await screen.findByRole('heading', { level: 2, name: 'Stagiaires inscrits' })).closest('section')
      expect(await within(section).findByText('Léa Petit')).toBeInTheDocument()
      expect(within(section).getByText('lea@adac.test')).toBeInTheDocument()
      expect(within(section).getByText('Omar Benali')).toBeInTheDocument()
    })

    it('liste les stagiaires pour le formateur', async () => {
      mockFormationDetail(secours)
      const calls = mockInscriptions(101)
      renderDetail('ADMIN', secours)
      expect(await screen.findByText('Léa Petit')).toBeInTheDocument()
      expect(calls.count).toBe(1)
    })

    it("n'appelle pas les inscriptions pour un stagiaire et n'affiche que le nombre", async () => {
      mockFormationDetail(secours)
      const calls = mockInscriptions(101)
      renderDetail('STAGIAIRE', secours)
      await screen.findByRole('heading', { level: 1, name: 'Premiers secours PSC1' })
      expect(await screen.findByText('2 inscrits')).toBeInTheDocument()
      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(calls.count).toBe(0)
      expect(screen.queryByText('lea@adac.test')).not.toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Stagiaires inscrits' })).not.toBeInTheDocument()
    })

    it('isole une erreur de la liste des inscrits', async () => {
      mockFormationDetail(secours)
      mockInscriptions(101, [], { errorStatus: 500 })
      renderDetail('SUPER_ADMIN', secours)
      const section = (await screen.findByRole('heading', { level: 2, name: 'Stagiaires inscrits' })).closest('section')
      expect(await within(section).findByRole('alert')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 1, name: 'Premiers secours PSC1' })).toBeInTheDocument()
      mockInscriptions(101)
      await userEvent.click(within(section).getByRole('button', { name: 'Réessayer' }))
      expect(await within(section).findByText('Léa Petit')).toBeInTheDocument()
    })
  })

  describe('archivage', () => {
    it("n'est proposé qu'à la chargée de formation", async () => {
      mockFormationDetail(secours)
      mockInscriptions(101)
      renderDetail('ADMIN', secours)
      await screen.findByRole('heading', { level: 1, name: 'Premiers secours PSC1' })
      expect(archiveButton()).not.toBeInTheDocument()
    })

    it("n'est pas proposé au stagiaire", async () => {
      mockFormationDetail(secours)
      renderDetail('STAGIAIRE', secours)
      await screen.findByRole('heading', { level: 1, name: 'Premiers secours PSC1' })
      expect(archiveButton()).not.toBeInTheDocument()
    })

    it('demande confirmation, archive puis revient à la liste avec une confirmation', async () => {
      mockFormationDetail(secours)
      mockInscriptions(101)
      mockFormationList()
      const calls = mockArchive(secours)
      renderDetail('SUPER_ADMIN', secours)
      await userEvent.click(await screen.findByRole('button', { name: 'Archiver' }))
      const dialog = screen.getByRole('dialog')
      expect(calls.count).toBe(0)
      await userEvent.click(within(dialog).getByRole('button', { name: 'Archiver' }))
      expect(await screen.findByRole('heading', { level: 1, name: 'Formations' })).toBeInTheDocument()
      expect(calls.count).toBe(1)
      expect(await screen.findByText('Formation archivée')).toBeInTheDocument()
    })

    it("n'appelle rien quand on annule et rend le focus au bouton", async () => {
      mockFormationDetail(secours)
      mockInscriptions(101)
      const calls = mockArchive(secours)
      renderDetail('SUPER_ADMIN', secours)
      const button = await screen.findByRole('button', { name: 'Archiver' })
      await userEvent.click(button)
      await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Annuler' }))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(calls.count).toBe(0)
      expect(button).toHaveFocus()
    })

    it('invite à recharger sur un 409 et reste sur le détail', async () => {
      const detail = mockFormationDetail(secours)
      mockInscriptions(101)
      mockArchive(secours, { errorStatus: 409 })
      renderDetail('SUPER_ADMIN', secours)
      await userEvent.click(await screen.findByRole('button', { name: 'Archiver' }))
      await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Archiver' }))
      expect(await screen.findByText(/modifiée entre-temps/)).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 1, name: 'Premiers secours PSC1' })).toBeInTheDocument()
      await userEvent.click(screen.getByRole('button', { name: 'Recharger' }))
      await waitFor(() => expect(detail.count).toBe(2))
      expect(screen.queryByText(/modifiée entre-temps/)).not.toBeInTheDocument()
    })
  })

  describe('modification', () => {
    it("propose « Modifier » à la chargée de formation sur une formation active", async () => {
      mockFormationDetail(secours)
      mockInscriptions(101)
      renderDetail('SUPER_ADMIN', secours)
      expect(await screen.findByRole('link', { name: 'Modifier' })).toHaveAttribute(
        'href',
        '/formations/101/modifier',
      )
    })

    it.each(['ADMIN', 'STAGIAIRE'])("ne propose pas « Modifier » à %s", async (role) => {
      mockFormationDetail(secours)
      mockInscriptions(101)
      renderDetail(role, secours)
      await screen.findByRole('heading', { level: 1, name: 'Premiers secours PSC1' })
      if (role === 'ADMIN') await screen.findByText('Léa Petit')
      expect(screen.queryByRole('link', { name: 'Modifier' })).not.toBeInTheDocument()
    })

    it("ne propose pas « Modifier » sur une formation archivée", async () => {
      mockFormationDetail(postures)
      mockInscriptions(103, [])
      renderDetail('SUPER_ADMIN', postures)
      await screen.findByRole('heading', { level: 1, name: 'Gestes et postures' })
      await screen.findByText('Aucun stagiaire inscrit')
      expect(screen.queryByRole('link', { name: 'Modifier' })).not.toBeInTheDocument()
    })
  })

  describe('bandeaux de confirmation', () => {
    it.each([
      ['formation-created', 'Formation créée'],
      ['formation-updated', 'Formation mise à jour'],
    ])('annonce « %s » reçu par navigation', async (notice, text) => {
      mockFormationDetail(secours)
      mockInscriptions(101)
      renderDetail('SUPER_ADMIN', secours, { notice })
      expect(await screen.findByText(text)).toHaveAttribute('role', 'status')
    })

    it("n'affiche aucun bandeau sans navigation", async () => {
      mockFormationDetail(secours)
      mockInscriptions(101)
      renderDetail('SUPER_ADMIN', secours)
      await screen.findByRole('heading', { level: 1, name: 'Premiers secours PSC1' })
      expect(screen.queryByText('Formation créée')).not.toBeInTheDocument()
      expect(screen.queryByText('Formation mise à jour')).not.toBeInTheDocument()
    })
  })

  it('ne présente aucune violation d’accessibilité', async () => {
    mockFormationDetail(secours)
    mockInscriptions(101)
    const { container } = renderDetail('SUPER_ADMIN', secours)
    await screen.findByText('Léa Petit')
    expect(await axe(container)).toHaveNoViolations()
  })
})
