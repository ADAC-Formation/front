import { screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../../../test/render'
import { mockSession } from '../../../test/session'
import ManagementMenu from './ManagementMenu'

const renderMenu = (role) => {
  mockSession(role)
  return renderWithProviders(<ManagementMenu />, { withSession: true, route: '/admin/gestion' })
}

// Les actions sont dans le DOM (donc au clavier et pour les lecteurs d'écran) ; leur affichage dépend du CSS (D61).
describe('ManagementMenu', () => {
  it('la chargée de formation a les actions créer et consulter sur chaque tuile', async () => {
    renderMenu('SUPER_ADMIN')
    expect(await screen.findAllByRole('link', { name: 'Créer un nouveau profil' })).toHaveLength(2)
    expect(screen.getByRole('link', { name: 'Créer une nouvelle formation' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /^Consulter/ })).toHaveLength(3)
  })

  it('le formateur ne peut que consulter : ni comptes (D54) ni formation à créer (D46)', async () => {
    renderMenu('ADMIN')
    expect(await screen.findAllByRole('link', { name: /^Consulter/ })).toHaveLength(3)
    expect(screen.queryByRole('link', { name: 'Créer un nouveau profil' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Créer une nouvelle formation' })).not.toBeInTheDocument()
  })

  it('n’a aucune violation d’accessibilité (jest-axe)', async () => {
    const { container } = renderMenu('SUPER_ADMIN')
    await screen.findByRole('link', { name: 'Créer une nouvelle formation' })
    expect(await axe(container)).toHaveNoViolations()
  })
})
