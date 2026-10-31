import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import FormField from './FormField'

describe('FormField', () => {
  it('lie l\'étiquette au champ', () => {
    render(<FormField label="Adresse e-mail" name="email" />)
    expect(screen.getByLabelText('Adresse e-mail')).toBeInTheDocument()
  })

  it('sans erreur : pas de message et pas d\'aria-invalid', () => {
    render(<FormField label="Adresse e-mail" name="email" />)
    const input = screen.getByLabelText('Adresse e-mail')
    expect(input).not.toHaveAttribute('aria-invalid', 'true')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('avec erreur : champ invalide, décrit par le message annoncé', () => {
    render(<FormField label="Adresse e-mail" name="email" error="L'adresse e-mail est obligatoire." />)
    const input = screen.getByLabelText('Adresse e-mail')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    const message = screen.getByRole('alert')
    expect(message).toHaveTextContent("L'adresse e-mail est obligatoire.")
    expect(input).toHaveAccessibleDescription("L'adresse e-mail est obligatoire.")
  })

  it('transmet les props du champ (autoComplete, ref)', () => {
    const ref = { current: null }
    render(<FormField label="Mot de passe" name="password" type="password" autoComplete="current-password" ref={ref} />)
    const input = screen.getByLabelText('Mot de passe')
    expect(input).toHaveAttribute('autocomplete', 'current-password')
    expect(ref.current).toBe(input)
  })

  it('n\'a aucune violation d\'accessibilité, avec ou sans erreur', async () => {
    const { container, rerender } = render(<FormField label="Adresse e-mail" name="email" />)
    expect(await axe(container)).toHaveNoViolations()
    rerender(<FormField label="Adresse e-mail" name="email" error="Obligatoire." />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
