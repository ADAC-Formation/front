import { screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import ManagementMenu from './ManagementMenu'
import { renderWithProviders } from '../../../test/render'
import { mockSession } from '../../../test/session'

function renderMenu(role) {
  mockSession(role)
  return renderWithProviders(<ManagementMenu />, { route: '/admin/gestion', withSession: true })
}

describe('ManagementMenu', () => {
  it.each(['SUPER_ADMIN', 'ADMIN'])('%s peut revenir au tableau de bord', async (role) => {
    renderMenu(role)
    expect(await screen.findByRole('link', { name: 'Retour' })).toHaveAttribute('href', '/')
  })

  it('affiche le titre et les trois tuiles de gestion', async () => {
    renderMenu('SUPER_ADMIN')
    expect(await screen.findByRole('heading', { level: 1, name: 'Gestion' })).toBeInTheDocument()
    for (const label of ['Formations', 'Formateurs', 'Stagiaires']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  describe('actions des tuiles selon le rôle', () => {
    it('la chargée de formation peut créer une formation, un formateur et un stagiaire', async () => {
      renderMenu('SUPER_ADMIN')
      expect(await screen.findByRole('link', { name: 'Créer une nouvelle formation' })).toHaveAttribute(
        'href',
        '/formations/creer',
      )
      expect(await screen.findAllByRole('link', { name: 'Créer un nouveau profil' })).toHaveLength(2)
    })

    it("le formateur ne voit aucune action de création (la création mène à « Accès refusé »)", async () => {
      renderMenu('ADMIN')
      expect(await screen.findByRole('link', { name: 'Consulter formations existantes' })).toHaveAttribute(
        'href',
        '/admin/formations',
      )
      expect(await screen.findAllByRole('link', { name: 'Consulter profils existants' })).toHaveLength(2)
      expect(screen.queryByRole('link', { name: 'Créer une nouvelle formation' })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'Créer un nouveau profil' })).not.toBeInTheDocument()
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
      expect(screen.queryByText('Catégories')).not.toBeInTheDocument()
      expect(screen.getAllByRole('article')).toHaveLength(3)
    })

    it("le formateur n'a pas l'action", async () => {
      renderMenu('ADMIN')
      await screen.findByRole('link', { name: 'Consulter formations existantes' })
      expect(screen.queryByRole('link', { name: 'Gérer les catégories' })).not.toBeInTheDocument()
    })
  })

  it("n'a aucune violation d'accessibilité (jest-axe)", async () => {
    const { container } = renderMenu('SUPER_ADMIN')
    await screen.findByRole('link', { name: 'Retour' })
    expect(await axe(container)).toHaveNoViolations()
  })
})
