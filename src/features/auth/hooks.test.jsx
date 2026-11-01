import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query'
import { Route, Routes, useLocation } from 'react-router'
import { render } from '@testing-library/react'
import { renderWithProviders } from '../../test/render'
import { server } from '../../test/msw/server'
import { API_URL, USERS, mockSession, mockNoSession } from '../../test/session'
import apiClient from '../../api/Axiosclient'
import { CURRENT_USER_KEY, prefetchSession, useCurrentUser, useLogin, useLogout } from './hooks'

function Where() {
  const location = useLocation()
  return (
    <>
      <span data-testid="path">{location.pathname}</span>
      <span data-testid="notice">{location.state?.notice ?? ''}</span>
    </>
  )
}

function CurrentUserProbe() {
  const { user, isLoading, isError } = useCurrentUser()
  if (isLoading) return <p>chargement</p>
  if (isError) return <p>erreur</p>
  return <p>{user ? `${user.role}` : 'visiteur'}</p>
}

describe('useCurrentUser', () => {
  it("renvoie l'utilisateur quand GET /auth/me répond 200", async () => {
    mockSession('STAGIAIRE')
    renderWithProviders(<CurrentUserProbe />, { withSession: true })
    expect(screen.getByText('chargement')).toBeInTheDocument()
    expect(await screen.findByText('STAGIAIRE')).toBeInTheDocument()
  })

  it('traite un 401 comme un visiteur, sans erreur ni notice', async () => {
    mockNoSession()
    renderWithProviders(
      <>
        <CurrentUserProbe />
        <Where />
      </>,
      { withSession: true },
    )
    expect(await screen.findByText('visiteur')).toBeInTheDocument()
    expect(screen.getByTestId('notice')).toHaveTextContent('')
    expect(screen.getByTestId('path')).toHaveTextContent('/')
  })

  it('signale une erreur quand GET /auth/me répond 500', async () => {
    server.use(http.get(`${API_URL}/auth/me`, () => new HttpResponse(null, { status: 500 })))
    renderWithProviders(<CurrentUserProbe />, { withSession: true })
    expect(await screen.findByText('erreur')).toBeInTheDocument()
  })

  it("signale une erreur si GET /auth/me répond autre chose qu'un utilisateur (ex. page HTML, VITE_API_URL absente)", async () => {
    server.use(
      http.get(
        `${API_URL}/auth/me`,
        () => new HttpResponse('<!doctype html><html></html>', { headers: { 'Content-Type': 'text/html' } }),
      ),
    )
    renderWithProviders(<CurrentUserProbe />, { withSession: true })
    expect(await screen.findByText('erreur')).toBeInTheDocument()
  })

  it("n'écrit rien dans le stockage du navigateur", async () => {
    mockSession('ADMIN')
    renderWithProviders(<CurrentUserProbe />, { withSession: true })
    await screen.findByText('ADMIN')
    expect(Object.keys(localStorage).filter((key) => key !== 'app-theme-preferences')).toEqual([])
    expect(sessionStorage.length).toBe(0)
  })
})

function LoginProbe() {
  const login = useLogin()
  const { user } = useCurrentUser()
  return (
    <>
      <button onClick={() => login.mutate({ email: 'a@adac.test', password: 'Motdepasse1' })}>go</button>
      <p>{user ? user.role : 'visiteur'}</p>
      <p>{login.error ? `${login.error.status}:${login.error.message}` : ''}</p>
      <Where />
    </>
  )
}

describe('useLogin', () => {
  it("envoie les identifiants, mémorise l'utilisateur et redirige vers /", async () => {
    mockNoSession()
    let body
    server.use(
      http.post(`${API_URL}/auth/login`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(USERS.SUPER_ADMIN)
      }),
    )
    renderWithProviders(<LoginProbe />, { route: '/login', withSession: true })
    await screen.findByText('visiteur')
    await userEvent.click(screen.getByText('go'))
    expect(await screen.findByText('SUPER_ADMIN')).toBeInTheDocument()
    expect(body).toEqual({ email: 'a@adac.test', password: 'Motdepasse1' })
    expect(screen.getByTestId('path')).toHaveTextContent('/')
  })

  it("expose l'erreur du back sans rediriger (401)", async () => {
    mockNoSession()
    server.use(
      http.post(`${API_URL}/auth/login`, () =>
        HttpResponse.json({ status: 401, message: 'Identifiants invalides', details: [] }, { status: 401 }),
      ),
    )
    renderWithProviders(<LoginProbe />, { route: '/login', withSession: true })
    await screen.findByText('visiteur')
    await userEvent.click(screen.getByText('go'))
    expect(await screen.findByText('401:Identifiants invalides')).toBeInTheDocument()
    expect(screen.getByTestId('path')).toHaveTextContent('/login')
  })
})

