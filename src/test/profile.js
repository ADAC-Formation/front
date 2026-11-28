import { http, HttpResponse } from 'msw'
import { server } from './msw/server'
import { API_URL } from './session'

const apiError = (status, message) => HttpResponse.json({ status, message, details: [] }, { status })

// PATCH /users/me/password (Q1, mergé dans le back : PR #18) : 204, ou 400 / 403 (ancien mot de passe faux) / 429 (verrou).
// `error` : { status, message } pour échouer. Renvoie les corps reçus (`calls.changed`).
export function mockChangePassword({ error = null } = {}) {
  const calls = { changed: [] }
  server.use(
    http.patch(`${API_URL}/users/me/password`, async ({ request }) => {
      calls.changed.push(await request.json())
      if (error) return apiError(error.status, error.message)
      return new HttpResponse(null, { status: 204 })
    }),
  )
  return calls
}
