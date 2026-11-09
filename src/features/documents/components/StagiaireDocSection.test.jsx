import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockDocumentApi } from '../../../test/documents'
import { FORMATIONS, mockFormationList, mockFormationListError } from '../../../test/formations'
import { renderWithProviders } from '../../../test/render'
import { USERS, mockSession } from '../../../test/session'
import { saveBlob } from '../saveBlob'
import StagiaireDocSection from './StagiaireDocSection'

vi.mock('../saveBlob', () => ({ saveBlob: vi.fn() }))

// Le stagiaire est inscrit à trois formations : 101 et 102 actives, 103 archivée (renvoyée en premier
// par le back pour vérifier le tri). `inscriptionId` : champ de la formation du stagiaire (back, Q13 réglée).
const [psc1, excel, gestes] = FORMATIONS
const mine = [
  { ...gestes, inscriptionId: 9 },
  { ...psc1, inscriptionId: 7 },
  { ...excel, inscriptionId: 8 },
]

const document = (id, fileName, inscriptionId) => ({
  id,
  fileName,
  fileUrl: `https://supabase.test/storage/${id}`,
  fileSize: 2048,
  mimeType: 'application/pdf',
  uploadedBy: USERS.STAGIAIRE,
  formationId: null,
  inscriptionId,
  createdAt: '2026-03-01T10:00:00',
})
const MY_DOCUMENTS = [document(601, 'Justificatif.pdf', 7), document(602, 'Ancien.pdf', 9)]

const api = (documents = MY_DOCUMENTS, options = {}) =>
  mockDocumentApi(documents, { uploader: USERS.STAGIAIRE, ...options })
const pdf = (name) => new File(['contenu'], name, { type: 'application/pdf' })
const regionOf = (title) => screen.findByRole('region', { name: title })
const zoneIn = (region) => within(region).queryByRole('group', { name: 'Zone de dépôt de documents' })
const drop = (region, files) => fireEvent.drop(zoneIn(region), { dataTransfer: { files } })

function renderSection(formations = mine) {
  mockSession('STAGIAIRE')
  mockFormationList(formations)
  return renderWithProviders(<StagiaireDocSection />)
}

beforeEach(() => saveBlob.mockClear())

describe('StagiaireDocSection — formations', () => {
  it('annonce le chargement puis une sous-section par formation, les actives avant l’archivée', async () => {
    api()
    renderSection()
    expect(screen.getByRole('heading', { level: 2, name: 'Mes documents' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Chargement…')
    await regionOf('Premiers secours PSC1')
    const titles = screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)
    expect(titles).toEqual(['Premiers secours PSC1', 'Excel niveau 1', 'Gestes et postures'])
  })

  it('affiche un message sans formation', async () => {
    api()
    renderSection([])
    expect(await screen.findByText("Vous n'êtes inscrit à aucune formation pour le moment")).toBeInTheDocument()
  })

  it('affiche l’erreur de la liste des formations avec « Réessayer »', async () => {
    api()
    mockFormationListError(500)
    renderWithProviders(<StagiaireDocSection />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Erreur serveur')
    mockFormationList(mine)
    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }))
    expect(await regionOf('Premiers secours PSC1')).toBeInTheDocument()
  })
})

