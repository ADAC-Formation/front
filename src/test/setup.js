import '@testing-library/jest-dom/vitest'
import { expect, beforeAll, afterEach, afterAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import { toHaveNoViolations } from 'jest-axe'
import { server } from './msw/server'

expect.extend(toHaveNoViolations)

// Tout appel réseau non déclaré par le test fait échouer le test.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  cleanup()
  server.resetHandlers()
})
afterAll(() => server.close())
