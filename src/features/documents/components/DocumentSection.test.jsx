import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DOCUMENTS, mockDocumentApi } from '../../../test/documents'
import { AUTRE_FORMATEUR, FORMATIONS } from '../../../test/formations'
import { renderWithProviders } from '../../../test/render'
import { mockSession } from '../../../test/session'
import { saveBlob } from '../saveBlob'
import DocumentSection from './DocumentSection'

vi.mock('../saveBlob', () => ({ saveBlob: vi.fn() }))

// La formation 101 est active et confiée à USERS.ADMIN (id 2) ; ses documents : un envoi du
// formateur (501), un envoi de la chargée de formation (502).
const formation = FORMATIONS.find((candidate) => candidate.id === 101)
const archived = { ...formation, status: 'ARCHIVED' }
const ofAnotherTrainer = { ...formation, formateur: AUTRE_FORMATEUR }

function renderSection(role, target = formation) {
  mockSession(role)
  return renderWithProviders(<DocumentSection formation={target} />, { withSession: true })
}

const zone = () => screen.queryByRole('group', { name: 'Zone de dépôt de documents' })
const pdf = (name) => new File(['contenu'], name, { type: 'application/pdf' })
const dropFiles = (files) => fireEvent.drop(screen.getByRole('group', { name: 'Zone de dépôt de documents' }), { dataTransfer: { files } })

beforeEach(() => saveBlob.mockClear())

describe('DocumentSection — liste', () => {
  it('affiche un chargement annoncé puis les documents de la formation', async () => {
    const api = mockDocumentApi()
    renderSection('STAGIAIRE')
    expect(screen.getByRole('heading', { level: 2, name: 'Documents' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Chargement…')
    expect(await screen.findByText('Support de cours.pdf')).toBeInTheDocument()
    expect(screen.getByText('Programme.docx')).toBeInTheDocument()
    expect(api.calls.listUrls[0]).toContain('formationId=101')
  })

  it('affiche « Aucun document disponible pour le moment » quand la liste est vide', async () => {
    mockDocumentApi([])
    renderSection('STAGIAIRE')
    expect(await screen.findByText('Aucun document disponible pour le moment')).toBeInTheDocument()
  })

  it('affiche l’erreur avec « Réessayer » qui relance la demande', async () => {
    mockDocumentApi(DOCUMENTS, { errors: { list: { status: 500, message: 'Erreur serveur' } } })
    renderSection('STAGIAIRE')
    expect(await screen.findByRole('alert')).toHaveTextContent('Erreur serveur')
    mockDocumentApi()
    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }))
    expect(await screen.findByText('Support de cours.pdf')).toBeInTheDocument()
  })
})

describe('DocumentSection — droits affichés', () => {
  it('la chargée de formation voit la zone de dépôt et « Supprimer » partout', async () => {
    mockDocumentApi()
    renderSection('SUPER_ADMIN')
    expect(await screen.findByRole('group', { name: 'Zone de dépôt de documents' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Supprimer Support de cours.pdf' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Supprimer Programme.docx' })).toBeInTheDocument()
  })

  it('le formateur de la formation dépose et ne supprime que ses envois', async () => {
    mockDocumentApi()
    renderSection('ADMIN')
    expect(await screen.findByRole('group', { name: 'Zone de dépôt de documents' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Supprimer Support de cours.pdf' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Supprimer Programme.docx' })).not.toBeInTheDocument()
  })

  it('un formateur sur la formation d’un autre consulte et télécharge seulement', async () => {
    mockDocumentApi()
    renderSection('ADMIN', ofAnotherTrainer)
    await screen.findByText('Support de cours.pdf')
    expect(zone()).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Télécharger Support de cours.pdf' })).toBeInTheDocument()
    // Ses propres envois restent supprimables : le back l'autorise « quelle que soit la formation ».
    expect(screen.getByRole('button', { name: 'Supprimer Support de cours.pdf' })).toBeInTheDocument()
  })

  it('le stagiaire lit et télécharge, sans dépôt ni suppression', async () => {
    mockDocumentApi()
    renderSection('STAGIAIRE')
    await screen.findByText('Support de cours.pdf')
    expect(zone()).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Télécharger Programme.docx' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Supprimer/ })).not.toBeInTheDocument()
  })

  it.each(['SUPER_ADMIN', 'ADMIN'])('%s : formation archivée en lecture seule, documents téléchargeables', async (role) => {
    mockDocumentApi()
    renderSection(role, archived)
    await screen.findByText('Support de cours.pdf')
    expect(zone()).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Supprimer/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Télécharger Support de cours.pdf' })).toBeInTheDocument()
  })
})

