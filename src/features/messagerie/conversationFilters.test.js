import { USERS } from '../../test/session'
import { FORMATEUR_ANNE, STAGIAIRE_LEA } from '../../test/messages'
import { filterConversations, hasActiveFilters } from './conversationFilters'

const conversation = (participant, unreadCount = 0) => ({
  conversationId: participant.id,
  participant,
  lastMessage: { id: participant.id, content: 'x', sender: participant, recipients: [], createdAt: '2026-11-02T10:00:00', readAt: null },
  unreadCount,
})

const anne = conversation(FORMATEUR_ANNE, 2) // Anne Martin, formateur
const lea = conversation(STAGIAIRE_LEA, 0) // Léa Petit, stagiaire
const chargee = conversation(USERS.SUPER_ADMIN, 1) // Chargée Dev
const all = [anne, lea, chargee]

const ids = (list) => list.map((c) => c.conversationId)

describe('filterConversations', () => {
  it('sans filtre, garde tout dans l\'ordre reçu', () => {
    expect(ids(filterConversations(all, {}))).toEqual([10, 20, 1])
    expect(ids(filterConversations(all, { status: 'all', role: 'all', search: '' }))).toEqual([10, 20, 1])
  })

  it('« unread » garde les conversations avec des non lus', () => {
    expect(ids(filterConversations(all, { status: 'unread' }))).toEqual([10, 1])
  })

  it('filtre par rôle de l\'interlocuteur', () => {
    expect(ids(filterConversations(all, { role: 'ADMIN' }))).toEqual([10])
    expect(ids(filterConversations(all, { role: 'STAGIAIRE' }))).toEqual([20])
    expect(ids(filterConversations(all, { role: 'SUPER_ADMIN' }))).toEqual([1])
  })

  it('cherche dans le prénom et dans le nom', () => {
    expect(ids(filterConversations(all, { search: 'anne' }))).toEqual([10])
    expect(ids(filterConversations(all, { search: 'petit' }))).toEqual([20])
  })

  it('ignore la casse, les accents et les espaces autour', () => {
    expect(ids(filterConversations(all, { search: '  LEA ' }))).toEqual([20])
    expect(ids(filterConversations(all, { search: 'chargee' }))).toEqual([1])
    expect(ids(filterConversations(all, { search: 'Chargée' }))).toEqual([1])
  })

  it('cherche aussi sur « prénom nom » ensemble', () => {
    expect(ids(filterConversations(all, { search: 'anne martin' }))).toEqual([10])
  })

  it('combine statut, rôle et recherche (ET)', () => {
    expect(ids(filterConversations(all, { status: 'unread', role: 'ADMIN', search: 'an' }))).toEqual([10])
    expect(ids(filterConversations(all, { status: 'unread', role: 'STAGIAIRE' }))).toEqual([])
  })

  it('ne cherche pas dans le contenu des messages', () => {
    expect(ids(filterConversations(all, { search: 'x' }))).toEqual([])
  })

  it('tolère une liste absente', () => {
    expect(filterConversations(undefined, { search: 'a' })).toEqual([])
  })
})

describe('hasActiveFilters', () => {
  it('vaut faux sans filtre ou avec les valeurs par défaut', () => {
    expect(hasActiveFilters({})).toBe(false)
    expect(hasActiveFilters({ status: 'all', role: 'all', search: '  ' })).toBe(false)
  })

  it('vaut vrai dès qu\'un filtre est posé', () => {
    expect(hasActiveFilters({ status: 'unread' })).toBe(true)
    expect(hasActiveFilters({ role: 'ADMIN' })).toBe(true)
    expect(hasActiveFilters({ search: 'a' })).toBe(true)
  })
})