// Écran protégé : observe des données comme une vraie page. Après la déconnexion le routeur le
// démonte (comme dans l'application) ; s'il restait monté, il relancerait sa requête et
// repeuplerait le cache selon le hasard du calendrier.
function FormationsScreen() {
  const logout = useLogout()
  const { data } = useQuery({
    queryKey: ['formations'],
    queryFn: async () => (await apiClient.get('/formations')).data,
  })
  return (
    <>
      <button onClick={() => logout.mutate()}>quitter</button>
      <p>{data ? 'formations affichées' : 'pas de formations'}</p>
    </>
  )
}

function LoggedOutScreen() {
  const queryClient = useQueryClient()
  const { user } = useCurrentUser()
  return (
    <>
      <p>{user ? user.role : 'visiteur'}</p>
      <p>{queryClient.getQueryData(['formations']) ? 'cache plein' : 'cache vide'}</p>
    </>
  )
}

function LogoutApp() {
  return (
    <>
      <Routes>
        <Route path="/formations" element={<FormationsScreen />} />
        <Route path="/login" element={<LoggedOutScreen />} />
      </Routes>
      <Where />
    </>
  )
}

describe('useLogout', () => {
  it.each([
    ['204', () => new HttpResponse(null, { status: 204 })],
    [
      '401 (session déjà expirée)',
      () => HttpResponse.json({ status: 401, message: 'Non authentifié', details: [] }, { status: 401 }),
    ],
  ])('vide la session et redirige vers /login quand le back répond %s', async (_label, respond) => {
    mockSession('STAGIAIRE')
    server.use(
      http.get(`${API_URL}/formations`, () => HttpResponse.json([{ id: 1 }])),
      http.post(`${API_URL}/auth/logout`, respond),
    )
    renderWithProviders(<LogoutApp />, { route: '/formations', withSession: true })
    expect(await screen.findByText('formations affichées')).toBeInTheDocument()
    await userEvent.click(screen.getByText('quitter'))
    await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/login'))
    expect(screen.getByText('visiteur')).toBeInTheDocument()
    expect(screen.getByText('cache vide')).toBeInTheDocument()
  })
})

function ExpiryProbe() {
  const { user } = useCurrentUser()
  useQuery({
    queryKey: ['formations'],
    queryFn: async () => (await apiClient.get('/formations')).data,
    enabled: Boolean(user),
  })
  return (
    <>
      <p>{user ? user.role : 'visiteur'}</p>
      <Where />
    </>
  )
}

describe('session expirée', () => {
  it('un 401 sur une requête de données vide la session et redirige vers /login avec la notice', async () => {
    mockSession('STAGIAIRE')
    server.use(
      http.get(`${API_URL}/formations`, () =>
        HttpResponse.json({ status: 401, message: 'Non authentifié', details: [] }, { status: 401 }),
      ),
    )
    renderWithProviders(<ExpiryProbe />, { route: '/formations', withSession: true })
    await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/login'))
    expect(screen.getByTestId('notice')).toHaveTextContent('session-expired')
    expect(screen.getByText('visiteur')).toBeInTheDocument()
    expect(sessionStorage.length).toBe(0)
  })
})

describe('prefetchSession', () => {
  const newClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } })

  it("remplit le cache avec l'utilisateur quand GET /auth/me répond 200", async () => {
    mockSession('ADMIN')
    const queryClient = newClient()
    await prefetchSession(queryClient)
    expect(queryClient.getQueryData(CURRENT_USER_KEY)).toEqual(USERS.ADMIN)
  })

  it('met null dans le cache (visiteur) quand GET /auth/me répond 401', async () => {
    mockNoSession()
    const queryClient = newClient()
    await prefetchSession(queryClient)
    expect(queryClient.getQueryData(CURRENT_USER_KEY)).toBeNull()
  })

  it('ne lève jamais d’erreur, même si GET /auth/me répond 500', async () => {
    server.use(http.get(`${API_URL}/auth/me`, () => new HttpResponse(null, { status: 500 })))
    await expect(prefetchSession(newClient())).resolves.not.toThrow()
  })

  it('évite une seconde requête : un useCurrentUser monté ensuite lit le cache', async () => {
    let calls = 0
    server.use(
      http.get(`${API_URL}/auth/me`, () => {
        calls += 1
        return HttpResponse.json(USERS.STAGIAIRE)
      }),
    )
    const queryClient = newClient()
    await prefetchSession(queryClient)
    render(
      <QueryClientProvider client={queryClient}>
        <CurrentUserProbe />
      </QueryClientProvider>,
    )
    expect(await screen.findByText('STAGIAIRE')).toBeInTheDocument()
    expect(calls).toBe(1)
  })
})
