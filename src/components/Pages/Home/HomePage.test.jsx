import { axe } from 'jest-axe'
import { screen, waitFor } from '@testing-library/react'
import HomePage from './HomePage'
import { renderWithProviders } from '../../../test/render'
import { CONVERSATIONS, mockConversations } from '../../../test/messages'

describe('HomePage', () => {
  beforeEach(() => mockConversations([]))

  it('affiche la tuile « Formations » pour un stagiaire', () => {
    renderWithProviders(<HomePage role="STAGIAIRE" />)
    expect(screen.getByText('Formations')).toBeInTheDocument()
  })

  it('affiche la tuile « Gestion » pour un administrateur', () => {
    renderWithProviders(<HomePage role="SUPER_ADMIN" />)
    expect(screen.getByText('Gestion')).toBeInTheDocument()
  })

  it.each(['STAGIAIRE', 'ADMIN', 'SUPER_ADMIN'])('affiche les quatre tuiles pour le rôle %s', (role) => {
    renderWithProviders(<HomePage role={role} />)
    const names = screen.getAllByRole('link').map((link) => link.textContent)
    expect(names).toHaveLength(4)
    expect(names).toEqual(expect.arrayContaining(['Messages', 'Notifications', 'Profile']))
  })

  it("n'a aucune violation d'accessibilité (jest-axe)", async () => {
    const { container } = renderWithProviders(<HomePage role="STAGIAIRE" />)
    expect(await axe(container)).toHaveNoViolations()
  })

  describe('pastille « non lus » de la tuile Messages', () => {
    it('affiche le total des non lus et le dit dans le nom accessible', async () => {
      mockConversations([
        { ...CONVERSATIONS[0], unreadCount: 2 },
        { ...CONVERSATIONS[1], unreadCount: 1 },
      ])
      renderWithProviders(<HomePage role="STAGIAIRE" />)
      const tile = await screen.findByRole('link', { name: 'Messages, 3 messages non lus' })
      expect(tile).toHaveTextContent('3')
    })

    it('met « message » au singulier pour un seul non lu', async () => {
      mockConversations([{ ...CONVERSATIONS[0], unreadCount: 1 }])
      renderWithProviders(<HomePage role="ADMIN" />)
      expect(await screen.findByRole('link', { name: 'Messages, 1 message non lu' })).toBeInTheDocument()
    })

    it("n'affiche aucune pastille quand il n'y a rien de non lu", async () => {
      const calls = mockConversations([{ ...CONVERSATIONS[0], unreadCount: 0 }])
      renderWithProviders(<HomePage role="STAGIAIRE" />)
      await waitFor(() => expect(calls.count).toBe(1))
      expect(screen.getByRole('link', { name: 'Messages' })).toBeInTheDocument()
    })

    it("n'affiche aucune pastille quand la requête échoue", async () => {
      const calls = mockConversations([], { errorStatus: 500 })
      renderWithProviders(<HomePage role="STAGIAIRE" />)
      await waitFor(() => expect(calls.count).toBe(1))
      expect(screen.getByRole('link', { name: 'Messages' })).toBeInTheDocument()
    })

    it("n'a aucune violation d'accessibilité avec une pastille", async () => {
      mockConversations([{ ...CONVERSATIONS[0], unreadCount: 2 }])
      const { container } = renderWithProviders(<HomePage role="STAGIAIRE" />)
      await screen.findByRole('link', { name: 'Messages, 2 messages non lus' })
      expect(await axe(container)).toHaveNoViolations()
    })
  })
})
