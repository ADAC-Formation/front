import { http, HttpResponse } from 'msw'
import { server } from '../test/msw/server'
import apiClient, { setUnauthorizedHandler } from './Axiosclient'
import { ApiError } from './ApiError'

const BASE = 'http://localhost:8080/api'

// Renvoie l'erreur levée par la requête (ou fait échouer le test si elle réussit).
async function catchError(request) {
  try {
    await request()
  } catch (error) {
    return error
  }
  throw new Error('La requête aurait dû échouer')
}

describe('client API — configuration', () => {
  it('envoie les cookies avec chaque requête', () => {
    expect(apiClient.defaults.withCredentials).toBe(true)
  })

  it('cible VITE_API_URL comme adresse de base', async () => {
    let calledUrl
    server.use(
      http.get(`${BASE}/auth/me`, ({ request }) => {
        calledUrl = request.url
        return HttpResponse.json({ id: 1 })
      }),
    )
    await apiClient.get('/auth/me')
    expect(calledUrl).toBe(`${BASE}/auth/me`)
  })

  it("n'envoie aucun en-tête Authorization et ne stocke aucun jeton", async () => {
    let authorization = 'non-appelé'
    server.use(
      http.post(`${BASE}/auth/login`, ({ request }) => {
        authorization = request.headers.get('authorization')
        return HttpResponse.json({ id: 1 })
      }),
    )
    await apiClient.post('/auth/login', { email: 'a@b.fr', password: 'Motdepasse1' })
    expect(authorization).toBeNull()
    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(0)
  })
})

describe('client API — normalisation des erreurs', () => {
  it('convertit une erreur au format standard en ApiError', async () => {
    server.use(
      http.post(`${BASE}/users`, () =>
        HttpResponse.json(
          { status: 400, message: 'Données invalides', details: ['Email invalide'] },
          { status: 400 },
        ),
      ),
    )
    const error = await catchError(() => apiClient.post('/users', {}))
    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(400)
    expect(error.message).toBe('Données invalides')
    expect(error.details).toEqual(['Email invalide'])
  })

  it('utilise un message générique et des détails vides si le corps est absent', async () => {
    server.use(http.get(`${BASE}/formations`, () => new HttpResponse(null, { status: 502 })))
    const error = await catchError(() => apiClient.get('/formations'))
    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(502)
    expect(error.message).toMatch(/erreur/i)
    expect(error.details).toEqual([])
  })

  it('utilise un message générique si le corps est du texte non JSON', async () => {
    server.use(http.get(`${BASE}/formations`, () => new HttpResponse('<html>Bad gateway</html>', { status: 502 })))
    const error = await catchError(() => apiClient.get('/formations'))
    expect(error.status).toBe(502)
    expect(error.message).not.toContain('<html>')
    expect(error.details).toEqual([])
  })

  it('signale une erreur réseau quand le serveur est injoignable', async () => {
    server.use(http.get(`${BASE}/formations`, () => HttpResponse.error()))
    const error = await catchError(() => apiClient.get('/formations'))
    expect(error).toBeInstanceOf(ApiError)
    expect(error.isNetworkError).toBe(true)
    expect(error.status).toBeUndefined()
    expect(error.message).toMatch(/serveur|réseau/i)
  })

  it('conserve le message du back pour un compte non activé (403)', async () => {
    server.use(
      http.post(`${BASE}/auth/login`, () =>
        HttpResponse.json(
          { status: 403, message: 'Compte non activé. Veuillez consulter vos emails.' },
          { status: 403 },
        ),
      ),
    )
    const unauthorized = vi.fn()
    setUnauthorizedHandler(unauthorized)
    const error = await catchError(() => apiClient.post('/auth/login', {}))
    expect(error.status).toBe(403)
    expect(error.message).toBe('Compte non activé. Veuillez consulter vos emails.')
    expect(unauthorized).not.toHaveBeenCalled()
  })

  it('conserve le message du back après trop de tentatives (429)', async () => {
    server.use(
      http.post(`${BASE}/auth/login`, () =>
        HttpResponse.json(
          { status: 429, message: 'Trop de tentatives. Réessayez dans 15 minutes.' },
          { status: 429 },
        ),
      ),
    )
    const error = await catchError(() => apiClient.post('/auth/login', {}))
    expect(error.status).toBe(429)
    expect(error.message).toBe('Trop de tentatives. Réessayez dans 15 minutes.')
  })
})

describe('client API — session expirée (401)', () => {
  let unauthorized

  beforeEach(() => {
    unauthorized = vi.fn()
    setUnauthorizedHandler(unauthorized)
  })

  afterEach(() => {
    setUnauthorizedHandler(null)
  })

  it("appelle le handler de session expirée sur un 401 hors connexion", async () => {
    server.use(http.get(`${BASE}/formations`, () => HttpResponse.json({ status: 401, message: 'Non authentifié' }, { status: 401 })))
    const error = await catchError(() => apiClient.get('/formations'))
    expect(error.status).toBe(401)
    expect(unauthorized).toHaveBeenCalledTimes(1)
  })

  it('ne déclenche pas le handler sur un 401 de POST /auth/login et remet l’erreur à l’appelant', async () => {
    server.use(http.post(`${BASE}/auth/login`, () => HttpResponse.json({ status: 401, message: 'Identifiants invalides' }, { status: 401 })))
    const error = await catchError(() => apiClient.post('/auth/login', {}))
    expect(error.status).toBe(401)
    expect(error.message).toBe('Identifiants invalides')
    expect(unauthorized).not.toHaveBeenCalled()
  })

  it('ne déclenche pas le handler sur un 401 de GET /auth/me (visiteur non connecté)', async () => {
    server.use(http.get(`${BASE}/auth/me`, () => HttpResponse.json({ status: 401, message: 'Non authentifié' }, { status: 401 })))
    const error = await catchError(() => apiClient.get('/auth/me'))
    expect(error.status).toBe(401)
    expect(unauthorized).not.toHaveBeenCalled()
  })

  it('ne déclenche pas le handler sur un 401 de PATCH /users/me/password (ancien mot de passe incorrect)', async () => {
    server.use(http.patch(`${BASE}/users/me/password`, () => HttpResponse.json({ status: 401, message: 'Ancien mot de passe incorrect' }, { status: 401 })))
    const error = await catchError(() => apiClient.patch('/users/me/password', {}))
    expect(error.status).toBe(401)
    expect(error.message).toBe('Ancien mot de passe incorrect')
    expect(unauthorized).not.toHaveBeenCalled()
  })

  it('ne plante pas quand aucun handler n’est enregistré', async () => {
    setUnauthorizedHandler(null)
    server.use(http.get(`${BASE}/formations`, () => new HttpResponse(null, { status: 401 })))
    const error = await catchError(() => apiClient.get('/formations'))
    expect(error.status).toBe(401)
  })
})