describe('DocumentSection — dépôt', () => {
  it('envoie plusieurs fichiers l’un après l’autre puis affiche la liste rechargée', async () => {
    const api = mockDocumentApi()
    const { container } = renderSection('SUPER_ADMIN')
    await screen.findByText('Support de cours.pdf')
    await userEvent.upload(container.querySelector('input[type="file"]'), [pdf('a.pdf'), pdf('b.pdf'), pdf('c.pdf')])
    expect(await screen.findByText('c.pdf')).toBeInTheDocument()
    expect(api.calls.uploaded.map(({ fileName, formationId }) => [fileName, formationId])).toEqual([
      ['a.pdf', 101],
      ['b.pdf', 101],
      ['c.pdf', 101],
    ])
    expect(screen.getByText('a.pdf')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('3 documents envoyés')
  })

  it('annonce « Envoi en cours… » pendant l’envoi', async () => {
    mockDocumentApi()
    renderSection('SUPER_ADMIN')
    await screen.findByText('Support de cours.pdf')
    dropFiles([pdf('a.pdf')])
    expect(await screen.findByText('Envoi en cours…')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText('Envoi en cours…')).not.toBeInTheDocument())
  })

  it('refuse un type non autorisé et un fichier trop gros sans appel, en les nommant', async () => {
    const api = mockDocumentApi()
    renderSection('SUPER_ADMIN')
    await screen.findByText('Support de cours.pdf')
    const exe = new File(['x'], 'virus.exe')
    const huge = pdf('gros.pdf')
    Object.defineProperty(huge, 'size', { value: 10 * 1024 * 1024 + 1 })
    dropFiles([exe, huge])
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('virus.exe')
    expect(alert).toHaveTextContent('Format non autorisé')
    expect(alert).toHaveTextContent('gros.pdf')
    expect(alert).toHaveTextContent('trop volumineux')
    expect(api.calls.uploaded).toEqual([])
  })

  it('un refus n’empêche pas l’envoi des autres fichiers', async () => {
    const api = mockDocumentApi()
    renderSection('SUPER_ADMIN')
    await screen.findByText('Support de cours.pdf')
    dropFiles([new File(['x'], 'virus.exe'), pdf('bon.pdf')])
    expect(await screen.findByText('bon.pdf')).toBeInTheDocument()
    expect(api.calls.uploaded.map((upload) => upload.fileName)).toEqual(['bon.pdf'])
    expect(screen.getByRole('alert')).toHaveTextContent('virus.exe')
  })

  it('affiche le message du back pour un fichier refusé (400) et continue', async () => {
    const api = mockDocumentApi(DOCUMENTS, {
      errors: { upload: (name) => (name === 'b.pdf' ? { status: 400, message: 'Signature invalide' } : null) },
    })
    renderSection('SUPER_ADMIN')
    await screen.findByText('Support de cours.pdf')
    dropFiles([pdf('a.pdf'), pdf('b.pdf'), pdf('c.pdf')])
    expect(await screen.findByRole('alert')).toHaveTextContent('b.pdf : Signature invalide')
    expect(api.calls.uploaded).toHaveLength(3)
    expect(await screen.findByText('c.pdf')).toBeInTheDocument()
    expect(screen.queryByText('b.pdf', { selector: 'p' })).not.toBeInTheDocument()
  })
})

describe('DocumentSection — refus de fichiers de même nom', () => {
  it('liste chaque refus, même quand deux fichiers portent le même nom', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockDocumentApi()
    renderSection('SUPER_ADMIN')
    await screen.findByText('Support de cours.pdf')
    dropFiles([new File(['x'], 'cours.exe'), new File(['y'], 'cours.exe')])
    const alert = await screen.findByRole('alert')
    expect(within(alert).getAllByRole('listitem')).toHaveLength(2)
    expect(spy.mock.calls.flat().join(' ')).not.toMatch(/same key|unique "key"/)
    spy.mockRestore()
  })
})

