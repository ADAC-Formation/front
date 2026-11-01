import { screen } from '@testing-library/react'
import { CalendarDays } from 'lucide-react'
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

  it('applique la couleur de catégorie reçue, sans la chercher ailleurs', () => {
    renderWithProviders(
      <ListItem title="Excel" category="Numérique" categoryColor="#2A6F97" details={details} to="/formations/2" />,
    )
    expect(screen.getByText('Numérique').style.getPropertyValue('--category-color')).toBe('#2A6F97')
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
