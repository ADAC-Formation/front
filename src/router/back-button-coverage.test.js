import { describe, expect, it } from 'vitest'

// Règle : toute page de l'application a un « Retour » (BackButton, destination explicite). Ce garde-fou lit
// le routeur et échoue si une page importée ne contient pas BackButton, pour qu'un oubli se voie tout de
// suite en ajoutant une page. Voir le bullet « Gabarit et accessibilité » de CLAUDE.md.

const sources = import.meta.glob('/src/**/*.jsx', { query: '?raw', import: 'default', eager: true })
const routerSource = Object.entries(sources).find(([file]) => file === '/src/router/router.jsx')[1]

// Pages sans « Retour » à dessein : l'accueil n'a rien au-dessus, et les pages publiques (connexion,
// activation, mot de passe) sont des étapes d'un parcours, pas des pages de l'application.
const EXEMPT = [
  'components/Pages/Home/HomeRoute',
  'components/Pages/LoginPage/LoginPage',
  'features/auth/pages/ActivationPage',
  'features/auth/pages/ForgotPasswordPage',
  'features/auth/pages/ResetPasswordPage',
]

// Dette connue : pages qui n'ont pas encore de « Retour ». À vider, jamais à allonger.
const KNOWN_GAPS = [
  'components/Pages/SiteMapPage/SiteMapPage',
]

const pagesOfRouter = [...routerSource.matchAll(/import\("\.\.\/([^"]+)"\)/g)].map((match) => match[1])

describe('« Retour » sur chaque page', () => {
  it('le routeur importe des pages (le garde-fou lit bien le routeur)', () => {
    expect(pagesOfRouter.length).toBeGreaterThan(10)
  })

  it.each([...new Set(pagesOfRouter)].filter((page) => !EXEMPT.includes(page) && !KNOWN_GAPS.includes(page)))(
    '%s contient un BackButton',
    (page) => {
      const source = sources[`/src/${page}.jsx`]
      expect(source, `fichier introuvable : ${page}`).toBeTypeOf('string')
      expect(source).toMatch(/<BackButton\b/)
    },
  )

  it('la dette connue ne contient que des pages qui n’ont toujours pas de « Retour »', () => {
    const fixed = KNOWN_GAPS.filter((page) => /<BackButton\b/.test(sources[`/src/${page}.jsx`] ?? ''))
    expect(fixed, 'à retirer de KNOWN_GAPS').toEqual([])
  })
})
