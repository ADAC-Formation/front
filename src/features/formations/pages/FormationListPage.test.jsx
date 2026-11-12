import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { Route, Routes } from 'react-router'
import FormationListPage from './FormationListPage'
import { renderWithProviders } from '../../../test/render'
import { mockSession } from '../../../test/session'
import { mockCategories } from '../../../test/categories'
import { mockFormationList, mockFormationListError } from '../../../test/formations'

function renderList(role, { route = '/formations' } = {}) {
  mockSession(role)
  mockCategories()
  return renderWithProviders(
    <Routes>
      <Route path="/formations" element={<FormationListPage />} />
      <Route path="/admin/formations" element={<FormationListPage />} />
    </Routes>,
    { route, withSession: true },
  )
}

const card = (name) => screen.getByRole('link', { name: new RegExp(name) })

describe('FormationListPage', () => {
  it('affiche un état de chargement puis les cartes des formations actives', async () => {
    const calls = mockFormationList()
    renderList('SUPER_ADMIN')
    expect(screen.getByText('Chargement…')).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: /Premiers secours PSC1/ })).toBeInTheDocument()
    expect(calls.urls[0]).toContain('status=ACTIVE')
    expect(screen.getByRole('heading', { level: 1, name: 'Formations' })).toBeInTheDocument()

    const secours = card('Premiers secours PSC1')
    expect(secours).toHaveAttribute('href', '/formations/101')
    expect(secours).toHaveTextContent('du 10 mars 2026 au 12 mars 2026')
    expect(secours).toHaveTextContent('Secourisme')
    expect(secours).toHaveTextContent('Formateur Dev')
    expect(secours).toHaveTextContent('2 inscrits')
    expect(secours).toHaveTextContent('Présentiel')
    expect(card('Excel niveau 1')).toHaveTextContent('0 inscrit')
    expect(screen.queryByText('Gestes et postures')).not.toBeInTheDocument()
  })

  it('affiche un état vide quand le back ne renvoie rien', async () => {
    mockFormationList([])
    renderList('SUPER_ADMIN')
    expect(await screen.findByText('Aucune formation')).toBeInTheDocument()
  })

  it('affiche une erreur annoncée avec « Réessayer »', async () => {
    mockFormationListError(500)
    renderList('SUPER_ADMIN')
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    mockFormationList()
    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }))
    expect(await screen.findByRole('link', { name: /Premiers secours PSC1/ })).toBeInTheDocument()
  })

  it('charge les formations archivées avec leur badge et une catégorie désactivée lisible', async () => {
    const calls = mockFormationList()
    renderList('SUPER_ADMIN')
    await screen.findByRole('link', { name: /Premiers secours PSC1/ })
    await userEvent.click(screen.getByRole('radio', { name: 'Archivées' }))
    const archived = await screen.findByRole('link', { name: /Gestes et postures/ })
    expect(calls.urls.at(-1)).toContain('status=ARCHIVED')
    expect(archived).toHaveTextContent('Archivée')
    expect(archived).toHaveTextContent('Ancienne catégorie')
    expect(screen.queryByRole('link', { name: /Premiers secours PSC1/ })).not.toBeInTheDocument()
  })

  it('recherche sans nouvel appel au back', async () => {
    const calls = mockFormationList()
    renderList('SUPER_ADMIN')
    await screen.findByRole('link', { name: /Premiers secours PSC1/ })
    const before = calls.count
    await userEvent.type(screen.getByRole('searchbox', { name: 'Rechercher une formation' }), 'excel')
    expect(screen.queryByRole('link', { name: /Premiers secours PSC1/ })).not.toBeInTheDocument()
    expect(card('Excel niveau 1')).toBeInTheDocument()
    expect(calls.count).toBe(before)
  })

  it("affiche « Aucune formation trouvée » quand la recherche ne donne rien", async () => {
    mockFormationList()
    renderList('SUPER_ADMIN')
    await screen.findByRole('link', { name: /Premiers secours PSC1/ })
    await userEvent.type(screen.getByRole('searchbox', { name: 'Rechercher une formation' }), 'zzz')
    expect(await screen.findByText('Aucune formation trouvée')).toBeInTheDocument()
  })

  describe('filtre par catégorie', () => {
    it.each(['SUPER_ADMIN', 'ADMIN'])('est proposé au rôle %s, avec toutes les catégories', async (role) => {
      mockFormationList()
      renderList(role)
      const select = await screen.findByLabelText('Catégorie')
      expect(select).toHaveValue('')
      await screen.findByRole('option', { name: 'Ancienne catégorie' })
      expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(
        expect.arrayContaining(['Toutes les catégories', 'Secourisme', 'Numérique', 'Ancienne catégorie']),
      )
    })

    it('filtre sans nouvel appel aux formations et se combine avec la recherche', async () => {
      const calls = mockFormationList()
      renderList('SUPER_ADMIN')
      await screen.findByRole('link', { name: /Premiers secours PSC1/ })
      await screen.findByRole('option', { name: 'Numérique' })
      const before = calls.count
      await userEvent.selectOptions(screen.getByLabelText('Catégorie'), 'Numérique')
      expect(screen.queryByRole('link', { name: /Premiers secours PSC1/ })).not.toBeInTheDocument()
      expect(card('Excel niveau 1')).toBeInTheDocument()
      expect(calls.count).toBe(before)

      await userEvent.type(screen.getByRole('searchbox', { name: 'Rechercher une formation' }), 'zzz')
      expect(await screen.findByText('Aucune formation trouvée')).toBeInTheDocument()
    })

    it('revient à toutes les formations avec « Toutes les catégories »', async () => {
      mockFormationList()
      renderList('SUPER_ADMIN')
      await screen.findByRole('option', { name: 'Numérique' })
      await userEvent.selectOptions(screen.getByLabelText('Catégorie'), 'Numérique')
      await userEvent.selectOptions(screen.getByLabelText('Catégorie'), 'Toutes les catégories')
      expect(await screen.findByRole('link', { name: /Premiers secours PSC1/ })).toBeInTheDocument()
    })

    it("n'est pas proposé au stagiaire, qui n'appelle pas les catégories", async () => {
      mockFormationList()
      renderList('STAGIAIRE')
      await screen.findByRole('link', { name: /Premiers secours PSC1/ })
      expect(screen.queryByLabelText('Catégorie')).not.toBeInTheDocument()
    })
  })

  it('trie par intitulé', async () => {
    mockFormationList()
    renderList('SUPER_ADMIN')
    await screen.findByRole('link', { name: /Premiers secours PSC1/ })
    await userEvent.selectOptions(screen.getByLabelText('Organiser par :'), 'intitule')
    const titles = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(titles.indexOf('Excel niveau 1')).toBeLessThan(titles.indexOf('Premiers secours PSC1'))
  })

  describe('chargée de formation', () => {
    it('propose de créer une formation et de gérer les catégories', async () => {
      mockFormationList()
      renderList('SUPER_ADMIN')
      await screen.findByRole('link', { name: /Premiers secours PSC1/ })
      expect(await screen.findByRole('link', { name: 'Créer une nouvelle formation' })).toHaveAttribute('href', '/formations/creer')
      expect(screen.getByRole('link', { name: 'Gérer les catégories' })).toHaveAttribute('href', '/formations/categories')
      expect(screen.queryByRole('radio', { name: 'Mes formations' })).not.toBeInTheDocument()
    })

    it('ne propose pas l’import Excel : il se trouve dans « Créer une nouvelle formation »', async () => {
      mockFormationList()
      renderList('SUPER_ADMIN')
      await screen.findByRole('link', { name: 'Créer une nouvelle formation' })
      expect(screen.queryByRole('link', { name: 'Importer un fichier Excel' })).not.toBeInTheDocument()
    })

    it('revient au menu Gestion', async () => {
      mockFormationList()
      renderList('SUPER_ADMIN')
      await waitFor(() => expect(screen.getByRole('link', { name: 'Retour' })).toHaveAttribute('href', '/admin/gestion'))
    })
  })

  describe('formateur', () => {
    it('voit « Mes formations » par défaut puis « Toutes », sans action de gestion', async () => {
      mockFormationList()
      renderList('ADMIN')
      expect(await screen.findByRole('radio', { name: 'Mes formations' })).toBeChecked()
      await screen.findByRole('link', { name: /Premiers secours PSC1/ })
      expect(screen.queryByRole('link', { name: /Excel niveau 1/ })).not.toBeInTheDocument()

      await userEvent.click(screen.getByRole('radio', { name: 'Toutes' }))
      expect(await screen.findByRole('link', { name: /Excel niveau 1/ })).toBeInTheDocument()

      expect(screen.queryByRole('link', { name: 'Créer une nouvelle formation' })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'Gérer les catégories' })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'Importer un fichier Excel' })).not.toBeInTheDocument()
    })

    it('revient au menu Gestion', async () => {
      mockFormationList()
      renderList('ADMIN')
      await waitFor(() => expect(screen.getByRole('link', { name: 'Retour' })).toHaveAttribute('href', '/admin/gestion'))
    })
  })

  describe('stagiaire', () => {
    it('voit « Mes formations » sans filtre de formateur ni action de gestion', async () => {
      mockFormationList()
      renderList('STAGIAIRE')
      expect(await screen.findByRole('heading', { level: 1, name: 'Mes formations' })).toBeInTheDocument()
      await screen.findByRole('link', { name: /Premiers secours PSC1/ })
      expect(screen.queryByRole('radio', { name: 'Toutes' })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'Créer une nouvelle formation' })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'Gérer les catégories' })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'Importer un fichier Excel' })).not.toBeInTheDocument()
      expect(screen.getByRole('radio', { name: 'Actives' })).toBeChecked()
    })

    it("ne montre pas le nombre d'inscrits (NOTES-03) : la chargée et le formateur le gardent", async () => {
      mockFormationList()
      renderList('STAGIAIRE')
      await screen.findByRole('link', { name: /Premiers secours PSC1/ })
      expect(card('Premiers secours PSC1')).not.toHaveTextContent(/inscrit/)
      expect(screen.queryByText(/\d+ inscrits?/)).not.toBeInTheDocument()
    })

    it('ne parle plus de formations « disponibles » (NOTES-02) : ce sont ses formations', async () => {
      mockFormationList()
      renderList('STAGIAIRE')
      await screen.findByRole('link', { name: /Premiers secours PSC1/ })
      expect(screen.queryByText(/disponibles/)).not.toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 2, name: 'Mes formations' })).toBeInTheDocument()
      expect(screen.getByText('Retrouvez vos formations et toutes les informations nécessaires.')).toBeInTheDocument()
    })

    it('revient au tableau de bord', async () => {
      mockFormationList()
      renderList('STAGIAIRE')
      await waitFor(() => expect(screen.getByRole('link', { name: 'Retour' })).toHaveAttribute('href', '/'))
    })
  })

  it('ne présente aucune violation d’accessibilité', async () => {
    mockFormationList()
    const { container } = renderList('SUPER_ADMIN')
    await screen.findByRole('link', { name: /Premiers secours PSC1/ })
    expect(await axe(container)).toHaveNoViolations()
  })

  it.each(['SUPER_ADMIN', 'ADMIN'])("%s garde le nombre d'inscrits (NOTES-03)", async (role) => {
    mockFormationList()
    renderList(role)
    await screen.findByRole('link', { name: /Premiers secours PSC1/ })
    expect(card('Premiers secours PSC1')).toHaveTextContent('2 inscrits')
  })
})

