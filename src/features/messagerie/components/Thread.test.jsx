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
    await waitFor(() => expect(calls.ids.length).toBe(2))
    expect([...calls.ids].sort()).toEqual([2, 3])
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(calls.count).toBe(2)
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
    const calls = mockMarkRead({ failIds: [2, 3], failOnce: true })
    render()
    await screen.findAllByRole('listitem')
    await waitFor(() => expect(calls.ids.length).toBe(2))
    window.dispatchEvent(new Event('visibilitychange'))
    await waitFor(() => expect(calls.ids.length).toBe(4))
    expect([...calls.ids].sort()).toEqual([2, 2, 3, 3])
  })

  it('affiche un message dont l’expéditeur est inconnu, sans planter', async () => {
    mockThread(10, [makeMessage({ id: 8, sender: null, recipients: [USERS.STAGIAIRE], content: 'Ancien message', readAt: '2026-11-02T10:00:00' })])
    render()
    expect(await screen.findByText('Ancien message')).toBeInTheDocument()
    expect(screen.getByText('Expéditeur inconnu')).toBeInTheDocument()
  })

  it('affiche le fil même quand le marquage échoue', async () => {
    mockThread(10)
    mockMarkRead({ failIds: [2, 3] })
    render()
    expect(await screen.findAllByRole('listitem')).toHaveLength(3)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