describe('StagiaireDocSection — liste et téléchargement', () => {
  it('liste les documents de chaque inscription, sans expéditeur', async () => {
    const { calls } = api()
    renderSection()
    const first = await regionOf('Premiers secours PSC1')
    expect(await within(first).findByText('Justificatif.pdf')).toBeInTheDocument()
    expect(within(first).getByText(/PDF · 2 Ko/)).toBeInTheDocument()
    const archived = await regionOf('Gestes et postures')
    expect(await within(archived).findByText('Ancien.pdf')).toBeInTheDocument()
    expect(within(first).queryByText('Ancien.pdf')).not.toBeInTheDocument()
    expect(screen.queryByText(/Envoyé par/)).not.toBeInTheDocument()
    expect(calls.listUrls.every((url) => url.includes('inscriptionId=') && !url.includes('formationId'))).toBe(true)
  })

  it('affiche « Aucun document déposé pour cette formation » quand la liste est vide', async () => {
    api([])
    renderSection([mine[1]])
    expect(await screen.findByText('Aucun document déposé pour cette formation')).toBeInTheDocument()
  })

  it('limite l’erreur d’une liste à sa formation, avec « Réessayer »', async () => {
    api(MY_DOCUMENTS, { errors: { list: (id) => (id === 8 ? { status: 500, message: 'Liste indisponible' } : null) } })
    renderSection()
    const failing = await regionOf('Excel niveau 1')
    expect(await within(failing).findByRole('alert')).toHaveTextContent('Liste indisponible')
    expect(within(failing).getByRole('button', { name: 'Réessayer' })).toBeInTheDocument()
    const healthy = await regionOf('Premiers secours PSC1')
    expect(await within(healthy).findByText('Justificatif.pdf')).toBeInTheDocument()
    expect(within(healthy).queryByRole('alert')).not.toBeInTheDocument()
  })

  it('rend un nom de fichier contenant du HTML en texte', async () => {
    api([document(603, '<img src=x onerror=alert(1)>.pdf', 7)])
    const { container } = renderSection([mine[1]])
    expect(await screen.findByText('<img src=x onerror=alert(1)>.pdf')).toBeInTheDocument()
    expect(container.querySelector('img')).toBeNull()
  })

  it('télécharge un document sous son nom d’origine', async () => {
    const { calls } = api()
    renderSection()
    await userEvent.click(await screen.findByRole('button', { name: 'Télécharger Justificatif.pdf' }))
    await waitFor(() => expect(saveBlob).toHaveBeenCalledTimes(1))
    expect(calls.downloaded).toEqual([601])
    expect(saveBlob.mock.calls[0][1]).toBe('Justificatif.pdf')
  })

  it('annonce une erreur de téléchargement', async () => {
    api(MY_DOCUMENTS, { errors: { download: { status: 403, message: 'x' } } })
    renderSection()
    await userEvent.click(await screen.findByRole('button', { name: 'Télécharger Justificatif.pdf' }))
    expect(await screen.findByRole('alert')).toHaveTextContent("Vous n'avez pas accès à ce document.")
    expect(saveBlob).not.toHaveBeenCalled()
  })
})

