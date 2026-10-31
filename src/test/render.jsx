import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '../context/ThemeProvider'
import UserProvider from '../features/auth/UserProvider'

// Rend `ui` avec les providers de l'application. QueryClient neuf par appel, sans retry,
// pour que les tests soient isolés et que les erreurs remontent immédiatement.
// `withSession: true` monte aussi le UserProvider (le test doit alors déclarer GET /auth/me
// avec mockSession / mockNoSession).
export function renderWithProviders(ui, { route = '/', withSession = false } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const content = withSession ? <UserProvider>{ui}</UserProvider> : ui
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MemoryRouter initialEntries={[route]}>{content}</MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>,
  )
}
