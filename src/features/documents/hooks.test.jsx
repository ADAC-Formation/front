import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../api/ApiError'
import { mockDocumentApi } from '../../test/documents'
import { renderWithProviders } from '../../test/render'
import { downloadDocument } from './api'
import { useDeleteDocument, useDocuments, useDownloadDocument, useUploadDocuments } from './hooks'
import { saveBlob } from './saveBlob'

vi.mock('./saveBlob', () => ({ saveBlob: vi.fn() }))

const pdf = (name, size = 1000) => new File([new Uint8Array(size)], name, { type: 'application/pdf' })

function ListProbe({ formationId = 101 }) {
  const { data, isLoading, isError, error } = useDocuments(formationId)
  if (isLoading) return <p>chargement</p>
  if (isError) return <p>erreur {error.status}</p>
  return (
    <ul>
      {data.map((document) => (
        <li key={document.id}>{document.fileName}</li>
      ))}
    </ul>
  )
}

describe('useDocuments', () => {
  it('liste les documents de la formation demandée', async () => {
    const api = mockDocumentApi()
    renderWithProviders(<ListProbe />)
    expect(await screen.findByText('Support de cours.pdf')).toBeInTheDocument()
    expect(api.calls.listUrls[0]).toContain('formationId=101')
  })

  it("remonte l'erreur en ApiError", async () => {
    mockDocumentApi(undefined, { errors: { list: { status: 500 } } })
    renderWithProviders(<ListProbe />)
    expect(await screen.findByText('erreur 500')).toBeInTheDocument()
  })
})

function UploadProbe({ files }) {
  const { upload, isPending, result } = useUploadDocuments(101)
  const list = useDocuments(101)
  return (
    <>
      <button onClick={() => upload(files)}>envoyer</button>
      {isPending && <p>en cours</p>}
      {result && (
        <>
          <p>{`envoyés ${result.uploaded}`}</p>
          <ul>
            {result.rejections.map(({ name, message }) => (
              <li key={name}>{`${name} : ${message}`}</li>
            ))}
          </ul>
        </>
      )}
      <ul>{list.data?.map((document) => <li key={document.id}>{`liste ${document.fileName}`}</li>)}</ul>
    </>
  )
}

describe('useUploadDocuments', () => {
  it('envoie un POST par fichier valide, dans l’ordre, avec le formationId', async () => {
    const api = mockDocumentApi()
    renderWithProviders(<UploadProbe files={[pdf('a.pdf'), pdf('b.pdf'), pdf('c.pdf')]} />)
    await screen.findByText('liste Programme.docx')
    await userEvent.click(screen.getByText('envoyer'))
    expect(await screen.findByText('envoyés 3')).toBeInTheDocument()
    expect(api.calls.uploaded.map(({ fileName, formationId }) => [fileName, formationId])).toEqual([
      ['a.pdf', 101],
      ['b.pdf', 101],
      ['c.pdf', 101],
    ])
  })

  it('refuse un fichier invalide sans appel et envoie les autres', async () => {
    const api = mockDocumentApi()
    const exe = new File(['x'], 'virus.exe')
    renderWithProviders(<UploadProbe files={[exe, pdf('bon.pdf')]} />)
    await userEvent.click(await screen.findByText('envoyer'))
    expect(await screen.findByText(/virus\.exe : Format non autorisé/)).toBeInTheDocument()
    expect(screen.getByText('envoyés 1')).toBeInTheDocument()
    expect(api.calls.uploaded.map((upload) => upload.fileName)).toEqual(['bon.pdf'])
  })

  it('un 400 du back sur un fichier n’arrête pas les suivants et garde son message', async () => {
    const api = mockDocumentApi(undefined, {
      errors: { upload: (name) => (name === 'b.pdf' ? { status: 400, message: 'Format non autorisé' } : null) },
    })
    renderWithProviders(<UploadProbe files={[pdf('a.pdf'), pdf('b.pdf'), pdf('c.pdf')]} />)
    await userEvent.click(await screen.findByText('envoyer'))
    expect(await screen.findByText('b.pdf : Format non autorisé')).toBeInTheDocument()
    expect(screen.getByText('envoyés 2')).toBeInTheDocument()
    expect(api.calls.uploaded.map((upload) => upload.fileName)).toEqual(['a.pdf', 'b.pdf', 'c.pdf'])
  })

  it('recharge la liste une seule fois à la fin, même si tout a échoué', async () => {
    const api = mockDocumentApi(undefined, { errors: { upload: { status: 403, message: 'Accès refusé' } } })
    renderWithProviders(<UploadProbe files={[pdf('a.pdf'), pdf('b.pdf')]} />)
    await screen.findByText('liste Programme.docx')
    const before = api.calls.list
    await userEvent.click(screen.getByText('envoyer'))
    await screen.findByText('a.pdf : Accès refusé')
    await waitFor(() => expect(api.calls.list).toBe(before + 1))
  })

  it('fait apparaître les documents envoyés dans la liste rechargée', async () => {
    mockDocumentApi()
    renderWithProviders(<UploadProbe files={[pdf('nouveau.pdf')]} />)
    await userEvent.click(await screen.findByText('envoyer'))
    expect(await screen.findByText('liste nouveau.pdf')).toBeInTheDocument()
  })
})

