import { useState } from 'react'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import Tabs from './Tabs'
import { renderWithProviders } from '../../../test/render'

const Counter = () => {
  const [count, setCount] = useState(0)
  return (
    <button type="button" onClick={() => setCount(count + 1)}>
      {`Compteur ${count}`}
    </button>
  )
}

const tabs = [
  { id: 'liste', label: 'Liste stagiaires', panel: <Counter /> },
  { id: 'docs', label: 'Documents stagiaires', panel: <p>Contenu documents</p> },
  { id: 'adac', label: 'Documents ADAC', panel: <p>Contenu ADAC</p> },
]

const renderTabs = (props = {}) => renderWithProviders(<Tabs label="Sections de la formation" tabs={tabs} {...props} />)

describe('Tabs', () => {
  it('rend une liste d’onglets nommée, le premier sélectionné par défaut', () => {
    renderTabs()
    expect(screen.getByRole('tablist', { name: 'Sections de la formation' })).toBeInTheDocument()
    expect(screen.getAllByRole('tab')).toHaveLength(3)
    expect(screen.getByRole('tab', { name: 'Liste stagiaires' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Documents ADAC' })).toHaveAttribute('aria-selected', 'false')
  })

  it('nomme le panneau visible par son onglet et masque les autres', () => {
    renderTabs()
    const panel = screen.getByRole('tabpanel', { name: 'Liste stagiaires' })
    expect(panel).toBeVisible()
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1)
    expect(screen.getByText('Contenu ADAC', { selector: 'p' }).closest('[role="tabpanel"]')).not.toBeVisible()
  })

  it('ouvre l’onglet demandé par défaut', () => {
    renderTabs({ defaultTabId: 'adac' })
    expect(screen.getByRole('tab', { name: 'Documents ADAC' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel', { name: 'Documents ADAC' })).toHaveTextContent('Contenu ADAC')
  })

  it('change de panneau au clic', async () => {
    const user = userEvent.setup()
    renderTabs()
    await user.click(screen.getByRole('tab', { name: 'Documents ADAC' }))
    expect(screen.getByRole('tab', { name: 'Documents ADAC' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel', { name: 'Documents ADAC' })).toHaveTextContent('Contenu ADAC')
    expect(screen.queryByRole('button', { name: /Compteur/ })).not.toBeInTheDocument()
  })

  it('garde l’état d’un panneau après un aller-retour', async () => {
    const user = userEvent.setup()
    renderTabs()
    await user.click(screen.getByRole('button', { name: 'Compteur 0' }))
    await user.click(screen.getByRole('tab', { name: 'Documents ADAC' }))
    await user.click(screen.getByRole('tab', { name: 'Liste stagiaires' }))
    expect(screen.getByRole('button', { name: 'Compteur 1' })).toBeInTheDocument()
  })

  it('un seul onglet est atteignable par Tab', () => {
    renderTabs()
    const [first, second, third] = screen.getAllByRole('tab')
    expect(first).toHaveAttribute('tabindex', '0')
    expect(second).toHaveAttribute('tabindex', '-1')
    expect(third).toHaveAttribute('tabindex', '-1')
  })

  it('←/→ passent d’un onglet à l’autre en boucle, Début/Fin vont au premier et au dernier', async () => {
    const user = userEvent.setup()
    renderTabs()
    screen.getByRole('tab', { name: 'Liste stagiaires' }).focus()

    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Documents stagiaires' })).toHaveFocus()
    expect(screen.getByRole('tab', { name: 'Documents stagiaires' })).toHaveAttribute('aria-selected', 'true')

    await user.keyboard('{End}')
    expect(screen.getByRole('tab', { name: 'Documents ADAC' })).toHaveFocus()

    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Liste stagiaires' })).toHaveFocus()

    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('tab', { name: 'Documents ADAC' })).toHaveFocus()

    await user.keyboard('{Home}')
    expect(screen.getByRole('tab', { name: 'Liste stagiaires' })).toHaveFocus()
    expect(screen.getByRole('tabpanel', { name: 'Liste stagiaires' })).toBeVisible()
  })

  it("n'a pas de violation d'accessibilité", async () => {
    const { container } = renderTabs()
    expect(await axe(container)).toHaveNoViolations()
  })
})
