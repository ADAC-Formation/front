import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import Alert from './Alert'

describe('Alert', () => {
  it('une erreur est annoncée avec role="alert"', () => {
    render(<Alert variant="error">Identifiants invalides</Alert>)
    expect(screen.getByRole('alert')).toHaveTextContent('Identifiants invalides')
  })

  it('une confirmation est annoncée avec role="status"', () => {
    render(<Alert variant="success">Compte activé avec succès</Alert>)
    expect(screen.getByRole('status')).toHaveTextContent('Compte activé avec succès')
  })

  it('rend le contenu en texte, jamais en HTML (XSS)', () => {
    render(<Alert variant="error">{'<img src=x onerror=alert(1)>'}</Alert>)
    expect(screen.getByRole('alert').textContent).toBe('<img src=x onerror=alert(1)>')
    expect(document.querySelector('img')).toBeNull()
  })

  it('n\'a aucune violation d\'accessibilité', async () => {
    const { container } = render(<Alert variant="error">Erreur</Alert>)
    expect(await axe(container)).toHaveNoViolations()
  })
})
