import { http, HttpResponse } from 'msw'
import { server } from './msw/server'
import { API_URL } from './session'
import { apiError } from './formations'

// Message du back quand l'email n'a pas pu partir (tech.md § 9).
export const DELIVERY_FAILED_MESSAGE = 'Envoi impossible pour le moment, réessayez plus tard.'
export const RATE_LIMIT_MESSAGE = 'Trop de retours envoyés. Réessayez dans une heure.'

// POST /api/feedback (tech.md § 9) : 201 sans corps par défaut. `error` vaut `{ status, message }` ou
// `'network'` ; `errorOnce: true` ne renvoie l'erreur qu'au premier envoi (pour tester un nouvel essai).
// `calls` garde chaque envoi reçu : les champs texte du multipart et `screenshot` (nom et type de la
// partie, ou `null`).
export function mockSendFeedback({ error = null, errorOnce = false } = {}) {
  const calls = []
  server.use(
    http.post(`${API_URL}/feedback`, async ({ request }) => {
      // jsdom et undici n'ont pas la même classe `File` : `request.formData()` échoue en test, on lit le multipart brut.
      const raw = await request.text()
      const field = (name) => new RegExp(`name="${name}"\\r\\n\\r\\n([^\\r]*)`).exec(raw)?.[1] ?? null
      const screenshotPart = /name="screenshot"; filename="([^"]*)"\r\nContent-Type: ([^\r]*)/.exec(raw)
      calls.push({
        contentType: request.headers.get('content-type'),
        type: field('type'),
        message: field('message'),
        page: field('page'),
        userAgent: field('userAgent'),
        viewport: field('viewport'),
        appVersion: field('appVersion'),
        screenshot: screenshotPart ? { name: screenshotPart[1], type: screenshotPart[2] } : null,
      })
      if (error && (!errorOnce || calls.length === 1)) {
        return error === 'network' ? HttpResponse.error() : apiError(error.status, error.message)
      }
      return new HttpResponse(null, { status: 201 })
    }),
  )
  return calls
}
