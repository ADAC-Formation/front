import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

describe('FormField : liste déroulante et zone de texte (prop as)', () => {
  it('rend une liste déroulante avec ses options quand as="select"', async () => {
    render(
      <FormField as="select" label="Modalité" name="modalite" defaultValue="">
        <option value="">Choisir</option>
        <option value="VISIO">Visio</option>
        <option value="MIXTE">Mixte</option>
      </FormField>,
    )
    const select = screen.getByLabelText('Modalité')
    expect(select.tagName).toBe('SELECT')
    expect(screen.getAllByRole('option')).toHaveLength(3)
    await userEvent.selectOptions(select, 'MIXTE')
    expect(select).toHaveValue('MIXTE')
  })

  it('rend une zone de texte quand as="textarea"', async () => {
    render(<FormField as="textarea" label="Description" name="description" rows={4} />)
    const textarea = screen.getByLabelText('Description')
    expect(textarea.tagName).toBe('TEXTAREA')
    await userEvent.type(textarea, 'Bonjour')
    expect(textarea).toHaveValue('Bonjour')
  })

  it.each([
    ['input', {}],
    ['select', { as: 'select' }],
    ['textarea', { as: 'textarea' }],
  ])("relie l'erreur au champ (%s) par aria-invalid et aria-describedby", (_name, props) => {
    render(
      <FormField label="Champ" name="champ" error="Ce champ est obligatoire." {...props}>
        {props.as === 'select' ? <option value="">Choisir</option> : undefined}
      </FormField>,
    )
    const field = screen.getByLabelText('Champ')
    expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(field).toHaveAttribute('aria-describedby', 'champ-error')
    expect(screen.getByRole('alert')).toHaveTextContent('Ce champ est obligatoire.')
    expect(screen.getByRole('alert')).toHaveAttribute('id', 'champ-error')
  })

  it("n'a pas d'attribut d'erreur sans erreur", () => {
    render(<FormField as="select" label="Champ" name="champ" />)
    const field = screen.getByLabelText('Champ')
    expect(field).not.toHaveAttribute('aria-invalid')
    expect(field).not.toHaveAttribute('aria-describedby')
  })

  it("n'a aucune violation d'accessibilité (jest-axe)", async () => {
    const { container } = render(
      <div>
        <FormField label="Intitulé" name="intitule" required />
        <FormField as="select" label="Modalité" name="modalite" error="Obligatoire.">
          <option value="">Choisir</option>
        </FormField>
        <FormField as="textarea" label="Description" name="description" />
      </div>,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
