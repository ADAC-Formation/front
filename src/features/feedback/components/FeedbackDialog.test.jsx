import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { vi } from 'vitest'
import { renderWithProviders } from '../../../test/render'
import { DELIVERY_FAILED_MESSAGE, RATE_LIMIT_MESSAGE, mockSendFeedback } from '../../../test/feedback'
import FeedbackDialog from './FeedbackDialog'

const THREE_MB = 3 * 1024 * 1024

function renderDialog() {
  const onSent = vi.fn()
  const onCancel = vi.fn()
  const view = renderWithProviders(<FeedbackDialog onSent={onSent} onCancel={onCancel} />, {
    route: '/formations/12?onglet=documents',
  })
  return { onSent, onCancel, ...view }
}

const bugRadio = () => screen.getByRole('radio', { name: 'Bug' })
const suggestionRadio = () => screen.getByRole('radio', { name: 'Suggestion' })
const messageField = () => screen.getByLabelText(/^Message/)
const imageField = () => screen.getByLabelText(/Capture d’écran/)
const sendButton = () => screen.getByRole('button', { name: /Envoyer/ })

const png = (size = 10) => new File([new Uint8Array(size)], 'ecran.png', { type: 'image/png' })

async function fillValidForm(user) {
  await user.click(bugRadio())
  await user.type(messageField(), 'Le bouton Enregistrer ne répond pas')
}

