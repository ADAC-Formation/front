import { http, HttpResponse } from 'msw'
import { server } from './msw/server'

export const API_URL = 'http://localhost:8080/api'

// Un utilisateur fictif par rôle (forme de UserResponse, tech.md § Auth).
export const USERS = {
  SUPER_ADMIN: { id: 1, email: 'chargee@adac.test', prenom: 'Chargée', nom: 'Dev', role: 'SUPER_ADMIN', isActive: true, emailNotificationsEnabled: true },
  ADMIN: { id: 2, email: 'formateur@adac.test', prenom: 'Formateur', nom: 'Dev', role: 'ADMIN', isActive: true, emailNotificationsEnabled: true },
  STAGIAIRE: { id: 3, email: 'stagiaire@adac.test', prenom: 'Stagiaire', nom: 'Dev', role: 'STAGIAIRE', isActive: true, emailNotificationsEnabled: true },
}

// GET /auth/me répond 200 avec l'utilisateur du rôle demandé.
export function mockSession(role) {
  server.use(http.get(`${API_URL}/auth/me`, () => HttpResponse.json(USERS[role])))
}

// GET /auth/me répond 401 : visiteur non connecté.
export function mockNoSession() {
  server.use(
    http.get(`${API_URL}/auth/me`, () =>
      HttpResponse.json({ status: 401, message: 'Non authentifié', details: [] }, { status: 401 }),
    ),
  )
}
