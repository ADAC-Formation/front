import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { Route, Routes } from 'react-router'
import DocumentTypeListPage from './DocumentTypeListPage'
import { renderWithProviders } from '../../../test/render'
import { mockSession } from '../../../test/session'
import { DOCUMENT_TYPES, mockDocumentTypeApi, mockDocumentTypes } from '../../../test/documentTypes'

function renderList(route = '/admin/documents') {
  mockSession('SUPER_ADMIN')
  return renderWithProviders(
    <Routes>
      <Route path="/admin/documents" element={<DocumentTypeListPage />} />
      <Route path="/admin/documents/nouveau" element={<p>page de création</p>} />
      <Route path="/admin/documents/:id/modifier" element={<p>page de modification</p>} />
    </Routes>,
    { route, withSession: true },
  )
}

const rowOf = (name) => screen.getByRole('heading', { name, level: 3 }).closest('li')

describe('DocumentTypeListPage — liste', () => {
  it('affiche les libellés de chaque type', async () => {
    mockDocumentTypeApi()
    renderList()
    await screen.findByRole('heading', { name: 'Pièce d’identité', level: 3 })

    const identity = within(rowOf('Pièce d’identité'))
    expect(identity.getByText('Sensible')).toBeInTheDocument()
    expect(identity.getByText('Toutes les formations')).toBeInTheDocument()
    expect(identity.getByText('7 jours avant le début')).toBeInTheDocument()
    expect(identity.getByText('Actif')).toBeInTheDocument()

    const certificate = within(rowOf('Certificat médical'))
    expect(certificate.queryByText('Facultatif')).not.toBeInTheDocument()
    expect(identity.queryByText('Obligatoire')).not.toBeInTheDocument()
    expect(certificate.queryByText('Sensible')).not.toBeInTheDocument()
    expect(certificate.getByText('Secourisme')).toBeInTheDocument()
    expect(certificate.getByText('PDF, JPG')).toBeInTheDocument()

    const old = within(rowOf('Ancienne attestation'))
    expect(old.getByText('15 jours après la fin')).toBeInTheDocument()
    expect(old.getByText('Désactivé')).toBeInTheDocument()
  })

  it('dit qui fournit chaque document (G35)', async () => {
    mockDocumentTypeApi([DOCUMENT_TYPES.identite, { ...DOCUMENT_TYPES.certificat, providedBy: 'ADAC' }])
    renderList()
    await screen.findByRole('heading', { name: 'Pièce d’identité', level: 3 })
    expect(within(rowOf('Pièce d’identité')).getByText('Fourni par le stagiaire')).toBeInTheDocument()
    expect(within(rowOf('Certificat médical')).getByText('Fourni par l’ADAC')).toBeInTheDocument()
  })

  it('trie par nom sans tenir compte de la casse ni des accents', async () => {
    mockDocumentTypeApi()
    renderList()
    await screen.findByRole('heading', { name: 'Pièce d’identité', level: 3 })
    const names = screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)
    expect(names).toEqual(['Ancienne attestation', 'Certificat médical', 'Pièce d’identité'])
  })

  it('propose de créer un type et de modifier chacun', async () => {
    mockDocumentTypeApi()
    renderList()
    expect(await screen.findByRole('link', { name: 'Modifier Certificat médical' })).toHaveAttribute(
      'href',
      '/admin/documents/2/modifier',
    )
    expect(screen.getByRole('link', { name: 'Nouveau type' })).toHaveAttribute('href', '/admin/documents/nouveau')
  })

  it('n’offre aucune suppression', async () => {
    mockDocumentTypeApi()
    renderList()
    await screen.findByRole('heading', { name: 'Certificat médical', level: 3 })
    expect(screen.queryByRole('button', { name: /supprimer/i })).not.toBeInTheDocument()
  })

  it('affiche un état vide', async () => {
    mockDocumentTypes([])
    renderList()
    expect(await screen.findByText('Aucun type de document pour le moment')).toBeInTheDocument()
  })

  it('affiche l’erreur de chargement avec « Réessayer »', async () => {
    const api = mockDocumentTypeApi(undefined, { errors: { list: { status: 500, message: 'Erreur serveur' } } })
    renderList()
    expect(await screen.findByText('Erreur serveur')).toBeInTheDocument()
    const before = api.calls.list
    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }))
    expect(api.calls.list).toBeGreaterThan(before)
  })

  it('affiche le bandeau transmis par la navigation', async () => {
    mockSession('SUPER_ADMIN')
    mockDocumentTypeApi()
    renderWithProviders(
      <Routes>
        <Route path="/admin/documents" element={<DocumentTypeListPage />} />
      </Routes>,
      { route: { pathname: '/admin/documents', state: { notice: 'document-type-created' } }, withSession: true },
    )
    expect(await screen.findByText('Type de document créé')).toBeInTheDocument()
  })
})

describe('DocumentTypeListPage — désactivation et réactivation', () => {
  it('désactive après confirmation, en prévenant que cela s’applique aux formations en cours', async () => {
    const api = mockDocumentTypeApi()
    renderList()
    await userEvent.click(await screen.findByRole('button', { name: 'Désactiver Certificat médical' }))

    const dialog = screen.getByRole('dialog', { name: /Certificat médical/ })
    expect(within(dialog).getByText(/formations en cours/)).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Désactiver' }))

    expect(await screen.findByText('Type de document désactivé')).toBeInTheDocument()
    expect(api.calls.deactivated).toEqual([DOCUMENT_TYPES.certificat.id])
    expect(within(rowOf('Certificat médical')).getByText('Désactivé')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('n’appelle rien quand on annule', async () => {
    const api = mockDocumentTypeApi()
    renderList()
    await userEvent.click(await screen.findByRole('button', { name: 'Désactiver Certificat médical' }))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Annuler' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(api.calls.deactivated).toEqual([])
  })

  it('réactive sans confirmation', async () => {
    const api = mockDocumentTypeApi()
    renderList()
    await userEvent.click(await screen.findByRole('button', { name: 'Réactiver Ancienne attestation' }))
    expect(await screen.findByText('Type de document réactivé')).toBeInTheDocument()
    expect(api.calls.activated).toEqual([DOCUMENT_TYPES.ancien.id])
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(within(rowOf('Ancienne attestation')).getByText('Actif')).toBeInTheDocument()
  })

  it('affiche l’erreur du back sans modifier la liste', async () => {
    mockDocumentTypeApi(undefined, { errors: { deactivate: { status: 404, message: 'Type de document introuvable' } } })
    renderList()
    await userEvent.click(await screen.findByRole('button', { name: 'Désactiver Certificat médical' }))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Désactiver' }))
    expect(await screen.findByText('Type de document introuvable')).toBeInTheDocument()
    expect(within(rowOf('Certificat médical')).getByText('Actif')).toBeInTheDocument()
  })
})

describe('DocumentTypeListPage — accessibilité', () => {
  it('n’a aucune violation jest-axe', async () => {
    mockDocumentTypeApi()
    const { container } = renderList()
    await screen.findByRole('heading', { name: 'Pièce d’identité', level: 3 })
    expect(await axe(container)).toHaveNoViolations()
  })
})
