import { screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import AccessDeniedPage from './AccessDeniedPage'
import { renderWithProviders } from '../../../test/render'

describe('AccessDeniedPage', () => {
  it('affiche le titre et un lien de retour', () => {
    renderWithProviders(<AccessDeniedPage />)
    expect(screen.getByRole('heading', { level: 1, name: 'Accès refusé' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /accueil/i })).toHaveAttribute('href', '/')
  })

  it('se place dans le gabarit de page, sous le logo comme les autres contenus', () => {
    renderWithProviders(<AccessDeniedPage />)
    const shell = screen.getByRole('heading', { name: 'Accès refusé' }).closest('[class*="shell"]')
    expect(shell, 'PageShell autour du contenu').not.toBeNull()
  })

  it("n'a aucune violation d'accessibilité (jest-axe)", async () => {
    const { container } = renderWithProviders(
      <main>
        <AccessDeniedPage />
      </main>,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
