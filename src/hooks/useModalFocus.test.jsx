import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { useModalFocus } from './useModalFocus'

// Boîte de dialogue minimale : champs de formulaire, liste, zone de texte, lien, un bouton
// désactivé en dernier (il ne doit pas compter comme dernier élément focalisable).
function Harness({ onCancel = () => {}, onOuterKeyDown }) {
  const dialogRef = useRef(null)
  const nameRef = useRef(null)
  const handleKeyDown = useModalFocus({ dialogRef, initialFocusRef: nameRef, onCancel })

  return (
    <div onKeyDown={onOuterKeyDown}>
      <div ref={dialogRef} role="dialog" aria-label="Test" onKeyDown={handleKeyDown}>
        <input ref={nameRef} aria-label="Nom" />
        <input aria-label="Hexadécimal" />
        <select aria-label="Choix">
          <option>a</option>
        </select>
        <textarea aria-label="Note" />
        <a href="#ailleurs">Lien</a>
        <button type="button">OK</button>
        <button type="button" disabled>
          Indisponible
        </button>
      </div>
    </div>
  )
}

describe('useModalFocus', () => {
  it('place le focus sur l’élément demandé à l’ouverture', () => {
    render(<Harness />)
    expect(screen.getByLabelText('Nom')).toHaveFocus()
  })

  it('suit l’ordre de Tab sur champs, liste, zone de texte, lien et bouton', async () => {
    render(<Harness />)
    await userEvent.tab()
    expect(screen.getByLabelText('Hexadécimal')).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByLabelText('Choix')).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByLabelText('Note')).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole('link', { name: 'Lien' })).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'OK' })).toHaveFocus()
  })

  it('revient au premier élément après le dernier, en ignorant le bouton désactivé', async () => {
    render(<Harness />)
    screen.getByRole('button', { name: 'OK' }).focus()
    await userEvent.tab()
    expect(screen.getByLabelText('Nom')).toHaveFocus()
  })

  it('revient au dernier élément avant le premier avec Maj+Tab', async () => {
    render(<Harness />)
    await userEvent.tab({ shift: true })
    expect(screen.getByRole('button', { name: 'OK' })).toHaveFocus()
  })

  it('appelle onCancel avec Échap sans laisser l’événement remonter', async () => {
    const onCancel = vi.fn()
    const onOuterKeyDown = vi.fn()
    render(<Harness onCancel={onCancel} onOuterKeyDown={onOuterKeyDown} />)
    await userEvent.keyboard('{Escape}')
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onOuterKeyDown).not.toHaveBeenCalled()
  })

  it('rend le focus à l’élément actif avant l’ouverture, à la fermeture', () => {
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()
    const { unmount } = render(<Harness />)
    expect(screen.getByLabelText('Nom')).toHaveFocus()
    unmount()
    expect(trigger).toHaveFocus()
    trigger.remove()
  })
})
