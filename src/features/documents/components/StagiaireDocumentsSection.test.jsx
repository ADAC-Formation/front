import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { mockDocumentApi } from '../../../test/documents'
import { FORMATIONS, INSCRITS, mockFormationList, mockInscriptions, mockUserInscriptions } from '../../../test/formations'
import { renderWithProviders } from '../../../test/render'
import { mockSession } from '../../../test/session'
import StagiaireDocumentsSection from './StagiaireDocumentsSection'

// « Documents » du profil d'un stagiaire, vu par la chargée de formation ou le formateur (G17) : pour chaque
// formation où il est inscrit (et que l'on peut consulter), ce qu'il a envoyé, avec un lien vers la formation.
// Chargée de formation : un seul appel `GET /users/{id}/inscriptions` (Q16, réservé à elle par le back).
// Formateur : le back le lui refuse, on parcourt donc les inscrits de ses formations.
const lea = INSCRITS[0].stagiaire // id 20 : inscription 1 en formation 101, inscription 5 en formation 103
const omar = INSCRITS[1].stagiaire // id 21
const [psc1, excel, gestes] = FORMATIONS

const document = (id, fileName, inscriptionId) => ({
  id,
  fileName,
  uploadedBy: { id: lea.id, prenom: lea.prenom, nom: lea.nom },
  fileSize: 2048,
  mimeType: 'application/pdf',
  formationId: null,
  inscriptionId,
  createdAt: '2026-03-01T10:00:00',
})
const DOCS = [document(701, 'Carte-identite.pdf', 1), document(702, 'Ancien.pdf', 5)]
const LEA_ENROLMENTS = [
  { id: 1, formation: psc1 },
  { id: 5, formation: gestes },
]

// Chargée de formation : le back répond `enrolments` à `GET /users/20/inscriptions`.
function setupManager({ enrolments = LEA_ENROLMENTS, errorStatus, documents = DOCS } = {}) {
  mockSession('SUPER_ADMIN')
  const formationCalls = mockFormationList([psc1, excel, gestes])
  const userCalls = mockUserInscriptions(lea.id, enrolments, { errorStatus })
  mockDocumentApi(documents)
  return { formationCalls, userCalls }
}

// Formateur : parcours des inscrits de chaque formation consultable.
function setupTrainer({ inscriptions = {}, documents = DOCS } = {}) {
  mockSession('ADMIN')
  mockFormationList([psc1, excel, gestes])
  const byFormation = {
    101: [INSCRITS[0], INSCRITS[1]],
    102: [{ id: 3, stagiaire: omar, inscritLe: '2026-01-22T10:00:00' }],
    103: [{ id: 5, stagiaire: lea, inscritLe: '2025-10-01T10:00:00' }],
    ...inscriptions,
  }
  for (const [formationId, list] of Object.entries(byFormation)) {
    if (list && list.errorStatus) mockInscriptions(Number(formationId), [], { errorStatus: list.errorStatus })
    else mockInscriptions(Number(formationId), list)
  }
  mockDocumentApi(documents)
}

const renderSection = () => renderWithProviders(<StagiaireDocumentsSection stagiaireId={lea.id} />)

describe('StagiaireDocumentsSection — chargée de formation (un seul appel, Q16)', () => {
  it('annonce le chargement puis une sous-section par formation où le stagiaire est inscrit', async () => {
    setupManager()
    renderSection()
    expect(screen.getByRole('heading', { level: 2, name: 'Documents' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Chargement…')
    const titles = await screen.findAllByRole('heading', { level: 3 })
    expect(titles.map((title) => title.textContent)).toEqual(['Premiers secours PSC1', 'Gestes et postures'])
  })

  it('lit les inscriptions du stagiaire en un seul appel, sans parcourir les formations', async () => {
    const { userCalls, formationCalls } = setupManager()
    renderSection()
    await screen.findByRole('link', { name: 'Premiers secours PSC1' })
    expect(userCalls.count).toBe(1)
    expect(formationCalls.count).toBe(0)
  })

  it('lie chaque formation à sa page et montre ce que le stagiaire y a envoyé', async () => {
    setupManager()
    renderSection()
    const psc = (await screen.findByRole('link', { name: 'Premiers secours PSC1' })).closest('section')
    expect(within(psc).getByRole('link', { name: 'Premiers secours PSC1' })).toHaveAttribute('href', '/formations/101')
    expect(await within(psc).findByRole('button', { name: 'Télécharger Carte-identite.pdf' })).toBeInTheDocument()
    const archived = screen.getByRole('link', { name: 'Gestes et postures' }).closest('section')
    expect(await within(archived).findByRole('button', { name: 'Télécharger Ancien.pdf' })).toBeInTheDocument()
    expect(within(psc).queryByText('Ancien.pdf')).not.toBeInTheDocument()
  })

  it('indique « Aucun document envoyé » pour une formation où il n’a rien envoyé', async () => {
    setupManager({ documents: [document(702, 'Ancien.pdf', 5)] })
    renderSection()
    const psc = (await screen.findByRole('link', { name: 'Premiers secours PSC1' })).closest('section')
    expect(await within(psc).findByText('Aucun document envoyé')).toBeInTheDocument()
  })

  it('explique quand le stagiaire n’est inscrit à aucune formation', async () => {
    setupManager({ enrolments: [] })
    renderSection()
    expect(await screen.findByText(/est inscrit à aucune formation que vous pouvez consulter/)).toBeInTheDocument()
  })

  it('annonce l’erreur du back avec « Réessayer » qui relance l’appel', async () => {
    setupManager({ errorStatus: 500 })
    renderSection()
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    mockUserInscriptions(lea.id, LEA_ENROLMENTS)
    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }))
    expect(await screen.findByRole('link', { name: 'Premiers secours PSC1' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('n’a aucune violation jest-axe', async () => {
    setupManager()
    const { container } = renderSection()
    await screen.findByRole('button', { name: 'Télécharger Carte-identite.pdf' })
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('StagiaireDocumentsSection — formateur (parcours des formations, le back lui refuse Q16)', () => {
  it('liste les formations où le stagiaire est inscrit, sans appeler /users/{id}/inscriptions', async () => {
    setupTrainer()
    renderSection()
    const titles = await screen.findAllByRole('heading', { level: 3 })
    expect(titles.map((title) => title.textContent)).toEqual(['Premiers secours PSC1', 'Gestes et postures'])
  })

  it('ignore une formation que l’on ne peut pas consulter (404), sans erreur', async () => {
    setupTrainer({ inscriptions: { 103: { errorStatus: 404 } } })
    renderSection()
    await screen.findByRole('link', { name: 'Premiers secours PSC1' })
    expect(screen.queryByRole('link', { name: 'Gestes et postures' })).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('garde les autres formations quand une liste d’inscrits échoue, avec « Réessayer »', async () => {
    setupTrainer({ inscriptions: { 103: { errorStatus: 500 } } })
    renderSection()
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: 'Premiers secours PSC1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }))
  })

  it('explique quand le stagiaire n’est inscrit à aucune formation consultable', async () => {
    setupTrainer({ inscriptions: { 101: [INSCRITS[1]], 103: [] } })
    renderSection()
    expect(await screen.findByText(/est inscrit à aucune formation que vous pouvez consulter/)).toBeInTheDocument()
  })
})
