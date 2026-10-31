import { screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import BackButton from './BackButton'
import { renderWithProviders } from '../../../test/render'

describe('BackButton', () => {
  it('est un lien « Retour » vers la destination donnée', () => {
    renderWithProviders(<BackButton to="/admin/gestion" />)
    expect(screen.getByRole('link', { name: 'Retour' })).toHaveAttribute('href', '/admin/gestion')
  })

  it("accepte un libellé précis", () => {
    renderWithProviders(<BackButton to="/admin/formateurs">Retour aux formateurs</BackButton>)
    expect(screen.getByRole('link', { name: 'Retour aux formateurs' })).toHaveAttribute(
      'href',
      '/admin/formateurs',
    )
  })

  it("n'a pas de violation d'accessibilité", async () => {
    const { container } = renderWithProviders(<BackButton to="/" />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
