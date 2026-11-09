import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { MemoryRouter } from 'react-router'
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

  it('ne plante pas quand l’expéditeur ou la date manque', () => {
    renderList({ documents: [{ ...cours, uploadedBy: null, createdAt: null }] })
    expect(screen.getByText('Support de cours.pdf')).toBeInTheDocument()
    expect(screen.getByRole('listitem')).toHaveTextContent('Expéditeur inconnu')
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

// Vue du stagiaire (028, G12) : ses propres envois, donc ni expéditeur ni « Supprimer ».
describe('DocumentList du stagiaire', () => {
  it('n’affiche aucun expéditeur avec showSender={false}', () => {
    renderList({ showSender: false })
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Support de cours.pdf')
    expect(screen.queryByText(/Envoyé par/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Formateur Dev/)).not.toBeInTheDocument()
  })

  it('garde l’expéditeur par défaut (027 inchangé)', () => {
    renderList()
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Envoyé par Formateur Dev')
  })

  it('sans canDelete, aucun « Supprimer » n’est proposé', () => {
    renderList({ canDelete: undefined, showSender: false })
    expect(screen.queryByRole('button', { name: /Supprimer/ })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Télécharger/ })).toHaveLength(2)
  })
})


// Résumé du profil (G16) : sans actions, avec l'endroit où chaque document a été déposé.
describe('DocumentList en résumé', () => {
  const renderSummary = (props = {}) =>
    render(
      <MemoryRouter>
        <DocumentList
          documents={DOCUMENTS}
          showSender={false}
          locationOf={(document) => ({ to: `/formations/${document.formationId}`, label: 'Premiers secours PSC1' })}
          {...props}
        />
      </MemoryRouter>,
    )

  it('écrit « Déposé dans » avec un lien vers la formation', () => {
    renderSummary()
    const line = screen.getAllByRole('listitem')[0]
    expect(line).toHaveTextContent('Déposé dans Premiers secours PSC1')
    expect(within(line).getByRole('link', { name: 'Premiers secours PSC1' })).toHaveAttribute('href', '/formations/101')
  })

  it('sans onDownload ni canDelete, aucun bouton', () => {
    renderSummary()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('sans locationOf, aucune ligne « Déposé dans » (027 inchangé)', () => {
    renderList()
    expect(screen.queryByText(/Déposé dans/)).not.toBeInTheDocument()
  })
})
