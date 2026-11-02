import { http, HttpResponse } from 'msw'
import { server } from './msw/server'
import { API_URL, USERS } from './session'
import { apiError } from './formations'

// Documents fictifs de la formation 101 (forme de DocumentResponse, tech.md § 6) : le premier a été
// envoyé par le formateur (USERS.ADMIN), le second par la chargée de formation.
export const DOCUMENTS = [
  {
    id: 501,
    fileName: 'Support de cours.pdf',
    fileUrl: 'https://supabase.test/storage/501',
    fileSize: 245760,
    mimeType: 'application/pdf',
    uploadedBy: USERS.ADMIN,
    formationId: 101,
    inscriptionId: null,
    createdAt: '2026-02-20T10:30:00',
  },
  {
    id: 502,
    fileName: 'Programme.docx',
    fileUrl: 'https://supabase.test/storage/502',
    fileSize: 51200,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    uploadedBy: USERS.SUPER_ADMIN,
    formationId: 101,
    inscriptionId: null,
    createdAt: '2026-02-21T09:00:00',
  },
]

// API des documents avec état en mémoire : GET (`?formationId=`), POST multipart, téléchargement
// binaire, DELETE, comme le back. Chaque écriture change la liste renvoyée ensuite. `errors[opération]`
// (`list`, `upload`, `download`, `delete`) vaut `{ status, message }`, ou `'network'` ; pour `upload`,
// une fonction `(fileName) => erreur | null` permet de refuser certains fichiers seulement.
// `calls` garde les listes (`list`, `listUrls`), les envois reçus (`uploaded` : nom, formationId),
// les identifiants téléchargés (`downloaded`) et supprimés (`deleted`) ; `state()` renvoie les documents.
export function mockDocumentApi(initial = DOCUMENTS, { errors = {}, uploader = USERS.SUPER_ADMIN } = {}) {
  let documents = initial.map((document) => ({ ...document }))
  let nextId = 900
  const calls = { list: 0, listUrls: [], uploaded: [], downloaded: [], deleted: [] }

  const failure = (operation, argument) => {
    const configured = errors[operation]
    const error = typeof configured === 'function' ? configured(argument) : configured
    if (!error) return null
    return error === 'network' ? HttpResponse.error() : apiError(error.status, error.message ?? 'Erreur')
  }

  server.use(
    http.get(`${API_URL}/documents`, ({ request }) => {
      calls.list += 1
      calls.listUrls.push(request.url)
      const error = failure('list')
      if (error) return error
      const formationId = Number(new URL(request.url).searchParams.get('formationId'))
      return HttpResponse.json(documents.filter((document) => document.formationId === formationId))
    }),
    http.post(`${API_URL}/documents`, async ({ request }) => {
      // jsdom et undici n'ont pas la même classe `File` : `request.formData()` échoue en test, on lit le multipart brut.
      const raw = await request.text()
      const fileName = /filename="([^"]*)"/.exec(raw)?.[1]
      const formationId = Number(/name="formationId"\r\n\r\n(\d+)/.exec(raw)?.[1])
      calls.uploaded.push({ fileName, formationId })
      const file = { name: fileName, size: raw.length, type: '' }
      const error = failure('upload', file.name)
      if (error) return error
      const document = {
        id: nextId++,
        fileName: file.name,
        fileUrl: `https://supabase.test/storage/${nextId}`,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
        uploadedBy: uploader,
        formationId,
        inscriptionId: null,
        createdAt: '2026-11-02T09:00:00',
      }
      documents = [...documents, document]
      return HttpResponse.json(document, { status: 201 })
    }),
    http.get(`${API_URL}/documents/:id/download`, ({ params }) => {
      calls.downloaded.push(Number(params.id))
      const error = failure('download')
      if (error) return error
      const document = documents.find((candidate) => candidate.id === Number(params.id))
      if (!document) return apiError(404, 'Document introuvable')
      return new HttpResponse(`contenu de ${document.fileName}`, {
        headers: { 'Content-Type': document.mimeType },
      })
    }),
    http.delete(`${API_URL}/documents/:id`, ({ params }) => {
      calls.deleted.push(Number(params.id))
      const error = failure('delete')
      if (error) return error
      if (!documents.some((document) => document.id === Number(params.id))) {
        return apiError(404, 'Document introuvable')
      }
      documents = documents.filter((document) => document.id !== Number(params.id))
      return new HttpResponse(null, { status: 204 })
    }),
  )

  return { calls, state: () => documents }
}
