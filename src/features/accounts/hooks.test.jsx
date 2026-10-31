import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse } from 'msw'
import { renderWithProviders } from '../../test/render'
import { FORMATEURS, STAGIAIRES, apiError, mockAccountList, mockRequest } from '../../test/accounts'
import {
  useAccount,
  useAccounts,
  useCreateAccount,
  useSetAccountActive,
  useUpdateAccount,
} from './hooks'

function ListProbe({ kind, active }) {
  const { data, isLoading, isError } = useAccounts(kind, { active })
  if (isLoading) return <p>chargement</p>
  if (isError) return <p>erreur</p>
  return (
    <ul>
      {data.map((a) => (
        <li key={a.id}>{a.prenom}</li>
      ))}
    </ul>
  )
}

describe('useAccounts', () => {
  it('liste les formateurs', async () => {
    mockAccountList('formateurs', FORMATEURS)
    renderWithProviders(<ListProbe kind="formateurs" />)
    expect(await screen.findByText('Anne')).toBeInTheDocument()
    expect(screen.getByText('Paul')).toBeInTheDocument()
  })

  it('liste les stagiaires', async () => {
    mockAccountList('stagiaires', STAGIAIRES)
    renderWithProviders(<ListProbe kind="stagiaires" />)
    expect(await screen.findByText('Léa')).toBeInTheDocument()
  })

  it('transmet active=true pour les comptes actifs', async () => {
    const calls = mockAccountList('formateurs', FORMATEURS)
    renderWithProviders(<ListProbe kind="formateurs" active />)
    expect(await screen.findByText('Anne')).toBeInTheDocument()
    expect(screen.queryByText('Paul')).not.toBeInTheDocument()
    expect(calls.urls[0]).toContain('active=true')
  })

  it('ne transmet aucun paramètre sans filtre', async () => {
    const calls = mockAccountList('formateurs', FORMATEURS)
    renderWithProviders(<ListProbe kind="formateurs" />)
    await screen.findByText('Anne')
    expect(calls.urls[0]).not.toContain('active')
  })
})

function DetailProbe({ id }) {
  const { data, isError, error } = useAccount(id)
  if (isError) return <p>erreur {error.status}</p>
  return <p>{data ? data.prenom : 'chargement'}</p>
}

describe('useAccount', () => {
  it('lit le détail', async () => {
    mockRequest('get', '/users/10', () => HttpResponse.json(FORMATEURS[0]))
    renderWithProviders(<DetailProbe id={10} />)
    expect(await screen.findByText('Anne')).toBeInTheDocument()
  })

  it('remonte le 404', async () => {
    mockRequest('get', '/users/99', () => apiError(404, 'Introuvable'))
    renderWithProviders(<DetailProbe id={99} />)
    expect(await screen.findByText('erreur 404')).toBeInTheDocument()
  })
})

function CreateProbe({ kind, values }) {
  const create = useCreateAccount(kind)
  return (
    <>
      <button onClick={() => create.mutate(values)}>créer</button>
      {create.isSuccess && <p>créé {create.data.prenom}</p>}
      {create.error && <p>échec {create.error.status}</p>}
    </>
  )
}

