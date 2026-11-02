import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../test/render'
import { mockCategories, mockCategoryApi } from '../../test/categories'
import { mockFormationList } from '../../test/formations'
import { useFormations } from '../formations/hooks'
import { useCategories, useCreateCategory, useSetCategoryActive, useUpdateCategory } from './hooks'

function Probe({ active }) {
  const { data, isLoading, isError, error } = useCategories({ active })
  if (isLoading) return <p>chargement</p>
  if (isError) return <p>erreur {error.status}</p>
  return (
    <ul>
      {data.map((category) => (
        <li key={category.id}>{category.nom}</li>
      ))}
    </ul>
  )
}

describe('useCategories', () => {
  it('liste toutes les catégories sans filtre', async () => {
    const calls = mockCategories()
    renderWithProviders(<Probe />)
    expect(await screen.findByText('Ancienne catégorie')).toBeInTheDocument()
    expect(calls.urls[0]).not.toContain('active')
  })

  it('transmet active=true pour les catégories actives', async () => {
    const calls = mockCategories()
    renderWithProviders(<Probe active />)
    expect(await screen.findByText('Secourisme')).toBeInTheDocument()
    expect(screen.queryByText('Ancienne catégorie')).not.toBeInTheDocument()
    expect(calls.urls[0]).toContain('active=true')
  })

  it("remonte l'erreur en ApiError", async () => {
    mockCategories(undefined, { errorStatus: 500 })
    renderWithProviders(<Probe active />)
    expect(await screen.findByText('erreur 500')).toBeInTheDocument()
  })
})

// ---------- Écritures (TICKET-049) ----------

const NEW_CATEGORY = { nom: 'Numérique avancé', couleur: '#12427C' }

// Une sonde qui lit la liste complète, la liste des actives et les formations : elle montre ce que
// le rechargement après une écriture met à jour.
function WriteProbe() {
  const create = useCreateCategory()
  const update = useUpdateCategory(1)
  const setActive = useSetCategoryActive()
  const all = useCategories()
  const active = useCategories({ active: true })
  const formations = useFormations()

  const failure = [create, update, setActive].find((mutation) => mutation.isError)
  return (
    <div>
      <button onClick={() => create.mutate(NEW_CATEGORY)}>créer</button>
      <button onClick={() => update.mutate({ nom: 'Secours', couleur: '#d62828' })}>modifier</button>
      <button onClick={() => setActive.mutate({ id: 1, active: false })}>désactiver</button>
      <button onClick={() => setActive.mutate({ id: 3, active: true })}>réactiver</button>
      {create.data && <p>créée {create.data.id}</p>}
      {failure && <p>erreur {failure.error.status} {failure.error.message}</p>}
      <p>{all.data ? `${all.data.length} au total` : 'chargement'}</p>
      <p>{active.data ? `${active.data.length} actives` : 'chargement'}</p>
      <p>{formations.data ? 'formations chargées' : 'chargement'}</p>
    </div>
  )
}

async function renderWriteProbe(options) {
  const api = mockCategoryApi(undefined, options)
  const formations = mockFormationList()
  renderWithProviders(<WriteProbe />)
  await screen.findByText('3 au total')
  await screen.findByText('2 actives')
  await screen.findByText('formations chargées')
  return { api, formations }
}

describe('useCreateCategory', () => {
  it('envoie { nom, couleur } et renvoie la catégorie créée', async () => {
    const { api } = await renderWriteProbe()
    await userEvent.click(screen.getByRole('button', { name: 'créer' }))
    expect(await screen.findByText('créée 100')).toBeInTheDocument()
    expect(api.calls.created).toEqual([NEW_CATEGORY])
  })

  it('recharge la liste complète, la liste des actives et les formations', async () => {
    const { api, formations } = await renderWriteProbe()
    const listCallsBefore = api.calls.list
    await userEvent.click(screen.getByRole('button', { name: 'créer' }))
    expect(await screen.findByText('4 au total')).toBeInTheDocument()
    expect(await screen.findByText('3 actives')).toBeInTheDocument()
    expect(api.calls.list).toBeGreaterThan(listCallsBefore)
    await waitFor(() => expect(formations.count).toBeGreaterThanOrEqual(2))
  })

  it('remonte le 409 en ApiError sans recharger', async () => {
    const { api, formations } = await renderWriteProbe({
      errors: { create: { status: 409, message: 'Cette catégorie existe déjà' } },
    })
    const listCallsBefore = api.calls.list
    await userEvent.click(screen.getByRole('button', { name: 'créer' }))
    expect(await screen.findByText('erreur 409 Cette catégorie existe déjà')).toBeInTheDocument()
    expect(api.calls.list).toBe(listCallsBefore)
    expect(formations.count).toBe(1)
  })
})

describe('useUpdateCategory', () => {
  it('envoie PUT avec le nom et la couleur', async () => {
    const { api } = await renderWriteProbe()
    await userEvent.click(screen.getByRole('button', { name: 'modifier' }))
    await waitFor(() => expect(api.calls.updated).toEqual([{ id: 1, nom: 'Secours', couleur: '#d62828' }]))
  })

  it('recharge les catégories et les formations (la catégorie y est embarquée)', async () => {
    const { api, formations } = await renderWriteProbe()
    const listCallsBefore = api.calls.list
    await userEvent.click(screen.getByRole('button', { name: 'modifier' }))
    await waitFor(() => expect(api.calls.list).toBeGreaterThan(listCallsBefore))
    await waitFor(() => expect(formations.count).toBeGreaterThanOrEqual(2))
  })

  it('remonte le 409 en ApiError', async () => {
    await renderWriteProbe({ errors: { update: { status: 409, message: 'Nom déjà utilisé' } } })
    await userEvent.click(screen.getByRole('button', { name: 'modifier' }))
    expect(await screen.findByText('erreur 409 Nom déjà utilisé')).toBeInTheDocument()
  })
})

describe('useSetCategoryActive', () => {
  it('désactive par PATCH …/deactivate et retire la catégorie des actives', async () => {
    const { api } = await renderWriteProbe()
    await userEvent.click(screen.getByRole('button', { name: 'désactiver' }))
    expect(await screen.findByText('1 actives')).toBeInTheDocument()
    expect(api.calls.deactivated).toEqual([1])
    expect(screen.getByText('3 au total')).toBeInTheDocument()
  })

  it('réactive par PATCH …/activate et ajoute la catégorie aux actives', async () => {
    const { api } = await renderWriteProbe()
    await userEvent.click(screen.getByRole('button', { name: 'réactiver' }))
    expect(await screen.findByText('3 actives')).toBeInTheDocument()
    expect(api.calls.activated).toEqual([3])
  })

  it('remonte une erreur sans recharger', async () => {
    const { api } = await renderWriteProbe({ errors: { deactivate: { status: 404, message: 'Catégorie introuvable' } } })
    const listCallsBefore = api.calls.list
    await userEvent.click(screen.getByRole('button', { name: 'désactiver' }))
    expect(await screen.findByText('erreur 404 Catégorie introuvable')).toBeInTheDocument()
    expect(api.calls.list).toBe(listCallsBefore)
  })
})
