import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { Route, Routes } from 'react-router'
import FormationDetailPage from './FormationDetailPage'
import FormationListPage from './FormationListPage'
import { renderWithProviders } from '../../../test/render'
import { mockCategories } from '../../../test/categories'
import { DOCUMENTS, mockDocumentApi } from '../../../test/documents'
import { mockFormationDocumentTypes } from '../../../test/documentTypes'
import { USERS, mockSession } from '../../../test/session'
import {
  FORMATIONS,
  mockArchive,
  mockFormationDetail,
  mockFormationList,
  INSCRITS,
  mockEnroll,
  mockInscriptions,
  mockUnenroll,
} from '../../../test/formations'
import { mockAccountList } from '../../../test/accounts'

const [secours, excel, postures] = FORMATIONS

function renderDetail(role, formation, { notice, documents, types = [] } = {}) {
  mockSession(role)
  mockCategories() // la liste des formations, où l'on revient, charge les catégories du filtre
  mockDocumentApi(documents, { uploader: USERS.STAGIAIRE }) // l'onglet « Documents ADAC » du détail
  mockFormationDocumentTypes(types) // types à envoyer : aucun par défaut
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

// Onglets du détail (G34) : les panneaux inactifs restent montés mais `hidden`, donc on cherche toujours
// dans le panneau visible (`getByRole` ignore les panneaux masqués).
const openTab = async (name) => {
  await userEvent.click(await screen.findByRole('tab', { name }))
  return screen.getByRole('tabpanel', { name })
}
const visiblePanel = (name) => screen.findByRole('tabpanel', { name })
const tabNames = () => screen.getAllByRole('tab').map((tab) => tab.textContent)

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
    expect(await within(await visiblePanel('Liste stagiaires')).findByText('Aucun stagiaire inscrit')).toBeInTheDocument()
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
    it.each(['SUPER_ADMIN', 'ADMIN', 'STAGIAIRE'])('%s voit les documents de la formation dans « Documents ADAC »', async (role) => {
      mockFormationDetail(secours)
      mockInscriptions(101)
      renderDetail(role, secours)
      const panel = await openTab('Documents ADAC')
      expect(await within(panel).findByText('Support de cours.pdf')).toBeInTheDocument()
      expect(screen.queryByText(/arriveront bientôt/)).not.toBeInTheDocument()
    })

    it('propose le dépôt à la chargée de formation seulement, ici', async () => {
      mockFormationDetail(secours)
      mockInscriptions(101)
      renderDetail('SUPER_ADMIN', secours)
      const panel = await openTab('Documents ADAC')
      expect(await within(panel).findByRole('group', { name: 'Zone de dépôt de documents' })).toBeInTheDocument()
    })

    describe('« Mes documents » du stagiaire (G16)', () => {
      const mineOnPage = { ...secours, inscriptionId: 7 }
      const myDocument = {
        id: 601,
        fileName: 'Justificatif.pdf',
        fileUrl: 'https://supabase.test/storage/601',
        fileSize: 2048,
        mimeType: 'application/pdf',
        uploadedBy: USERS.STAGIAIRE,
        formationId: null,
        inscriptionId: 7,
        createdAt: '2026-03-01T10:00:00',
      }

      it('ouvre « Documents ADAC » et propose « Mes documents » avec la zone de dépôt et ses propres dépôts', async () => {
        mockFormationDetail(mineOnPage)
        renderDetail('STAGIAIRE', mineOnPage, { documents: [...DOCUMENTS, myDocument] })
        const adac = await visiblePanel('Documents ADAC')
        expect(await within(adac).findByText('Support de cours.pdf')).toBeInTheDocument()
        const mine = await openTab('Mes documents')
        expect(await within(mine).findByText('Justificatif.pdf')).toBeInTheDocument()
        expect(within(mine).getByRole('group', { name: 'Zone de dépôt de documents' })).toBeInTheDocument()
        expect(within(mine).getByRole('button', { name: 'Supprimer Justificatif.pdf' })).toBeInTheDocument()
        expect(within(mine).queryByText('Support de cours.pdf')).not.toBeInTheDocument()
      })

      it('garde les documents de la formation en lecture seule pour le stagiaire', async () => {
        mockFormationDetail(mineOnPage)
        renderDetail('STAGIAIRE', mineOnPage, { documents: [...DOCUMENTS, myDocument] })
        const adac = await visiblePanel('Documents ADAC')
        await within(adac).findByText('Support de cours.pdf')
        expect(within(adac).queryByRole('button', { name: 'Supprimer Support de cours.pdf' })).not.toBeInTheDocument()
        expect(within(adac).queryByRole('group', { name: 'Zone de dépôt de documents' })).not.toBeInTheDocument()
      })

      it('reste sur « Mes documents » après un dépôt', async () => {
        mockFormationDetail(mineOnPage)
        renderDetail('STAGIAIRE', mineOnPage, { documents: [...DOCUMENTS, myDocument] })
        const mine = await openTab('Mes documents')
        await within(mine).findByText('Justificatif.pdf')
        const pdf = new File(['%PDF'], 'Attestation.pdf', { type: 'application/pdf' })
        await userEvent.upload(mine.querySelector('input[type="file"]'), pdf)
        expect(await within(mine).findByText('Attestation.pdf')).toBeInTheDocument()
        expect(screen.getByRole('tab', { name: 'Mes documents' })).toHaveAttribute('aria-selected', 'true')
      })

      it('sur une formation archivée : ses dépôts sans zone de dépôt ni suppression', async () => {
        const archivedMine = { ...postures, inscriptionId: 9 }
        mockFormationDetail(archivedMine)
        renderDetail('STAGIAIRE', archivedMine, {
          documents: [{ ...myDocument, id: 602, fileName: 'Ancien.pdf', inscriptionId: 9 }],
        })
        const mine = await openTab('Mes documents')
        expect(await within(mine).findByText('Ancien.pdf')).toBeInTheDocument()
        expect(within(mine).queryByRole('group', { name: 'Zone de dépôt de documents' })).not.toBeInTheDocument()
        expect(within(mine).queryByRole('button', { name: /Supprimer/ })).not.toBeInTheDocument()
      })

      it.each(['SUPER_ADMIN', 'ADMIN'])('%s ne voit pas « Mes documents »', async (role) => {
        mockFormationDetail(secours)
        mockInscriptions(101)
        renderDetail(role, secours)
        await screen.findByRole('tablist')
        expect(screen.queryByRole('tab', { name: 'Mes documents' })).not.toBeInTheDocument()
      })
    })

    it('n’a aucune violation d’accessibilité avec les documents (jest-axe)', async () => {
      mockFormationDetail(secours)
      mockInscriptions(101)
      const { container } = renderDetail('SUPER_ADMIN', secours)
      const panel = await openTab('Documents ADAC')
      await within(panel).findByText('Support de cours.pdf')
      await within(panel).findByRole('group', { name: 'Zone de dépôt de documents' })
      expect(await axe(container)).toHaveNoViolations()
    })
  })

  describe('inscrits', () => {
    it('liste les stagiaires pour la chargée de formation', async () => {
      mockFormationDetail(secours)
      mockInscriptions(101)
      renderDetail('SUPER_ADMIN', secours)
      const section = await visiblePanel('Liste stagiaires')
      expect(await within(section).findByText('Léa Petit')).toBeInTheDocument()
      expect(within(section).getByText('lea@adac.test')).toBeInTheDocument()
      expect(within(section).getByText('Omar Benali')).toBeInTheDocument()
    })

    it('liste les stagiaires pour le formateur', async () => {
      mockFormationDetail(secours)
      const calls = mockInscriptions(101)
      renderDetail('ADMIN', secours)
      expect(await within(await visiblePanel('Liste stagiaires')).findByText('Léa Petit')).toBeInTheDocument()
      expect(calls.count).toBe(1)
    })

    it("n'appelle pas les inscriptions pour un stagiaire et n'affiche pas même le nombre (NOTES-03)", async () => {
      mockFormationDetail(secours)
      const calls = mockInscriptions(101)
      renderDetail('STAGIAIRE', secours)
      await screen.findByRole('heading', { level: 1, name: 'Premiers secours PSC1' })
      expect(screen.queryByText('2 inscrits')).not.toBeInTheDocument()
      expect(screen.queryByText('Inscrits')).not.toBeInTheDocument()
      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(calls.count).toBe(0)
      expect(screen.queryByText('lea@adac.test')).not.toBeInTheDocument()
      expect(screen.queryByRole('tab', { name: 'Liste stagiaires' })).not.toBeInTheDocument()
    })

    describe('documents reçus par inscrit (G34)', () => {
      const lea = INSCRITS[0].stagiaire
      const TYPES = [
        { id: 1, nom: 'Pièce d’identité' },
        { id: 2, nom: 'Diplôme' },
      ]
      const sentByLea = {
        id: 701,
        fileName: 'Pièce d’identité - recto.pdf',
        fileSize: 2048,
        mimeType: 'application/pdf',
        uploadedBy: { id: lea.id, prenom: lea.prenom, nom: lea.nom },
        formationId: null,
        inscriptionId: 1,
        createdAt: '2026-03-01T10:00:00',
      }

      it.each(['SUPER_ADMIN', 'ADMIN'])('%s voit « X/Y documents reçus » sur la ligne de chaque inscrit', async (role) => {
        mockFormationDetail(secours)
        mockInscriptions(101)
        renderDetail(role, secours, { documents: [...DOCUMENTS, sentByLea], types: TYPES })
        const section = await visiblePanel('Liste stagiaires')
        const leaRow = (await within(section).findByText('Léa Petit')).closest('li')
        expect(await within(leaRow).findByText('1/2 documents reçus')).toBeInTheDocument()
        expect(within(leaRow).queryByRole('button', { name: /Télécharger/ })).not.toBeInTheDocument()
        const omarRow = within(section).getByText('Omar Benali').closest('li')
        expect(await within(omarRow).findByText('0/2 documents reçus')).toBeInTheDocument()
      })

      it.each(['SUPER_ADMIN', 'ADMIN'])('%s voit le détail par type dans « Documents stagiaires »', async (role) => {
        mockFormationDetail(secours)
        mockInscriptions(101)
        renderDetail(role, secours, { documents: [...DOCUMENTS, sentByLea], types: TYPES })
        const panel = await openTab('Documents stagiaires')
        const leaBlock = await within(panel).findByRole('region', { name: 'Léa Petit' })
        await userEvent.click(within(leaBlock).getByText('Léa Petit')) // bloc replié à l'arrivée
        const identite = await within(leaBlock).findByRole('listitem', { name: 'Pièce d’identité' })
        expect(within(identite).getByText('Reçu')).toBeInTheDocument()
        expect(within(identite).getByRole('button', { name: 'Télécharger Pièce d’identité - recto.pdf' })).toBeInTheDocument()
        expect(within(within(leaBlock).getByRole('listitem', { name: 'Diplôme' })).getByText('Manquant')).toBeInTheDocument()
      })

      it('n’a aucune violation d’accessibilité (jest-axe)', async () => {
        mockFormationDetail(secours)
        mockInscriptions(101)
        const { container } = renderDetail('SUPER_ADMIN', secours, { documents: [...DOCUMENTS, sentByLea], types: TYPES })
        const panel = await openTab('Documents stagiaires')
        await within(await within(panel).findByRole('region', { name: 'Léa Petit' })).findByText('1/2 documents reçus')
        expect(await axe(container)).toHaveNoViolations()
      })
    })

    it('isole une erreur de la liste des inscrits', async () => {
      mockFormationDetail(secours)
      mockInscriptions(101, [], { errorStatus: 500 })
      renderDetail('SUPER_ADMIN', secours)
      const section = await visiblePanel('Liste stagiaires')
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
      if (role === 'ADMIN') await within(await visiblePanel('Liste stagiaires')).findByText('Léa Petit')
      expect(screen.queryByRole('link', { name: 'Modifier' })).not.toBeInTheDocument()
    })

    it("ne propose pas « Modifier » sur une formation archivée", async () => {
      mockFormationDetail(postures)
      mockInscriptions(103, [])
      renderDetail('SUPER_ADMIN', postures)
      await screen.findByRole('heading', { level: 1, name: 'Gestes et postures' })
      await within(await visiblePanel('Liste stagiaires')).findByText('Aucun stagiaire inscrit')
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
    await within(await visiblePanel('Liste stagiaires')).findByText('Léa Petit')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('ne présente aucune violation d’accessibilité pour le stagiaire', async () => {
    const mine = { ...secours, inscriptionId: 7 }
    mockFormationDetail(mine)
    const { container } = renderDetail('STAGIAIRE', mine)
    await within(await visiblePanel('Documents ADAC')).findByText('Support de cours.pdf')
    expect(await axe(container)).toHaveNoViolations()
  })

  describe('onglets (G34)', () => {
    it.each(['SUPER_ADMIN', 'ADMIN'])('%s : trois onglets, « Liste stagiaires » ouvert par défaut', async (role) => {
      mockFormationDetail(secours)
      mockInscriptions(101)
      renderDetail(role, secours)
      await screen.findByRole('tablist', { name: 'Sections de la formation' })
      expect(tabNames()).toEqual(['Liste stagiaires', 'Documents stagiaires', 'Documents ADAC'])
      expect(screen.getByRole('tab', { name: 'Liste stagiaires' })).toHaveAttribute('aria-selected', 'true')
    })

    it('stagiaire : deux onglets, « Documents ADAC » ouvert par défaut', async () => {
      const mine = { ...secours, inscriptionId: 7 }
      mockFormationDetail(mine)
      renderDetail('STAGIAIRE', mine)
      await screen.findByRole('tablist', { name: 'Sections de la formation' })
      expect(tabNames()).toEqual(['Documents ADAC', 'Mes documents'])
      expect(screen.getByRole('tab', { name: 'Documents ADAC' })).toHaveAttribute('aria-selected', 'true')
    })

    it('place les informations, « Modifier » et « Archiver » avant la barre d’onglets', async () => {
      mockFormationDetail(secours)
      mockInscriptions(101)
      renderDetail('SUPER_ADMIN', secours)
      const tablist = await screen.findByRole('tablist')
      const before = (node) => Boolean(node.compareDocumentPosition(tablist) & Node.DOCUMENT_POSITION_FOLLOWING)
      expect(before(screen.getByRole('heading', { level: 1, name: 'Premiers secours PSC1' }))).toBe(true)
      expect(before(screen.getByText('du 10 mars 2026 au 12 mars 2026'))).toBe(true)
      expect(before(screen.getByRole('link', { name: 'Modifier' }))).toBe(true)
      expect(before(screen.getByRole('button', { name: 'Archiver' }))).toBe(true)
    })

    it('passe d’un onglet à l’autre au clavier', async () => {
      mockFormationDetail(secours)
      mockInscriptions(101)
      renderDetail('SUPER_ADMIN', secours)
      const first = await screen.findByRole('tab', { name: 'Liste stagiaires' })
      first.focus()
      await userEvent.keyboard('{ArrowRight}')
      expect(screen.getByRole('tab', { name: 'Documents stagiaires' })).toHaveAttribute('aria-selected', 'true')
      await userEvent.keyboard('{End}')
      expect(screen.getByRole('tabpanel', { name: 'Documents ADAC' })).toBeVisible()
    })
  })
  describe('inscrire et désinscrire (J5, J8)', () => {
    const stagiaire = (id, prenom, nom, { isActive, activated }) => ({
      id, email: `${prenom.toLowerCase()}@adac.test`, prenom, nom, role: 'STAGIAIRE', isActive, activated, emailNotificationsEnabled: true,
    })
    // Léa (20) et Omar (21) sont déjà inscrits à 101 (INSCRITS).
    const CANDIDATS = [
      stagiaire(20, 'Léa', 'Petit', { isActive: true, activated: true }),
      stagiaire(21, 'Omar', 'Benali', { isActive: true, activated: true }),
      stagiaire(30, 'Zoé', 'Martin', { isActive: false, activated: false }), // jamais activée
      stagiaire(31, 'Yann', 'Leroy', { isActive: false, activated: true }), // suspendu
      stagiaire(32, 'Inès', 'Roy', { isActive: true, activated: true }),
    ]
    const lea = INSCRITS[0].stagiaire
    const sentByLea = {
      id: 701,
      fileName: 'Carte-identite.pdf',
      fileSize: 2048,
      mimeType: 'application/pdf',
      uploadedBy: { id: lea.id, prenom: lea.prenom, nom: lea.nom },
      formationId: null,
      inscriptionId: 1,
      createdAt: '2026-03-01T10:00:00',
    }
    const sentToLea = { ...sentByLea, id: 702, fileName: 'Convocation.pdf', uploadedBy: { id: 1, prenom: 'Chargée', nom: 'Dev' } }

    const inscritsSection = () => visiblePanel('Liste stagiaires')

    const openPicker = async (section) => {
      await userEvent.click(await within(section).findByRole('button', { name: 'Inscrire des stagiaires' }))
      return within(section).getByRole('group', { name: 'Stagiaires' })
    }

    it('propose les jamais activés, ni les suspendus ni les inscrits, inscrit puis récapitule par nom', async () => {
      mockFormationDetail(secours)
      mockInscriptions(101)
      mockAccountList('stagiaires', CANDIDATS)
      const enrolCalls = mockEnroll()
      renderDetail('SUPER_ADMIN', secours)
      const section = await inscritsSection()
      await within(section).findByText('Léa Petit')
      const picker = await openPicker(section)

      const zoe = await within(picker).findByRole('checkbox', { name: 'Zoé Martin' })
      const ines = within(picker).getByRole('checkbox', { name: 'Inès Roy' })
      expect(within(picker).queryByRole('checkbox', { name: 'Yann Leroy' })).not.toBeInTheDocument()
      expect(within(picker).queryByRole('checkbox', { name: 'Léa Petit' })).not.toBeInTheDocument()
      expect(within(picker).queryByRole('checkbox', { name: 'Omar Benali' })).not.toBeInTheDocument()
      expect(within(picker).queryByText(/@adac\.test/)).not.toBeInTheDocument()

      await userEvent.click(zoe)
      await userEvent.click(ines)
      await userEvent.click(within(section).getByRole('button', { name: 'Inscrire' }))

      expect(await within(section).findByText('Inscrits : Zoé Martin, Inès Roy.')).toBeInTheDocument()
      expect(enrolCalls.bodies).toEqual([
        { formationId: 101, stagiaireId: 30 },
        { formationId: 101, stagiaireId: 32 },
      ])
      expect(within(section).queryByRole('group', { name: 'Stagiaires' })).not.toBeInTheDocument()
      await within(section).findByText('Léa Petit')
    })

    it('liste les échecs par nom avec leur raison', async () => {
      mockFormationDetail(secours)
      mockInscriptions(101)
      mockAccountList('stagiaires', CANDIDATS)
      mockEnroll({ errors: { '101:32': { status: 404, message: 'Stagiaire introuvable' } } })
      renderDetail('SUPER_ADMIN', secours)
      const section = await inscritsSection()
      const picker = await openPicker(section)
      await userEvent.click(await within(picker).findByRole('checkbox', { name: 'Zoé Martin' }))
      await userEvent.click(within(picker).getByRole('checkbox', { name: 'Inès Roy' }))
      await userEvent.click(within(section).getByRole('button', { name: 'Inscrire' }))

      expect(await within(section).findByText('Inscrits : Zoé Martin.')).toBeInTheDocument()
      expect(within(section).getByText('Inscription impossible : Inès Roy (Stagiaire introuvable).')).toBeInTheDocument()
      await within(section).findByText('Léa Petit')
    })

    it('« Annuler » referme la liste sans appel', async () => {
      mockFormationDetail(secours)
      mockInscriptions(101)
      mockAccountList('stagiaires', CANDIDATS)
      const enrolCalls = mockEnroll()
      renderDetail('SUPER_ADMIN', secours)
      const section = await inscritsSection()
      const picker = await openPicker(section)
      await userEvent.click(await within(picker).findByRole('checkbox', { name: 'Zoé Martin' }))
      await userEvent.click(within(section).getByRole('button', { name: 'Annuler' }))
      expect(within(section).queryByRole('group', { name: 'Stagiaires' })).not.toBeInTheDocument()
      expect(enrolCalls.bodies).toEqual([])
    })

    it('« Désinscrire » annonce le nombre de documents, puis désinscrit', async () => {
      mockFormationDetail(secours)
      mockInscriptions(101)
      const unenrolCalls = mockUnenroll()
      renderDetail('SUPER_ADMIN', secours, { documents: [sentByLea, sentToLea] })
      const section = await inscritsSection()
      const leaRow = (await within(section).findByText('Léa Petit')).closest('li')
      await within(leaRow).findByText('1 document envoyé')
      await userEvent.click(within(leaRow).getByRole('button', { name: 'Désinscrire Léa Petit' }))

      const dialog = screen.getByRole('dialog', { name: 'Désinscrire Léa Petit de « Premiers secours PSC1 » ?' })
      expect(
        within(dialog).getByText('Ses 2 documents déposés sur cette formation seront supprimés définitivement.'),
      ).toBeInTheDocument()
      await userEvent.click(within(dialog).getByRole('button', { name: 'Désinscrire' }))

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
      expect(unenrolCalls.paths).toEqual([{ formationId: 101, stagiaireId: 20 }])
      await within(section).findByText('Léa Petit')
    })

    it('après une désinscription, reste sur « Liste stagiaires » et retire le stagiaire des deux onglets', async () => {
      mockFormationDetail(secours)
      mockInscriptions(101)
      mockUnenroll()
      renderDetail('SUPER_ADMIN', secours)
      const section = await inscritsSection()
      await userEvent.click(await within(section).findByRole('button', { name: 'Désinscrire Léa Petit' }))
      mockInscriptions(101, [INSCRITS[1]]) // le back ne renvoie plus Léa
      await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Désinscrire' }))
      await waitFor(() => expect(within(section).queryByText('Léa Petit')).not.toBeInTheDocument())
      expect(screen.getByRole('tab', { name: 'Liste stagiaires' })).toHaveAttribute('aria-selected', 'true')
      const documents = await openTab('Documents stagiaires')
      expect(await within(documents).findByRole('region', { name: 'Omar Benali' })).toBeInTheDocument()
      expect(within(documents).queryByRole('region', { name: 'Léa Petit' })).not.toBeInTheDocument()
    })

    it('ne propose « Inscrire des stagiaires » et « Désinscrire » que dans « Liste stagiaires »', async () => {
      mockFormationDetail(secours)
      mockInscriptions(101)
      renderDetail('SUPER_ADMIN', secours)
      await within(await inscritsSection()).findByRole('button', { name: 'Inscrire des stagiaires' })
      for (const name of ['Documents stagiaires', 'Documents ADAC']) {
        const panel = await openTab(name)
        expect(within(panel).queryByRole('button', { name: /Inscrire|Désinscrire/ })).not.toBeInTheDocument()
      }
    })

    it('affiche l’erreur de la désinscription dans la confirmation', async () => {
      mockFormationDetail(secours)
      mockInscriptions(101)
      mockUnenroll({ errorStatus: 409 })
      renderDetail('SUPER_ADMIN', secours)
      const section = await inscritsSection()
      await userEvent.click(await within(section).findByRole('button', { name: 'Désinscrire Omar Benali' }))
      const dialog = screen.getByRole('dialog')
      await userEvent.click(within(dialog).getByRole('button', { name: 'Désinscrire' }))
      expect(await within(dialog).findByRole('alert')).toHaveTextContent('Formation archivée, désinscription impossible')
    })

    it('aucune action sur une formation archivée', async () => {
      mockFormationDetail(postures)
      mockInscriptions(103)
      renderDetail('SUPER_ADMIN', postures)
      const section = await inscritsSection()
      await within(section).findByText('Léa Petit')
      expect(within(section).queryByRole('button', { name: /Inscrire|Désinscrire/ })).not.toBeInTheDocument()
    })

    it('aucune action pour le formateur', async () => {
      mockFormationDetail(secours)
      mockInscriptions(101)
      renderDetail('ADMIN', secours)
      const section = await inscritsSection()
      await within(section).findByText('Léa Petit')
      expect(within(section).queryByRole('button', { name: /Inscrire|Désinscrire/ })).not.toBeInTheDocument()
    })

    it('n’a aucune violation d’accessibilité, liste ouverte (jest-axe)', async () => {
      mockFormationDetail(secours)
      mockInscriptions(101)
      mockAccountList('stagiaires', CANDIDATS)
      const { container } = renderDetail('SUPER_ADMIN', secours)
      const section = await inscritsSection()
      const picker = await openPicker(section)
      await within(picker).findByRole('checkbox', { name: 'Zoé Martin' })
      expect(await axe(container)).toHaveNoViolations()
    })
  })
})
