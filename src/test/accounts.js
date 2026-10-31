import { http, HttpResponse } from 'msw'
import { server } from './msw/server'
import { API_URL } from './session'

// Comptes fictifs (forme de UserResponse, tech.md § 2).
export const FORMATEURS = [
  { id: 10, email: 'anne@adac.test', prenom: 'Anne', nom: 'Martin', role: 'ADMIN', isActive: true, emailNotificationsEnabled: true },
  { id: 11, email: 'paul@adac.test', prenom: 'Paul', nom: 'Durand', role: 'ADMIN', isActive: false, emailNotificationsEnabled: true },
]
export const STAGIAIRES = [
  { id: 20, email: 'lea@adac.test', prenom: 'Léa', nom: 'Petit', role: 'STAGIAIRE', isActive: true, emailNotificationsEnabled: true },
  { id: 21, email: 'omar@adac.test', prenom: 'Omar', nom: 'Benali', role: 'STAGIAIRE', isActive: false, emailNotificationsEnabled: true },
]

export const apiError = (status, message) => HttpResponse.json({ status, message, details: [] }, { status })

// GET /users/formateurs|stagiaires ; `active=true` ne renvoie que les actifs, comme le back.
export function mockAccountList(kind, accounts) {
  const calls = { count: 0, urls: [] }
  server.use(
    http.get(`${API_URL}/users/${kind}`, ({ request }) => {
      calls.count += 1
      calls.urls.push(request.url)
      const onlyActive = new URL(request.url).searchParams.get('active') === 'true'
      return HttpResponse.json(onlyActive ? accounts.filter((a) => a.isActive) : accounts)
    }),
  )
  return calls
}

// Handler à réponse fixe ; mémorise le nombre d'appels et le corps JSON reçu (post / put).
export function mockRequest(method, path, respond) {
  const calls = { count: 0, body: null }
  server.use(
    http[method](`${API_URL}${path}`, async ({ request }) => {
      calls.count += 1
      if (method === 'post' || method === 'put') calls.body = await request.json()
      return respond()
    }),
  )
  return calls
}
