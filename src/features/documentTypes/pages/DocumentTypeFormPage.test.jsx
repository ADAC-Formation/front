import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { Route, Routes } from 'react-router'
import DocumentTypeFormPage from './DocumentTypeFormPage'
import DocumentTypeListPage from './DocumentTypeListPage'
import { renderWithProviders } from '../../../test/render'
import { mockSession } from '../../../test/session'
import { mockCategories } from '../../../test/categories'
import { DOCUMENT_TYPES, mockDocumentTypeApi } from '../../../test/documentTypes'

function renderForm(route, apiOptions) {
  mockSession('SUPER_ADMIN')
  mockCategories()
  const api = mockDocumentTypeApi(undefined, apiOptions)
  renderWithProviders(
    <Routes>
      <Route path="/admin/documents" element={<DocumentTypeListPage />} />
      <Route path="/admin/documents/nouveau" element={<DocumentTypeFormPage />} />
      <Route path="/admin/documents/:id/modifier" element={<DocumentTypeFormPage />} />
    </Routes>,
    { route, withSession: true },
  )
  return api
}

const type = (label, value) => userEvent.type(screen.getByLabelText(label), value)

describe('DocumentTypeFormPage — création', () => {
  const submit = () => userEvent.click(screen.getByRole('button', { name: 'Créer le type' }))

  it('propose un retour vers la liste et un titre', async () => {
    renderForm('/admin/documents/nouveau')
    expect(await screen.findByRole('heading', { level: 1, name: 'Nouveau type de document' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Retour/ })).toHaveAttribute('href', '/admin/documents')
  })

  it('démarre facultatif, pour toutes les formations, sans délai', async () => {
    renderForm('/admin/documents/nouveau')
    await screen.findByLabelText('Nom')
    expect(screen.getByLabelText('Obligatoire')).not.toBeChecked()
    expect(screen.getByLabelText('Sensible')).not.toBeChecked()
    expect(screen.getByRole('radio', { name: 'Toutes les formations' })).toBeChecked()
    expect(screen.getByLabelText('Délai')).toHaveValue('')
    expect(screen.queryByLabelText('Nombre de jours')).not.toBeInTheDocument()
  })

  it('envoie le corps complet puis affiche la liste avec « Type de document créé »', async () => {
    const api = renderForm('/admin/documents/nouveau')
    await type('Nom', 'Certificat d’aptitude')
    await userEvent.click(screen.getByLabelText('Obligatoire'))
    await userEvent.click(screen.getByRole('radio', { name: 'Certaines catégories' }))
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Secourisme' }))
    await userEvent.selectOptions(screen.getByLabelText('Délai'), 'BEFORE_START')
    await type('Nombre de jours', '7')
    await submit()

    expect(await screen.findByText('Type de document créé')).toBeInTheDocument()
    expect(api.calls.created).toEqual([
      {
        nom: 'Certificat d’aptitude',
        aide: null,
        isRequired: true,
        isSensitive: false,
        appliesToAllFormations: false,
        categoryIds: [1],
        deadlineDays: 7,
        deadlineAnchor: 'BEFORE_START',
        allowedFormats: [],
      },
    ])
    expect(await screen.findByRole('heading', { name: 'Certificat d’aptitude', level: 3 })).toBeInTheDocument()
  })

  it('envoie les formats cochés', async () => {
    const api = renderForm('/admin/documents/nouveau')
    await type('Nom', 'Photo')
    await userEvent.click(screen.getByRole('checkbox', { name: 'PNG' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'JPG' }))
    await submit()
    await screen.findByText('Type de document créé')
    expect(api.calls.created[0].allowedFormats).toEqual(['jpg', 'png'])
  })

  it('explique la règle générale quand aucun format n’est coché', async () => {
    renderForm('/admin/documents/nouveau')
    expect(await screen.findByText(/règle générale/i)).toBeInTheDocument()
  })

  it('n’affiche les catégories que pour la portée « certaines catégories », actives seulement', async () => {
    renderForm('/admin/documents/nouveau')
    await screen.findByLabelText('Nom')
    expect(screen.queryByRole('checkbox', { name: 'Secourisme' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('radio', { name: 'Certaines catégories' }))
    expect(await screen.findByRole('checkbox', { name: 'Secourisme' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Numérique' })).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: 'Ancienne catégorie' })).not.toBeInTheDocument()
  })

  it('refuse en ligne un nom vide, sans aucun appel', async () => {
    const api = renderForm('/admin/documents/nouveau')
    await screen.findByLabelText('Nom')
    await submit()
    expect(await screen.findByText('Le nom est obligatoire.')).toBeInTheDocument()
    expect(screen.getByLabelText('Nom')).toHaveAttribute('aria-invalid', 'true')
    expect(api.calls.created).toEqual([])
  })

  it('refuse la portée « certaines catégories » sans catégorie cochée', async () => {
    const api = renderForm('/admin/documents/nouveau')
    await type('Nom', 'Certificat')
    await userEvent.click(screen.getByRole('radio', { name: 'Certaines catégories' }))
    await submit()
    expect(await screen.findByText('Choisissez au moins une catégorie.')).toBeInTheDocument()
    expect(api.calls.created).toEqual([])
  })

  it('refuse un délai sans nombre de jours', async () => {
    const api = renderForm('/admin/documents/nouveau')
    await type('Nom', 'Certificat')
    await userEvent.selectOptions(screen.getByLabelText('Délai'), 'AFTER_END')
    await submit()
    expect(await screen.findByText('Indiquez le nombre de jours.')).toBeInTheDocument()
    expect(api.calls.created).toEqual([])
  })

  it('affiche le 409 sous « Nom » et garde la saisie', async () => {
    const api = renderForm('/admin/documents/nouveau', {
      errors: { create: { status: 409, message: 'Un type de document porte déjà ce nom' } },
    })
    await type('Nom', 'Pièce d’identité')
    await submit()
    const error = await screen.findByText('Un type de document porte déjà ce nom')
    expect(screen.getByLabelText('Nom')).toHaveAccessibleDescription('Un type de document porte déjà ce nom')
    expect(error).toBeInTheDocument()
    expect(screen.getByLabelText('Nom')).toHaveValue('Pièce d’identité')
    expect(api.calls.created).toHaveLength(1)
  })

  it('affiche les autres erreurs du back dans un bandeau', async () => {
    renderForm('/admin/documents/nouveau', { errors: { create: { status: 500, message: 'Erreur serveur' } } })
    await type('Nom', 'Certificat')
    await submit()
    expect(await screen.findByRole('alert')).toHaveTextContent('Erreur serveur')
  })
})

describe('DocumentTypeFormPage — modification', () => {
  it('préremplit le formulaire depuis la liste', async () => {
    renderForm('/admin/documents/2/modifier')
    expect(await screen.findByRole('heading', { level: 1, name: /Modifier Certificat médical/ })).toBeInTheDocument()
    expect(screen.getByLabelText('Nom')).toHaveValue('Certificat médical')
    expect(screen.getByRole('radio', { name: 'Certaines catégories' })).toBeChecked()
    expect(await screen.findByRole('checkbox', { name: 'Secourisme' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'PDF' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'PNG' })).not.toBeChecked()
  })

  it('prévient que les changements s’appliquent aux formations en cours', async () => {
    renderForm('/admin/documents/2/modifier')
    expect(await screen.findByText(/formations en cours/)).toBeInTheDocument()
  })

  it('garde cochée une catégorie désactivée déjà liée au type', async () => {
    mockSession('SUPER_ADMIN')
    mockCategories()
    mockDocumentTypeApi([{ ...DOCUMENT_TYPES.certificat, categories: [{ id: 3, nom: 'Ancienne catégorie' }] }])
    renderWithProviders(
      <Routes>
        <Route path="/admin/documents/:id/modifier" element={<DocumentTypeFormPage />} />
      </Routes>,
      { route: '/admin/documents/2/modifier', withSession: true },
    )
    expect(await screen.findByRole('checkbox', { name: 'Ancienne catégorie' })).toBeChecked()
  })

  it('envoie PUT avec le type complet puis affiche « Type de document mis à jour »', async () => {
    const api = renderForm('/admin/documents/2/modifier')
    await screen.findByLabelText('Nom')
    await userEvent.selectOptions(screen.getByLabelText('Délai'), 'AFTER_END')
    await type('Nombre de jours', '15')
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    expect(await screen.findByText('Type de document mis à jour')).toBeInTheDocument()
    expect(api.calls.updated).toEqual([
      {
        id: 2,
        nom: 'Certificat médical',
        aide: null,
        isRequired: false,
        isSensitive: false,
        appliesToAllFormations: false,
        categoryIds: [1],
        deadlineDays: 15,
        deadlineAnchor: 'AFTER_END',
        allowedFormats: ['pdf', 'jpg'],
      },
    ])
  })

  it('affiche « Type de document introuvable » avec un retour vers la liste', async () => {
    renderForm('/admin/documents/999/modifier')
    expect(await screen.findByText('Type de document introuvable')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Retour/ })).toHaveAttribute('href', '/admin/documents')
  })

  it('affiche l’erreur de chargement de la liste', async () => {
    renderForm('/admin/documents/2/modifier', { errors: { list: { status: 500, message: 'Erreur serveur' } } })
    expect(await screen.findByText('Erreur serveur')).toBeInTheDocument()
  })
})

describe('DocumentTypeFormPage — accessibilité', () => {
  it('n’a aucune violation jest-axe en création', async () => {
    renderForm('/admin/documents/nouveau')
    await screen.findByLabelText('Nom')
    await userEvent.click(screen.getByRole('radio', { name: 'Certaines catégories' }))
    await screen.findByRole('checkbox', { name: 'Secourisme' })
    await userEvent.selectOptions(screen.getByLabelText('Délai'), 'BEFORE_START')
    expect(await axe(document.body.firstElementChild)).toHaveNoViolations()
  })
})
