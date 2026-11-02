import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import ConfirmDialog from './ConfirmDialog'

function renderDialog(props = {}) {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()
  render(
    <>
      <button>ouvrir</button>
      <ConfirmDialog
        title="Suspendre ce compte ?"
        confirmLabel="Suspendre"
        onConfirm={onConfirm}
        onCancel={onCancel}
        {...props}
      >
        Anne Martin ne pourra plus se connecter.
      </ConfirmDialog>
    </>,
  )
  return { onConfirm, onCancel }
}

describe('ConfirmDialog', () => {
  it('est une boîte de dialogue modale nommée par son titre', () => {
    renderDialog()
    const dialog = screen.getByRole('dialog', { name: 'Suspendre ce compte ?' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByText('Anne Martin ne pourra plus se connecter.')).toBeInTheDocument()
  })

  it("donne le focus à l'action d'annulation à l'ouverture", () => {
    renderDialog()
    expect(screen.getByRole('button', { name: 'Annuler' })).toHaveFocus()
  })

  it('confirme et annule par les boutons', async () => {
    const { onConfirm, onCancel } = renderDialog()
    await userEvent.click(screen.getByRole('button', { name: 'Suspendre' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('annule avec Échap', async () => {
    const { onCancel } = renderDialog()
    await userEvent.keyboard('{Escape}')
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('garde le focus dans la boîte avec Tab', async () => {
    renderDialog()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Suspendre' })).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Annuler' })).toHaveFocus()
  })

  it('garde le focus dans la boîte avec Maj+Tab', async () => {
    renderDialog()
    expect(screen.getByRole('button', { name: 'Annuler' })).toHaveFocus()
    await userEvent.tab({ shift: true })
    expect(screen.getByRole('button', { name: 'Suspendre' })).toHaveFocus()
    await userEvent.tab({ shift: true })
    expect(screen.getByRole('button', { name: 'Annuler' })).toHaveFocus()
  })

  it("rend le focus à l'élément précédent à la fermeture", () => {
    const { unmount } = render(<button>ouvrir</button>)
    screen.getByText('ouvrir').focus()
    unmount()
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()
    const { unmount: closeDialog } = render(
      <ConfirmDialog title="T" confirmLabel="OK" onConfirm={() => {}} onCancel={() => {}} />,
    )
    closeDialog()
    expect(trigger).toHaveFocus()
    trigger.remove()
  })

  it("n'a pas de violation d'accessibilité", async () => {
    renderDialog()
    expect(await axe(document.body)).toHaveNoViolations()
  })
})
