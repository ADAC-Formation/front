import { createEvent, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import DocumentDropzone from './DocumentDropzone'

const pdf = (name) => new File(['contenu'], name, { type: 'application/pdf' })

function renderZone(props = {}) {
  const onFiles = vi.fn()
  const view = render(<DocumentDropzone onFiles={onFiles} {...props} />)
  return { onFiles, ...view }
}

const zone = () => screen.getByRole('group', { name: 'Zone de dépôt de documents' })
const input = (container) => container.querySelector('input[type="file"]')

describe('DocumentDropzone', () => {
  it('annonce les types et la taille acceptés', () => {
    renderZone()
    expect(zone()).toHaveTextContent('Glissez-déposez vos fichiers ici')
    expect(zone()).toHaveTextContent('PDF, JPG, PNG ou DOCX')
    expect(zone()).toHaveTextContent('10 Mo')
  })

  it('propose « Choisir des fichiers » (clavier) avec un champ multiple limité aux types acceptés', () => {
    const { container } = renderZone()
    expect(screen.getByRole('button', { name: 'Choisir des fichiers' })).toBeEnabled()
    expect(input(container)).toHaveAttribute('multiple')
    expect(input(container)).toHaveAttribute('accept', '.pdf,.jpg,.jpeg,.png,.docx')
  })

  it('transmet les fichiers choisis avec le champ', async () => {
    const { container, onFiles } = renderZone()
    await userEvent.upload(input(container), [pdf('a.pdf'), pdf('b.pdf')])
    expect(onFiles).toHaveBeenCalledTimes(1)
    expect(onFiles.mock.calls[0][0].map((file) => file.name)).toEqual(['a.pdf', 'b.pdf'])
  })

  it('le bouton ouvre le sélecteur de fichiers', async () => {
    const { container } = renderZone()
    const click = vi.spyOn(input(container), 'click')
    await userEvent.click(screen.getByRole('button', { name: 'Choisir des fichiers' }))
    expect(click).toHaveBeenCalled()
  })

  it('transmet plusieurs fichiers lâchés et empêche le navigateur de les ouvrir', () => {
    const { onFiles } = renderZone()
    expect(fireEvent.dragOver(zone())).toBe(false)
    const notPrevented = fireEvent.drop(zone(), { dataTransfer: { files: [pdf('a.pdf'), pdf('b.pdf')] } })
    expect(notPrevented).toBe(false)
    expect(onFiles.mock.calls[0][0].map((file) => file.name)).toEqual(['a.pdf', 'b.pdf'])
  })

  it('garde la mise en évidence en passant sur un élément intérieur, la retire en sortant de la zone', () => {
    renderZone()
    fireEvent.dragOver(zone())
    const highlighted = zone().className
    const inner = screen.getByRole('button', { name: 'Choisir des fichiers' })
    // jsdom ne transmet pas `relatedTarget` via fireEvent : on l'ajoute à l'événement.
    const leaveTo = (target) => {
      const event = createEvent.dragLeave(zone())
      Object.defineProperty(event, 'relatedTarget', { value: target })
      fireEvent(zone(), event)
    }
    leaveTo(inner)
    expect(zone().className).toBe(highlighted)
    leaveTo(document.body)
    expect(zone().className).not.toBe(highlighted)
  })

  it('ignore un dépôt sans fichier', () => {
    const { onFiles } = renderZone()
    fireEvent.drop(zone(), { dataTransfer: { files: [] } })
    expect(onFiles).not.toHaveBeenCalled()
  })

  it('pendant un envoi : annonce « Envoi en cours… » et refuse de nouveaux fichiers', () => {
    const { onFiles } = renderZone({ isPending: true })
    expect(screen.getByRole('status')).toHaveTextContent('Envoi en cours…')
    expect(screen.getByRole('button', { name: 'Choisir des fichiers' })).toBeDisabled()
    fireEvent.drop(zone(), { dataTransfer: { files: [pdf('a.pdf')] } })
    expect(onFiles).not.toHaveBeenCalled()
  })

  it('n’a aucune violation d’accessibilité (jest-axe)', async () => {
    const { container } = renderZone()
    expect(await axe(container)).toHaveNoViolations()
  })
})
