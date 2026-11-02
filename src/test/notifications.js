import { http, HttpResponse } from 'msw'
import { server } from './msw/server'
import { API_URL } from './session'

// Notifications fictives (forme de NotificationResponse, tech.md § 8).
export const NOTIFICATIONS = [
  { id: 1, type: 'NEW_MESSAGE', content: 'Nouveau message de Marie', entityType: 'MESSAGE', entityId: 7, isRead: false, createdAt: '2026-11-02T10:00:00' },
  { id: 2, type: 'DOCUMENT_UPLOADED', content: 'Nouveau document dans Excel avancé', entityType: 'FORMATION', entityId: 12, isRead: false, createdAt: '2026-11-02T09:00:00' },
  { id: 3, type: 'FORMATION_UPDATED', content: 'La formation Excel avancé a été modifiée', entityType: 'FORMATION', entityId: 12, isRead: false, createdAt: '2026-11-01T16:00:00' },
  { id: 4, type: 'NEW_MESSAGE', content: 'Nouveau message de Paul', entityType: 'MESSAGE', entityId: 9, isRead: true, createdAt: '2026-10-30T08:30:00' },
]

const apiError = (status, message) => HttpResponse.json({ status, message, details: [] }, { status })

// Simule le back des notifications avec un état en mémoire : les écritures (lire, tout lire,
// retirer de la cloche) modifient ce que les lectures suivantes renvoient, comme le vrai back.
// Options : `notifications` (jeu de départ), `unreadCount` (force le `count` de /unread, pour
// tester « 99+ »), `failWrites` (les PATCH / DELETE répondent 500), `failReads` (les GET répondent 500).
// Renvoie les compteurs d'appels, les URL reçues et l'état courant (`state`).
export function mockNotificationApi({
  notifications = NOTIFICATIONS,
  unreadCount = null,
  failWrites = false,
  failReads = false,
} = {}) {
  // `deletedFromBell: true` dans le jeu de départ simule une notification déjà retirée de la cloche.
  const state = notifications.map((n) => ({ ...n, deletedFromBell: n.deletedFromBell ?? false }))
  const calls = {
    unread: 0,
    list: 0,
    read: [],
    readAll: 0,
    remove: [],
    listUrls: [],
    state,
  }
  const view = (notification) => {
    const visible = { ...notification }
    delete visible.deletedFromBell
    return visible
  }
  const byNewest = (a, b) => b.createdAt.localeCompare(a.createdAt)

  server.use(
    http.get(`${API_URL}/notifications/unread`, () => {
      calls.unread += 1
      if (failReads) return apiError(500, 'Erreur serveur')
      const unread = state.filter((n) => !n.isRead && !n.deletedFromBell).sort(byNewest)
      return HttpResponse.json({ count: unreadCount ?? unread.length, notifications: unread.slice(0, 50).map(view) })
    }),
    http.get(`${API_URL}/notifications`, ({ request }) => {
      calls.list += 1
      calls.listUrls.push(request.url)
      if (failReads) return apiError(500, 'Erreur serveur')
      const read = new URL(request.url).searchParams.get('read')
      const wanted = read === null ? state : state.filter((n) => n.isRead === (read === 'true'))
      return HttpResponse.json([...wanted].sort(byNewest).slice(0, 200).map(view))
    }),
    http.patch(`${API_URL}/notifications/read-all`, () => {
      calls.readAll += 1
      if (failWrites) return apiError(500, 'Erreur serveur')
      state.forEach((n) => { n.isRead = true })
      return new HttpResponse(null, { status: 200 })
    }),
    http.patch(`${API_URL}/notifications/:id/read`, ({ params }) => {
      calls.read.push(Number(params.id))
      if (failWrites) return apiError(500, 'Erreur serveur')
      const target = state.find((n) => n.id === Number(params.id))
      if (!target) return apiError(404, 'Notification introuvable')
      target.isRead = true
      return HttpResponse.json(view(target))
    }),
    http.delete(`${API_URL}/notifications/:id`, ({ params }) => {
      calls.remove.push(Number(params.id))
      if (failWrites) return apiError(500, 'Erreur serveur')
      const target = state.find((n) => n.id === Number(params.id))
      if (target) target.deletedFromBell = true
      return new HttpResponse(null, { status: 204 })
    }),
  )
  return calls
}
