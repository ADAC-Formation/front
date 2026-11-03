import { renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { renderWithProviders } from '../../test/render'
import { server } from '../../test/msw/server'
import { API_URL, USERS, mockSession } from '../../test/session'
import { FORMATEURS, STAGIAIRES, mockAccountList } from '../../test/accounts'
import { FORMATIONS, mockFormationList } from '../../test/formations'
import {
  CONVERSATIONS,
  THREAD,
  makeMessage,
  mockConversations,
  mockMarkRead,
  mockSendMessage,
  mockThread,
} from '../../test/messages'
import {
  POLL_INTERVAL_MS,
  useConversations,
  useMarkThreadRead,
  useSendMessage,
  useThread,
  useUnreadCount,
} from './hooks'
import { useRecipients } from './useRecipients'

const wrapperWith = (queryClient) =>
  function Wrapper({ children }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }

describe('useConversations', () => {
  function Probe() {
    const { data, isLoading, isError } = useConversations()
    if (isLoading) return <p>chargement</p>
    if (isError) return <p>erreur</p>
    return (
      <ul>
        {data.map((c) => (
          <li key={c.conversationId}>
            {c.participant.prenom} {c.unreadCount}
          </li>
        ))}
      </ul>
    )
  }

  it('liste les conversations dans l\'ordre reçu', async () => {
    mockConversations()
    renderWithProviders(<Probe />)
    const items = await screen.findAllByRole('listitem')
    expect(items.map((li) => li.textContent)).toEqual(['Anne 2', 'Chargée 0'])
  })

  it('signale une erreur du back', async () => {
    mockConversations([], { errorStatus: 500 })
    renderWithProviders(<Probe />)
    expect(await screen.findByText('erreur')).toBeInTheDocument()
  })

  it('est sondée toutes les 45 s, en pause onglet masqué, et rechargée au focus (D21)', async () => {
    mockConversations()
    const queryClient = new QueryClient()
    const { result } = renderHook(() => useConversations(), { wrapper: wrapperWith(queryClient) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const options = queryClient.getQueryCache().find({ queryKey: ['messages', 'conversations'] }).options
    expect(POLL_INTERVAL_MS).toBe(45000)
    expect(options.refetchInterval).toBe(POLL_INTERVAL_MS)
    expect(options.refetchIntervalInBackground).toBe(false)
    expect(options.refetchOnWindowFocus).toBe(true)
  })
})

describe('useUnreadCount', () => {
  function Probe() {
    const count = useUnreadCount()
    return <p>non lus : {count}</p>
  }

  it('additionne les non lus de la liste des conversations', async () => {
    mockConversations([
      { ...CONVERSATIONS[0], unreadCount: 2 },
      { ...CONVERSATIONS[1], unreadCount: 1 },
    ])
    renderWithProviders(<Probe />)
    expect(await screen.findByText('non lus : 3')).toBeInTheDocument()
  })

  it('vaut zéro tant que la liste charge et en cas d\'erreur', async () => {
    const calls = mockConversations([], { errorStatus: 500 })
    renderWithProviders(<Probe />)
    expect(screen.getByText('non lus : 0')).toBeInTheDocument()
    await waitFor(() => expect(calls.count).toBe(1))
    expect(screen.getByText('non lus : 0')).toBeInTheDocument()
  })
})

describe('useThread', () => {
  function Probe({ userId }) {
    const { data, isError, error } = useThread(userId)
    if (isError) return <p>erreur {error.status}</p>
    if (!data) return <p>chargement</p>
    return (
      <ol>
        {data.map((m) => (
          <li key={m.id}>{m.content}</li>
        ))}
      </ol>
    )
  }

  it('liste les messages du fil dans l\'ordre reçu (du plus ancien au plus récent)', async () => {
    mockThread(10)
    renderWithProviders(<Probe userId={10} />)
    const items = await screen.findAllByRole('listitem')
    expect(items.map((li) => li.textContent)).toEqual(THREAD.map((m) => m.content))
  })

  it('accepte l\'identifiant en texte (paramètre d\'adresse)', async () => {
    const calls = mockThread(10)
    renderWithProviders(<Probe userId="10" />)
    await screen.findAllByRole('listitem')
    expect(calls.count).toBe(1)
  })

  it('remonte une erreur 404 du back avec son statut', async () => {
    mockThread(999, [], { errorStatus: 404 })
    renderWithProviders(<Probe userId={999} />)
    expect(await screen.findByText('erreur 404')).toBeInTheDocument()
  })

  it('est sondé toutes les 45 s, en pause onglet masqué', async () => {
    mockThread(10)
    const queryClient = new QueryClient()
    const { result } = renderHook(() => useThread(10), { wrapper: wrapperWith(queryClient) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const options = queryClient.getQueryCache().find({ queryKey: ['messages', 'thread', '10'] }).options
    expect(options.refetchInterval).toBe(POLL_INTERVAL_MS)
    expect(options.refetchIntervalInBackground).toBe(false)
  })

  it('ne lance aucun appel quand il est désactivé', async () => {
    const calls = mockThread(10)
    renderHook(() => useThread(10, { enabled: false }), { wrapper: wrapperWith(new QueryClient()) })
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(calls.count).toBe(0)
  })
})

describe('useSendMessage', () => {
  function Probe({ recipientId = 7, content = 'Salut' }) {
    const { mutate, isPending, isSuccess, isError, error } = useSendMessage()
    return (
      <div>
        <button type="button" onClick={() => mutate({ recipientId, content })}>
          envoyer
        </button>
        {isPending && <p>en cours</p>}
        {isSuccess && <p>envoyé</p>}
        {isError && <p>erreur {error.status ?? 'réseau'}</p>}
      </div>
    )
  }

  it('envoie le contenu à un seul destinataire', async () => {
    const calls = mockSendMessage()
    renderWithProviders(<Probe />)
    await userEvent.click(screen.getByRole('button', { name: 'envoyer' }))
    expect(await screen.findByText('envoyé')).toBeInTheDocument()
    expect(calls.bodies).toEqual([{ recipientIds: [7], content: 'Salut' }])
  })

  it('recharge la liste des conversations et le fil après un envoi', async () => {
    mockSendMessage()
    const conversationCalls = mockConversations()
    const threadCalls = mockThread(7)
    function Both() {
      useConversations()
      useThread(7)
      return <Probe />
    }
    renderWithProviders(<Both />)
    await waitFor(() => expect(conversationCalls.count).toBe(1))
    await waitFor(() => expect(threadCalls.count).toBe(1))
    await userEvent.click(screen.getByRole('button', { name: 'envoyer' }))
    await waitFor(() => expect(conversationCalls.count).toBe(2))
    await waitFor(() => expect(threadCalls.count).toBe(2))
  })

  it.each([403, 404])('remonte le statut %i du back', async (status) => {
    mockSendMessage({ errorStatus: status })
    renderWithProviders(<Probe />)
    await userEvent.click(screen.getByRole('button', { name: 'envoyer' }))
    expect(await screen.findByText(`erreur ${status}`)).toBeInTheDocument()
  })

  it('remonte une erreur réseau', async () => {
    server.use(http.post(`${API_URL}/messages/send`, () => HttpResponse.error()))
    renderWithProviders(<Probe />)
    await userEvent.click(screen.getByRole('button', { name: 'envoyer' }))
    expect(await screen.findByText(/^erreur/)).toBeInTheDocument()
  })
})

describe('useMarkThreadRead', () => {
  function Probe({ messages, currentUserId = USERS.STAGIAIRE.id }) {
    const { mutateAsync, isSuccess } = useMarkThreadRead()
    return (
      <div>
        <button type="button" onClick={() => mutateAsync({ messages, currentUserId })}>
          lire
        </button>
        {isSuccess && <p>terminé</p>}
      </div>
    )
  }

  it('envoie un PATCH par message reçu non lu, et aucun pour les autres', async () => {
    const calls = mockMarkRead()
    renderWithProviders(<Probe messages={THREAD} />)
    await userEvent.click(screen.getByRole('button', { name: 'lire' }))
    expect(await screen.findByText('terminé')).toBeInTheDocument()
    expect([...calls.ids].sort()).toEqual([2, 3])
  })

  it('n\'envoie rien quand tout est lu', async () => {
    const calls = mockMarkRead()
    const allRead = THREAD.map((m) => ({ ...m, readAt: '2026-11-02T11:00:00' }))
    renderWithProviders(<Probe messages={allRead} />)
    await userEvent.click(screen.getByRole('button', { name: 'lire' }))
    expect(await screen.findByText('terminé')).toBeInTheDocument()
    expect(calls.count).toBe(0)
  })

  it('un échec n\'empêche pas les autres marquages ni la fin', async () => {
    const calls = mockMarkRead({ failIds: [2] })
    renderWithProviders(<Probe messages={THREAD} />)
    await userEvent.click(screen.getByRole('button', { name: 'lire' }))
    expect(await screen.findByText('terminé')).toBeInTheDocument()
    expect([...calls.ids].sort()).toEqual([2, 3])
  })

  it('recharge la liste des conversations quand des messages ont été marqués', async () => {
    mockMarkRead()
    const conversationCalls = mockConversations()
    function Both() {
      useConversations()
      return <Probe messages={[makeMessage({ id: 5, sender: USERS.ADMIN, recipients: [USERS.STAGIAIRE] })]} />
    }
    renderWithProviders(<Both />)
    await waitFor(() => expect(conversationCalls.count).toBe(1))
    await userEvent.click(screen.getByRole('button', { name: 'lire' }))
    await waitFor(() => expect(conversationCalls.count).toBe(2))
  })
})

describe('useRecipients', () => {
  function Probe({ enabled = true }) {
    const { recipients, isLoading, isError } = useRecipients({ enabled })
    if (isLoading) return <p>chargement</p>
    if (isError) return <p>erreur</p>
    return (
      <ul>
        {recipients.map((r) => (
          <li key={r.id}>{r.prenom}</li>
        ))}
      </ul>
    )
  }

  const names = async () => (await screen.findAllByRole('listitem')).map((li) => li.textContent)

  it('chargée de formation : formateurs et stagiaires actifs', async () => {
    mockSession('SUPER_ADMIN')
    mockConversations([])
    const formateurs = mockAccountList('formateurs', FORMATEURS)
    mockAccountList('stagiaires', STAGIAIRES)
    renderWithProviders(<Probe />)
    expect(await names()).toEqual(['Anne', 'Léa'])
    expect(formateurs.urls[0]).toContain('active=true')
  })

  it('formateur : stagiaires actifs et chargée de formation connue par une conversation', async () => {
    mockSession('ADMIN')
    mockConversations([{ ...CONVERSATIONS[1], unreadCount: 0 }])
    mockAccountList('stagiaires', STAGIAIRES)
    renderWithProviders(<Probe />)
    expect(await names()).toEqual(['Léa', 'Chargée'])
  })

  it('stagiaire : formateurs de ses formations, sans doublon', async () => {
    mockSession('STAGIAIRE')
    mockConversations([])
    mockFormationList([FORMATIONS[0], { ...FORMATIONS[0], id: 102 }])
    renderWithProviders(<Probe />)
    expect(await names()).toEqual(['Formateur'])
  })

  it('ne lance aucun appel de destinataires tant qu\'il est désactivé', async () => {
    mockSession('SUPER_ADMIN')
    const conversations = mockConversations([])
    const formateurs = mockAccountList('formateurs', FORMATEURS)
    const stagiaires = mockAccountList('stagiaires', STAGIAIRES)
    renderWithProviders(<Probe enabled={false} />)
    await new Promise((resolve) => setTimeout(resolve, 80))
    expect(conversations.count + formateurs.count + stagiaires.count).toBe(0)
  })

  it('signale une erreur du back', async () => {
    mockSession('STAGIAIRE')
    mockConversations([])
    server.use(http.get(`${API_URL}/formations`, () => HttpResponse.json({ status: 500, message: 'x', details: [] }, { status: 500 })))
    renderWithProviders(<Probe />)
    expect(await screen.findByText('erreur')).toBeInTheDocument()
  })
})
