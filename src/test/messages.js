import { http, HttpResponse, delay } from 'msw'
import { server } from './msw/server'
import { API_URL, USERS } from './session'
import { FORMATEURS, STAGIAIRES } from './accounts'

// Messagerie fictive (formes de MessageResponse et ConversationResponse, tech.md § 7).
// L'utilisateur connecté des tests de messagerie est le plus souvent USERS.STAGIAIRE (id 3).
const [anne] = FORMATEURS // id 10
const [lea] = STAGIAIRES // id 20

export function makeMessage({
  id,
  sender,
  recipients,
  content = 'Bonjour',
  readAt = null,
  createdAt = '2026-11-02T09:00:00',
  isGroup = false,
}) {
  return { id, content, sender, recipients, isGroup, readAt, createdAt }
}

// Fil entre le stagiaire (id 3) et Anne (id 10) : deux messages reçus non lus, un envoyé.
export const THREAD = [
  makeMessage({ id: 1, sender: USERS.STAGIAIRE, recipients: [anne], content: 'Bonjour, une question.', readAt: '2026-11-02T09:30:00', createdAt: '2026-11-02T09:00:00' }),
  makeMessage({ id: 2, sender: anne, recipients: [USERS.STAGIAIRE], content: 'Oui, je vous écoute.', createdAt: '2026-11-02T10:00:00' }),
  makeMessage({ id: 3, sender: anne, recipients: [USERS.STAGIAIRE], content: 'Rendez-vous lundi ?', createdAt: '2026-11-02T10:05:00' }),
]

export const CONVERSATIONS = [
  { conversationId: anne.id, participant: anne, lastMessage: THREAD[2], unreadCount: 2 },
  {
    conversationId: USERS.SUPER_ADMIN.id,
    participant: USERS.SUPER_ADMIN,
    lastMessage: makeMessage({ id: 9, sender: USERS.STAGIAIRE, recipients: [USERS.SUPER_ADMIN], content: 'Merci !', readAt: '2026-11-01T12:00:00', createdAt: '2026-11-01T11:00:00' }),
    unreadCount: 0,
  },
]

export { anne as FORMATEUR_ANNE, lea as STAGIAIRE_LEA }

const apiError = (status, message) => HttpResponse.json({ status, message, details: [] }, { status })

// GET /messages. `calls.count` compte les requêtes reçues.
export function mockConversations(conversations = CONVERSATIONS, { errorStatus } = {}) {
  const calls = { count: 0 }
  server.use(
    http.get(`${API_URL}/messages`, () => {
      calls.count += 1
      return errorStatus ? apiError(errorStatus, 'Erreur serveur') : HttpResponse.json(conversations)
    }),
  )
  return calls
}

// GET /messages/{userId} : le fil, ou l'erreur demandée.
export function mockThread(userId, messages = THREAD, { errorStatus } = {}) {
  const calls = { count: 0 }
  server.use(
    http.get(`${API_URL}/messages/${userId}`, () => {
      calls.count += 1
      return errorStatus ? apiError(errorStatus, 'Erreur serveur') : HttpResponse.json(messages)
    }),
  )
  return calls
}

// POST /messages/send : 201 avec le message créé ; mémorise les corps reçus (`calls.bodies`).
// `delayMs` laisse le temps de cliquer deux fois.
export function mockSendMessage({ errorStatus, errorMessage = 'Refusé', delayMs = 0, sender = USERS.STAGIAIRE } = {}) {
  const calls = { count: 0, bodies: [] }
  server.use(
    http.post(`${API_URL}/messages/send`, async ({ request }) => {
      calls.count += 1
      const body = await request.json()
      calls.bodies.push(body)
      if (delayMs) await delay(delayMs)
      if (errorStatus) return apiError(errorStatus, errorMessage)
      const message = makeMessage({
        id: 1000 + calls.count,
        sender,
        recipients: [{ ...anne, id: body.recipientIds[0] }],
        content: body.content,
        createdAt: '2026-11-03T08:00:00',
      })
      return HttpResponse.json(message, { status: 201 })
    }),
  )
  return calls
}

// PATCH /messages/{id}/read : 200 ; les ids dans `failIds` répondent 500 (`failOnce: true` : au premier essai
// seulement). `calls.ids` garde l'ordre d'arrivée.
export function mockMarkRead({ failIds = [], failOnce = false } = {}) {
  const calls = { count: 0, ids: [] }
  const failed = new Set()
  server.use(
    http.patch(`${API_URL}/messages/:id/read`, ({ params }) => {
      const id = Number(params.id)
      calls.count += 1
      calls.ids.push(id)
      const shouldFail = failIds.includes(id) && !(failOnce && failed.has(id))
      failed.add(id)
      return shouldFail ? apiError(500, 'Erreur serveur') : new HttpResponse(null, { status: 200 })
    }),
  )
  return calls
}
