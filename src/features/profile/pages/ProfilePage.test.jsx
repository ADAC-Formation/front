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

  it('formateur : résumé « Mes documents » de ses propres dépôts, avec le lien vers la formation (NOTES-08)', async () => {
    mockFormationList([FORMATIONS[0]])
    mockDocumentApi([{ ...myDocument, uploadedBy: USERS.ADMIN, formationId: 101, inscriptionId: null }], {
      uploader: USERS.ADMIN,
    })
    renderProfile('ADMIN')
    expect(await screen.findByRole('heading', { level: 2, name: 'Mes documents' })).toBeInTheDocument()
    const item = (await screen.findByText('Justificatif.pdf')).closest('li')
    expect(within(item).getByRole('link', { name: 'Premiers secours PSC1' })).toHaveAttribute('href', '/formations/101')
  })

  it('SUPER_ADMIN : titre seul, sans « Mes documents » ni aucun appel (formations ou documents)', async () => {
    // Aucun mock de formations ni de documents : un appel non déclaré ferait échouer le test.
    renderProfile('SUPER_ADMIN')
    expect(await screen.findByRole('heading', { level: 1, name: 'Mon profil' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Mes documents' })).not.toBeInTheDocument()
  })

  it.each(['STAGIAIRE', 'ADMIN', 'SUPER_ADMIN'])('%s : informations et mot de passe', async (role) => {
    if (role !== 'SUPER_ADMIN') {
      mockFormationList([])
      mockDocumentApi([], { uploader: USERS[role] })
    }
    renderProfile(role)
    expect(await screen.findByRole('heading', { level: 2, name: 'Mes informations' })).toBeInTheDocument()
    expect(screen.getByText(USERS[role].email)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Mot de passe' })).toBeInTheDocument()
  })

  it.each(['STAGIAIRE', 'ADMIN', 'SUPER_ADMIN'])(
    '%s : aucun réglage des e-mails, ils sont toujours envoyés (NOTES-04, ind. 30)',
    async (role) => {
      if (role !== 'SUPER_ADMIN') {
        mockFormationList([])
        mockDocumentApi([], { uploader: USERS[role] })
      }
      renderProfile(role)
      // « Mes informations » attend la session : le réglage, s'il existait, serait déjà rendu.
      expect(await screen.findByRole('heading', { level: 2, name: 'Mes informations' })).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Notifications par e-mail' })).not.toBeInTheDocument()
      expect(screen.queryByRole('switch')).not.toBeInTheDocument()
    },
  )

  it.each(['STAGIAIRE', 'ADMIN', 'SUPER_ADMIN'])(
    '%s : « Mes données personnelles » résume le RGPD et mène aux mentions légales',
    async (role) => {
      if (role !== 'SUPER_ADMIN') {
        mockFormationList([])
        mockDocumentApi([], { uploader: USERS[role] })
      }
      renderProfile(role)
      const section = await screen.findByRole('region', { name: 'Mes données personnelles' })
      expect(within(section).getByText(/e-mails du portail.*toujours envoyés/)).toBeInTheDocument()
      for (const right of ['accès', 'rectification', 'effacement', 'limitation', 'vous opposer', 'portabilité']) {
        expect(section).toHaveTextContent(right)
      }
      expect(within(section).getByText('Contact pour vos données personnelles')).toBeInTheDocument()
      expect(within(section).getByText('À renseigner par l’ADAC')).toBeInTheDocument()
      expect(within(section).getByRole('link', { name: 'Tout savoir sur vos données personnelles' })).toHaveAttribute(
        'href',
        '/mentions-legales',
      )
    },
  )

  it('n’a aucun <main> (celui du Layout est le seul) et aucune violation jest-axe', async () => {
    mockFormationList(mine)
    mockDocumentApi([myDocument], { uploader: USERS.STAGIAIRE })
    const { container } = renderProfile('STAGIAIRE')
    await screen.findByText('Justificatif.pdf')
    expect(container.querySelector('main')).toBeNull()
    expect(await axe(container)).toHaveNoViolations()
  })
})
