import '@testing-library/jest-dom/vitest'
import { expect, beforeAll, afterEach, afterAll } from 'vitest'
import { cleanup, configure } from '@testing-library/react'
import { toHaveNoViolations } from 'jest-axe'
import { server } from './msw/server'

expect.extend(toHaveNoViolations)

// Les pages sont chargées à la demande (`lazy`) : la première importation d'une page, transformée
// par Vite, peut dépasser la seconde par défaut quand toute la suite tourne en parallèle.
configure({ asyncUtilTimeout: 4000 })

// Tout appel réseau non déclaré par le test fait échouer le test. MSW seul ne suffit pas : l'erreur est
// avalée par la page, et la requête (ou sa réponse) peut tomber pendant le test suivant, qui échoue alors
// au hasard (session expirée, page introuvable…). On note donc chaque requête non déclarée et on fait
// échouer le test qui l'a lancée.
const unhandledRequests = []
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
  server.events.on('request:unhandled', ({ request }) => unhandledRequests.push(`${request.method} ${request.url}`))
})
afterEach(() => {
  cleanup()
  server.resetHandlers()
  const found = unhandledRequests.splice(0)
  if (found.length > 0) {
    throw new Error(['Requêtes réseau non déclarées par ce test (ajouter les mocks MSW) :', ...found].join('\n'))
  }
})
afterAll(() => server.close())
