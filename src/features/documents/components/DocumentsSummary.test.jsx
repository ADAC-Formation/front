import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { mockDocumentApi } from '../../../test/documents'
import { FORMATIONS, mockFormationList, mockFormationListError } from '../../../test/formations'
import { renderWithProviders } from '../../../test/render'
import { USERS, mockSession } from '../../../test/session'
import DocumentsSummary from './DocumentsSummary'

// Résumé « Mes documents » du profil (G16) : tous les dépôts du stagiaire, avec la formation où chacun a
// été déposé. Lecture seule : le dépôt, le téléchargement et la suppression sont sur la page de la formation.
const [psc1, excel, gestes] = FORMATIONS
const mine = [
  { ...gestes, inscriptionId: 9 },
  { ...psc1, inscriptionId: 7 },
  { ...excel, inscriptionId: 8 },
]

const document = (id, fileName, inscriptionId, createdAt) => ({
  id,
  fileName,
  fileUrl: `https://supabase.test/storage/${id}`,
  fileSize: 2048,
  mimeType: 'application/pdf',
  uploadedBy: USERS.STAGIAIRE,
  formationId: null,
  inscriptionId,
  createdAt,
})
const MY_DOCUMENTS = [
  document(601, 'Justificatif.pdf', 7, '2026-03-01T10:00:00'),
  document(602, 'Ancien.pdf', 9, '2025-11-04T10:00:00'),
  document(603, 'Tableau.pdf', 8, '2026-03-05T10:00:00'),
]

const api = (documents = MY_DOCUMENTS, options = {}) =>
  mockDocumentApi(documents, { uploader: USERS.STAGIAIRE, ...options })

function renderSummary(formations = mine) {
  mockSession('STAGIAIRE')
  mockFormationList(formations)
  return renderWithProviders(<DocumentsSummary />)
}

describe('DocumentsSummary', () => {
  it('annonce le chargement puis liste tous les dépôts, le plus récent d’abord', async () => {
    api()
    renderSummary()
    expect(screen.getByRole('heading', { level: 2, name: 'Mes documents' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Chargement…')
    await screen.findByText('Justificatif.pdf')
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(3))
    const names = screen.getAllByRole('listitem').map((item) => item.querySelector('p').textContent)
    expect(names).toEqual(['Tableau.pdf', 'Justificatif.pdf', 'Ancien.pdf'])
  })

  it('indique la formation de chaque document, avec un lien vers sa page', async () => {
    api()
    renderSummary()
    const item = (await screen.findByText('Justificatif.pdf')).closest('li')
    expect(item).toHaveTextContent('Déposé dans Premiers secours PSC1')
    expect(within(item).getByRole('link', { name: 'Premiers secours PSC1' })).toHaveAttribute('href', '/formations/101')
    const archived = await screen.findByText('Ancien.pdf')
    expect(within(archived.closest('li')).getByRole('link', { name: 'Gestes et postures' })).toHaveAttribute(
      'href',
      '/formations/103',
    )
  })

  it('est en lecture seule : ni dépôt, ni téléchargement, ni suppression', async () => {
    api()
    renderSummary()
    await screen.findByText('Justificatif.pdf')
    expect(screen.queryByRole('group', { name: 'Zone de dépôt de documents' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('n’interroge que les inscriptions du stagiaire, jamais une formation', async () => {
    const { calls } = api()
    renderSummary([...mine, { ...FORMATIONS[0], id: 999 }])
    await screen.findByText('Justificatif.pdf')
    await screen.findByText('Ancien.pdf')
    expect(calls.list).toBe(3)
    expect(calls.listUrls.every((url) => url.includes('inscriptionId=') && !url.includes('formationId'))).toBe(true)
  })

  it('affiche un message sans formation', async () => {
    api()
    renderSummary([])
    expect(await screen.findByText("Vous n'êtes inscrit à aucune formation pour le moment")).toBeInTheDocument()
  })

  it('explique où déposer quand aucun document n’existe', async () => {
    api([])
    renderSummary()
    expect(await screen.findByText('Aucun document déposé pour le moment')).toBeInTheDocument()
    expect(screen.getByText(/depuis la page de chaque formation/)).toBeInTheDocument()
  })

  it('affiche l’erreur de la liste des formations avec « Réessayer »', async () => {
    api()
    mockSession('STAGIAIRE')
    mockFormationListError(500)
    renderWithProviders(<DocumentsSummary />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Erreur serveur')
    mockFormationList(mine)
    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }))
    expect(await screen.findByText('Justificatif.pdf')).toBeInTheDocument()
  })

  it('garde les documents des autres formations quand une liste échoue, avec « Réessayer »', async () => {
    api(MY_DOCUMENTS, { errors: { list: (id) => (id === 8 ? { status: 500, message: 'Liste indisponible' } : null) } })
    renderSummary()
    expect(await screen.findByRole('alert')).toHaveTextContent('Liste indisponible')
    expect(await screen.findByText('Justificatif.pdf')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeInTheDocument()
  })

  it('ignore une formation sans inscriptionId, sans appel', async () => {
    const { calls } = api()
    renderSummary([{ ...psc1 }, { ...excel, inscriptionId: 8 }])
    await screen.findByText('Tableau.pdf')
    expect(calls.list).toBe(1)
    expect(screen.queryByText('Justificatif.pdf')).not.toBeInTheDocument()
  })

  it('rend un nom de fichier contenant du HTML en texte', async () => {
    api([document(604, '<img src=x onerror=alert(1)>.pdf', 7, '2026-03-02T10:00:00')])
    const { container } = renderSummary()
    expect(await screen.findByText('<img src=x onerror=alert(1)>.pdf')).toBeInTheDocument()
    expect(container.querySelector('img')).toBeNull()
  })

  it('n’a aucune violation jest-axe', async () => {
    api()
    const { container } = renderSummary()
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(3))
    expect(await axe(container)).toHaveNoViolations()
  })
})
