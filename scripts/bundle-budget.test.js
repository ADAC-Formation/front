import { describe, expect, it } from 'vitest'
import { checkBundle, isPageSource } from './bundle-budget.js'

const ENTRY = 'src/main.jsx'
const LOGIN = 'src/components/Pages/LoginPage/LoginPage.jsx'
const ACCOUNTS = 'src/features/accounts/pages/AccountListPage.jsx'

const budget = { entryGzipBytes: 100_000 }

// Manifeste réduit au format de Vite : la page est chargée à la demande dans son propre fichier.
const lazyManifest = () => ({
  [ENTRY]: { file: 'assets/index-a.js', src: ENTRY, isEntry: true, dynamicImports: [LOGIN, ACCOUNTS] },
  [LOGIN]: { file: 'assets/LoginPage-b.js', src: LOGIN, isDynamicEntry: true },
  [ACCOUNTS]: { file: 'assets/AccountListPage-c.js', src: ACCOUNTS, isDynamicEntry: true },
})

describe('isPageSource', () => {
  it('reconnaît les pages, pas les tests ni les autres modules', () => {
    expect(isPageSource(LOGIN)).toBe(true)
    expect(isPageSource(ACCOUNTS)).toBe(true)
    expect(isPageSource('src/components/Pages/LoginPage/LoginPage.test.jsx')).toBe(false)
    expect(isPageSource('src/components/Pages/LoginPage/LoginPage.module.css')).toBe(false)
    expect(isPageSource('src/features/auth/guards/RequireAuth.jsx')).toBe(false)
  })
})

describe('checkBundle', () => {
  it('réussit sous le budget et sans page dans le fichier d’entrée', () => {
    const errors = checkBundle({ manifest: lazyManifest(), entryGzipBytes: 90_000, budget })
    expect(errors).toEqual([])
  })

  it('réussit exactement au budget', () => {
    const errors = checkBundle({ manifest: lazyManifest(), entryGzipBytes: 100_000, budget })
    expect(errors).toEqual([])
  })

  it('échoue en affichant la taille mesurée et le budget', () => {
    const errors = checkBundle({ manifest: lazyManifest(), entryGzipBytes: 120_000, budget })
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('120000')
    expect(errors[0]).toContain('100000')
  })

  it('échoue en nommant une page importée statiquement par l’entrée', () => {
    const manifest = lazyManifest()
    manifest[ENTRY].imports = [LOGIN]
    const errors = checkBundle({ manifest, entryGzipBytes: 90_000, budget })
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain(LOGIN)
  })

  it('échoue pour une page importée indirectement (via un chunk partagé)', () => {
    const manifest = lazyManifest()
    manifest[ENTRY].imports = ['_shared.js']
    manifest['_shared.js'] = { file: 'assets/shared-d.js', imports: [ACCOUNTS] }
    const errors = checkBundle({ manifest, entryGzipBytes: 90_000, budget })
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain(ACCOUNTS)
  })

  it('échoue quand une page est regroupée dans le fichier d’entrée lui-même', () => {
    const manifest = lazyManifest()
    manifest[LOGIN].file = manifest[ENTRY].file
    const errors = checkBundle({ manifest, entryGzipBytes: 90_000, budget })
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain(LOGIN)
  })

  it('échoue pour une page connue du dépôt mais absente du manifeste (code dans l’entrée)', () => {
    const errors = checkBundle({
      manifest: lazyManifest(),
      entryGzipBytes: 90_000,
      budget,
      pageSources: [LOGIN, ACCOUNTS, 'src/components/Pages/Home/HomeRoute.jsx'],
    })
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('src/components/Pages/Home/HomeRoute.jsx')
  })

  it('cumule les erreurs de taille et de page', () => {
    const manifest = lazyManifest()
    manifest[ENTRY].imports = [LOGIN]
    const errors = checkBundle({ manifest, entryGzipBytes: 120_000, budget })
    expect(errors).toHaveLength(2)
  })
})
