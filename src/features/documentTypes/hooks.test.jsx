import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../test/render'
import { mockDocumentTypeApi, mockDocumentTypes } from '../../test/documentTypes'
import {
  useCreateDocumentType,
  useDocumentTypes,
  useSetDocumentTypeActive,
  useUpdateDocumentType,
} from './hooks'

function ListProbe({ active }) {
  const { data, isLoading, isError, error } = useDocumentTypes({ active })
  if (isLoading) return <p>chargement</p>
  if (isError) return <p>erreur {error.status}</p>
  return (
    <ul>
      {data.map((type) => (
        <li key={type.id}>{type.nom}</li>
      ))}
    </ul>
  )
}

describe('useDocumentTypes', () => {
  it('liste tous les types sans filtre', async () => {
    const calls = mockDocumentTypes()
    renderWithProviders(<ListProbe />)
    expect(await screen.findByText('Ancienne attestation')).toBeInTheDocument()
    expect(calls.urls[0]).not.toContain('active')
  })

  it('transmet active=true pour les types actifs', async () => {
    const calls = mockDocumentTypes()
    renderWithProviders(<ListProbe active />)
    expect(await screen.findByText('Certificat médical')).toBeInTheDocument()
    expect(screen.queryByText('Ancienne attestation')).not.toBeInTheDocument()
    expect(calls.urls[0]).toContain('active=true')
  })

  it('remonte l’erreur en ApiError', async () => {
    mockDocumentTypes(undefined, { errorStatus: 500 })
    renderWithProviders(<ListProbe />)
    expect(await screen.findByText('erreur 500')).toBeInTheDocument()
  })
})

const NEW_TYPE = {
  nom: 'Attestation employeur',
  aide: null,
  isRequired: true,
  isSensitive: false,
  appliesToAllFormations: true,
  categoryIds: [],
  deadlineDays: null,
  deadlineAnchor: null,
  allowedFormats: [],
}

function WriteProbe() {
  const create = useCreateDocumentType()
  const update = useUpdateDocumentType(1)
  const setActive = useSetDocumentTypeActive()
  const all = useDocumentTypes()
  const active = useDocumentTypes({ active: true })

  const failure = [create, update, setActive].find((mutation) => mutation.isError)
  return (
    <div>
      <button onClick={() => create.mutate(NEW_TYPE)}>créer</button>
      <button onClick={() => update.mutate({ ...NEW_TYPE, nom: 'Identité' })}>modifier</button>
      <button onClick={() => setActive.mutate({ id: 1, active: false })}>désactiver</button>
      <button onClick={() => setActive.mutate({ id: 3, active: true })}>réactiver</button>
      {create.data && <p>créé {create.data.id}</p>}
      {failure && (
        <p>
          erreur {failure.error.status} {failure.error.message}
        </p>
      )}
      <p>{all.data ? `${all.data.length} au total` : 'chargement'}</p>
      <p>{active.data ? `${active.data.length} actifs` : 'chargement'}</p>
    </div>
  )
}

async function renderWriteProbe(options) {
  const api = mockDocumentTypeApi(undefined, options)
  renderWithProviders(<WriteProbe />)
  await screen.findByText('3 au total')
  await screen.findByText('2 actifs')
  return api
}

describe('useCreateDocumentType', () => {
  it('envoie le corps tel quel et renvoie le type créé', async () => {
    const api = await renderWriteProbe()
    await userEvent.click(screen.getByRole('button', { name: 'créer' }))
    expect(await screen.findByText('créé 100')).toBeInTheDocument()
    expect(api.calls.created).toEqual([NEW_TYPE])
  })

  it('recharge la liste complète et la liste des actifs', async () => {
    await renderWriteProbe()
    await userEvent.click(screen.getByRole('button', { name: 'créer' }))
    expect(await screen.findByText('4 au total')).toBeInTheDocument()
    expect(await screen.findByText('3 actifs')).toBeInTheDocument()
  })

  it('remonte le 409 en ApiError sans recharger', async () => {
    const api = await renderWriteProbe({ errors: { create: { status: 409, message: 'Ce type existe déjà' } } })
    const before = api.calls.list
    await userEvent.click(screen.getByRole('button', { name: 'créer' }))
    expect(await screen.findByText('erreur 409 Ce type existe déjà')).toBeInTheDocument()
    expect(api.calls.list).toBe(before)
  })
})

describe('useUpdateDocumentType', () => {
  it('envoie PUT sur l’identifiant avec le corps complet', async () => {
    const api = await renderWriteProbe()
    await userEvent.click(screen.getByRole('button', { name: 'modifier' }))
    await waitFor(() => expect(api.calls.updated).toEqual([{ id: 1, ...NEW_TYPE, nom: 'Identité' }]))
  })

  it('recharge les listes après la modification', async () => {
    const api = await renderWriteProbe()
    const before = api.calls.list
    await userEvent.click(screen.getByRole('button', { name: 'modifier' }))
    await waitFor(() => expect(api.calls.list).toBeGreaterThan(before))
  })

  it('remonte le 409 en ApiError', async () => {
    await renderWriteProbe({ errors: { update: { status: 409, message: 'Nom déjà utilisé' } } })
    await userEvent.click(screen.getByRole('button', { name: 'modifier' }))
    expect(await screen.findByText('erreur 409 Nom déjà utilisé')).toBeInTheDocument()
  })

  it('remonte le 404 d’un type inconnu en ApiError', async () => {
    await renderWriteProbe({ errors: { update: { status: 404, message: 'Type de document introuvable' } } })
    await userEvent.click(screen.getByRole('button', { name: 'modifier' }))
    expect(await screen.findByText('erreur 404 Type de document introuvable')).toBeInTheDocument()
  })
})

describe('useSetDocumentTypeActive', () => {
  it('désactive par PATCH …/deactivate et retire le type des actifs', async () => {
    const api = await renderWriteProbe()
    await userEvent.click(screen.getByRole('button', { name: 'désactiver' }))
    expect(await screen.findByText('1 actifs')).toBeInTheDocument()
    expect(api.calls.deactivated).toEqual([1])
    expect(screen.getByText('3 au total')).toBeInTheDocument()
  })

  it('réactive par PATCH …/activate et ajoute le type aux actifs', async () => {
    const api = await renderWriteProbe()
    await userEvent.click(screen.getByRole('button', { name: 'réactiver' }))
    expect(await screen.findByText('3 actifs')).toBeInTheDocument()
    expect(api.calls.activated).toEqual([3])
  })

  it('remonte l’erreur du back sans recharger', async () => {
    const api = await renderWriteProbe({ errors: { deactivate: { status: 404, message: 'Type de document introuvable' } } })
    const before = api.calls.list
    await userEvent.click(screen.getByRole('button', { name: 'désactiver' }))
    expect(await screen.findByText('erreur 404 Type de document introuvable')).toBeInTheDocument()
    expect(api.calls.list).toBe(before)
  })
})
