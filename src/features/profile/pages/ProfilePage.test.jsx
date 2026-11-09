import { screen, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { mockDocumentApi } from '../../../test/documents'
import { FORMATIONS, mockFormationList } from '../../../test/formations'
import { renderWithProviders } from '../../../test/render'
import { USERS, mockSession } from '../../../test/session'
import ProfilePage from './ProfilePage'

// Formation du stagiaire avec son inscriptionId (champ du back) et un document déposé.
const mine = [{ ...FORMATIONS[0], inscriptionId: 7 }]
const myDocument = {
  id: 601,
  fileName: 'Justificatif.pdf',
  fileUrl: 'https://supabase.test/storage/601',
  fileSize: 2048,
  mimeType: 'application/pdf',
  uploadedBy: USERS.STAGIAIRE,
  formationId: null,
  inscriptionId: 7,
  createdAt: '2026-03-01T10:00:00',
}

function renderProfile(role) {
  mockSession(role)
  return renderWithProviders(<ProfilePage />, { withSession: true })
}

describe('ProfilePage', () => {
  it('stagiaire : titre « Mon profil » et résumé « Mes documents » avec le lien vers la formation', async () => {
    mockFormationList(mine)
    mockDocumentApi([myDocument], { uploader: USERS.STAGIAIRE })
    renderProfile('STAGIAIRE')
    expect(await screen.findByRole('heading', { level: 1, name: 'Mon profil' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { level: 2, name: 'Mes documents' })).toBeInTheDocument()
    const item = (await screen.findByText('Justificatif.pdf')).closest('li')
    expect(item).toHaveTextContent('Déposé dans Premiers secours PSC1')
    expect(within(item).getByRole('link', { name: 'Premiers secours PSC1' })).toHaveAttribute('href', '/formations/101')
    expect(screen.queryByRole('group', { name: 'Zone de dépôt de documents' })).not.toBeInTheDocument()
  })

  it.each(['ADMIN', 'SUPER_ADMIN'])(
    '%s : titre seul, sans « Mes documents » ni aucun appel (formations ou documents)',
    async (role) => {
      // Aucun mock de formations ni de documents : un appel non déclaré ferait échouer le test.
      renderProfile(role)
      expect(await screen.findByRole('heading', { level: 1, name: 'Mon profil' })).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Mes documents' })).not.toBeInTheDocument()
    },
  )

  it.each(['STAGIAIRE', 'ADMIN', 'SUPER_ADMIN'])('%s : informations, notifications par e-mail et mot de passe', async (role) => {
    if (role === 'STAGIAIRE') {
      mockFormationList([])
      mockDocumentApi([], { uploader: USERS.STAGIAIRE })
    }
    renderProfile(role)
    expect(await screen.findByRole('heading', { level: 2, name: 'Mes informations' })).toBeInTheDocument()
    expect(screen.getByText(USERS[role].email)).toBeInTheDocument()
    expect(await screen.findByRole('switch', { name: 'Recevoir les notifications par e-mail' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Mot de passe' })).toBeInTheDocument()
  })

  it('n’a aucun <main> (celui du Layout est le seul) et aucune violation jest-axe', async () => {
    mockFormationList(mine)
    mockDocumentApi([myDocument], { uploader: USERS.STAGIAIRE })
    const { container } = renderProfile('STAGIAIRE')
    await screen.findByText('Justificatif.pdf')
    expect(container.querySelector('main')).toBeNull()
    expect(await axe(container)).toHaveNoViolations()
  })
})
