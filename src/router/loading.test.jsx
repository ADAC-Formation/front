import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider, createMemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { axe } from 'jest-axe'
import { routes } from './router'
import RouteError from './RouteError'
import { reloadPage } from './reloadPage'
import { ThemeProvider } from '../context/ThemeProvider'
import { mockSession } from '../test/session'

vi.mock('./reloadPage', () => ({ reloadPage: vi.fn() }))

// Promesse pilotable : le test décide quand le « téléchargement » de la page se termine.
function deferred() {
  let resolve, reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const Ready = () => <h1>Page prête</h1>
const Slow = () => <h1>Page lente</h1>

// Arbre de test bâti sur la vraie route racine (Layout, HydrateFallback, errorElement) :
// seules les pages enfants sont remplacées par des pages dont le chargement est contrôlé.
function renderWith(children, path) {
  const [root] = routes
  const router = createMemoryRouter([{ ...root, children }], { initialEntries: [path] })
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>,
  )
  return router
}

describe('chargement annoncé', () => {
  it('premier affichage : « Chargement… » (status) jusqu’à l’arrivée de la page', async () => {
    const gate = deferred()
    renderWith([{ path: 'lente', lazy: () => gate.promise }], '/lente')

    expect(await screen.findByRole('status')).toHaveTextContent('Chargement…')
    expect(screen.queryByRole('heading', { name: 'Page lente' })).not.toBeInTheDocument()

    await act(async () => gate.resolve({ Component: Slow }))
    expect(await screen.findByRole('heading', { name: 'Page lente' })).toBeInTheDocument()
    expect(screen.queryByText('Chargement…')).not.toBeInTheDocument()
  })

  it('navigation vers une page non chargée : « Chargement de la page… » puis disparition', async () => {
    mockSession('STAGIAIRE')
    const gate = deferred()
    const router = renderWith(
      [
        { path: 'prete', Component: Ready },
        { path: 'lente', lazy: () => gate.promise },
      ],
      '/prete',
    )
    expect(await screen.findByRole('heading', { name: 'Page prête' })).toBeInTheDocument()
    expect(screen.queryByText('Chargement de la page…')).not.toBeInTheDocument()

    act(() => {
      router.navigate('/lente')
    })
    expect(await screen.findByText('Chargement de la page…')).toBeInTheDocument()
    // L'ancienne page reste affichée pendant l'attente (comportement du routeur).
    expect(screen.getByRole('heading', { name: 'Page prête' })).toBeInTheDocument()

    await act(async () => gate.resolve({ Component: Slow }))
    expect(await screen.findByRole('heading', { name: 'Page lente' })).toBeInTheDocument()
    expect(screen.queryByText('Chargement de la page…')).not.toBeInTheDocument()
  })
})

describe('échec de chargement', () => {
  beforeEach(() => {
    reloadPage.mockClear()
    // Le routeur journalise l'erreur de route : bruit attendu dans ce test.
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => vi.restoreAllMocks())

  it('affiche une erreur annoncée et « Réessayer », qui recharge l’application', async () => {
    renderWith(
      [{ path: 'cassee', lazy: () => Promise.reject(new Error('Failed to fetch dynamically imported module')) }],
      '/cassee',
    )

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/Cette page n'a pas pu être chargée/)
    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }))
    expect(reloadPage).toHaveBeenCalledTimes(1)
  })

  it('une adresse inconnue affiche un message en français, pas l’écran d’erreur du routeur', async () => {
    renderWith([{ path: 'prete', Component: Ready }], '/inconnue')
    expect(await screen.findByRole('heading', { name: 'Page introuvable' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /accueil/i })).toHaveAttribute('href', '/')
  })
})

describe('RouteError', () => {
  it('n’a pas de violation d’accessibilité', async () => {
    const router = createMemoryRouter([
      { path: '/', Component: () => { throw new Error('boom') }, ErrorBoundary: RouteError },
    ])
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { container } = render(<RouterProvider router={router} />)
    await screen.findByRole('alert')
    expect(await axe(container)).toHaveNoViolations()
    vi.restoreAllMocks()
  })
})
