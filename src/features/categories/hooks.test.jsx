import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../test/render'
import { mockCategories } from '../../test/categories'
import { useCategories } from './hooks'

function Probe({ active }) {
  const { data, isLoading, isError, error } = useCategories({ active })
  if (isLoading) return <p>chargement</p>
  if (isError) return <p>erreur {error.status}</p>
  return (
    <ul>
      {data.map((category) => (
        <li key={category.id}>{category.nom}</li>
      ))}
    </ul>
  )
}

describe('useCategories', () => {
  it('liste toutes les catégories sans filtre', async () => {
    const calls = mockCategories()
    renderWithProviders(<Probe />)
    expect(await screen.findByText('Ancienne catégorie')).toBeInTheDocument()
    expect(calls.urls[0]).not.toContain('active')
  })

  it('transmet active=true pour les catégories actives', async () => {
    const calls = mockCategories()
    renderWithProviders(<Probe active />)
    expect(await screen.findByText('Secourisme')).toBeInTheDocument()
    expect(screen.queryByText('Ancienne catégorie')).not.toBeInTheDocument()
    expect(calls.urls[0]).toContain('active=true')
  })

  it("remonte l'erreur en ApiError", async () => {
    mockCategories(undefined, { errorStatus: 500 })
    renderWithProviders(<Probe active />)
    expect(await screen.findByText('erreur 500')).toBeInTheDocument()
  })
})
