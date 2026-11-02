import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../../../test/render'
import { mockNoSession, mockSession } from '../../../test/session'
import { LoginButton } from './LoginButton'

// Le libellé est masqué visuellement sur petit écran mais le bouton garde son nom accessible (D61).
describe('LoginButton', () => {
  it('est nommé « Se déconnecter » pour un utilisateur connecté', async () => {
    mockSession('SUPER_ADMIN')
    renderWithProviders(<LoginButton />, { withSession: true })
    expect(await screen.findByRole('button', { name: 'Se déconnecter' })).toBeInTheDocument()
  })

  it('est nommé « Se connecter » pour un visiteur', async () => {
    mockNoSession()
    renderWithProviders(<LoginButton />, { withSession: true, route: '/formations' })
    expect(await screen.findByRole('button', { name: 'Se connecter' })).toBeInTheDocument()
  })
})
