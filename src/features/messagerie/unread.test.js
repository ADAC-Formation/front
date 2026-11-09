import { totalUnread, unreadIncomingIds, unreadLabel } from './unread'

describe('totalUnread', () => {
  it('additionne les non lus des conversations', () => {
    expect(totalUnread([{ unreadCount: 2 }, { unreadCount: 1 }, { unreadCount: 0 }])).toBe(3)
  })

  it('vaut zéro sans conversation', () => {
    expect(totalUnread([])).toBe(0)
    expect(totalUnread(undefined)).toBe(0)
  })

  it('ignore les valeurs absentes ou invalides', () => {
    expect(totalUnread([{ unreadCount: 2 }, {}, { unreadCount: null }, { unreadCount: 'x' }])).toBe(2)
  })
})

describe('unreadLabel', () => {
  it('met le mot au singulier pour un message', () => {
    expect(unreadLabel(1)).toBe('1 message non lu')
  })

  it('met le mot au pluriel pour plusieurs messages', () => {
    expect(unreadLabel(2)).toBe('2 messages non lus')
    expect(unreadLabel(3)).toBe('3 messages non lus')
  })
})

describe('unreadIncomingIds', () => {
  const me = 3
  const messages = [
    { id: 1, sender: { id: 7 }, readAt: null },
    { id: 2, sender: { id: 7 }, readAt: '2026-11-02T10:00:00' },
    { id: 3, sender: { id: me }, readAt: null },
    { id: 4, sender: { id: 7 }, readAt: null },
  ]

  it('garde les messages reçus non lus, dans l\'ordre', () => {
    expect(unreadIncomingIds(messages, me)).toEqual([1, 4])
  })

  it('ne contient ni les messages lus ni ceux envoyés par soi', () => {
    expect(unreadIncomingIds(messages, me)).not.toContain(2)
    expect(unreadIncomingIds(messages, me)).not.toContain(3)
  })

  it('renvoie une liste vide sans messages ou sans utilisateur', () => {
    expect(unreadIncomingIds(undefined, me)).toEqual([])
    expect(unreadIncomingIds(messages, undefined)).toEqual([])
  })
})

describe('unreadIncomingIds — expéditeur inconnu', () => {
  it('ignore un message sans expéditeur au lieu de planter', () => {
    const messages = [{ id: 1, sender: null, readAt: null }, { id: 2, sender: { id: 9 }, readAt: null }]
    expect(unreadIncomingIds(messages, 3)).toEqual([1, 2])
  })
})
