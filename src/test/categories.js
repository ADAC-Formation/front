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
