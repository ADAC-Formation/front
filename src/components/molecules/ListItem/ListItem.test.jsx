import { screen } from '@testing-library/react'
import { CalendarDays } from 'lucide-react'
import { cssSheets, rulesOf, stripComments } from '../../../test/css-sheets'
import { renderWithProviders } from '../../../test/render'
import ListItem from './ListItem'

const details = [{ icon: CalendarDays, value: 'du 10 mars 2026 au 12 mars 2026' }]

describe('ListItem', () => {
  it('affiche le titre, la catégorie et les détails dans un lien', () => {
    renderWithProviders(
      <ListItem title="Premiers secours" category="Secourisme" categoryColor="#D62828" details={details} to="/formations/1" />,
    )
    const link = screen.getByRole('link', { name: /Premiers secours/ })
    expect(link).toHaveAttribute('href', '/formations/1')
    expect(link).toHaveTextContent('Secourisme')
    expect(link).toHaveTextContent('du 10 mars 2026 au 12 mars 2026')
  })

  // NOTES-34 (A2) : la couleur choisie pour la catégorie n'est plus celle du texte (jaune sur blanc : 1.7:1) ;
  // elle colore une pastille décorative, le nom reste dans la couleur du texte.
  it('met la couleur de catégorie reçue sur une pastille décorative, devant le nom', () => {
    renderWithProviders(
      <ListItem title="Excel" category="Numérique" categoryColor="#2A6F97" details={details} to="/formations/2" />,
    )
    const label = screen.getByText('Numérique')
    expect(label.style.getPropertyValue('--category-color')).toBe('#2A6F97')
    const dot = label.querySelector('[aria-hidden="true"]')
    expect(dot).not.toBeNull()
    expect(dot).toHaveClass(/categoryDot/)
  })

  it('écrit le nom de la catégorie dans la couleur du texte, jamais dans la couleur choisie', () => {
    const rules = rulesOf(stripComments(cssSheets['src/components/molecules/ListItem/ListItem.module.css']))
    const category = rules.find((r) => r.selector.trim() === '.category')
    expect(category.body).toMatch(/color\s*:\s*var\(--foreground\)/)
    expect(category.body).not.toMatch(/(^|[^-])color\s*:\s*var\(--category-color\)/)
    const dot = rules.find((r) => r.selector.trim() === '.categoryDot')
    expect(dot?.body).toMatch(/background-color\s*:\s*var\(--category-color\)/)
  })

  it("affiche un badge de statut en texte quand il est fourni", () => {
    renderWithProviders(
      <ListItem title="Ancienne" category="Autre" categoryColor="#6A994E" badge="Archivée" details={details} to="/formations/3" />,
    )
    expect(screen.getByText('Archivée')).toBeInTheDocument()
  })

  it('ne rend ni catégorie ni badge quand ils sont absents', () => {
    renderWithProviders(<ListItem title="Sans catégorie" details={details} to="/formations/4" />)
    expect(screen.queryByText('Archivée')).not.toBeInTheDocument()
  })
})