describe('FeedbackDialog — présentation', () => {
  it('est une boîte modale « Envoyer un retour » avec le type, le message et la capture', () => {
    renderDialog()

    const dialog = screen.getByRole('dialog', { name: 'Envoyer un retour' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(bugRadio()).not.toBeChecked()
    expect(suggestionRadio()).not.toBeChecked()
    expect(messageField()).toBeRequired()
    expect(imageField()).toHaveAttribute('accept', 'image/png,image/jpeg,image/webp')
  })

  it('place le focus dans la boîte à l’ouverture', () => {
    renderDialog()
    expect(bugRadio()).toHaveFocus()
  })

  it('affiche le contexte joint et l’avertissement sur les données personnelles', () => {
    renderDialog()

    expect(screen.getByText(/Envoyé avec votre retour : page, navigateur, taille d’écran, version/)).toBeInTheDocument()
    expect(
      screen.getByText('Évitez d’inclure des données personnelles de stagiaires dans la capture.'),
    ).toBeInTheDocument()
  })

  it('n’a pas de violation d’accessibilité', async () => {
    const { container } = renderDialog()
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('FeedbackDialog — fermeture sans envoi', () => {
  it('« Annuler » ferme sans requête', async () => {
    const calls = mockSendFeedback()
    const user = userEvent.setup()
    const { onCancel } = renderDialog()

    await user.click(screen.getByRole('button', { name: 'Annuler' }))

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(calls).toHaveLength(0)
  })

  it('Échap ferme sans requête', async () => {
    const calls = mockSendFeedback()
    const user = userEvent.setup()
    const { onCancel } = renderDialog()

    await user.keyboard('{Escape}')

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(calls).toHaveLength(0)
  })
})

describe('FeedbackDialog — validation', () => {
  it('exige le type et un message d’au moins 10 caractères, sans requête', async () => {
    const calls = mockSendFeedback()
    const user = userEvent.setup()
    renderDialog()

    await user.type(messageField(), 'court')
    await user.click(sendButton())

    expect(await screen.findByText('Choisissez le type de retour.')).toBeInTheDocument()
    expect(screen.getByText('Le message doit contenir au moins 10 caractères.')).toBeInTheDocument()
    expect(messageField()).toHaveAttribute('aria-invalid', 'true')
    expect(calls).toHaveLength(0)
  })

  it('refuse un message de plus de 2000 caractères', async () => {
    const calls = mockSendFeedback()
    const user = userEvent.setup()
    renderDialog()

    await user.click(bugRadio())
    await user.click(messageField())
    await user.paste('a'.repeat(2001))
    await user.click(sendButton())

    expect(await screen.findByText('Le message ne doit pas dépasser 2000 caractères.')).toBeInTheDocument()
    expect(calls).toHaveLength(0)
  })

  it('bloque l’envoi d’une image de plus de 3 Mo', async () => {
    const calls = mockSendFeedback()
    const user = userEvent.setup()
    renderDialog()

    await fillValidForm(user)
    await user.upload(imageField(), png(THREE_MB + 1))
    await user.click(sendButton())

    expect(await screen.findByText('Image trop lourde (3 Mo maximum).')).toBeInTheDocument()
    expect(calls).toHaveLength(0)
  })

  it('bloque l’envoi d’un fichier qui n’est ni png, ni jpeg, ni webp', async () => {
    const calls = mockSendFeedback()
    const user = userEvent.setup({ applyAccept: false })
    renderDialog()

    await fillValidForm(user)
    await user.upload(imageField(), new File(['%PDF'], 'doc.pdf', { type: 'application/pdf' }))
    await user.click(sendButton())

    expect(await screen.findByText('Format non accepté : png, jpeg ou webp.')).toBeInTheDocument()
    expect(calls).toHaveLength(0)
  })
})

describe('FeedbackDialog — envoi', () => {
  it('envoie le retour avec la capture et le contexte, puis appelle onSent', async () => {
    const calls = mockSendFeedback()
    const user = userEvent.setup()
    const { onSent } = renderDialog()

    await user.click(suggestionRadio())
    await user.type(messageField(), 'Ajouter un filtre par date')
    await user.upload(imageField(), png())
    await user.click(sendButton())

    await waitFor(() => expect(onSent).toHaveBeenCalledTimes(1))
    expect(calls).toHaveLength(1)
    expect(calls[0]).toMatchObject({
      type: 'SUGGESTION',
      message: 'Ajouter un filtre par date',
      screenshot: { name: 'ecran.png', type: 'image/png' },
    })
    expect(calls[0].appVersion).toMatch(/^0\.0\.0\+/)
  })

  it('garde la saisie et affiche le message du back quand la limite est atteinte (429)', async () => {
    mockSendFeedback({ error: { status: 429, message: RATE_LIMIT_MESSAGE } })
    const user = userEvent.setup()
    const { onSent } = renderDialog()

    await fillValidForm(user)
    await user.click(sendButton())

    expect(await screen.findByRole('alert')).toHaveTextContent(RATE_LIMIT_MESSAGE)
    expect(onSent).not.toHaveBeenCalled()
    expect(bugRadio()).toBeChecked()
    expect(messageField()).toHaveValue('Le bouton Enregistrer ne répond pas')
  })

  it('garde la saisie quand l’email ne peut pas partir (503) et permet de réessayer', async () => {
    const calls = mockSendFeedback({ error: { status: 503, message: DELIVERY_FAILED_MESSAGE }, errorOnce: true })
    const user = userEvent.setup()
    const { onSent } = renderDialog()

    await fillValidForm(user)
    await user.upload(imageField(), png())
    await user.click(sendButton())

    expect(await screen.findByRole('alert')).toHaveTextContent(DELIVERY_FAILED_MESSAGE)
    expect(messageField()).toHaveValue('Le bouton Enregistrer ne répond pas')
    expect(imageField().files[0].name).toBe('ecran.png')

    await user.click(sendButton())

    await waitFor(() => expect(onSent).toHaveBeenCalledTimes(1))
    expect(calls).toHaveLength(2)
    expect(calls[1].screenshot).toEqual({ name: 'ecran.png', type: 'image/png' })
  })

  it('n’envoie qu’une requête sur un double clic', async () => {
    const calls = mockSendFeedback()
    const user = userEvent.setup()
    const { onSent } = renderDialog()

    await fillValidForm(user)
    await user.dblClick(sendButton())

    await waitFor(() => expect(onSent).toHaveBeenCalled())
    expect(calls).toHaveLength(1)
  })
})
