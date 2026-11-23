import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { axe } from 'jest-axe'
import { renderWithProviders } from '../../../test/render'
import { server } from '../../../test/msw/server'
import { API_URL, mockNoSession, mockSession } from '../../../test/session'
import { mockSendFeedback } from '../../../test/feedback'
import { FeedbackButton } from './FeedbackButton'

const settle = () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 150)) })
const feedbackButton = () => screen.queryByRole('button', { name: 'Envoyer un retour' })

describe('FeedbackButton — visibilité', () => {
  it.each(['SUPER_ADMIN', 'ADMIN'])('est affiché pour %s', async (role) => {
    mockSession(role)
    renderWithProviders(<FeedbackButton />, { withSession: true })
    expect(await screen.findByRole('button', { name: 'Envoyer un retour' })).toBeInTheDocument()
  })

  it('n’est pas affiché pour un stagiaire', async () => {
    mockSession('STAGIAIRE')
    renderWithProviders(<FeedbackButton />, { withSession: true })
    await settle()
    expect(feedbackButton()).not.toBeInTheDocument()
  })

  it('n’est pas affiché sans session', async () => {
    mockNoSession()
    renderWithProviders(<FeedbackButton />, { withSession: true, route: '/login' })
    await settle()
    expect(feedbackButton()).not.toBeInTheDocument()
  })

  it('n’est pas affiché tant que la session n’est pas connue', () => {
    // GET /auth/me ne répond jamais : la session reste inconnue.
    server.use(http.get(`${API_URL}/auth/me`, () => new Promise(() => {})))
    renderWithProviders(<FeedbackButton />, { withSession: true })
    expect(feedbackButton()).not.toBeInTheDocument()
  })
})

describe('FeedbackButton — envoi', () => {
  it('ouvre la boîte de retour', async () => {
    mockSession('ADMIN')
    const user = userEvent.setup()
    renderWithProviders(<FeedbackButton />, { withSession: true })

    await user.click(await screen.findByRole('button', { name: 'Envoyer un retour' }))

    expect(screen.getByRole('dialog', { name: 'Envoyer un retour' })).toBeInTheDocument()
  })

  it('ferme la boîte, annonce le remerciement et rend le focus au bouton après un envoi', async () => {
    mockSession('SUPER_ADMIN')
    const calls = mockSendFeedback()
    const user = userEvent.setup()
    renderWithProviders(<FeedbackButton />, { withSession: true })

    const button = await screen.findByRole('button', { name: 'Envoyer un retour' })
    await user.click(button)
    await user.click(screen.getByRole('radio', { name: 'Bug' }))
    await user.type(screen.getByLabelText(/^Message/), 'Le bouton Enregistrer ne répond pas')
    await user.click(screen.getByRole('button', { name: 'Envoyer' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByRole('status')).toHaveTextContent('Merci, votre retour a bien été envoyé.')
    expect(button).toHaveFocus()
    expect(calls).toHaveLength(1)
  })

  it('n’a pas de violation d’accessibilité', async () => {
    mockSession('ADMIN')
    const { container } = renderWithProviders(<FeedbackButton />, { withSession: true })
    await screen.findByRole('button', { name: 'Envoyer un retour' })
    expect(await axe(container)).toHaveNoViolations()
  })
})