describe('StagiaireDocSection — suppression', () => {
  const OTHERS = { ...USERS.ADMIN, id: 2 }
  const withOthers = [...MY_DOCUMENTS, { ...document(603, 'Programme.pdf', 7), uploadedBy: OTHERS }]
  const askDelete = async (name) => {
    await userEvent.click(await screen.findByRole('button', { name: `Supprimer ${name}` }))
    return screen.getByRole('dialog')
  }

  it('propose « Supprimer » sur ses propres dépôts, pas sur ceux des autres', async () => {
    api(withOthers)
    renderSection()
    const region = await regionOf('Premiers secours PSC1')
    expect(await within(region).findByRole('button', { name: 'Supprimer Justificatif.pdf' })).toBeInTheDocument()
    expect(within(region).getByRole('button', { name: 'Télécharger Programme.pdf' })).toBeInTheDocument()
    expect(within(region).queryByRole('button', { name: 'Supprimer Programme.pdf' })).not.toBeInTheDocument()
  })

  it('ne propose pas « Supprimer » sur une formation archivée', async () => {
    api()
    renderSection()
    const region = await regionOf('Gestes et postures')
    await within(region).findByRole('button', { name: 'Télécharger Ancien.pdf' })
    expect(within(region).queryByRole('button', { name: /Supprimer/ })).not.toBeInTheDocument()
  })

  it('demande confirmation, supprime, annonce le succès et retire le document de la liste', async () => {
    const { calls } = api()
    renderSection()
    const dialog = await askDelete('Justificatif.pdf')
    expect(dialog).toHaveTextContent('Justificatif.pdf')
    expect(dialog).toHaveTextContent(/définitive/i)
    await userEvent.click(within(dialog).getByRole('button', { name: 'Supprimer' }))
    expect(await screen.findByText('Document supprimé')).toBeInTheDocument()
    expect(calls.deleted).toEqual([601])
    await waitFor(() => expect(screen.queryByText('Justificatif.pdf')).not.toBeInTheDocument())
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('n’appelle rien quand on annule', async () => {
    const { calls } = api()
    renderSection()
    const dialog = await askDelete('Justificatif.pdf')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Annuler' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(calls.deleted).toEqual([])
  })

  it('annonce le refus du back (403) et garde le document', async () => {
    api(MY_DOCUMENTS, { errors: { delete: { status: 403, message: 'Vous ne pouvez supprimer que vos propres documents' } } })
    renderSection()
    const dialog = await askDelete('Justificatif.pdf')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Supprimer' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Vous ne pouvez supprimer que vos propres documents')
    expect(screen.getByText('Justificatif.pdf')).toBeInTheDocument()
  })
})

describe('StagiaireDocSection — dépôt', () => {
  it('offre la zone de dépôt sur les formations actives seulement', async () => {
    api()
    renderSection()
    const active = await regionOf('Premiers secours PSC1')
    const archived = await regionOf('Gestes et postures')
    expect(await within(active).findByRole('group', { name: 'Zone de dépôt de documents' })).toBeInTheDocument()
    expect(zoneIn(archived)).not.toBeInTheDocument()
    expect(await within(archived).findByText('Ancien.pdf')).toBeInTheDocument()
  })

  it('dépose avec l’inscriptionId, annonce le succès et ajoute le document à la liste', async () => {
    const { calls } = api()
    renderSection()
    const region = await regionOf('Premiers secours PSC1')
    await within(region).findByText('Justificatif.pdf')
    drop(region, [pdf('Attestation.pdf')])
    expect(await within(region).findByText('1 document envoyé')).toBeInTheDocument()
    expect(await within(region).findByText('Attestation.pdf')).toBeInTheDocument()
    expect(calls.uploaded).toEqual([{ fileName: 'Attestation.pdf', formationId: null, inscriptionId: 7 }])
  })

  it('refuse un type non autorisé sans appel et l’annonce avec son nom', async () => {
    const { calls } = api()
    renderSection()
    const region = await regionOf('Premiers secours PSC1')
    await within(region).findByText('Justificatif.pdf')
    drop(region, [new File(['x'], 'virus.exe')])
    expect(await within(region).findByRole('alert')).toHaveTextContent('virus.exe : Format non autorisé')
    expect(calls.uploaded).toEqual([])
  })

  it('liste le refus du back pour un fichier sans bloquer les autres', async () => {
    const { calls } = api(MY_DOCUMENTS, {
      errors: { upload: (name) => (name === 'b.pdf' ? { status: 400, message: 'Format non autorisé' } : null) },
    })
    renderSection()
    const region = await regionOf('Premiers secours PSC1')
    await within(region).findByText('Justificatif.pdf')
    drop(region, [pdf('a.pdf'), pdf('b.pdf'), pdf('c.pdf')])
    expect(await within(region).findByRole('alert')).toHaveTextContent('b.pdf : Format non autorisé')
    expect(calls.uploaded.map((upload) => upload.fileName)).toEqual(['a.pdf', 'b.pdf', 'c.pdf'])
    expect(await within(region).findByText('2 documents envoyés')).toBeInTheDocument()
  })

  it('un dépôt dans une formation ne touche pas les autres sous-sections', async () => {
    api()
    renderSection()
    const region = await regionOf('Premiers secours PSC1')
    const other = await regionOf('Excel niveau 1')
    await within(region).findByText('Justificatif.pdf')
    drop(region, [pdf('Attestation.pdf')])
    await within(region).findByText('1 document envoyé')
    expect(within(other).queryByText('1 document envoyé')).not.toBeInTheDocument()
    expect(within(other).queryByText('Attestation.pdf')).not.toBeInTheDocument()
  })
})

describe('StagiaireDocSection — sans inscriptionId (stagiaire non inscrit)', () => {
  it('affiche « Dépôt indisponible pour le moment » sans aucun appel à /documents', async () => {
    const { calls } = api()
    renderSection([{ ...psc1 }])
    const region = await regionOf('Premiers secours PSC1')
    expect(within(region).getByText('Dépôt indisponible pour le moment')).toBeInTheDocument()
    expect(zoneIn(region)).not.toBeInTheDocument()
    expect(within(region).queryByRole('button', { name: /Télécharger/ })).not.toBeInTheDocument()
    await waitFor(() => expect(calls.list).toBe(0))
  })

  it('n’affecte pas les formations qui ont un inscriptionId', async () => {
    api()
    renderSection([{ ...psc1 }, { ...excel, inscriptionId: 8 }])
    expect(within(await regionOf('Premiers secours PSC1')).getByText('Dépôt indisponible pour le moment')).toBeInTheDocument()
    expect(await within(await regionOf('Excel niveau 1')).findByRole('group', { name: 'Zone de dépôt de documents' })).toBeInTheDocument()
  })
})

describe('StagiaireDocSection — accessibilité', () => {
  it('n’a aucune violation jest-axe', async () => {
    api()
    const { container } = renderSection()
    await screen.findByText('Justificatif.pdf')
    expect(await axe(container)).toHaveNoViolations()
  })
})
