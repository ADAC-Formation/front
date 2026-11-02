import { useEffect } from 'react'

// Éléments où le focus peut aller dans une boîte de dialogue (les désactivés sont exclus).
const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]'

// Comportement clavier d'une boîte de dialogue modale : focus initial sur `initialFocusRef`, Échap
// appelle `onCancel`, Tab et Maj+Tab restent dans la boîte, le focus revient à l'élément actif
// d'avant l'ouverture quand la boîte se ferme. Renvoie le `onKeyDown` à poser sur la boîte
// (`dialogRef`). Utilisé par ConfirmDialog et par les boîtes à champs de formulaire.
export function useModalFocus({ dialogRef, initialFocusRef, onCancel }) {
  useEffect(() => {
    const previous = document.activeElement
    initialFocusRef.current?.focus()
    return () => previous?.focus?.()
  }, [initialFocusRef])

  return (event) => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onCancel()
      return
    }
    if (event.key !== 'Tab') return

    const focusable = dialogRef.current.querySelectorAll(FOCUSABLE)
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }
}
