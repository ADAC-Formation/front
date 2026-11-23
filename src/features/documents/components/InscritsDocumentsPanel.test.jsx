import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockDocumentApi } from '../../../test/documents'
import { mockFormationDocumentTypes } from '../../../test/documentTypes'
import { FORMATIONS, INSCRITS, mockInscriptions } from '../../../test/formations'
import { renderWithProviders } from '../../../test/render'
import { mockSession } from '../../../test/session'
import { saveBlob } from '../saveBlob'
import InscritsDocumentsPanel from './InscritsDocumentsPanel'

vi.mock('../saveBlob', () => ({ saveBlob: vi.fn() }))

// Onglet « Documents stagiaires » : un bloc par inscrit, chaque type « Reçu » ou « Manquant » avec ses
// fichiers, puis « Autres documents » (G34).
const formation = FORMATIONS[0]
const [lea, omar] = INSCRITS.map(({ stagiaire }) => stagiaire)
const TYPES = [
  { id: 1, nom: 'Pièce d’identité' },
  { id: 2, nom: 'Diplôme' },
]
const document = (id, fileName, inscriptionId, uploader) => ({
  id,
  fileName,
  fileSize: 2048,
  mimeType: 'application/pdf',
  uploadedBy: { id: uploader.id, prenom: uploader.prenom, nom: uploader.nom },
  formationId: null,
  inscriptionId,
  createdAt: '2026-03-01T10:00:00',
})

const DOCS = [
  document(701, 'Pièce d’identité - recto.pdf', 1, lea),
  document(702, 'CV <img src=x>.pdf', 1, lea),
  document(703, 'Diplôme - master.pdf', 2, omar),
]

function renderPanel({ inscrits = INSCRITS, types = TYPES, typesError, documents = DOCS } = {}) {
  mockSession('SUPER_ADMIN')
  mockInscriptions(formation.id, inscrits)
  const typeCalls = mockFormationDocumentTypes(types, { errorStatus: typesError })
  const api = mockDocumentApi(documents)
  const view = renderWithProviders(<InscritsDocumentsPanel formation={formation} />)
  return { api, typeCalls, ...view }
}

const blockOf = async (name) => screen.findByRole('region', { name })
// Les blocs sont repliés à l'arrivée : un clic sur la ligne (le résumé) les déplie.
const openBlock = async (name) => {
  const block = await blockOf(name)
  await userEvent.click(within(block).getByText(name))
  return block
}

beforeEach(() => saveBlob.mockClear())

describe('InscritsDocumentsPanel', () => {
  it('affiche un bloc par inscrit, titré de son nom, avec son compte', async () => {
    renderPanel()
    const leaBlock = await blockOf('Léa Petit')
    expect(await within(leaBlock).findByText('1/2 documents reçus')).toBeInTheDocument()
    const omarBlock = await blockOf('Omar Benali')
    expect(await within(omarBlock).findByText('1/2 documents reçus')).toBeInTheDocument()
  })

  it('replie chaque bloc à l’arrivée : nom et compte visibles, types masqués jusqu’au clic', async () => {
    renderPanel()
    const leaBlock = await blockOf('Léa Petit')
    expect(await within(leaBlock).findByText('1/2 documents reçus')).toBeVisible()
    const identite = await within(leaBlock).findByRole('listitem', { name: 'Pièce d’identité' })
    expect(identite).not.toBeVisible()
    await userEvent.click(within(leaBlock).getByText('Léa Petit'))
    expect(identite).toBeVisible()
    await userEvent.click(within(leaBlock).getByText('Léa Petit'))
    expect(identite).not.toBeVisible()
  })

  it('marque le résumé d’un inscrit complet ou incomplet, l’état restant écrit', async () => {
    renderPanel({
      documents: [...DOCS, document(704, 'Diplôme - bac.pdf', 1, lea)],
    })
    const leaBlock = await blockOf('Léa Petit')
    expect((await within(leaBlock).findByText('2/2 documents reçus')).closest('summary')).toHaveAttribute('data-complete', 'true')
    const omarBlock = await blockOf('Omar Benali')
    expect((await within(omarBlock).findByText('1/2 documents reçus')).closest('summary')).toHaveAttribute('data-complete', 'false')
  })

  it('écrit « Reçu » ou « Manquant » pour chaque type, avec les fichiers reçus', async () => {
    renderPanel()
    const leaBlock = await openBlock('Léa Petit')
    const identite = await within(leaBlock).findByRole('listitem', { name: 'Pièce d’identité' })
    expect(within(identite).getByText('Reçu')).toBeInTheDocument()
    expect(within(identite).getByRole('button', { name: 'Télécharger Pièce d’identité - recto.pdf' })).toBeInTheDocument()
    const diplome = within(leaBlock).getByRole('listitem', { name: 'Diplôme' })
    expect(within(diplome).getByText('Manquant')).toBeInTheDocument()
    expect(within(diplome).queryByRole('button')).not.toBeInTheDocument()
  })

  it('liste les fichiers hors type sous « Autres documents », le nom rendu en texte', async () => {
    const { container } = renderPanel()
    const leaBlock = await openBlock('Léa Petit')
    expect(await within(leaBlock).findByText('Autres documents')).toBeVisible()
    expect(within(leaBlock).getByRole('button', { name: 'Télécharger CV <img src=x>.pdf' })).toBeInTheDocument()
    expect(container.querySelector('img')).toBeNull()
    const omarBlock = await blockOf('Omar Benali')
    await within(omarBlock).findByText('1/2 documents reçus')
    expect(within(omarBlock).queryByText('Autres documents')).not.toBeInTheDocument()
  })

  it('télécharge un fichier par le client authentifié', async () => {
    const user = userEvent.setup()
    const { api } = renderPanel()
    const leaBlock = await openBlock('Léa Petit')
    await user.click(await within(leaBlock).findByRole('button', { name: 'Télécharger Pièce d’identité - recto.pdf' }))
    await waitFor(() => expect(saveBlob).toHaveBeenCalledTimes(1))
    expect(api.calls.downloaded).toEqual([701])
  })

  it('affiche « Aucun stagiaire inscrit » sans inscrit', async () => {
    renderPanel({ inscrits: [] })
    expect(await screen.findByText('Aucun stagiaire inscrit')).toBeInTheDocument()
  })

  it('signale une fois l’erreur des types et compte alors les fichiers envoyés', async () => {
    renderPanel({ typesError: 500 })
    expect(await screen.findByText('Erreur serveur')).toBeInTheDocument()
    expect(screen.getAllByText('Erreur serveur')).toHaveLength(1)
    const leaBlock = await blockOf('Léa Petit')
    expect(await within(leaBlock).findByText('2 documents envoyés')).toBeInTheDocument()
  })

  it("n'a pas de violation d'accessibilité", async () => {
    const { container } = renderPanel()
    const leaBlock = await blockOf('Léa Petit')
    await within(leaBlock).findByText('1/2 documents reçus')
    expect(await axe(container)).toHaveNoViolations()
  })
})
