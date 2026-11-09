import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockDocumentApi } from '../../../test/documents'
import { INSCRITS } from '../../../test/formations'
import { renderWithProviders } from '../../../test/render'
import { USERS, mockSession } from '../../../test/session'
import { saveBlob } from '../saveBlob'
import SentDocuments from './SentDocuments'

vi.mock('../saveBlob', () => ({ saveBlob: vi.fn() }))

// Ce qu'un stagiaire a envoyé sur son inscription, vu par le formateur ou la chargée de formation (G17) :
// une coche verte (et le texte) s'il a envoyé au moins un document, un lien par fichier pour l'ouvrir.
const lea = INSCRITS[0].stagiaire // id 20, inscription 1
const document = (id, fileName, uploadedBy = lea, inscriptionId = 1) => ({
  id,
  fileName,
  fileUrl: `https://supabase.test/storage/${id}`,
  fileSize: 2048,
  mimeType: 'application/pdf',
  uploadedBy,
  formationId: null,
  inscriptionId,
  createdAt: '2026-03-01T10:00:00',
})

function renderSent(documents, { options, props } = {}) {
  mockSession('SUPER_ADMIN')
  const api = mockDocumentApi(documents, options)
  const view = renderWithProviders(<SentDocuments inscriptionId={1} stagiaireId={lea.id} {...props} />)
  return { api, ...view }
}

beforeEach(() => saveBlob.mockClear())

describe('SentDocuments', () => {
  it('annonce le chargement, puis une coche « Documents envoyés » et un lien par fichier', async () => {
    renderSent([document(701, 'Carte-identite.pdf'), document(702, 'Diplome.pdf')])
    expect(screen.getByRole('status')).toHaveTextContent('Chargement…')
    expect(await screen.findByText('Documents envoyés')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Télécharger Carte-identite.pdf' })).toHaveTextContent('Carte-identite.pdf')
    expect(screen.getByRole('button', { name: 'Télécharger Diplome.pdf' })).toBeInTheDocument()
    expect(screen.queryByText('Aucun document envoyé')).not.toBeInTheDocument()
  })

  it('affiche « Aucun document envoyé » sans coche quand le stagiaire n’a rien envoyé', async () => {
    renderSent([])
    expect(await screen.findByText('Aucun document envoyé')).toBeInTheDocument()
    expect(screen.queryByText('Documents envoyés')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('ne compte pas les documents déposés par un autre que le stagiaire', async () => {
    renderSent([document(703, 'Convocation.pdf', USERS.SUPER_ADMIN)])
    expect(await screen.findByText('Aucun document envoyé')).toBeInTheDocument()
    expect(screen.queryByText('Convocation.pdf')).not.toBeInTheDocument()
  })

  it('ne lit que l’inscription demandée', async () => {
    const { api } = renderSent([document(701, 'Carte-identite.pdf'), document(704, 'Autre.pdf', lea, 2)])
    await screen.findByText('Documents envoyés')
    expect(screen.queryByText('Autre.pdf')).not.toBeInTheDocument()
    expect(api.calls.listUrls).toHaveLength(1)
    expect(api.calls.listUrls[0]).toContain('inscriptionId=1')
    expect(api.calls.listUrls[0]).not.toContain('formationId')
  })

  it('ouvre un document en le téléchargeant sous son nom d’origine', async () => {
    const { api } = renderSent([document(701, 'Carte-identite.pdf')])
    await userEvent.click(await screen.findByRole('button', { name: 'Télécharger Carte-identite.pdf' }))
    await waitFor(() => expect(saveBlob).toHaveBeenCalledTimes(1))
    expect(api.calls.downloaded).toEqual([701])
    expect(saveBlob.mock.calls[0][1]).toBe('Carte-identite.pdf')
  })

  it('annonce une erreur de téléchargement', async () => {
    renderSent([document(701, 'Carte-identite.pdf')], { options: { errors: { download: { status: 403, message: 'x' } } } })
    await userEvent.click(await screen.findByRole('button', { name: 'Télécharger Carte-identite.pdf' }))
    expect(await screen.findByRole('alert')).toHaveTextContent("Vous n'avez pas accès à ce document.")
    expect(saveBlob).not.toHaveBeenCalled()
  })

  it('affiche l’erreur de la liste avec « Réessayer »', async () => {
    renderSent([], { options: { errors: { list: { status: 500, message: 'Liste indisponible' } } } })
    expect(await screen.findByRole('alert')).toHaveTextContent('Liste indisponible')
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeInTheDocument()
  })

  it('rend un nom de fichier contenant du HTML en texte', async () => {
    const { container } = renderSent([document(705, '<img src=x onerror=alert(1)>.pdf')])
    expect(await screen.findByText('<img src=x onerror=alert(1)>.pdf')).toBeInTheDocument()
    expect(container.querySelector('img')).toBeNull()
  })

  it('n’a aucune violation jest-axe', async () => {
    const { container } = renderSent([document(701, 'Carte-identite.pdf')])
    await screen.findByText('Documents envoyés')
    expect(await axe(container)).toHaveNoViolations()
  })
})
