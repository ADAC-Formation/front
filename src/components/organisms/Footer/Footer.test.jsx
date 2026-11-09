import { screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { SiteFooter } from './Footer'
import { renderWithProviders } from '../../../test/render'

describe('SiteFooter', () => {
  it('est un pied de page avec un lien vers les mentions légales et la confidentialité', () => {
    renderWithProviders(<SiteFooter />)
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Mentions légales et confidentialité' })).toHaveAttribute(
      'href',
      '/mentions-legales',
    )
  })

  it('n’a aucune violation d’accessibilité (jest-axe)', async () => {
    const { container } = renderWithProviders(<SiteFooter />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
