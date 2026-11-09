import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test/render'
import { mockSendMessage } from '../../../test/messages'
import MessageComposer from './MessageComposer'

const render = () => renderWithProviders(<MessageComposer recipientId={10} />, { route: '/messages/10' })
const field = () => screen.getByLabelText('Message')
const sendButton = () => screen.getByRole('button', { name: 'Envoyer' })

describe('MessageComposer', () => {
  it('propose un champ avec un libellé visible et un bouton « Envoyer »', () => {
    render()
    expect(field()).toBeInTheDocument()
    expect(field().tagName).toBe('TEXTAREA')
    expect(sendButton()).toBeInTheDocument()
  })

  it('envoie le message à un seul destinataire, vide le champ et annonce le succès', async () => {
    const calls = mockSendMessage()
    render()
    await userEvent.type(field(), 'Bonjour')
    await userEvent.click(sendButton())
    expect(await screen.findByRole('status')).toHaveTextContent('Message envoyé')
    expect(calls.bodies).toEqual([{ recipientIds: [10], content: 'Bonjour' }])
    expect(field()).toHaveValue('')
  })

  it.each([
    ['vide', ''],
    ['fait d\'espaces', '   \n  '],
  ])('refuse un message %s sans aucun appel', async (_label, value) => {
    const calls = mockSendMessage()
    render()
    if (value) await userEvent.type(field(), value)
    await userEvent.click(sendButton())
    expect(await screen.findByRole('alert')).toHaveTextContent('Le message est obligatoire.')
    expect(field()).toHaveAttribute('aria-invalid', 'true')
    expect(calls.count).toBe(0)
  })

  it('refuse plus de 5000 caractères sans aucun appel', async () => {
    const calls = mockSendMessage()
    render()
    fireEvent.change(field(), { target: { value: 'a'.repeat(5001) } })
    await userEvent.click(sendButton())
    expect(await screen.findByRole('alert')).toHaveTextContent('5000 caractères')
    expect(calls.count).toBe(0)
  })

  it('accepte exactement 5000 caractères', async () => {
    const calls = mockSendMessage()
    render()
    fireEvent.change(field(), { target: { value: 'a'.repeat(5000) } })
    await userEvent.click(sendButton())
    await waitFor(() => expect(calls.count).toBe(1))
  })

  it('la touche Entrée insère un saut de ligne et n\'envoie rien', async () => {
    const calls = mockSendMessage()
    render()
    await userEvent.type(field(), 'ligne un{Enter}ligne deux')
    expect(field()).toHaveValue('ligne un\nligne deux')
    expect(calls.count).toBe(0)
  })

  it('n\'affiche le compteur qu\'à l\'approche de la limite', async () => {
    render()
    expect(screen.queryByText(/caractères restants/)).not.toBeInTheDocument()
    fireEvent.change(field(), { target: { value: 'a'.repeat(4600) } })
    expect(await screen.findByText('400 caractères restants')).toBeInTheDocument()
  })

  it.each([
    [403, 'Vous ne pouvez pas écrire à cette personne.'],
    [404, 'Ce destinataire est introuvable.'],
  ])('traduit le %i du back et conserve le texte saisi', async (status, text) => {
    mockSendMessage({ errorStatus: status })
    render()
    await userEvent.type(field(), 'Bonjour')
    await userEvent.click(sendButton())
    expect(await screen.findByRole('alert')).toHaveTextContent(text)
    expect(field()).toHaveValue('Bonjour')
  })

  it('affiche le message du back pour les autres erreurs', async () => {
    mockSendMessage({ errorStatus: 500, errorMessage: 'Panne du serveur' })
    render()
    await userEvent.type(field(), 'Bonjour')
    await userEvent.click(sendButton())
    expect(await screen.findByRole('alert')).toHaveTextContent('Panne du serveur')
  })

  it('un double clic n\'envoie qu\'un seul message et désactive le bouton pendant l\'appel', async () => {
    const calls = mockSendMessage({ delayMs: 150 })
    render()
    await userEvent.type(field(), 'Bonjour')
    await userEvent.dblClick(sendButton())
    expect(sendButton()).toBeDisabled()
    await screen.findByRole('status')
    expect(calls.count).toBe(1)
  })

  it('efface l\'erreur après un envoi réussi', async () => {
    mockSendMessage()
    render()
    await userEvent.click(sendButton())
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    await userEvent.type(field(), 'Bonjour')
    await userEvent.click(sendButton())
    await screen.findByRole('status')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
