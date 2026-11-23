import { ApiError } from '../../api/ApiError'
import { DELIVERY_FAILED_MESSAGE, mockSendFeedback } from '../../test/feedback'
import { collectFeedbackContext, sendFeedback } from './api'

const CONTEXT = { page: '/formations/12', userAgent: 'Mozilla/5.0', viewport: '1280x720', appVersion: '0.0.0+local' }

describe('sendFeedback', () => {
  it('envoie un multipart avec le type, le message et le contexte, sans capture', async () => {
    const calls = mockSendFeedback()

    await sendFeedback({ type: 'BUG', message: 'Le bouton ne répond pas', screenshot: null, context: CONTEXT })

    expect(calls).toHaveLength(1)
    expect(calls[0].contentType).toMatch(/^multipart\/form-data; boundary=/)
    expect(calls[0]).toMatchObject({
      type: 'BUG',
      message: 'Le bouton ne répond pas',
      page: '/formations/12',
      userAgent: 'Mozilla/5.0',
      viewport: '1280x720',
      appVersion: '0.0.0+local',
      screenshot: null,
    })
  })

  it('joint la capture quand elle est fournie', async () => {
    const calls = mockSendFeedback()
    const screenshot = new File([new Uint8Array([0x89, 0x50])], 'ecran.png', { type: 'image/png' })

    await sendFeedback({ type: 'SUGGESTION', message: 'Une idée utile', screenshot, context: CONTEXT })

    expect(calls[0].screenshot).toEqual({ name: 'ecran.png', type: 'image/png' })
  })

  it("rejette en ApiError avec le message du back quand l'envoi échoue", async () => {
    mockSendFeedback({ error: { status: 503, message: DELIVERY_FAILED_MESSAGE } })

    const sending = sendFeedback({ type: 'BUG', message: 'Le bouton ne répond pas', screenshot: null, context: CONTEXT })

    await expect(sending).rejects.toBeInstanceOf(ApiError)
    await expect(sending).rejects.toMatchObject({ status: 503, message: DELIVERY_FAILED_MESSAGE })
  })
})

describe('collectFeedbackContext', () => {
  const fakeWindow = (href) => ({
    location: new URL(href),
    navigator: { userAgent: 'Mozilla/5.0 Test' },
    innerWidth: 390,
    innerHeight: 844,
  })

  it('ne garde que le chemin de la page, sans paramètres ni fragment', () => {
    const context = collectFeedbackContext(fakeWindow('http://localhost:5173/formations/12?onglet=documents#liste'))

    expect(context.page).toBe('/formations/12')
  })

  it('joint le navigateur, la taille de fenêtre et la version de l’application', () => {
    const context = collectFeedbackContext(fakeWindow('http://localhost:5173/'))

    expect(context).toEqual({
      page: '/',
      userAgent: 'Mozilla/5.0 Test',
      viewport: '390x844',
      appVersion: __APP_VERSION__,
    })
    expect(context.appVersion).toMatch(/^0\.0\.0\+/)
  })
})
