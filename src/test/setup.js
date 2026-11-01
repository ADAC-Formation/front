import '@testing-library/jest-dom/vitest'
import { expect, beforeAll, afterEach, afterAll } from 'vitest'
import { cleanup, configure } from '@testing-library/react'
import { toHaveNoViolations } from 'jest-axe'
import { server } from './msw/server'

expect.extend(toHaveNoViolations)

// Les pages sont chargées à la demande (`lazy`) : la première importation d'une page, transformée
// par Vite, peut dépasser la seconde par défaut quand toute la suite tourne en parallèle.
configure({ asyncUtilTimeout: 4000 })

// Tout appel réseau non déclaré par le test fait échouer le test.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  cleanup()
  server.resetHandlers()
})
afterAll(() => server.close())
