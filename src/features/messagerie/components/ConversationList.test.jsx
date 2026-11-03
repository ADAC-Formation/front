import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test/render'
import { mockSession } from '../../../test/session'
import { CONVERSATIONS, mockConversations } from '../../../test/messages'
import ConversationList from './ConversationList'

const render = (props) => renderWithProviders(<ConversationList {...props} />, { route: '/messages' })

describe('ConversationList', () => {
  beforeEach(() => mockSession('STAGIAIRE'))

  it('annonce le chargement puis affiche les conversations dans l\'ordre reçu', async () => {
    mockConversations()
    render()
    expect(screen.getByRole('status')).toHaveTextContent('Chargement')
    const items = await screen.findAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(within(items[0]).getByText('Anne Martin')).toBeInTheDocument()
    expect(within(items[1]).getByText('Chargée Dev')).toBeInTheDocument()
  })

  it('affiche un extrait du dernier message et sa date', async () => {
    mockConversations()
    render()
    const [first] = await screen.findAllByRole('listitem')
    expect(within(first).getByText('Rendez-vous lundi ?')).toBeInTheDocument()
    expect(within(first).getByText(/2 nov/)).toBeInTheDocument()
  })

  it('précise « Vous : » quand le dernier message vient de l\'utilisateur', async () => {
    mockConversations()
    render()
    const items = await screen.findAllByRole('listitem')
    expect(within(items[1]).getByText(/Vous\s*:/)).toBeInTheDocument()
    expect(within(items[0]).queryByText(/Vous\s*:/)).not.toBeInTheDocument()
  })

  it('met en évidence les non lus avec un texte accessible', async () => {
    mockConversations()
    render()
    const [first, second] = await screen.findAllByRole('listitem')
    expect(within(first).getByText('2 messages non lus')).toBeInTheDocument()
    expect(within(second).queryByText(/non lu/)).not.toBeInTheDocument()
    expect(first).toHaveAttribute('data-unread', 'true')
    expect(second).not.toHaveAttribute('data-unread')
  })

  it('met le mot « message » au singulier pour un seul non lu', async () => {
    mockConversations([{ ...CONVERSATIONS[0], unreadCount: 1 }])
    render()
    expect(await screen.findByText('1 message non lu')).toBeInTheDocument()
  })

  it('chaque ligne est un lien vers le fil', async () => {
    mockConversations()
    render()
    const links = await screen.findAllByRole('link')
    expect(links[0]).toHaveAttribute('href', '/messages/10')
    expect(links[1]).toHaveAttribute('href', '/messages/1')
  })

  it('marque la conversation ouverte avec aria-current', async () => {
    mockConversations()
    render({ activeUserId: 10 })
    const links = await screen.findAllByRole('link')
    expect(links[0]).toHaveAttribute('aria-current', 'page')
    expect(links[1]).not.toHaveAttribute('aria-current')
  })

  it('affiche le contenu en texte, jamais en HTML', async () => {
    const hostile = { ...CONVERSATIONS[0], lastMessage: { ...CONVERSATIONS[0].lastMessage, content: '<img src=x onerror=alert(1)>' } }
    mockConversations([hostile])
    const { container } = render()
    expect(await screen.findByText('<img src=x onerror=alert(1)>')).toBeInTheDocument()
    expect(container.querySelector('img')).toBeNull()
  })

  it('affiche un état vide avec l\'action fournie', async () => {
    mockConversations([])
    render({ emptyAction: <button type="button">Nouvelle conversation</button> })
    expect(await screen.findByText('Aucune conversation pour le moment')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nouvelle conversation' })).toBeInTheDocument()
  })

  it('affiche une erreur annoncée avec « Réessayer » qui relance la requête', async () => {
    const calls = mockConversations([], { errorStatus: 500 })
    render()
    expect(await screen.findByRole('alert')).toHaveTextContent('conversations')
    mockConversations()
    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }))
    expect(await screen.findAllByRole('listitem')).toHaveLength(2)
    expect(calls.count).toBe(1)
  })
})
