import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test/render'
import { USERS, mockSession } from '../../../test/session'
import { FORMATEUR_ANNE, THREAD, makeMessage, mockConversations, mockMarkRead, mockThread } from '../../../test/messages'
import { cssSheets, stripComments } from '../../../test/css-sheets'
import Thread from './Thread'

const render = (props) => renderWithProviders(<Thread userId={10} {...props} />, { route: '/messages/10' })

describe('Thread', () => {
  beforeEach(() => {
    mockSession('STAGIAIRE')
    mockConversations()
    mockMarkRead()
  })

  it('annonce le chargement puis affiche les messages du plus ancien au plus récent', async () => {
    mockThread(10)
    render()
    expect(screen.getByRole('status')).toHaveTextContent('Chargement')
    const items = await screen.findAllByRole('listitem')
    expect(items).toHaveLength(3)
    expect(within(items[0]).getByText('Bonjour, une question.')).toBeInTheDocument()
    expect(within(items[2]).getByText('Rendez-vous lundi ?')).toBeInTheDocument()
  })

  // NOTES-34 (A7, WCAG 2.1.1) : le fil défile seul ; sans élément focalisable, le clavier ne pouvait pas le faire défiler.
  it('la liste des messages est atteignable au clavier pour la faire défiler', async () => {
    mockThread(10)
    render()
    const list = await screen.findByRole('list', { name: 'Messages' })
    expect(list).toHaveAttribute('tabindex', '0')
  })

  it('indique l\'auteur par du texte (« Vous » ou le nom) et la date', async () => {
    mockThread(10)
    render()
    const items = await screen.findAllByRole('listitem')
    expect(within(items[0]).getByText('Vous')).toBeInTheDocument()
    expect(within(items[1]).getByText('Anne Martin')).toBeInTheDocument()
    expect(within(items[1]).getByText(/2 nov/)).toBeInTheDocument()
  })

  it('affiche le contenu en texte, jamais en HTML', async () => {
    const hostile = makeMessage({ id: 5, sender: FORMATEUR_ANNE, recipients: [USERS.STAGIAIRE], content: '<script>alert(1)</script>', readAt: '2026-11-02T10:00:00' })
    mockThread(10, [hostile])
    const { container } = render()
    expect(await screen.findByText('<script>alert(1)</script>')).toBeInTheDocument()
    expect(container.querySelector('script')).toBeNull()
  })

  it('conserve les sauts de ligne (white-space: pre-wrap)', () => {
    const css = stripComments(cssSheets['src/features/messagerie/components/Thread.module.css'])
    expect(css).toMatch(/white-space:\s*pre-wrap/)
  })

  it('invite à écrire le premier message quand le fil est vide', async () => {
    mockThread(10, [])
    render()
    expect(await screen.findByText(/Aucun message/)).toBeInTheDocument()
  })

  it('affiche une erreur annoncée avec « Réessayer »', async () => {
    mockThread(10, [], { errorStatus: 500 })
    render()
    expect(await screen.findByRole('alert')).toHaveTextContent('fil de discussion')
    mockThread(10)
    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }))
    expect(await screen.findAllByRole('listitem')).toHaveLength(3)
  })

  it('marque les messages reçus non lus comme lus, une seule fois', async () => {
    mockThread(10)
    const calls = mockMarkRead()
    render()
    await screen.findAllByRole('listitem')
    await waitFor(() => expect(calls.count).toBe(1))
    expect(calls.conversationIds).toEqual([10])
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(calls.count).toBe(1)
  })

  it('marque de nouveau, en un appel, quand un message non lu arrive pendant que le fil est ouvert', async () => {
    mockThread(10)
    const calls = mockMarkRead()
    render()
    await waitFor(() => expect(calls.count).toBe(1))
    const arrived = makeMessage({ id: 4, sender: FORMATEUR_ANNE, recipients: [USERS.STAGIAIRE], content: 'Nouveau', createdAt: '2026-11-02T11:00:00' })
    mockThread(10, [...THREAD, arrived])
    window.dispatchEvent(new Event('visibilitychange'))
    expect(await screen.findByText('Nouveau')).toBeInTheDocument()
    await waitFor(() => expect(calls.count).toBe(2))
    expect(calls.conversationIds).toEqual([10, 10])
  })

  it('ne marque rien quand tout est lu', async () => {
    mockThread(10, THREAD.map((m) => ({ ...m, readAt: '2026-11-02T11:00:00' })))
    const calls = mockMarkRead()
    render()
    await screen.findAllByRole('listitem')
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(calls.count).toBe(0)
  })

  it('réessaie au rechargement suivant un marquage qui avait échoué', async () => {
    mockThread(10)
    const calls = mockMarkRead({ errorStatus: 500, failOnce: true })
    render()
    await screen.findAllByRole('listitem')
    await waitFor(() => expect(calls.count).toBe(1))
    window.dispatchEvent(new Event('visibilitychange'))
    await waitFor(() => expect(calls.count).toBe(2))
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(calls.count).toBe(2)
  })

  it('affiche un message dont l’expéditeur est inconnu, sans planter', async () => {
    mockThread(10, [makeMessage({ id: 8, sender: null, recipients: [USERS.STAGIAIRE], content: 'Ancien message', readAt: '2026-11-02T10:00:00' })])
    render()
    expect(await screen.findByText('Ancien message')).toBeInTheDocument()
    expect(screen.getByText('Expéditeur inconnu')).toBeInTheDocument()
  })

  it('affiche le fil même quand le marquage échoue', async () => {
    mockThread(10)
    mockMarkRead({ errorStatus: 500 })
    render()
    expect(await screen.findAllByRole('listitem')).toHaveLength(3)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  describe('message groupé (H15)', () => {
    const lea = { id: 20, email: 'lea@adac.test', prenom: 'Léa', nom: 'Petit', role: 'STAGIAIRE', isActive: true }
    const marc = { id: 22, email: 'marc@adac.test', prenom: 'Marc', nom: 'Dubois', role: 'STAGIAIRE', isActive: true }
    const groupMessage = makeMessage({
      id: 50,
      sender: FORMATEUR_ANNE,
      recipients: [USERS.STAGIAIRE, lea, marc],
      content: 'Rappel pour tous',
      createdAt: '2026-11-03T08:00:00',
      isGroup: true,
    })

    it('signale un message groupé par la mention texte « Message groupé »', async () => {
      mockThread(10, [...THREAD, groupMessage])
      render()
      const items = await screen.findAllByRole('listitem')
      expect(within(items[3]).getByText('Message groupé')).toBeInTheDocument()
    })

    it('ne met la mention que sur les messages groupés', async () => {
      mockThread(10, [...THREAD, groupMessage])
      render()
      await screen.findAllByRole('listitem')
      expect(screen.getAllByText('Message groupé')).toHaveLength(1)
    })

    it("n'affiche jamais les destinataires d'un message groupé (ni nom ni e-mail)", async () => {
      mockThread(10, [...THREAD, groupMessage])
      render()
      await screen.findAllByRole('listitem')
      expect(screen.queryByText('Léa Petit')).not.toBeInTheDocument()
      expect(screen.queryByText('Marc Dubois')).not.toBeInTheDocument()
      expect(screen.queryByText(/@adac\.test/)).not.toBeInTheDocument()
    })
  })
})
