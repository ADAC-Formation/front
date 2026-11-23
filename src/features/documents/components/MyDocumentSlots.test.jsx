import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockDocumentApi } from '../../../test/documents'
import { mockFormationDocumentTypes } from '../../../test/documentTypes'
import { FORMATIONS } from '../../../test/formations'
import { renderWithProviders } from '../../../test/render'
import { USERS, mockSession } from '../../../test/session'
import { saveBlob } from '../saveBlob'
import MyDocumentsSection from './MyDocumentsSection'

vi.mock('../saveBlob', () => ({ saveBlob: vi.fn() }))

// « Mes documents » du stagiaire : un créneau par type de document à envoyer pour la formation, rouge tant
// que rien n'est déposé, vert ensuite ; ce qu'il envoie en plus apparaît en neutre dans « Autres documents ».
// Un fichier est rattaché à son créneau par son nom (« <type> - <fichier> », voir documentSlots.js).
const [psc1, , gestes] = FORMATIONS
const active = { ...psc1, inscriptionId: 7 }
const archived = { ...gestes, inscriptionId: 9 }

const document = (id, fileName, inscriptionId = 7) => ({
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

const IDENTITE = {
  id: 1,
  nom: 'Pièce d’identité',
  aide: 'Recto-verso, en cours de validité.',
  isSensitive: true,
  appliesToAllFormations: true,
  categories: [],
  deadlineDays: 7,
  deadlineAnchor: 'BEFORE_START',
  allowedFormats: [],
  isActive: true,
}
const CV = {
  ...IDENTITE,
  id: 2,
  nom: 'CV',
  aide: null,
  isSensitive: false,
  deadlineDays: null,
  deadlineAnchor: null,
  allowedFormats: ['pdf'],
}

const api = (documents = []) => mockDocumentApi(documents, { uploader: USERS.STAGIAIRE })
const pdf = (name) => new File(['contenu'], name, { type: 'application/pdf' })
const slotOf = (name) => screen.findByRole('group', { name })
const fileInputOf = (slot, name) => within(slot).getByLabelText(`Choisir un fichier pour ${name}`)

function renderSection(formation = active) {
  mockSession('STAGIAIRE')
  return renderWithProviders(<MyDocumentsSection formation={formation} />)
}

beforeEach(() => saveBlob.mockClear())

describe('MyDocumentsSection — créneaux des documents à envoyer', () => {
  it('affiche un créneau par type, avec son aide et son délai', async () => {
    mockFormationDocumentTypes([IDENTITE, CV])
    api()
    renderSection()
    const slot = within(await slotOf('Pièce d’identité'))
    expect(slot.getByText('Recto-verso, en cours de validité.')).toBeInTheDocument()
    expect(slot.getByText('7 jours avant le début')).toBeInTheDocument()
    expect(await slotOf('CV')).toBeInTheDocument()
  })

  it('lit les types de la formation du stagiaire', async () => {
    const calls = mockFormationDocumentTypes([IDENTITE])
    api()
    renderSection()
    await slotOf('Pièce d’identité')
    expect(calls.urls[0]).toContain(`/formations/${active.id}/document-types`)
  })

  it('est rouge et « À envoyer » tant que rien n’est déposé', async () => {
    mockFormationDocumentTypes([IDENTITE])
    api()
    renderSection()
    const slot = await slotOf('Pièce d’identité')
    expect(slot).toHaveAttribute('data-status', 'missing')
    expect(within(slot).getByText('À envoyer')).toBeInTheDocument()
  })

  it('devient verte et « Envoyé » avec le document déposé, listé avec Télécharger et Supprimer', async () => {
    mockFormationDocumentTypes([IDENTITE])
    api([document(610, 'Pièce d’identité - recto.pdf')])
    renderSection()
    const slot = await slotOf('Pièce d’identité')
    await within(slot).findByText('Pièce d’identité - recto.pdf')
    expect(slot).toHaveAttribute('data-status', 'sent')
    expect(within(slot).getByText('Envoyé')).toBeInTheDocument()
    expect(within(slot).getByRole('button', { name: 'Télécharger Pièce d’identité - recto.pdf' })).toBeInTheDocument()
    expect(within(slot).getByRole('button', { name: 'Supprimer Pièce d’identité - recto.pdf' })).toBeInTheDocument()
  })

  it('range dans « Autres documents », en neutre, ce qui n’est dans aucun créneau', async () => {
    mockFormationDocumentTypes([IDENTITE])
    api([document(611, 'Programme perso.pdf')])
    renderSection()
    const slot = await slotOf('Pièce d’identité')
    const others = (await screen.findByRole('heading', { level: 3, name: 'Autres documents' })).closest('div')
    expect(await within(others).findByText('Programme perso.pdf')).toBeInTheDocument()
    expect(within(slot).queryByText('Programme perso.pdf')).not.toBeInTheDocument()
    expect(others).not.toHaveAttribute('data-status')
  })

  it('dépose depuis un créneau sous « <type> - <fichier> », sur l’inscription, et passe au vert', async () => {
    mockFormationDocumentTypes([IDENTITE])
    const { calls } = api()
    renderSection()
    const slot = await slotOf('Pièce d’identité')
    fireEvent.change(fileInputOf(slot, 'Pièce d’identité'), { target: { files: [pdf('scan.pdf')] } })
    await waitFor(() => expect(slot).toHaveAttribute('data-status', 'sent'))
    expect(calls.uploaded).toEqual([{ fileName: 'Pièce d’identité - scan.pdf', formationId: null, inscriptionId: 7 }])
    expect(await screen.findByText('1 document envoyé')).toBeInTheDocument()
  })

  it('refuse un format que le type n’accepte pas, sans appel', async () => {
    mockFormationDocumentTypes([CV])
    const { calls } = api()
    renderSection()
    const slot = await slotOf('CV')
    fireEvent.change(fileInputOf(slot, 'CV'), { target: { files: [new File(['x'], 'cv.png', { type: 'image/png' })] } })
    expect(await within(slot).findByRole('alert')).toHaveTextContent('Ce document accepte seulement : PDF.')
    expect(calls.uploaded).toEqual([])
    expect(slot).toHaveAttribute('data-status', 'missing')
  })

  it('limite le sélecteur de fichiers aux formats du type', async () => {
    mockFormationDocumentTypes([CV, IDENTITE])
    api()
    renderSection()
    const cv = await slotOf('CV')
    const identite = await slotOf('Pièce d’identité')
    expect(fileInputOf(cv, 'CV')).toHaveAttribute('accept', '.pdf')
    expect(fileInputOf(identite, 'Pièce d’identité').getAttribute('accept')).toContain('.docx')
  })

  it('refuse un format hors règle générale avant l’envoi, comme le dépôt libre', async () => {
    mockFormationDocumentTypes([IDENTITE])
    const { calls } = api()
    renderSection()
    const slot = await slotOf('Pièce d’identité')
    fireEvent.change(fileInputOf(slot, 'Pièce d’identité'), { target: { files: [new File(['x'], 'virus.exe')] } })
    expect(await screen.findByRole('alert')).toHaveTextContent('Format non autorisé')
    expect(calls.uploaded).toEqual([])
  })

  it('n’offre aucun dépôt dans les créneaux d’une formation archivée', async () => {
    mockFormationDocumentTypes([IDENTITE])
    api()
    renderSection(archived)
    const slot = await slotOf('Pièce d’identité')
    expect(within(slot).queryByLabelText('Choisir un fichier pour Pièce d’identité')).not.toBeInTheDocument()
    expect(within(slot).queryByRole('button', { name: /Envoyer|Choisir/ })).not.toBeInTheDocument()
  })

  it('annonce l’erreur de chargement des types et garde le dépôt libre', async () => {
    mockFormationDocumentTypes([], { errorStatus: 500 })
    api()
    renderSection()
    expect(await screen.findByText('Erreur serveur')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Zone de dépôt de documents' })).toBeInTheDocument()
  })

  it('n’a aucune violation jest-axe avec des créneaux rouges et verts', async () => {
    mockFormationDocumentTypes([IDENTITE, CV])
    api([document(612, 'CV - mon cv.pdf')])
    const { container } = renderSection()
    await screen.findByText('CV - mon cv.pdf')
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('MyDocumentsSection — pièces de l’ADAC (G35)', () => {
  it('ne propose aucun créneau pour un type fourni par l’ADAC', async () => {
    mockFormationDocumentTypes([IDENTITE, { ...CV, id: 3, nom: 'Feuille d’émargement', providedBy: 'ADAC' }])
    api()
    renderSection()
    await slotOf('Pièce d’identité')
    expect(screen.queryByRole('group', { name: 'Feuille d’émargement' })).not.toBeInTheDocument()
  })
})
