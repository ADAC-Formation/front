import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { mockDocumentApi } from '../../../test/documents'
import { INSCRITS } from '../../../test/formations'
import { renderWithProviders } from '../../../test/render'
import { mockSession } from '../../../test/session'
import InscritDocumentCount from './InscritDocumentCount'

// Compte des documents reçus d'un inscrit, sur sa ligne de « Liste stagiaires » (G34).
const lea = INSCRITS[0].stagiaire // id 20, inscription 1
const TYPES = [
  { id: 1, nom: 'Pièce d’identité' },
  { id: 2, nom: 'Diplôme' },
]
const document = (id, fileName, uploadedBy = lea) => ({
  id,
  fileName,
  fileSize: 2048,
  mimeType: 'application/pdf',
  uploadedBy: { id: uploadedBy.id, prenom: uploadedBy.prenom, nom: uploadedBy.nom },
  formationId: null,
  inscriptionId: 1,
  createdAt: '2026-03-01T10:00:00',
})

function renderCount(documents, { types = TYPES, typesAvailable = true, errors } = {}) {
  mockSession('SUPER_ADMIN')
  const api = mockDocumentApi(documents, { errors })
  const view = renderWithProviders(
    <InscritDocumentCount inscriptionId={1} stagiaireId={lea.id} types={types} typesAvailable={typesAvailable} />,
  )
  return { api, ...view }
}

describe('InscritDocumentCount', () => {
  it('annonce le chargement puis « X/Y documents reçus »', async () => {
    renderCount([document(1, 'Pièce d’identité - recto.pdf')])
    expect(screen.getByRole('status')).toHaveTextContent('Chargement…')
    expect(await screen.findByText('1/2 documents reçus')).toBeInTheDocument()
  })

  it('marque un inscrit complet d’une icône de réussite, le texte portant l’état', async () => {
    renderCount([document(1, 'Pièce d’identité - recto.pdf'), document(2, 'Diplôme - bac.pdf')])
    const label = await screen.findByText('2/2 documents reçus')
    expect(label.closest('[data-complete]')).toHaveAttribute('data-complete', 'true')
  })

  it('compte les fichiers envoyés quand la formation n’a aucun type', async () => {
    renderCount([document(1, 'CV.pdf'), document(2, 'Lettre.pdf')], { types: [] })
    expect(await screen.findByText('2 documents envoyés')).toBeInTheDocument()
  })

  it('compte les fichiers envoyés quand les types sont indisponibles', async () => {
    renderCount([document(1, 'Pièce d’identité - recto.pdf')], { types: [], typesAvailable: false })
    expect(await screen.findByText('1 document envoyé')).toBeInTheDocument()
  })

  it('affiche l’erreur de la liste avec « Réessayer »', async () => {
    const user = userEvent.setup()
    let failing = true
    const { api } = renderCount([document(1, 'Diplôme - bac.pdf')], {
      errors: { list: () => (failing ? { status: 500, message: 'Erreur serveur' } : null) },
    })
    expect(await screen.findByText('Erreur serveur')).toBeInTheDocument()
    failing = false
    await user.click(screen.getByRole('button', { name: 'Réessayer' }))
    expect(await screen.findByText('1/2 documents reçus')).toBeInTheDocument()
    expect(api.calls.list).toBe(2)
  })

  it("n'a pas de violation d'accessibilité", async () => {
    const { container } = renderCount([])
    await screen.findByText('0/2 documents reçus')
    expect(await axe(container)).toHaveNoViolations()
  })
})
