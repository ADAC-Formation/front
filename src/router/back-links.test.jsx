import { render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { routes } from './router'
import { ThemeProvider } from '../context/ThemeProvider'
import { mockSession } from '../test/session'
import { cssSheets, rulesOf, stripComments } from '../test/css-sheets'

function renderApp(path) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>,
  )
}

// Lien « Retour » commun : un lien (pas un bouton) avec une destination explicite.
describe.each([
  ['/formations', 'Retour', '/admin/gestion'],
  ['/formations/categories', 'Retour', '/formations'],
  ['/formations/creer', 'Retour', '/formations'],
  ['/formations/1', 'Retour aux formations', '/formations'],
])('lien « Retour » sur %s', (path, label, destination) => {
  it(`est un lien « ${label} » vers ${destination}`, async () => {
    mockSession('SUPER_ADMIN')
    renderApp(path)
    const link = await screen.findByRole('link', { name: new RegExp(`^${label}$`) })
    expect(link).toHaveAttribute('href', destination)
    expect(screen.queryByRole('button', { name: /^Retour/ })).not.toBeInTheDocument()
  })
})

describe('feuilles de style des pages', () => {
  it('aucune page ne redéfinit une règle .back (celle de BackButton suffit)', () => {
    const violations = []
    for (const [file, css] of Object.entries(cssSheets)) {
      if (file.includes('BackButton')) continue
      for (const { selector } of rulesOf(stripComments(css))) {
        if (/\.back\b/.test(selector)) violations.push(`${file} : ${selector.trim()}`)
      }
    }
    expect(violations).toEqual([])
  })
})
