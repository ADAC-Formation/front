import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../test/render'
import {
  FORMATIONS,
  INSCRITS,
  mockArchive,
  mockFormationDetail,
  mockFormationList,
  mockInscriptions,
} from '../../test/formations'
import { useArchiveFormation, useFormation, useFormations, useInscriptions } from './hooks'

function ListProbe({ status }) {
  const { data, isLoading, isError } = useFormations({ status })
  if (isLoading) return <p>chargement</p>
  if (isError) return <p>erreur</p>
  return (
    <ul>
      {data.map((f) => (
        <li key={f.id}>{f.intitule}</li>
      ))}
    </ul>
  )
}

describe('useFormations', () => {
  it('liste les formations sans filtre par défaut', async () => {
    const calls = mockFormationList()
    renderWithProviders(<ListProbe />)
    expect(await screen.findByText('Premiers secours PSC1')).toBeInTheDocument()
    expect(calls.urls[0]).not.toContain('status')
  })

  it('transmet le statut demandé', async () => {
    const calls = mockFormationList()
    renderWithProviders(<ListProbe status="ARCHIVED" />)
    expect(await screen.findByText('Gestes et postures')).toBeInTheDocument()
    expect(screen.queryByText('Excel niveau 1')).not.toBeInTheDocument()
    expect(calls.urls[0]).toContain('status=ARCHIVED')
  })
})

function DetailProbe({ id }) {
  const { data, isError, error } = useFormation(id)
  if (isError) return <p>erreur {error.status}</p>
  return <p>{data ? data.intitule : 'chargement'}</p>
}

describe('useFormation', () => {
  it('charge le détail', async () => {
    mockFormationDetail(FORMATIONS[0])
    renderWithProviders(<DetailProbe id={101} />)
    expect(await screen.findByText('Premiers secours PSC1')).toBeInTheDocument()
  })

  it('remonte le 404 en ApiError', async () => {
    mockFormationDetail(FORMATIONS[0], { errorStatus: 404 })
    renderWithProviders(<DetailProbe id={101} />)
    expect(await screen.findByText('erreur 404')).toBeInTheDocument()
  })

  it('remonte le 403 en ApiError', async () => {
    mockFormationDetail(FORMATIONS[0], { errorStatus: 403 })
    renderWithProviders(<DetailProbe id={101} />)
    expect(await screen.findByText('erreur 403')).toBeInTheDocument()
  })
})

function InscriptionsProbe({ enabled }) {
  const { data, isError } = useInscriptions(101, { enabled })
  if (isError) return <p>erreur</p>
  return <p>{data ? `${data.length} inscrits` : 'rien'}</p>
}

describe('useInscriptions', () => {
  it('charge les inscrits quand elle est activée', async () => {
    mockInscriptions(101, INSCRITS)
    renderWithProviders(<InscriptionsProbe enabled />)
    expect(await screen.findByText('2 inscrits')).toBeInTheDocument()
  })

  it("n'émet aucun appel quand elle est désactivée", async () => {
    const calls = mockInscriptions(101, INSCRITS)
    renderWithProviders(<InscriptionsProbe enabled={false} />)
    expect(screen.getByText('rien')).toBeInTheDocument()
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(calls.count).toBe(0)
  })
})

function ArchiveProbe({ id, onDone }) {
  const archive = useArchiveFormation(id)
  const list = useFormations({ status: 'ACTIVE' })
  return (
    <div>
      <button onClick={() => archive.mutate(undefined, { onSuccess: onDone })}>archiver</button>
      {archive.isError && <p>erreur {archive.error.status}</p>}
      <p>{list.data ? `${list.data.length} actives` : 'chargement'}</p>
    </div>
  )
}

describe('useArchiveFormation', () => {
  it("appelle PATCH …/archive et recharge la liste", async () => {
    const listCalls = mockFormationList()
    const archiveCalls = mockArchive(FORMATIONS[0])
    renderWithProviders(<ArchiveProbe id={101} />)
    expect(await screen.findByText('2 actives')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'archiver' }))
    await screen.findByText('2 actives')
    expect(archiveCalls.count).toBe(1)
    expect(listCalls.count).toBeGreaterThanOrEqual(2)
  })

  it('remonte le 409 en ApiError', async () => {
    mockFormationList()
    mockArchive(FORMATIONS[0], { errorStatus: 409 })
    renderWithProviders(<ArchiveProbe id={101} />)
    await screen.findByText('2 actives')
    await userEvent.click(screen.getByRole('button', { name: 'archiver' }))
    expect(await screen.findByText('erreur 409')).toBeInTheDocument()
  })
})
