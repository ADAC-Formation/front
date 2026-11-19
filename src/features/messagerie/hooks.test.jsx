import { renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { renderWithProviders } from '../../test/render'
import { server } from '../../test/msw/server'
import { API_URL, mockSession } from '../../test/session'
import { FORMATEURS, STAGIAIRES, mockAccountList } from '../../test/accounts'
import { FORMATIONS, mockFormationList } from '../../test/formations'
import {
  CONVERSATIONS,
  THREAD,
  STAGIAIRE_LEA,
  mockConversations,
  mockGroupPreview,
  mockMarkRead,
  mockSendGroupMessage,
  mockSendMessage,
  mockThread,
} from '../../test/messages'
import {
  POLL_INTERVAL_MS,
  useConversations,
  useGroupPreview,
  useMarkThreadRead,
  useSendGroupMessage,
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
  function Probe({ conversationId = 10 }) {
    const { mutateAsync, isSuccess, isError, error } = useMarkThreadRead()
    return (
      <div>
        <button type="button" onClick={() => mutateAsync({ conversationId }).catch(() => {})}>
          lire
        </button>
        {isSuccess && <p>terminé</p>}
        {isError && <p>erreur {error.status}</p>}
      </div>
    )
  }

  it('marque tout le fil en un seul appel, vers /messages/conversations/{id}/read', async () => {
    const calls = mockMarkRead()
    renderWithProviders(<Probe conversationId={10} />)
    await userEvent.click(screen.getByRole('button', { name: 'lire' }))
    expect(await screen.findByText('terminé')).toBeInTheDocument()
    expect(calls.count).toBe(1)
    expect(calls.conversationIds).toEqual([10])
  })

  it('recharge la liste des conversations après le marquage (les non lus changent)', async () => {
    mockMarkRead()
    const conversationCalls = mockConversations()
    function Both() {
      useConversations()
      return <Probe />
    }
    renderWithProviders(<Both />)
    await waitFor(() => expect(conversationCalls.count).toBe(1))
    await userEvent.click(screen.getByRole('button', { name: 'lire' }))
    await waitFor(() => expect(conversationCalls.count).toBe(2))
  })

  it('remonte l\'erreur du back sans recharger la liste', async () => {
    mockMarkRead({ errorStatus: 404 })
    const conversationCalls = mockConversations()
    function Both() {
      useConversations()
      return <Probe />
    }
    renderWithProviders(<Both />)
    await waitFor(() => expect(conversationCalls.count).toBe(1))
    await userEvent.click(screen.getByRole('button', { name: 'lire' }))
    expect(await screen.findByText('erreur 404')).toBeInTheDocument()
    expect(conversationCalls.count).toBe(1)
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

describe('useGroupPreview', () => {
  const noRetryClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const formationFilter = { type: 'FORMATION', formationId: '101' }

  it("n'appelle pas le back tant que le filtre est incomplet", async () => {
    const calls = mockGroupPreview()
    const { result } = renderHook(() => useGroupPreview({ type: 'FORMATION', formationId: '' }), {
      wrapper: wrapperWith(noRetryClient()),
    })
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(result.current.fetchStatus).toBe('idle')
    expect(calls.count).toBe(0)
  })

  it("demande les destinataires d'une formation avec filterType et formationId", async () => {
    const calls = mockGroupPreview([STAGIAIRE_LEA])
    const { result } = renderHook(() => useGroupPreview(formationFilter), { wrapper: wrapperWith(noRetryClient()) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([STAGIAIRE_LEA])
    expect(calls.searches[0].get('filterType')).toBe('FORMATION')
    expect(calls.searches[0].get('formationId')).toBe('101')
    expect(calls.searches[0].has('userIds')).toBe(false)
  })

  it('sérialise userIds en paramètres répétés (userIds=4&userIds=7), comme Spring les lit', async () => {
    const calls = mockGroupPreview()
    const { result } = renderHook(() => useGroupPreview({ type: 'MANUAL', userIds: [4, 7] }), {
      wrapper: wrapperWith(noRetryClient()),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(calls.searches[0].get('filterType')).toBe('MANUAL')
    expect(calls.searches[0].getAll('userIds')).toEqual(['4', '7'])
    expect([...calls.searches[0].keys()]).not.toContain('userIds[]')
  })

  it('« Documents manquants » envoie seulement filterType', async () => {
    const calls = mockGroupPreview()
    const { result } = renderHook(() => useGroupPreview({ type: 'MISSING_DOCS' }), {
      wrapper: wrapperWith(noRetryClient()),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect([...calls.searches[0].keys()]).toEqual(['filterType'])
  })

  it("ne redemande pas quand les mêmes personnes sont cochées dans un autre ordre", async () => {
    const calls = mockGroupPreview()
    const { result, rerender } = renderHook(({ filter }) => useGroupPreview(filter), {
      wrapper: wrapperWith(noRetryClient()),
      initialProps: { filter: { type: 'MANUAL', userIds: [4, 7] } },
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    rerender({ filter: { type: 'MANUAL', userIds: [7, 4] } })
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(calls.count).toBe(1)
  })

  it('redemande quand le filtre change', async () => {
    const calls = mockGroupPreview()
    const { result, rerender } = renderHook(({ filter }) => useGroupPreview(filter), {
      wrapper: wrapperWith(noRetryClient()),
      initialProps: { filter: formationFilter },
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    rerender({ filter: { type: 'FORMATION', formationId: '102' } })
    await waitFor(() => expect(calls.count).toBe(2))
    expect(calls.searches[1].get('formationId')).toBe('102')
  })

  it('remonte un 400 (aucun destinataire) sans nouvel essai, même si le client en prévoit', async () => {
    const calls = mockGroupPreview([], { errorStatus: 400, errorMessage: 'Aucun destinataire' })
    const retryingClient = new QueryClient({ defaultOptions: { queries: { retry: 3, retryDelay: 1 } } })
    const { result } = renderHook(() => useGroupPreview(formationFilter), { wrapper: wrapperWith(retryingClient) })
    await waitFor(() => expect(result.current.isError).toBe(true))
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(result.current.error.status).toBe(400)
    expect(calls.count).toBe(1)
  })

  it.each([403, 404])('remonte le statut %i du back', async (status) => {
    mockGroupPreview([], { errorStatus: status })
    const { result } = renderHook(() => useGroupPreview(formationFilter), { wrapper: wrapperWith(noRetryClient()) })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error.status).toBe(status)
  })
})

describe('useSendGroupMessage', () => {
  function Probe({ filter = { type: 'FORMATION', formationId: '101' }, content = 'Salut tout le monde' }) {
    const { mutate, isPending, isSuccess, isError, error, data } = useSendGroupMessage()
    return (
      <div>
        <button type="button" onClick={() => mutate({ filter, content })}>
          envoyer
        </button>
        {isPending && <p>en cours</p>}
        {isSuccess && <p>envoyé à {data.recipients.length}</p>}
        {isError && <p>erreur {error.status ?? 'réseau'}</p>}
      </div>
    )
  }

  it('envoie { content, filter } sans recipientIds et renvoie le message avec ses destinataires', async () => {
    const calls = mockSendGroupMessage([STAGIAIRE_LEA, { ...STAGIAIRE_LEA, id: 21 }, { ...STAGIAIRE_LEA, id: 22 }])
    renderWithProviders(<Probe />)
    await userEvent.click(screen.getByRole('button', { name: 'envoyer' }))
    expect(await screen.findByText('envoyé à 3')).toBeInTheDocument()
    expect(calls.bodies).toEqual([{ content: 'Salut tout le monde', filter: { type: 'FORMATION', formationId: 101 } }])
    expect(calls.bodies[0]).not.toHaveProperty('recipientIds')
  })

  it('« Sélection libre » envoie les userIds', async () => {
    const calls = mockSendGroupMessage()
    renderWithProviders(<Probe filter={{ type: 'MANUAL', userIds: [4, 7] }} />)
    await userEvent.click(screen.getByRole('button', { name: 'envoyer' }))
    await screen.findByText(/^envoyé/)
    expect(calls.bodies[0].filter).toEqual({ type: 'MANUAL', userIds: [4, 7] })
  })

  it('recharge la liste des conversations et le fil après un envoi', async () => {
    mockSendGroupMessage()
    const conversationCalls = mockConversations()
    const threadCalls = mockThread(20)
    function Both() {
      useConversations()
      useThread(20)
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
    mockSendGroupMessage([], { errorStatus: status })
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
