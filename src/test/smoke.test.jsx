import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { axe } from 'jest-axe'
import { server } from './msw/server'

function Hello() {
  return (
    <main>
      <h1>Bonjour</h1>
    </main>
  )
}

describe('outillage de test', () => {
  it('rend un composant et trouve son contenu', () => {
    render(<Hello />)
    expect(screen.getByRole('heading', { name: 'Bonjour' })).toBeInTheDocument()
  })

  it('ne détecte aucune violation d\'accessibilité sur un composant simple', async () => {
    const { container } = render(<Hello />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('intercepte une requête avec MSW', async () => {
    server.use(http.get('http://localhost:8080/api/ping', () => HttpResponse.json({ ok: true })))
    const response = await fetch('http://localhost:8080/api/ping')
    expect(await response.json()).toEqual({ ok: true })
  })
})
