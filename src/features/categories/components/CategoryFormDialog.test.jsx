import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import CategoryFormDialog from './CategoryFormDialog'

const CATEGORY = { id: 1, nom: 'Secourisme', couleur: '#D62828', isActive: true }

function renderDialog(props = {}) {
  const onSubmit = vi.fn()
  const onCancel = vi.fn()
  const view = render(
    <>
      <button>ouvrir</button>
      <CategoryFormDialog onSubmit={onSubmit} onCancel={onCancel} {...props} />
    </>,
  )
  return { onSubmit, onCancel, ...view }
}

const nameField = () => screen.getByLabelText('Nom')
const hexField = () => screen.getByLabelText('Couleur (hexadécimal)')
const picker = () => screen.getByLabelText('Choisir une couleur')
const submitButton = (name) => screen.getByRole('button', { name })

describe('CategoryFormDialog — création', () => {
  it('est une boîte modale « Créer une catégorie » à nom et couleur', () => {
    renderDialog()
    const dialog = screen.getByRole('dialog', { name: 'Créer une catégorie' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(nameField()).toHaveValue('')
    expect(nameField()).toBeRequired()
    expect(hexField()).toHaveValue('#12427C')
    expect(submitButton('Créer')).toBeInTheDocument()
  })

  it('place le focus sur « Nom » à l’ouverture', () => {
    renderDialog()
    expect(nameField()).toHaveFocus()
  })

  it('garde le focus dans la boîte avec Tab et Maj+Tab', async () => {
    renderDialog()
    submitButton('Créer').focus()
    await userEvent.tab()
    expect(nameField()).toHaveFocus()
    await userEvent.tab({ shift: true })
    expect(submitButton('Créer')).toHaveFocus()
  })

  it('ferme avec Échap et avec « Annuler », sans envoyer', async () => {
    const { onCancel, onSubmit } = renderDialog()
    await userEvent.keyboard('{Escape}')
    expect(onCancel).toHaveBeenCalledTimes(1)
    await userEvent.click(submitButton('Annuler'))
    expect(onCancel).toHaveBeenCalledTimes(2)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('envoie le nom nettoyé et la couleur en majuscules', async () => {
    const { onSubmit } = renderDialog()
    await userEvent.type(nameField(), '  Numérique avancé ')
    await userEvent.clear(hexField())
    await userEvent.type(hexField(), '#12427c')
    await userEvent.click(submitButton('Créer'))
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith({ nom: 'Numérique avancé', couleur: '#12427C' })
  })
})

describe('CategoryFormDialog — modification', () => {
  it('est une boîte « Modifier la catégorie » préremplie', () => {
    renderDialog({ category: CATEGORY })
    expect(screen.getByRole('dialog', { name: 'Modifier la catégorie' })).toBeInTheDocument()
    expect(nameField()).toHaveValue('Secourisme')
    expect(hexField()).toHaveValue('#D62828')
    expect(submitButton('Enregistrer')).toBeInTheDocument()
  })

  it('envoie les deux champs quand l’un change', async () => {
    const { onSubmit } = renderDialog({ category: CATEGORY })
    await userEvent.clear(nameField())
    await userEvent.type(nameField(), 'Secours')
    await userEvent.click(submitButton('Enregistrer'))
    expect(onSubmit).toHaveBeenCalledWith({ nom: 'Secours', couleur: '#D62828' })
  })

  it('se ferme sans envoyer quand rien n’a changé', async () => {
    const { onSubmit, onCancel } = renderDialog({ category: CATEGORY })
    await userEvent.click(submitButton('Enregistrer'))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('considère inchangée une couleur ressaisie en minuscules', async () => {
    const { onSubmit, onCancel } = renderDialog({ category: CATEGORY })
    await userEvent.clear(hexField())
    await userEvent.type(hexField(), '#d62828')
    await userEvent.click(submitButton('Enregistrer'))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})

describe('CategoryFormDialog — couleur', () => {
  it('reporte un code hexadécimal valide sur le sélecteur et la pastille', async () => {
    renderDialog()
    await userEvent.clear(hexField())
    await userEvent.type(hexField(), '#12427c')
    expect(picker()).toHaveValue('#12427c')
    expect(screen.getByTestId('color-preview')).toHaveStyle({ backgroundColor: '#12427c' })
  })

  it('reporte le sélecteur sur le champ hexadécimal en majuscules', () => {
    renderDialog()
    fireEvent.change(picker(), { target: { value: '#ff0000' } })
    expect(hexField()).toHaveValue('#FF0000')
    expect(screen.getByTestId('color-preview')).toHaveStyle({ backgroundColor: '#ff0000' })
  })

  it('garde la dernière couleur valide dans le sélecteur pendant une saisie incomplète', async () => {
    renderDialog({ category: CATEGORY })
    await userEvent.clear(hexField())
    await userEvent.type(hexField(), '#12')
    expect(picker()).toHaveValue('#d62828')
  })
})

describe('CategoryFormDialog — validation', () => {
  it('refuse un nom vide, lie l’erreur au champ et n’envoie rien', async () => {
    const { onSubmit } = renderDialog()
    await userEvent.click(submitButton('Créer'))
    const message = await screen.findByText('Le nom est obligatoire.')
    expect(nameField()).toHaveAttribute('aria-invalid', 'true')
    expect(nameField().getAttribute('aria-describedby')).toContain(message.id)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it.each(['12427c', '#12427', '#GGGGGG', ''])('refuse la couleur %j sans envoyer', async (value) => {
    const { onSubmit } = renderDialog()
    await userEvent.type(nameField(), 'Numérique')
    await userEvent.clear(hexField())
    if (value) await userEvent.type(hexField(), value)
    await userEvent.click(submitButton('Créer'))
    expect(await screen.findByText(/#RRGGBB/)).toBeInTheDocument()
    expect(hexField()).toHaveAttribute('aria-invalid', 'true')
    expect(onSubmit).not.toHaveBeenCalled()
  })
})

describe('CategoryFormDialog — retour du back', () => {
  it('affiche l’erreur du back dans un bandeau annoncé et garde la saisie', async () => {
    const { rerender, onSubmit, onCancel } = renderDialog()
    await userEvent.type(nameField(), 'Doublon')
    rerender(
      <>
        <button>ouvrir</button>
        <CategoryFormDialog onSubmit={onSubmit} onCancel={onCancel} error="Cette catégorie existe déjà" />
      </>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Cette catégorie existe déjà')
    expect(nameField()).toHaveValue('Doublon')
  })

  it('désactive le bouton de validation pendant l’envoi', () => {
    renderDialog({ isPending: true })
    expect(submitButton('Créer')).toBeDisabled()
  })

  it('rend le message du back en texte, jamais en HTML', () => {
    renderDialog({ error: '<img src=x onerror=alert(1)>' })
    expect(screen.getByRole('alert')).toHaveTextContent('<img src=x onerror=alert(1)>')
    expect(document.querySelector('img')).toBeNull()
  })
})

describe('CategoryFormDialog — focus', () => {
  it('rend le focus à l’élément précédent à la fermeture', () => {
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()
    const { unmount } = renderDialog()
    unmount()
    expect(trigger).toHaveFocus()
    trigger.remove()
  })
})

describe('CategoryFormDialog — accessibilité', () => {
  it('n’a aucune violation (création)', async () => {
    renderDialog()
    expect(await axe(document.body)).toHaveNoViolations()
  })

  it('n’a aucune violation avec des erreurs de champs et un bandeau d’erreur', async () => {
    renderDialog({ error: 'Cette catégorie existe déjà' })
    await userEvent.click(submitButton('Créer'))
    await screen.findByText('Le nom est obligatoire.')
    expect(await axe(document.body)).toHaveNoViolations()
  })
})
