import { http, HttpResponse } from 'msw'
import { server } from './msw/server'
import { API_URL, USERS } from './session'

// Catégories et formations fictives (forme de FormationResponse, tech.md § 4 et DTOs).
export const CATEGORIES = {
  secours: { id: 1, nom: 'Secourisme', couleur: '#D62828', isActive: true, createdAt: '2026-01-05T09:00:00' },
  numerique: { id: 2, nom: 'Numérique', couleur: '#2A6F97', isActive: true, createdAt: '2026-01-05T09:00:00' },
  ancienne: { id: 3, nom: 'Ancienne catégorie', couleur: '#6A994E', isActive: false, createdAt: '2026-01-05T09:00:00' },
}

// Le formateur « mien » est USERS.ADMIN (id 2) ; l'autre formateur a l'id 12.
export const AUTRE_FORMATEUR = {
  id: 12, email: 'paul@adac.test', prenom: 'Paul', nom: 'Durand', role: 'ADMIN', isActive: true, emailNotificationsEnabled: true,
}

export const FORMATIONS = [
  {
    id: 101,
    intitule: 'Premiers secours PSC1',
    description: 'Gestes de premiers secours.',
    dateDebut: '2026-03-10',
    dateFin: '2026-03-12',
    modalite: 'PRESENTIEL',
    status: 'ACTIVE',
    category: CATEGORIES.secours,
    formateur: USERS.ADMIN,
    inscriptionsCount: 2,
    createdAt: '2026-01-10T10:00:00',
  },
  {
    id: 102,
    intitule: 'Excel niveau 1',
    description: null,
    dateDebut: '2026-02-02',
    dateFin: '2026-02-03',
    modalite: 'VISIO',
    status: 'ACTIVE',
    category: CATEGORIES.numerique,
    formateur: AUTRE_FORMATEUR,
    inscriptionsCount: 0,
    createdAt: '2026-01-11T10:00:00',
  },
  {
    id: 103,
    intitule: 'Gestes et postures',
    description: 'Prévention des troubles musculo-squelettiques.',
    dateDebut: '2025-11-04',
    dateFin: '2025-11-05',
    modalite: 'MIXTE',
    status: 'ARCHIVED',
    category: CATEGORIES.ancienne,
    formateur: USERS.ADMIN,
    inscriptionsCount: 1,
    createdAt: '2025-09-01T10:00:00',
  },
]

export const INSCRITS = [
  { id: 1, stagiaire: { id: 20, email: 'lea@adac.test', prenom: 'Léa', nom: 'Petit', role: 'STAGIAIRE', isActive: true, emailNotificationsEnabled: true }, inscritLe: '2026-01-20T10:00:00' },
  { id: 2, stagiaire: { id: 21, email: 'omar@adac.test', prenom: 'Omar', nom: 'Benali', role: 'STAGIAIRE', isActive: true, emailNotificationsEnabled: true }, inscritLe: '2026-01-21T10:00:00' },
]

export const apiError = (status, message) => HttpResponse.json({ status, message, details: [] }, { status })

// GET /formations ; `?status=` filtre comme le back. `calls.urls` garde les URL reçues.
export function mockFormationList(formations = FORMATIONS) {
  const calls = { count: 0, urls: [] }
  server.use(
    http.get(`${API_URL}/formations`, ({ request }) => {
      calls.count += 1
      calls.urls.push(request.url)
      const status = new URL(request.url).searchParams.get('status')
      return HttpResponse.json(status ? formations.filter((f) => f.status === status) : formations)
    }),
  )
  return calls
}

// GET /formations avec une réponse d'erreur fixe.
export function mockFormationListError(status = 500) {
  server.use(http.get(`${API_URL}/formations`, () => apiError(status, 'Erreur serveur')))
}

// GET /formations/{id} : 200 avec la formation, ou l'erreur demandée (403, 404…).
export function mockFormationDetail(formation, { errorStatus } = {}) {
  const calls = { count: 0 }
  server.use(
    http.get(`${API_URL}/formations/${formation.id}`, () => {
      calls.count += 1
      return errorStatus ? apiError(errorStatus, 'Refusé') : HttpResponse.json(formation)
    }),
  )
  return calls
}

// GET /formations/{id}/inscriptions : 200 avec les inscrits, ou une erreur.
export function mockInscriptions(formationId, inscrits = INSCRITS, { errorStatus } = {}) {
  const calls = { count: 0 }
  server.use(
    http.get(`${API_URL}/formations/${formationId}/inscriptions`, () => {
      calls.count += 1
      return errorStatus ? apiError(errorStatus, 'Erreur serveur') : HttpResponse.json(inscrits)
    }),
  )
  return calls
}

// PATCH /formations/{id}/archive : 200 avec la formation archivée, ou l'erreur demandée (409…).
export function mockArchive(formation, { errorStatus } = {}) {
  const calls = { count: 0 }
  server.use(
    http.patch(`${API_URL}/formations/${formation.id}/archive`, () => {
      calls.count += 1
      return errorStatus
        ? apiError(errorStatus, 'Modifiée entre-temps')
        : HttpResponse.json({ ...formation, status: 'ARCHIVED' })
    }),
  )
  return calls
}

// POST /formations : 201 avec la formation créée (id fourni), ou l'erreur demandée (400...).
// `calls.body` garde le corps JSON reçu.
export function mockCreateFormation({ id = 55, errorStatus, errorMessage = 'Requête invalide' } = {}) {
  const calls = { count: 0, body: null }
  server.use(
    http.post(`${API_URL}/formations`, async ({ request }) => {
      calls.count += 1
      calls.body = await request.json()
      if (errorStatus) return apiError(errorStatus, errorMessage)
      return HttpResponse.json({ ...FORMATIONS[0], id, ...calls.body }, { status: 201 })
    }),
  )
  return calls
}

// PUT /formations/{id} : 200 avec la formation modifiée, ou l'erreur demandée (400, 409...).
export function mockUpdateFormation(formation, { errorStatus, errorMessage = 'Modifiée entre-temps' } = {}) {
  const calls = { count: 0, body: null }
  server.use(
    http.put(`${API_URL}/formations/${formation.id}`, async ({ request }) => {
      calls.count += 1
      calls.body = await request.json()
      if (errorStatus) return apiError(errorStatus, errorMessage)
      return HttpResponse.json({ ...formation, ...calls.body })
    }),
  )
  return calls
}

// POST /formations/import : 201 avec `count` formations créées, ou l'erreur demandée (400, 403...),
// ou une coupure réseau. `calls.body` garde le multipart brut (jsdom et undici n'ont pas la même classe `File` : `request.formData()` échoue en test), `calls.contentType` l'en-tête reçu.
export function mockImportFormations({ count = 2, errorStatus, errorMessage = 'Fichier invalide', networkError = false } = {}) {
  const calls = { count: 0, body: '', contentType: null }
  server.use(
    http.post(`${API_URL}/formations/import`, async ({ request }) => {
      calls.count += 1
      calls.contentType = request.headers.get('content-type')
      calls.body = await request.text()
      if (networkError) return HttpResponse.error()
      if (errorStatus) return apiError(errorStatus, errorMessage)
      const created = Array.from({ length: count }, (_, index) => ({ ...FORMATIONS[0], id: 200 + index }))
      return HttpResponse.json(created, { status: 201 })
    }),
  )
  return calls
}
