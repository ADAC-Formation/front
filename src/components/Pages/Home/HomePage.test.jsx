import { axe } from 'jest-axe'
import { screen } from '@testing-library/react'
import HomePage from './HomePage'
import { renderWithProviders } from '../../../test/render'

describe('HomePage', () => {
  it('affiche la tuile « Formations » pour un stagiaire', () => {
    renderWithProviders(<HomePage role="STAGIAIRE" />)
    expect(screen.getByText('Formations')).toBeInTheDocument()
  })

  it('affiche la tuile « Gestion » pour un administrateur', () => {
    renderWithProviders(<HomePage role="SUPER_ADMIN" />)
    expect(screen.getByText('Gestion')).toBeInTheDocument()
  })

  it("n'a aucune violation d'accessibilité (jest-axe)", async () => {
    const { container } = renderWithProviders(<HomePage role="STAGIAIRE" />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