describe('useCreateAccount', () => {
  const values = { nom: 'Roux', prenom: 'Zoé', email: 'zoe@adac.test' }

  it('crée un formateur sans formationIds', async () => {
    const calls = mockRequest('post', '/users/formateurs', () =>
      HttpResponse.json({ ...FORMATEURS[0], id: 12, prenom: 'Zoé' }, { status: 201 }),
    )
    renderWithProviders(<CreateProbe kind="formateurs" values={values} />)
    await userEvent.click(screen.getByText('créer'))
    expect(await screen.findByText('créé Zoé')).toBeInTheDocument()
    expect(calls.body).toEqual(values)
  })

  it('crée un stagiaire avec formationIds vide', async () => {
    const calls = mockRequest('post', '/users/stagiaires', () =>
      HttpResponse.json({ ...STAGIAIRES[0], id: 22, prenom: 'Zoé' }, { status: 201 }),
    )
    renderWithProviders(<CreateProbe kind="stagiaires" values={values} />)
    await userEvent.click(screen.getByText('créer'))
    expect(await screen.findByText('créé Zoé')).toBeInTheDocument()
    expect(calls.body).toEqual({ ...values, formationIds: [] })
  })

  it('remonte le 409', async () => {
    mockRequest('post', '/users/formateurs', () => apiError(409, 'Cet email est déjà utilisé'))
    renderWithProviders(<CreateProbe kind="formateurs" values={values} />)
    await userEvent.click(screen.getByText('créer'))
    expect(await screen.findByText('échec 409')).toBeInTheDocument()
  })

  it('recharge la liste après création', async () => {
    const calls = mockAccountList('formateurs', FORMATEURS)
    mockRequest('post', '/users/formateurs', () =>
      HttpResponse.json({ ...FORMATEURS[0], id: 12, prenom: 'Zoé' }, { status: 201 }),
    )
    renderWithProviders(
      <>
        <ListProbe kind="formateurs" />
        <CreateProbe kind="formateurs" values={values} />
      </>,
    )
    await screen.findByText('Anne')
    await userEvent.click(screen.getByText('créer'))
    await screen.findByText('créé Zoé')
    await vi.waitFor(() => expect(calls.count).toBe(2))
  })
})

function UpdateProbe({ original, values }) {
  const update = useUpdateAccount(original.id)
  return (
    <>
      <button onClick={() => update.mutate({ original, values })}>modifier</button>
      {update.isSuccess && <p>modifié {update.data.prenom}</p>}
    </>
  )
}

describe('useUpdateAccount', () => {
  it("n'envoie que les champs modifiés", async () => {
    const original = FORMATEURS[0]
    const calls = mockRequest('put', '/users/10', () => HttpResponse.json({ ...original, prenom: 'Annie' }))
    renderWithProviders(
      <UpdateProbe original={original} values={{ nom: original.nom, prenom: 'Annie', email: original.email }} />,
    )
    await userEvent.click(screen.getByText('modifier'))
    expect(await screen.findByText('modifié Annie')).toBeInTheDocument()
    expect(calls.body).toEqual({ prenom: 'Annie' })
  })
})

function ActiveProbe({ id, active }) {
  const setActive = useSetAccountActive()
  const { data } = useAccount(id)
  return (
    <>
      <button onClick={() => setActive.mutate({ id, active })}>basculer</button>
      <p>{data ? (data.isActive ? 'actif' : 'suspendu') : 'chargement'}</p>
    </>
  )
}

describe('useSetAccountActive', () => {
  it('suspend un compte et met le détail à jour', async () => {
    mockRequest('get', '/users/10', () => HttpResponse.json(FORMATEURS[0]))
    const calls = mockRequest('patch', '/users/10/deactivate', () =>
      HttpResponse.json({ ...FORMATEURS[0], isActive: false }),
    )
    renderWithProviders(<ActiveProbe id={10} active={false} />)
    expect(await screen.findByText('actif')).toBeInTheDocument()
    await userEvent.click(screen.getByText('basculer'))
    expect(await screen.findByText('suspendu')).toBeInTheDocument()
    expect(calls.count).toBe(1)
  })

  it('réactive un compte', async () => {
    mockRequest('get', '/users/11', () => HttpResponse.json(FORMATEURS[1]))
    const calls = mockRequest('patch', '/users/11/reactivate', () =>
      HttpResponse.json({ ...FORMATEURS[1], isActive: true }),
    )
    renderWithProviders(<ActiveProbe id={11} active />)
    expect(await screen.findByText('suspendu')).toBeInTheDocument()
    await userEvent.click(screen.getByText('basculer'))
    expect(await screen.findByText('actif')).toBeInTheDocument()
    expect(calls.count).toBe(1)
  })
})
