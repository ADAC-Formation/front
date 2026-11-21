import { screen, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import ManagementMenu from './ManagementMenu'
import { renderWithProviders } from '../../../test/render'
import { mockSession } from '../../../test/session'

function renderMenu(role) {
  mockSession(role)
  return renderWithProviders(<ManagementMenu />, { route: '/admin/gestion', withSession: true })
}

const tile = (name) => screen.getByRole('heading', { level: 2, name }).closest('article')

describe('ManagementMenu', () => {
  it.each(['SUPER_ADMIN', 'ADMIN'])('%s peut revenir au tableau de bord', async (role) => {
    renderMenu(role)
    expect(await screen.findByRole('link', { name: 'Retour' })).toHaveAttribute('href', '/')
  })

  it('la chargée de formation voit trois tuiles : Formations, Documents et Profils', async () => {
    renderMenu('SUPER_ADMIN')
    expect(await screen.findByRole('heading', { level: 1, name: 'Gestion' })).toBeInTheDocument()
    await screen.findByRole('heading', { level: 2, name: 'Documents' })
    const titles = screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)
    expect(titles).toEqual(['Formations', 'Documents', 'Profils'])
    expect(screen.getAllByRole('article')).toHaveLength(3)
  })

  describe('actions des tuiles selon le rôle', () => {
    it('la chargée de formation peut créer une formation et un type de document', async () => {
      renderMenu('SUPER_ADMIN')
      expect(await screen.findByRole('link', { name: 'Créer une nouvelle formation' })).toHaveAttribute(
        'href',
        '/formations/creer',
      )
      const documents = within(tile('Documents'))
      expect(documents.getByRole('link', { name: 'Créer un type de document' })).toHaveAttribute(
        'href',
        '/admin/documents/nouveau',
      )
      expect(documents.getByRole('link', { name: 'Consulter les types existants' })).toHaveAttribute(
        'href',
        '/admin/documents',
      )
    })

    it('le formateur voit deux tuiles, sans action de création (elle mène à « Accès refusé »)', async () => {
      renderMenu('ADMIN')
      expect(await screen.findByRole('link', { name: 'Consulter formations existantes' })).toHaveAttribute(
        'href',
        '/admin/formations',
      )
      const titles = screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)
      expect(titles).toEqual(['Formations', 'Profils'])
      expect(await screen.findAllByRole('link', { name: 'Consulter profils existants' })).toHaveLength(2)
      expect(screen.queryByRole('link', { name: /^Créer/ })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: /type de document|types existants/i })).not.toBeInTheDocument()
    })
  })

  describe('tuile Profils', () => {
    it('regroupe les sections Formateurs et Stagiaires avec leurs liens', async () => {
      renderMenu('SUPER_ADMIN')
      await screen.findByRole('heading', { level: 2, name: 'Documents' })
      const profiles = within(tile('Profils'))

      const formateurs = within(profiles.getByRole('group', { name: 'Formateurs' }))
      expect(formateurs.getByRole('link', { name: 'Créer un nouveau profil' })).toHaveAttribute(
        'href',
        '/admin/formateurs/nouveau',
      )
      expect(formateurs.getByRole('link', { name: 'Consulter profils existants' })).toHaveAttribute(
        'href',
        '/admin/formateurs',
      )

      const stagiaires = within(profiles.getByRole('group', { name: 'Stagiaires' }))
      expect(stagiaires.getByRole('link', { name: 'Créer un nouveau profil' })).toHaveAttribute(
        'href',
        '/admin/stagiaires/nouveau',
      )
      expect(stagiaires.getByRole('link', { name: 'Consulter profils existants' })).toHaveAttribute(
        'href',
        '/admin/stagiaires',
      )
    })

    it('le formateur consulte les deux listes sans créer', async () => {
      renderMenu('ADMIN')
      await screen.findByRole('heading', { level: 2, name: 'Profils' })
      const profiles = within(tile('Profils'))
      expect(profiles.getByRole('group', { name: 'Formateurs' })).toBeInTheDocument()
      expect(profiles.getByRole('group', { name: 'Stagiaires' })).toBeInTheDocument()
      expect(profiles.queryByRole('link', { name: 'Créer un nouveau profil' })).not.toBeInTheDocument()
    })
  })

  describe('gestion des catégories (action de la tuile Formations)', () => {
    it('la chargée de formation gère les catégories depuis la tuile Formations', async () => {
      renderMenu('SUPER_ADMIN')
      const link = await screen.findByRole('link', { name: 'Gérer les catégories' })
      expect(link).toHaveAttribute('href', '/formations/categories')
      expect(link.closest('article')).toHaveTextContent('Formations')
    })

    it("n'ajoute pas de tuile « Catégories » : les catégories ne concernent que les formations", async () => {
      renderMenu('SUPER_ADMIN')
      await screen.findByRole('link', { name: 'Gérer les catégories' })
      expect(screen.queryByRole('heading', { level: 2, name: 'Catégories' })).not.toBeInTheDocument()
    })

    it("le formateur n'a pas l'action", async () => {
      renderMenu('ADMIN')
      await screen.findByRole('link', { name: 'Consulter formations existantes' })
      expect(screen.queryByRole('link', { name: 'Gérer les catégories' })).not.toBeInTheDocument()
    })
  })

  describe('import de comptes par Excel (NOTES-09)', () => {
    it('la chargée de formation importe depuis la tuile Profils', async () => {
      renderMenu('SUPER_ADMIN')
      const link = await screen.findByRole('link', { name: 'Importer depuis Excel' })
      expect(link).toHaveAttribute('href', '/admin/comptes/importer')
      expect(link.closest('article')).toHaveTextContent('Profils')
    })

    it("le formateur n'a pas l'action", async () => {
      renderMenu('ADMIN')
      await screen.findByRole('link', { name: 'Consulter formations existantes' })
      expect(screen.queryByRole('link', { name: 'Importer depuis Excel' })).not.toBeInTheDocument()
    })
  })

  it("n'a aucune violation d'accessibilité (jest-axe)", async () => {
    const { container } = renderMenu('SUPER_ADMIN')
    await screen.findByRole('link', { name: 'Retour' })
    expect(await axe(container)).toHaveNoViolations()
  })
})
