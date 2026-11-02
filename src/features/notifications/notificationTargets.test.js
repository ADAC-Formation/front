import { describeNotification } from './notificationTargets'

const base = { id: 1, type: 'NEW_MESSAGE', content: 'x', isRead: false, createdAt: '2026-11-02T10:00:00' }

describe('describeNotification', () => {
  it('envoie un message vers la conversation avec l’autre participant', () => {
    expect(describeNotification({ ...base, entityType: 'MESSAGE', entityId: 7 })).toEqual({
      kind: 'message',
      label: 'Message',
      path: '/messages/7',
    })
  })

  it('envoie une formation vers son détail', () => {
    expect(describeNotification({ ...base, type: 'DOCUMENT_UPLOADED', entityType: 'FORMATION', entityId: 12 })).toEqual({
      kind: 'formation',
      label: 'Formation',
      path: '/formations/12',
    })
  })

  it('traite une notification de document comme une formation, quel que soit le `type`', () => {
    for (const type of ['DOCUMENT_UPLOADED', 'FORMATION_UPDATED', 'UN_TYPE_FUTUR']) {
      expect(describeNotification({ ...base, type, entityType: 'FORMATION', entityId: 3 }).path).toBe('/formations/3')
    }
  })

  it('donne une présentation neutre et aucune cible pour un entityType inconnu', () => {
    expect(describeNotification({ ...base, entityType: 'AUTRE', entityId: 5 })).toEqual({
      kind: 'other',
      label: 'Notification',
      path: null,
    })
  })

  it("n'échoue pas sur une notification incomplète", () => {
    expect(describeNotification({ ...base, entityType: undefined, entityId: undefined }).path).toBeNull()
    expect(describeNotification({ ...base, entityType: 'MESSAGE', entityId: null }).path).toBeNull()
  })
})
