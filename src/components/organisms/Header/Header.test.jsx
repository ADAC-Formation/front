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
