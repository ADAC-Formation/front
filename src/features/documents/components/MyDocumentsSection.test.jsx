import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockDocumentApi } from '../../../test/documents'
import { FORMATIONS } from '../../../test/formations'
import { renderWithProviders } from '../../../test/render'
import { USERS, mockSession } from '../../../test/session'
import { saveBlob } from '../saveBlob'
import MyDocumentsSection from './MyDocumentsSection'

vi.mock('../saveBlob', () => ({ saveBlob: vi.fn() }))

// Section « Mes documents » du détail d'une formation, vue par le stagiaire (G16). `inscriptionId` :
// champ de la formation que le back renseigne pour le stagiaire inscrit (Q13 réglée).
const [psc1, , gestes] = FORMATIONS
const active = { ...psc1, inscriptionId: 7 }
const archived = { ...gestes, inscriptionId: 9 }

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
const region = () => screen.findByRole('region', { name: 'Mes documents' })
const zoneIn = (section) => within(section).queryByRole('group', { name: 'Zone de dépôt de documents' })
const drop = (section, files) => fireEvent.drop(zoneIn(section), { dataTransfer: { files } })

function renderSection(formation = active) {
  mockSession('STAGIAIRE')
  return renderWithProviders(<MyDocumentsSection formation={formation} />)
}

beforeEach(() => saveBlob.mockClear())

describe('MyDocumentsSection — liste et téléchargement', () => {
  it('annonce le chargement puis liste les documents de son inscription, sans expéditeur', async () => {
    const { calls } = api()
    renderSection()
    expect(screen.getByRole('heading', { level: 2, name: 'Mes documents' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Chargement…')
    const section = await region()
    expect(await within(section).findByText('Justificatif.pdf')).toBeInTheDocument()
    expect(within(section).getByText(/PDF · 2 Ko/)).toBeInTheDocument()
    expect(within(section).queryByText('Ancien.pdf')).not.toBeInTheDocument()
    expect(screen.queryByText(/Envoyé par/)).not.toBeInTheDocument()
    expect(calls.listUrls.every((url) => url.includes('inscriptionId=7') && !url.includes('formationId'))).toBe(true)
  })

  it('affiche « Aucun document déposé pour cette formation » quand la liste est vide', async () => {
    api([])
    renderSection()
    expect(await screen.findByText('Aucun document déposé pour cette formation')).toBeInTheDocument()
  })

  it('affiche l’erreur de la liste avec « Réessayer »', async () => {
    api(MY_DOCUMENTS, { errors: { list: { status: 500, message: 'Liste indisponible' } } })
    renderSection()
    expect(await screen.findByRole('alert')).toHaveTextContent('Liste indisponible')
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeInTheDocument()
  })

  it('rend un nom de fichier contenant du HTML en texte', async () => {
    api([document(603, '<img src=x onerror=alert(1)>.pdf', 7)])
    const { container } = renderSection()
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

describe('MyDocumentsSection — suppression', () => {
  const OTHERS = { ...USERS.ADMIN, id: 2 }
  const withOthers = [...MY_DOCUMENTS, { ...document(603, 'Programme.pdf', 7), uploadedBy: OTHERS }]
  const askDelete = async (name) => {
    await userEvent.click(await screen.findByRole('button', { name: `Supprimer ${name}` }))
    return screen.getByRole('dialog')
  }

  it('propose « Supprimer » sur ses propres dépôts, pas sur ceux des autres', async () => {
    api(withOthers)
    renderSection()
    const section = await region()
    expect(await within(section).findByRole('button', { name: 'Supprimer Justificatif.pdf' })).toBeInTheDocument()
    expect(within(section).getByRole('button', { name: 'Télécharger Programme.pdf' })).toBeInTheDocument()
    expect(within(section).queryByRole('button', { name: 'Supprimer Programme.pdf' })).not.toBeInTheDocument()
  })

  it('ne propose pas « Supprimer » sur une formation archivée', async () => {
    api()
    renderSection(archived)
    await screen.findByRole('button', { name: 'Télécharger Ancien.pdf' })
    expect(screen.queryByRole('button', { name: /Supprimer/ })).not.toBeInTheDocument()
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

describe('MyDocumentsSection — dépôt', () => {
  it('offre la zone de dépôt sur une formation active', async () => {
    api()
    renderSection()
    expect(await within(await region()).findByRole('group', { name: 'Zone de dépôt de documents' })).toBeInTheDocument()
  })

  it('n’offre pas la zone de dépôt sur une formation archivée, mais garde la liste', async () => {
    api()
    renderSection(archived)
    const section = await region()
    expect(await within(section).findByText('Ancien.pdf')).toBeInTheDocument()
    expect(zoneIn(section)).not.toBeInTheDocument()
  })

  it('dépose avec l’inscriptionId, annonce le succès et ajoute le document à la liste', async () => {
    const { calls } = api()
    renderSection()
    const section = await region()
    await within(section).findByText('Justificatif.pdf')
    drop(section, [pdf('Attestation.pdf')])
    expect(await within(section).findByText('1 document envoyé')).toBeInTheDocument()
    expect(await within(section).findByText('Attestation.pdf')).toBeInTheDocument()
    expect(calls.uploaded).toEqual([{ fileName: 'Attestation.pdf', formationId: null, inscriptionId: 7 }])
  })

  it('refuse un type non autorisé sans appel et l’annonce avec son nom', async () => {
    const { calls } = api()
    renderSection()
    const section = await region()
    await within(section).findByText('Justificatif.pdf')
    drop(section, [new File(['x'], 'virus.exe')])
    expect(await within(section).findByRole('alert')).toHaveTextContent('virus.exe : Format non autorisé')
    expect(calls.uploaded).toEqual([])
  })

  it('liste le refus du back pour un fichier sans bloquer les autres', async () => {
    const { calls } = api(MY_DOCUMENTS, {
      errors: { upload: (name) => (name === 'b.pdf' ? { status: 400, message: 'Format non autorisé' } : null) },
    })
    renderSection()
    const section = await region()
    await within(section).findByText('Justificatif.pdf')
    drop(section, [pdf('a.pdf'), pdf('b.pdf'), pdf('c.pdf')])
    expect(await within(section).findByRole('alert')).toHaveTextContent('b.pdf : Format non autorisé')
    expect(calls.uploaded.map((upload) => upload.fileName)).toEqual(['a.pdf', 'b.pdf', 'c.pdf'])
    expect(await within(section).findByText('2 documents envoyés')).toBeInTheDocument()
  })
})

describe('MyDocumentsSection — sans inscriptionId', () => {
  it('affiche « Dépôt indisponible pour le moment » sans aucun appel à /documents', async () => {
    const { calls } = api()
    renderSection({ ...psc1 })
    const section = await region()
    expect(within(section).getByText('Dépôt indisponible pour le moment')).toBeInTheDocument()
    expect(zoneIn(section)).not.toBeInTheDocument()
    expect(within(section).queryByRole('button', { name: /Télécharger/ })).not.toBeInTheDocument()
    await waitFor(() => expect(calls.list).toBe(0))
  })
})

describe('MyDocumentsSection — accessibilité', () => {
  it('n’a aucune violation jest-axe', async () => {
    api()
    const { container } = renderSection()
    await screen.findByText('Justificatif.pdf')
    expect(await axe(container)).toHaveNoViolations()
  })
})
