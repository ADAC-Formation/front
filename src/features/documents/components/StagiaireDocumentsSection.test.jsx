import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { mockDocumentApi } from '../../../test/documents'
import { FORMATIONS, INSCRITS, mockFormationList, mockInscriptions } from '../../../test/formations'
import { renderWithProviders } from '../../../test/render'
import { mockSession } from '../../../test/session'
import StagiaireDocumentsSection from './StagiaireDocumentsSection'

// « Documents » du profil d'un stagiaire, vu par le formateur ou la chargée de formation (G17) : pour chaque
// formation où il est inscrit (et que l'on peut consulter), ce qu'il a envoyé, avec un lien vers la formation.
const lea = INSCRITS[0].stagiaire // id 20 : inscription 1 en formation 101, inscription 5 en formation 103
const omar = INSCRITS[1].stagiaire // id 21
const [psc1, excel, gestes] = FORMATIONS

const document = (id, fileName, inscriptionId) => ({
  id,
  fileName,
  fileUrl: `https://supabase.test/storage/${id}`,
  fileSize: 2048,
  mimeType: 'application/pdf',
  uploadedBy: lea,
  formationId: null,
  inscriptionId,
  createdAt: '2026-03-01T10:00:00',
})
const DOCS = [document(701, 'Carte-identite.pdf', 1), document(702, 'Ancien.pdf', 5)]

function setup({ role = 'SUPER_ADMIN', inscriptions = {}, documents = DOCS, docOptions } = {}) {
  mockSession(role)
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
  return mockDocumentApi(documents, docOptions)
}

const renderSection = () => renderWithProviders(<StagiaireDocumentsSection stagiaireId={lea.id} />)

describe('StagiaireDocumentsSection', () => {
  it('annonce le chargement puis une sous-section par formation où le stagiaire est inscrit', async () => {
    setup()
    renderSection()
    expect(screen.getByRole('heading', { level: 2, name: 'Documents' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Chargement…')
    const titles = await screen.findAllByRole('heading', { level: 3 })
    expect(titles.map((title) => title.textContent)).toEqual(['Premiers secours PSC1', 'Gestes et postures'])
  })

  it('lie chaque formation à sa page et montre ce que le stagiaire y a envoyé', async () => {
    setup()
    renderSection()
    const psc = (await screen.findByRole('link', { name: 'Premiers secours PSC1' })).closest('section')
    expect(within(psc).getByRole('link', { name: 'Premiers secours PSC1' })).toHaveAttribute('href', '/formations/101')
    expect(await within(psc).findByRole('button', { name: 'Télécharger Carte-identite.pdf' })).toBeInTheDocument()
    const archived = screen.getByRole('link', { name: 'Gestes et postures' }).closest('section')
    expect(await within(archived).findByRole('button', { name: 'Télécharger Ancien.pdf' })).toBeInTheDocument()
    expect(within(psc).queryByText('Ancien.pdf')).not.toBeInTheDocument()
  })

  it('indique « Aucun document envoyé » pour une formation où il n’a rien envoyé', async () => {
    setup({ documents: [document(702, 'Ancien.pdf', 5)] })
    renderSection()
    const psc = (await screen.findByRole('link', { name: 'Premiers secours PSC1' })).closest('section')
    expect(await within(psc).findByText('Aucun document envoyé')).toBeInTheDocument()
  })

  it('ignore une formation que l’on ne peut pas consulter (404), sans erreur', async () => {
    setup({ role: 'ADMIN', inscriptions: { 103: { errorStatus: 404 } } })
    renderSection()
    await screen.findByRole('link', { name: 'Premiers secours PSC1' })
    expect(screen.queryByRole('link', { name: 'Gestes et postures' })).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('garde les autres formations quand une liste d’inscrits échoue, avec « Réessayer »', async () => {
    setup({ inscriptions: { 103: { errorStatus: 500 } } })
    renderSection()
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: 'Premiers secours PSC1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }))
  })

  it('explique quand le stagiaire n’est inscrit à aucune formation consultable', async () => {
    setup({ inscriptions: { 101: [INSCRITS[1]], 103: [] } })
    renderSection()
    expect(await screen.findByText(/est inscrit à aucune formation que vous pouvez consulter/)).toBeInTheDocument()
  })

  it('n’a aucune violation jest-axe', async () => {
    setup()
    const { container } = renderSection()
    await screen.findByRole('button', { name: 'Télécharger Carte-identite.pdf' })
    expect(await axe(container)).toHaveNoViolations()
  })
})
