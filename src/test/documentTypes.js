import { http, HttpResponse } from 'msw'
import { server } from './msw/server'
import { API_URL } from './session'
import { CATEGORIES, apiError } from './formations'

// Types de document fictifs (forme de DocumentTypeResponse, design.md § 3) : un type pour toutes les
// formations (sensible, avec délai), un type par catégorie (formats limités)
// et un type désactivé.
export const DOCUMENT_TYPES = {
  identite: {
    id: 1,
    nom: 'Pièce d’identité',
    aide: 'Recto-verso, en cours de validité.',
    isSensitive: true,
    appliesToAllFormations: true,
    categories: [],
    deadlineDays: 7,
    deadlineAnchor: 'BEFORE_START',
    allowedFormats: [],
    isActive: true,
    createdAt: '2026-11-20T09:00:00Z',
    updatedAt: '2026-11-20T09:00:00Z',
  },
  certificat: {
    id: 2,
    nom: 'Certificat médical',
    aide: null,
    isSensitive: false,
    appliesToAllFormations: false,
    categories: [CATEGORIES.secours],
    deadlineDays: null,
    deadlineAnchor: null,
    allowedFormats: ['pdf', 'jpg'],
    isActive: true,
    createdAt: '2026-11-20T09:00:00Z',
    updatedAt: '2026-11-20T09:00:00Z',
  },
  ancien: {
    id: 3,
    nom: 'Ancienne attestation',
    aide: null,
    isSensitive: false,
    appliesToAllFormations: true,
    categories: [],
    deadlineDays: 15,
    deadlineAnchor: 'AFTER_END',
    allowedFormats: [],
    isActive: false,
    createdAt: '2026-11-20T09:00:00Z',
    updatedAt: '2026-11-20T09:00:00Z',
  },
}

export const DOCUMENT_TYPE_LIST = [DOCUMENT_TYPES.identite, DOCUMENT_TYPES.certificat, DOCUMENT_TYPES.ancien]

// GET /document-types ; `?active=true` ne renvoie que les types actifs, comme le back.
export function mockDocumentTypes(types = DOCUMENT_TYPE_LIST, { errorStatus } = {}) {
  const calls = { count: 0, urls: [] }
  server.use(
    http.get(`${API_URL}/document-types`, ({ request }) => {
      calls.count += 1
      calls.urls.push(request.url)
      if (errorStatus) return apiError(errorStatus, 'Erreur serveur')
      const onlyActive = new URL(request.url).searchParams.get('active') === 'true'
      return HttpResponse.json(onlyActive ? types.filter((type) => type.isActive) : types)
    }),
  )
  return calls
}

// API des types de document avec état en mémoire : GET (`?active=true`), POST, PUT, PATCH activate /
// deactivate, comme le back. Chaque écriture change la liste renvoyée ensuite. `errors[opération]`
// (`list`, `create`, `update`, `activate`, `deactivate`) vaut `{ status, message }` pour répondre par
// une erreur, ou `'network'` pour couper la connexion. `calls` garde le nombre d'appels et les corps
// reçus (`created`, `updated`) ; `state()` renvoie les types actuels du faux back. `categories` sert à
// remplir `categories` à partir de `categoryIds`, comme le fait le back.
export function mockDocumentTypeApi(
  initial = DOCUMENT_TYPE_LIST,
  { errors = {}, categories = Object.values(CATEGORIES) } = {},
) {
  let types = initial.map((type) => ({ ...type }))
  let nextId = 100
  const calls = { list: 0, listUrls: [], created: [], updated: [], activated: [], deactivated: [] }

  const failure = (operation) => {
    const error = errors[operation]
    if (!error) return null
    return error === 'network' ? HttpResponse.error() : apiError(error.status, error.message ?? 'Erreur')
  }
  const find = (id) => types.find((type) => type.id === Number(id))
  const toResponse = (body) => {
    const { categoryIds, ...fields } = body
    return { ...fields, categories: categories.filter((category) => categoryIds.includes(category.id)) }
  }
  const setActive = (id, isActive, record, operation) => {
    record.push(Number(id))
    const error = failure(operation)
    if (error) return error
    const type = find(id)
    if (!type) return apiError(404, 'Type de document introuvable')
    type.isActive = isActive
    return HttpResponse.json(type)
  }

  server.use(
    http.get(`${API_URL}/document-types`, ({ request }) => {
      calls.list += 1
      calls.listUrls.push(request.url)
      const error = failure('list')
      if (error) return error
      const onlyActive = new URL(request.url).searchParams.get('active') === 'true'
      return HttpResponse.json(onlyActive ? types.filter((type) => type.isActive) : types)
    }),
    http.post(`${API_URL}/document-types`, async ({ request }) => {
      const body = await request.json()
      calls.created.push(body)
      const error = failure('create')
      if (error) return error
      const type = {
        id: nextId++,
        ...toResponse(body),
        isActive: true,
        createdAt: '2026-11-21T09:00:00Z',
        updatedAt: '2026-11-21T09:00:00Z',
      }
      types = [...types, type]
      return HttpResponse.json(type, { status: 201 })
    }),
    http.put(`${API_URL}/document-types/:id`, async ({ request, params }) => {
      const body = await request.json()
      calls.updated.push({ id: Number(params.id), ...body })
      const error = failure('update')
      if (error) return error
      const type = find(params.id)
      if (!type) return apiError(404, 'Type de document introuvable')
      Object.assign(type, toResponse(body))
      return HttpResponse.json(type)
    }),
    http.patch(`${API_URL}/document-types/:id/activate`, ({ params }) =>
      setActive(params.id, true, calls.activated, 'activate'),
    ),
    http.patch(`${API_URL}/document-types/:id/deactivate`, ({ params }) =>
      setActive(params.id, false, calls.deactivated, 'deactivate'),
    ),
  )

  return { calls, state: () => types }
}

// Types à envoyer pour une formation (GET /formations/{id}/document-types) : actifs, triés, comme le back.
// `types` : la liste renvoyée telle quelle ; `errorStatus` : répond par cette erreur.
export function mockFormationDocumentTypes(types = [], { errorStatus } = {}) {
  const calls = { count: 0, urls: [] }
  server.use(
    http.get(`${API_URL}/formations/:formationId/document-types`, ({ request }) => {
      calls.count += 1
      calls.urls.push(request.url)
      if (errorStatus) return apiError(errorStatus, 'Erreur serveur')
      return HttpResponse.json(types)
    }),
  )
  return calls
}
