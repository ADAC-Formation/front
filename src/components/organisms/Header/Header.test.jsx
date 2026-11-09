import { act, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { renderWithProviders } from '../../../test/render'
import { mockNoSession, mockSession } from '../../../test/session'
import { mockNotificationApi } from '../../../test/notifications'
import { SiteHeader } from './Header'

const settle = () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 150)) })

describe('SiteHeader — cloche de notifications', () => {
  it('affiche la cloche pour un utilisateur connecté', async () => {
    mockSession('STAGIAIRE')
    mockNotificationApi()
    renderWithProviders(<SiteHeader />, { withSession: true })
    expect(await screen.findByRole('button', { name: 'Notifications, 3 non lues' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Se déconnecter' })).toBeInTheDocument()
  })

  it('n’affiche aucune cloche ni appel /notifications pour un visiteur', async () => {
    mockNoSession()
    const calls = mockNotificationApi()
    renderWithProviders(<SiteHeader />, { withSession: true, route: '/login' })
    await settle()
    expect(screen.queryByRole('button', { name: /Notifications/ })).not.toBeInTheDocument()
    expect(calls.unread).toBe(0)
  })

  it('ne présente aucune violation jest-axe', async () => {
    mockSession('ADMIN')
    mockNotificationApi()
    const { container } = renderWithProviders(<SiteHeader />, { withSession: true })
    await screen.findByRole('button', { name: /Notifications, 3/ })
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('SiteHeader — nom de l’utilisateur', () => {
  it.each([
    ['SUPER_ADMIN', 'Chargée Dev', 'Chargée de formation'],
    ['ADMIN', 'Formateur Dev', 'Formateur'],
    ['STAGIAIRE', 'Stagiaire Dev', 'Stagiaire'],
  ])('affiche le nom et le rôle de %s sous le bandeau, avec un lien vers le profil', async (role, name, label) => {
    mockSession(role)
    mockNotificationApi()
    renderWithProviders(<SiteHeader />, { withSession: true })
    const link = await screen.findByRole('link', { name: new RegExp(`${name}`) })
    expect(link).toHaveAttribute('href', '/profile')
    expect(link).toHaveTextContent(label)
  })

  it('n’affiche aucun nom pour un visiteur', async () => {
    mockNoSession()
    mockNotificationApi()
    renderWithProviders(<SiteHeader />, { withSession: true, route: '/login' })
    await settle()
    expect(screen.queryByRole('link', { name: /Dev/ })).not.toBeInTheDocument()
  })
})
