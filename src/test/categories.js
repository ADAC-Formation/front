import { http, HttpResponse } from 'msw'
import { server } from './msw/server'
import { API_URL } from './session'
import { CATEGORIES, apiError } from './formations'

// Catégories fictives (forme de CategoryResponse, tech.md § 3) : deux actives, une désactivée.
export const CATEGORY_LIST = [CATEGORIES.secours, CATEGORIES.numerique, CATEGORIES.ancienne]

// GET /categories ; `?active=true` ne renvoie que les actives, comme le back.
export function mockCategories(categories = CATEGORY_LIST, { errorStatus } = {}) {
  const calls = { count: 0, urls: [] }
  server.use(
    http.get(`${API_URL}/categories`, ({ request }) => {
      calls.count += 1
      calls.urls.push(request.url)
      if (errorStatus) return apiError(errorStatus, 'Erreur serveur')
      const onlyActive = new URL(request.url).searchParams.get('active') === 'true'
      return HttpResponse.json(onlyActive ? categories.filter((c) => c.isActive) : categories)
    }),
  )
  return calls
}

// API des catégories avec état en mémoire : GET (`?active=true`), POST, PUT, PATCH activate /
// deactivate, comme le back. Chaque écriture change la liste renvoyée ensuite, ce qui permet de
// vérifier le rechargement. `errors[opération]` (`create`, `update`, `activate`, `deactivate`) vaut
// `{ status, message }` pour répondre par une erreur, ou `'network'` pour couper la connexion.
// `calls` garde le nombre d'appels et les corps JSON reçus (`created`, `updated`) ; `state()` renvoie
// les catégories actuelles du faux back.
export function mockCategoryApi(initial = CATEGORY_LIST, { errors = {} } = {}) {
  let categories = initial.map((category) => ({ ...category }))
  let nextId = 100
  const calls = { list: 0, listUrls: [], created: [], updated: [], activated: [], deactivated: [] }

  const failure = (operation) => {
    const error = errors[operation]
    if (!error) return null
    return error === 'network' ? HttpResponse.error() : apiError(error.status, error.message ?? 'Erreur')
  }
  const find = (id) => categories.find((category) => category.id === Number(id))
  const setActive = (id, isActive, record, operation) => {
    record.push(Number(id))
    const error = failure(operation)
    if (error) return error
    const category = find(id)
    if (!category) return apiError(404, 'Catégorie introuvable')
    category.isActive = isActive
    return HttpResponse.json(category)
  }

  server.use(
    http.get(`${API_URL}/categories`, ({ request }) => {
      calls.list += 1
      calls.listUrls.push(request.url)
      const onlyActive = new URL(request.url).searchParams.get('active') === 'true'
      return HttpResponse.json(onlyActive ? categories.filter((category) => category.isActive) : categories)
    }),
    http.post(`${API_URL}/categories`, async ({ request }) => {
      const body = await request.json()
      calls.created.push(body)
      const error = failure('create')
      if (error) return error
      const category = { id: nextId++, nom: body.nom, couleur: body.couleur, isActive: true, createdAt: '2026-11-02T09:00:00' }
      categories = [...categories, category]
      return HttpResponse.json(category, { status: 201 })
    }),
    http.put(`${API_URL}/categories/:id`, async ({ request, params }) => {
      const body = await request.json()
      calls.updated.push({ id: Number(params.id), ...body })
      const error = failure('update')
      if (error) return error
      const category = find(params.id)
      if (!category) return apiError(404, 'Catégorie introuvable')
      Object.assign(category, { nom: body.nom, couleur: body.couleur })
      return HttpResponse.json(category)
    }),
    http.patch(`${API_URL}/categories/:id/activate`, ({ params }) =>
      setActive(params.id, true, calls.activated, 'activate'),
    ),
    http.patch(`${API_URL}/categories/:id/deactivate`, ({ params }) =>
      setActive(params.id, false, calls.deactivated, 'deactivate'),
    ),
  )

  return { calls, state: () => categories }
}
