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

  it("n'a aucune violation d'accessibilité (jest-axe)", async () => {
    const { container } = renderMenu('SUPER_ADMIN')
    await screen.findByRole('link', { name: 'Retour' })
    expect(await axe(container)).toHaveNoViolations()
  })
})
