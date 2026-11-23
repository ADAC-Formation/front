import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../test/render'
import { FORMATIONS, INSCRITS, mockEnroll, mockFormationList, mockInscriptions, mockUnenroll } from '../../test/formations'
import { NETWORK_ERROR_MESSAGE } from '../../api/ApiError'
import { useEnrollStagiaires, useInscriptions, useUnenrollStagiaire } from './hooks'

function EnrollProbe({ pairs }) {
  const enroll = useEnrollStagiaires()
  const inscrits = useInscriptions(101)
  const result = enroll.data
  return (
    <div>
      <button onClick={() => enroll.mutate(pairs)}>inscrire</button>
      <p>{inscrits.data ? `${inscrits.data.length} inscrits` : 'chargement'}</p>
      {result && (
        <>
          <p>inscrits : {result.enrolled.map((pair) => `${pair.formationId}/${pair.stagiaireId}`).join(', ')}</p>
          <ul>
            {result.failed.map((pair) => (
              <li key={`${pair.formationId}/${pair.stagiaireId}`}>
                échec {pair.formationId}/{pair.stagiaireId} : {pair.message}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

describe('useEnrollStagiaires', () => {
  it("envoie un POST par couple, l'un après l'autre, dans l'ordre donné", async () => {
    const calls = mockEnroll()
    mockInscriptions(101, INSCRITS)
    renderWithProviders(
      <EnrollProbe pairs={[{ formationId: 101, stagiaireId: 30 }, { formationId: 102, stagiaireId: 30 }]} />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'inscrire' }))
    expect(await screen.findByText('inscrits : 101/30, 102/30')).toBeInTheDocument()
    expect(calls.bodies).toEqual([
      { formationId: 101, stagiaireId: 30 },
      { formationId: 102, stagiaireId: 30 },
    ])
  })

  it('poursuit après un échec et renvoie le message du back pour chaque échec', async () => {
    mockEnroll({ errors: { 102: { status: 400, message: 'Formation archivée, inscription impossible' } } })
    mockInscriptions(101, INSCRITS)
    renderWithProviders(
      <EnrollProbe
        pairs={[
          { formationId: 102, stagiaireId: 30 },
          { formationId: 101, stagiaireId: 30 },
        ]}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'inscrire' }))
    expect(await screen.findByText('inscrits : 101/30')).toBeInTheDocument()
    expect(screen.getByText('échec 102/30 : Formation archivée, inscription impossible')).toBeInTheDocument()
  })

  it('compte un 409 « déjà inscrit » comme une réussite', async () => {
    mockEnroll({ errors: { 101: { status: 409, message: 'Stagiaire déjà inscrit à cette formation' } } })
    mockInscriptions(101, INSCRITS)
    renderWithProviders(<EnrollProbe pairs={[{ formationId: 101, stagiaireId: 20 }]} />)
    await userEvent.click(screen.getByRole('button', { name: 'inscrire' }))
    expect(await screen.findByText('inscrits : 101/20')).toBeInTheDocument()
    expect(screen.queryByText(/échec/)).not.toBeInTheDocument()
  })

  it('rend le message de coupure réseau pour une inscription qui ne part pas', async () => {
    mockEnroll({ errors: { 101: 'network' } })
    mockInscriptions(101, INSCRITS)
    renderWithProviders(<EnrollProbe pairs={[{ formationId: 101, stagiaireId: 30 }]} />)
    await userEvent.click(screen.getByRole('button', { name: 'inscrire' }))
    expect(await screen.findByText(`échec 101/30 : ${NETWORK_ERROR_MESSAGE}`)).toBeInTheDocument()
  })

  it('recharge les inscrits des formations une fois les inscriptions faites', async () => {
    mockEnroll()
    const inscrits = mockInscriptions(101, INSCRITS)
    renderWithProviders(<EnrollProbe pairs={[{ formationId: 101, stagiaireId: 30 }]} />)
    expect(await screen.findByText('2 inscrits')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'inscrire' }))
    await screen.findByText('inscrits : 101/30')
    await vi.waitFor(() => expect(inscrits.count).toBe(2))
  })
})

function UnenrollProbe() {
  const unenroll = useUnenrollStagiaire()
  const list = useInscriptions(101)
  return (
    <div>
      <button onClick={() => unenroll.mutate({ formationId: 101, stagiaireId: 20 })}>désinscrire</button>
      {unenroll.isSuccess && <p>désinscrit</p>}
      {unenroll.isError && <p>erreur {unenroll.error.status} : {unenroll.error.message}</p>}
      <p>{list.data ? `${list.data.length} inscrits` : 'chargement'}</p>
    </div>
  )
}

describe('useUnenrollStagiaire', () => {
  it('appelle DELETE …/inscriptions/{stagiaireId} et recharge les inscrits', async () => {
    const calls = mockUnenroll()
    const inscrits = mockInscriptions(101, INSCRITS)
    mockFormationList(FORMATIONS)
    renderWithProviders(<UnenrollProbe />)
    expect(await screen.findByText('2 inscrits')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'désinscrire' }))
    expect(await screen.findByText('désinscrit')).toBeInTheDocument()
    expect(calls.paths).toEqual([{ formationId: 101, stagiaireId: 20 }])
    await vi.waitFor(() => expect(inscrits.count).toBe(2))
  })

  it('remonte le 409 de la formation archivée en ApiError', async () => {
    mockUnenroll({ errorStatus: 409 })
    mockInscriptions(101, INSCRITS)
    renderWithProviders(<UnenrollProbe />)
    await userEvent.click(screen.getByRole('button', { name: 'désinscrire' }))
    expect(await screen.findByText('erreur 409 : Formation archivée, désinscription impossible')).toBeInTheDocument()
  })
})
