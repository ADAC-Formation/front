import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import { DOCUMENTS } from '../../../test/documents'
import DocumentList from './DocumentList'

const [cours, programme] = DOCUMENTS

function renderList(props = {}) {
  const onDownload = vi.fn()
  const onDelete = vi.fn()
  const view = render(
    <DocumentList
      documents={DOCUMENTS}
      canDelete={() => false}
      onDownload={onDownload}
      onDelete={onDelete}
      {...props}
    />,
  )
  return { onDownload, onDelete, ...view }
}

describe('DocumentList', () => {
  it('liste un document par ligne : type en texte, nom, taille, date et expéditeur', () => {
    renderList()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    const first = screen.getAllByRole('listitem')[0]
    expect(first).toHaveTextContent('PDF')
    expect(first).toHaveTextContent('Support de cours.pdf')
    expect(first).toHaveTextContent('240 Ko')
    expect(first).toHaveTextContent('20 février 2026')
    expect(first).toHaveTextContent('Formateur Dev')
    expect(screen.getAllByRole('listitem')[1]).toHaveTextContent('Word')
  })

  it('n’affiche jamais l’e-mail de l’expéditeur ni l’adresse du fichier', () => {
    const { container } = renderList()
    expect(container).not.toHaveTextContent('formateur@adac.test')
    expect(container).not.toHaveTextContent('supabase')
    expect(container.querySelector('a')).toBeNull()
  })

  it('rend un nom de fichier contenant du HTML en texte', () => {
    const hostile = { ...cours, id: 7, fileName: '<img src=x onerror=alert(1)>.pdf' }
    const { container } = renderList({ documents: [hostile] })
    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByText('<img src=x onerror=alert(1)>.pdf')).toBeInTheDocument()
  })

  it('propose « Télécharger », nommé avec le fichier, et prévient le parent', async () => {
    const { onDownload } = renderList()
    const button = screen.getByRole('button', { name: 'Télécharger Support de cours.pdf' })
    expect(button).toHaveTextContent('Télécharger')
    await userEvent.click(button)
    expect(onDownload).toHaveBeenCalledWith(cours)
  })

  it('n’affiche « Supprimer » que sur les documents autorisés', async () => {
    const { onDelete } = renderList({ canDelete: (document) => document.id === programme.id })
    expect(screen.queryByRole('button', { name: 'Supprimer Support de cours.pdf' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer Programme.docx' }))
    expect(onDelete).toHaveBeenCalledWith(programme)
  })

  it('ne propose aucune suppression quand rien n’est autorisé', () => {
    renderList()
    expect(screen.queryByRole('button', { name: /^Supprimer/ })).not.toBeInTheDocument()
  })

  it('désactive les boutons d’une ligne en cours de téléchargement', () => {
    renderList({ downloadingId: cours.id })
    expect(screen.getByRole('button', { name: 'Télécharger Support de cours.pdf' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Télécharger Programme.docx' })).toBeEnabled()
  })

  it('n’a aucune violation d’accessibilité (jest-axe)', async () => {
    const { container } = renderList({ canDelete: () => true })
    expect(await axe(container)).toHaveNoViolations()
  })
})
