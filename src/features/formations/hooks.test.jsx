import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../test/render'
import {
  FORMATIONS,
  INSCRITS,
  mockArchive,
  mockCreateFormation,
  mockFormationDetail,
  mockFormationList,
  mockImportFormations,
  mockInscriptions,
  mockUpdateFormation,
} from '../../test/formations'
import {
  useArchiveFormation,
  useCreateFormation,
  useFormation,
  useFormations,
  useImportFormations,
  useInscriptions,
  useUpdateFormation,
} from './hooks'

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

const REQUEST = {
  intitule: 'Nouvelle formation',
  description: null,
  dateDebut: '2026-05-04',
  dateFin: '2026-05-05',
  modalite: 'VISIO',
  categoryId: 2,
  formateurId: null,
}

function CreateProbe() {
  const create = useCreateFormation()
  const list = useFormations({ status: 'ACTIVE' })
  return (
    <div>
      <button onClick={() => create.mutate(REQUEST)}>créer</button>
      {create.data && <p>créée {create.data.id}</p>}
      {create.isError && <p>erreur {create.error.status}</p>}
      <p>{list.data ? `${list.data.length} actives` : 'chargement'}</p>
    </div>
  )
}

describe('useCreateFormation', () => {
  it('envoie le corps, renvoie la formation créée et recharge les listes', async () => {
    const listCalls = mockFormationList()
    const createCalls = mockCreateFormation({ id: 77 })
    renderWithProviders(<CreateProbe />)
    await screen.findByText('2 actives')
    await userEvent.click(screen.getByRole('button', { name: 'créer' }))
    expect(await screen.findByText('créée 77')).toBeInTheDocument()
    expect(createCalls.body).toEqual(REQUEST)
    expect(listCalls.count).toBeGreaterThanOrEqual(2)
  })

  it('remonte le 400 en ApiError', async () => {
    mockFormationList()
    mockCreateFormation({ errorStatus: 400 })
    renderWithProviders(<CreateProbe />)
    await screen.findByText('2 actives')
    await userEvent.click(screen.getByRole('button', { name: 'créer' }))
    expect(await screen.findByText('erreur 400')).toBeInTheDocument()
  })
})

function UpdateProbe() {
  const update = useUpdateFormation(101)
  return (
    <div>
      <button onClick={() => update.mutate({ intitule: 'Renommée' })}>modifier</button>
      {update.data && <p>modifiée {update.data.intitule}</p>}
      {update.isError && <p>erreur {update.error.status}</p>}
    </div>
  )
}

describe('useUpdateFormation', () => {
  it('envoie PUT avec les champs donnés et renvoie la formation', async () => {
    const calls = mockUpdateFormation(FORMATIONS[0])
    renderWithProviders(<UpdateProbe />)
    await userEvent.click(screen.getByRole('button', { name: 'modifier' }))
    expect(await screen.findByText('modifiée Renommée')).toBeInTheDocument()
    expect(calls.body).toEqual({ intitule: 'Renommée' })
  })

  it('remonte le 409 en ApiError', async () => {
    mockUpdateFormation(FORMATIONS[0], { errorStatus: 409 })
    renderWithProviders(<UpdateProbe />)
    await userEvent.click(screen.getByRole('button', { name: 'modifier' }))
    expect(await screen.findByText('erreur 409')).toBeInTheDocument()
  })
})

const XLSX_FILE = new File(['contenu'], 'formations.xlsx', {
  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
})

function ImportProbe() {
  const importFormations = useImportFormations()
  const list = useFormations({ status: 'ACTIVE' })
  return (
    <div>
      <button onClick={() => importFormations.mutate(XLSX_FILE)}>importer</button>
      {importFormations.data && <p>importées {importFormations.data.length}</p>}
      {importFormations.isError && <p>erreur {importFormations.error.status} {importFormations.error.message}</p>}
      <p>{list.data ? `${list.data.length} actives` : 'chargement'}</p>
    </div>
  )
}

describe('useImportFormations', () => {
  it('envoie le fichier dans le champ file en multipart, renvoie les formations et recharge les listes', async () => {
    const listCalls = mockFormationList()
    const importCalls = mockImportFormations({ count: 3 })
    renderWithProviders(<ImportProbe />)
    await screen.findByText('2 actives')
    await userEvent.click(screen.getByRole('button', { name: 'importer' }))
    expect(await screen.findByText('importées 3')).toBeInTheDocument()
    expect(importCalls.contentType).toMatch(/^multipart\/form-data; boundary=/)
    expect(importCalls.body).toContain('name="file"; filename="formations.xlsx"')
    expect(listCalls.count).toBeGreaterThanOrEqual(2)
  })

  it('remonte le 400 en ApiError avec le message du back', async () => {
    mockFormationList()
    mockImportFormations({ errorStatus: 400, errorMessage: 'ligne 3, colonne categorie : "X" introuvable' })
    renderWithProviders(<ImportProbe />)
    await userEvent.click(screen.getByRole('button', { name: 'importer' }))
    expect(await screen.findByText('erreur 400 ligne 3, colonne categorie : "X" introuvable')).toBeInTheDocument()
  })

  it('ne recharge pas les listes quand l’import échoue', async () => {
    const listCalls = mockFormationList()
    mockImportFormations({ errorStatus: 400 })
    renderWithProviders(<ImportProbe />)
    await screen.findByText('2 actives')
    await userEvent.click(screen.getByRole('button', { name: 'importer' }))
    await screen.findByText(/erreur 400/)
    expect(listCalls.count).toBe(1)
  })
})