function DeleteProbe() {
  const remove = useDeleteDocument()
  const list = useDocuments(101)
  return (
    <>
      <button onClick={() => remove.mutate(501)}>supprimer</button>
      {remove.isError && <p>{`erreur ${remove.error.status}`}</p>}
      <ul>{list.data?.map((document) => <li key={document.id}>{document.fileName}</li>)}</ul>
    </>
  )
}

describe('useDeleteDocument', () => {
  it('supprime puis recharge la liste', async () => {
    const api = mockDocumentApi()
    renderWithProviders(<DeleteProbe />)
    await screen.findByText('Support de cours.pdf')
    await userEvent.click(screen.getByText('supprimer'))
    await waitFor(() => expect(screen.queryByText('Support de cours.pdf')).not.toBeInTheDocument())
    expect(api.calls.deleted).toEqual([501])
  })

  it('recharge aussi la liste sur un 404 (le document n’existe plus)', async () => {
    const api = mockDocumentApi(undefined, { errors: { delete: { status: 404, message: 'Introuvable' } } })
    renderWithProviders(<DeleteProbe />)
    await screen.findByText('Support de cours.pdf')
    const before = api.calls.list
    await userEvent.click(screen.getByText('supprimer'))
    expect(await screen.findByText('erreur 404')).toBeInTheDocument()
    await waitFor(() => expect(api.calls.list).toBe(before + 1))
  })

  it('ne recharge pas la liste sur un 403', async () => {
    const api = mockDocumentApi(undefined, { errors: { delete: { status: 403, message: 'Interdit' } } })
    renderWithProviders(<DeleteProbe />)
    await screen.findByText('Support de cours.pdf')
    const before = api.calls.list
    await userEvent.click(screen.getByText('supprimer'))
    expect(await screen.findByText('erreur 403')).toBeInTheDocument()
    expect(api.calls.list).toBe(before)
  })
})

describe('téléchargement', () => {
  beforeEach(() => saveBlob.mockClear())

  it('downloadDocument renvoie le binaire du back', async () => {
    mockDocumentApi()
    const blob = await downloadDocument(501)
    expect(await blob.text()).toBe('contenu de Support de cours.pdf')
  })

  it.each([
    [403, /pas accès/i],
    [404, /introuvable/i],
  ])('un %i devient une ApiError lisible (corps blob non exploitable)', async (status, message) => {
    mockDocumentApi(undefined, { errors: { download: { status, message: 'Message du back' } } })
    const error = await downloadDocument(501).catch((caught) => caught)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(status)
    expect(error.message).toMatch(message)
  })

  function DownloadProbe() {
    const download = useDownloadDocument()
    return (
      <>
        <button onClick={() => download.mutate({ id: 501, fileName: 'Support de cours.pdf' })}>télécharger</button>
        {download.isError && <p>{download.error.message}</p>}
      </>
    )
  }

  it('enregistre le fichier reçu sous le nom du document', async () => {
    const api = mockDocumentApi()
    renderWithProviders(<DownloadProbe />)
    await userEvent.click(screen.getByText('télécharger'))
    await waitFor(() => expect(saveBlob).toHaveBeenCalledTimes(1))
    expect(api.calls.downloaded).toEqual([501])
    expect(saveBlob.mock.calls[0][1]).toBe('Support de cours.pdf')
    expect(await saveBlob.mock.calls[0][0].text()).toBe('contenu de Support de cours.pdf')
  })

  it('n’enregistre rien et expose l’erreur sur un 403', async () => {
    mockDocumentApi(undefined, { errors: { download: { status: 403, message: 'x' } } })
    renderWithProviders(<DownloadProbe />)
    await userEvent.click(screen.getByText('télécharger'))
    expect(await screen.findByText(/pas accès/i)).toBeInTheDocument()
    expect(saveBlob).not.toHaveBeenCalled()
  })
})
