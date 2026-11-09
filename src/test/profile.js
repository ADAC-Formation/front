import { http, HttpResponse } from 'msw'
import { server } from './msw/server'
import { API_URL } from './session'

const apiError = (status, message) => HttpResponse.json({ status, message, details: [] }, { status })

// PATCH /users/me : renvoie l'utilisateur mis à jour (UserResponse). `error` : { status, message } pour échouer.
// Renvoie les corps reçus (`calls.patched`).
export function mockUpdateProfile(user, { error = null } = {}) {
  const calls = { patched: [] }
  server.use(
    http.patch(`${API_URL}/users/me`, async ({ request }) => {
      const body = await request.json()
      calls.patched.push(body)
      if (error) return apiError(error.status, error.message)
      return HttpResponse.json({ ...user, ...body })
    }),
  )
  return calls
}

// PATCH /users/me/password : route annoncée par Charlotte (Q1), absente du back `dev` au 2026-11-09.
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
