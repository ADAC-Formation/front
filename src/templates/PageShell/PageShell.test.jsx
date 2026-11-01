import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { PageShell } from './PageShell'

describe('PageShell', () => {
  it('rend un <div> : le seul <main> de la page est celui du Layout', () => {
    render(
      <PageShell>
        <h1>Titre</h1>
      </PageShell>,
    )
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Titre' }).parentElement.tagName).toBe('DIV')
  })

  it('accepte la variante center et une classe supplémentaire', () => {
    render(
      <PageShell center className="extra">
        <p>Contenu</p>
      </PageShell>,
    )
    const shell = screen.getByText('Contenu').parentElement
    expect(shell).toHaveClass('extra')
    expect(shell.className).toMatch(/center/)
  })

  it('n’a aucune violation d’accessibilité (jest-axe)', async () => {
    const { container } = render(
      <main>
        <PageShell>
          <h1>Titre</h1>
        </PageShell>
      </main>,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
