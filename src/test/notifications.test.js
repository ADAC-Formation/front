import { describe, expect, it } from 'vitest'
import apiClient from '../api/Axiosclient'
import { mockNotificationApi } from './notifications'

describe('mockNotificationApi', () => {
  it('renvoie les non lues et un compteur, et suit les écritures', async () => {
    const calls = mockNotificationApi()

    const first = await apiClient.get('/notifications/unread')
    expect(first.data.count).toBe(3)
    expect(first.data.notifications.map((n) => n.id)).toEqual([1, 2, 3])

    await apiClient.patch('/notifications/1/read')
    await apiClient.delete('/notifications/2')

    const second = await apiClient.get('/notifications/unread')
    expect(second.data.notifications.map((n) => n.id)).toEqual([3])
    expect(calls.read).toEqual([1])
    expect(calls.remove).toEqual([2])
  })

  it("filtre l'historique par ?read= et garde les notifications retirées de la cloche", async () => {
    const calls = mockNotificationApi()
    await apiClient.delete('/notifications/2')

    const all = await apiClient.get('/notifications')
    expect(all.data).toHaveLength(4)
    const read = await apiClient.get('/notifications', { params: { read: true } })
    expect(read.data.map((n) => n.id)).toEqual([4])
    expect(calls.listUrls[1]).toContain('read=true')
  })

  it('fait échouer un appel non déclaré', async () => {
    await expect(apiClient.get('/notifications/unread')).rejects.toBeDefined()
  })
})