describe('DocumentSection — téléchargement', () => {
  it('enregistre le fichier reçu sous son nom d’origine', async () => {
    const api = mockDocumentApi()
    renderSection('STAGIAIRE')
    await userEvent.click(await screen.findByRole('button', { name: 'Télécharger Support de cours.pdf' }))
    await waitFor(() => expect(saveBlob).toHaveBeenCalledTimes(1))
    expect(api.calls.downloaded).toEqual([501])
    expect(saveBlob.mock.calls[0][1]).toBe('Support de cours.pdf')
  })

  it.each([
    [403, /pas accès/i],
    [404, /introuvable/i],
  ])('annonce l’erreur %i et n’enregistre rien', async (status, message) => {
    mockDocumentApi(DOCUMENTS, { errors: { download: { status, message: 'x' } } })
    renderSection('STAGIAIRE')
    await userEvent.click(await screen.findByRole('button', { name: 'Télécharger Support de cours.pdf' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(saveBlob).not.toHaveBeenCalled()
  })
})

describe('DocumentSection — suppression', () => {
  const askDelete = async (name) => {
    await userEvent.click(await screen.findByRole('button', { name: `Supprimer ${name}` }))
    return screen.getByRole('dialog')
  }

  it('demande confirmation en nommant le fichier, puis supprime et recharge la liste', async () => {
    const api = mockDocumentApi()
    renderSection('SUPER_ADMIN')
    const dialog = await askDelete('Programme.docx')
    expect(dialog).toHaveTextContent('Programme.docx')
    expect(dialog).toHaveTextContent(/définitive/i)
    await userEvent.click(within(dialog).getByRole('button', { name: 'Supprimer' }))
    await waitFor(() => expect(screen.queryByText('Programme.docx')).not.toBeInTheDocument())
    expect(api.calls.deleted).toEqual([502])
    expect(screen.getByRole('status')).toHaveTextContent('Document supprimé')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('annuler ne fait aucun appel, garde le document et rend le focus au bouton', async () => {
    const api = mockDocumentApi()
    renderSection('SUPER_ADMIN')
    const button = await screen.findByRole('button', { name: 'Supprimer Programme.docx' })
    await userEvent.click(button)
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Annuler' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(api.calls.deleted).toEqual([])
    expect(screen.getByText('Programme.docx')).toBeInTheDocument()
    expect(button).toHaveFocus()
  })

  it('sur un 404 (déjà supprimé), affiche le message et recharge la liste', async () => {
    const api = mockDocumentApi(DOCUMENTS, { errors: { delete: { status: 404, message: 'Document introuvable' } } })
    renderSection('SUPER_ADMIN')
    await screen.findByText('Programme.docx')
    const before = api.calls.list
    const dialog = await askDelete('Programme.docx')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Supprimer' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Document introuvable')
    await waitFor(() => expect(api.calls.list).toBe(before + 1))
  })

  it('sur un 403, affiche le message sans quitter la liste', async () => {
    mockDocumentApi(DOCUMENTS, { errors: { delete: { status: 403, message: 'Accès refusé' } } })
    renderSection('ADMIN')
    const dialog = await askDelete('Support de cours.pdf')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Supprimer' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Accès refusé')
    expect(screen.getByText('Support de cours.pdf')).toBeInTheDocument()
  })
})

describe('DocumentSection — texte et accessibilité', () => {
  it('rend un nom de fichier contenant du HTML en texte', async () => {
    mockDocumentApi([{ ...DOCUMENTS[0], fileName: '<b>gras</b>.pdf' }])
    const { container } = renderSection('STAGIAIRE')
    expect(await screen.findByText('<b>gras</b>.pdf')).toBeInTheDocument()
    expect(container.querySelector('b')).toBeNull()
  })

  it('n’a aucune violation d’accessibilité (jest-axe)', async () => {
    mockDocumentApi()
    const { container } = renderSection('SUPER_ADMIN')
    await screen.findByRole('group', { name: 'Zone de dépôt de documents' })
    await screen.findByText('Support de cours.pdf')
    expect(await axe(container)).toHaveNoViolations()
  })
})
