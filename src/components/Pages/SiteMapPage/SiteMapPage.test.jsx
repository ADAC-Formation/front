import { screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import SiteMapPage from './SiteMapPage'
import { renderWithProviders } from '../../../test/render'
import { mockSession } from '../../../test/session'

function renderMap(role) {
  mockSession(role)
  return renderWithProviders(<SiteMapPage />, { route: '/plan-du-site', withSession: true })
}

describe('SiteMapPage', () => {
  it('liste les pages du stagiaire, sans la gestion', async () => {
    renderMap('STAGIAIRE')
    expect(await screen.findByRole('heading', { level: 1, name: 'Plan de site' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Formations' })).toHaveAttribute('href', '/formations')
    expect(screen.getByRole('link', { name: 'Messages' })).toHaveAttribute('href', '/messages')
    expect(screen.queryByRole('link', { name: 'Gestion' })).not.toBeInTheDocument()
  })

  it('ajoute la gestion pour la chargée de formation et le formateur', async () => {
    renderMap('SUPER_ADMIN')
    expect(await screen.findByRole('link', { name: 'Gestion' })).toHaveAttribute('href', '/admin/gestion')
    expect(screen.getByRole('link', { name: 'Formateurs' })).toHaveAttribute('href', '/admin/formateurs')
    expect(screen.getByRole('link', { name: 'Stagiaires' })).toHaveAttribute('href', '/admin/stagiaires')
  })

  it('n’a aucune violation d’accessibilité (jest-axe)', async () => {
    const { container } = renderMap('ADMIN')
    await screen.findByRole('heading', { level: 1 })
    expect(await axe(container)).toHaveNoViolations()
  })
})
