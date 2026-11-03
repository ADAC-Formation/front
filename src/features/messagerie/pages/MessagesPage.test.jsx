import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router'
import { axe } from 'jest-axe'
import { cssSheets, stripComments } from '../../../test/css-sheets'
import { renderWithProviders } from '../../../test/render'
import { server } from '../../../test/msw/server'
import { API_URL, mockSession } from '../../../test/session'
import { FORMATIONS, mockFormationList } from '../../../test/formations'
import { FORMATEURS, STAGIAIRES, mockAccountList } from '../../../test/accounts'
import {
  CONVERSATIONS,
  FORMATEUR_ANNE,
  mockConversations,
  mockMarkRead,
  mockSendMessage,
  mockThread,
} from '../../../test/messages'
import MessagesPage from './MessagesPage'

function renderPage(route) {
  return renderWithProviders(
    <Routes>
      <Route path="/messages" element={<MessagesPage />} />
      <Route path="/messages/:userId" element={<MessagesPage />} />
    </Routes>,
    { route },
  )
}

const threadPane = () => within(screen.getByRole('region', { name: 'Fil de discussion' }))

// Le stagiaire connecté est inscrit à une formation d'Anne (id 10) : il peut lui écrire.
const withAnneAsFormateur = () =>
  mockFormationList([{ ...FORMATIONS[0], formateur: FORMATEUR_ANNE }])

describe('MessagesPage — liste', () => {
  beforeEach(() => {
    mockSession('STAGIAIRE')
    mockConversations()
    withAnneAsFormateur()
  })

  it('affiche le titre « Messages », la liste des conversations et « Nouvelle conversation »', async () => {
    renderPage('/messages')
    expect(screen.getByRole('heading', { level: 1, name: 'Messages' })).toBeInTheDocument()
    expect(await screen.findByText('Anne Martin')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nouvelle conversation' })).toBeInTheDocument()
  })

  it('invite à choisir une conversation dans le volet du fil', async () => {
    renderPage('/messages')
    expect(await screen.findByText('Sélectionnez une conversation pour afficher les messages.')).toBeInTheDocument()
  })

  it('propose « Nouvelle conversation » dans l\'état vide', async () => {
    mockConversations([])
    renderPage('/messages')
    expect(await screen.findByText('Aucune conversation pour le moment')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Nouvelle conversation' }).length).toBeGreaterThan(0)
  })

  it('n\'a aucune violation d\'accessibilité', async () => {
    const { container } = renderPage('/messages')
    await screen.findByText('Anne Martin')
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('MessagesPage — gabarit des autres pages', () => {
  beforeEach(() => {
    mockSession('STAGIAIRE')
    mockConversations()
    withAnneAsFormateur()
  })

  it('propose « Retour » vers le tableau de bord, comme les autres pages', async () => {
    renderPage('/messages')
    expect(screen.getByRole('link', { name: 'Retour' })).toHaveAttribute('href', '/')
    await screen.findByText('Anne Martin')
  })

  it('place « Nouvelle conversation » dans l\'en-tête, à côté du titre', async () => {
    renderPage('/messages')
    const header = screen.getByRole('heading', { level: 1, name: 'Messages' }).parentElement
    expect(within(header).getByRole('button', { name: 'Nouvelle conversation' })).toBeInTheDocument()
    await screen.findByText('Anne Martin')
  })

  it('le bouton ouvre puis ferme le panneau des destinataires', async () => {
    renderPage('/messages')
    const toggle = screen.getByRole('button', { name: 'Nouvelle conversation' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    const panel = await screen.findByRole('region', { name: 'Nouvelle conversation' })
    await userEvent.click(within(panel).getByRole('button', { name: 'Fermer' }))
    expect(screen.queryByRole('region', { name: 'Nouvelle conversation' })).not.toBeInTheDocument()
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await screen.findByText('Anne Martin')
  })

  it('propose les filtres « Toutes » et « Non lues » sous le titre', async () => {
    renderPage('/messages')
    const filters = screen.getByRole('group', { name: 'Conversations affichées' })
    expect(within(filters).getByRole('radio', { name: 'Toutes' })).toBeChecked()
    expect(within(filters).getByRole('radio', { name: 'Non lues' })).not.toBeChecked()
    await screen.findByText('Anne Martin')
  })

  it('« Non lues » ne garde que les conversations avec des messages non lus', async () => {
    renderPage('/messages')
    await screen.findByText('Chargée Dev')
    await userEvent.click(screen.getByRole('radio', { name: 'Non lues' }))
    expect(screen.queryByText('Chargée Dev')).not.toBeInTheDocument()
    expect(screen.getByText('Anne Martin')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('radio', { name: 'Toutes' }))
    expect(await screen.findByText('Chargée Dev')).toBeInTheDocument()
  })

  it('propose une recherche par nom et un filtre par rôle, comme les pages de comptes', async () => {
    renderPage('/messages')
    expect(screen.getByRole('searchbox', { name: 'Rechercher une personne' })).toBeInTheDocument()
    const role = screen.getByRole('combobox', { name: /^Rôle/ })
    expect(within(role).getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Tous les rôles',
      'Chargée de formation',
      'Formateur',
      'Stagiaire',
    ])
    await screen.findByText('Anne Martin')
  })

  it('la recherche filtre la liste au fil de la saisie', async () => {
    renderPage('/messages')
    await screen.findByText('Chargée Dev')
    await userEvent.type(screen.getByRole('searchbox', { name: 'Rechercher une personne' }), 'anne')
    expect(screen.queryByText('Chargée Dev')).not.toBeInTheDocument()
    expect(screen.getByText('Anne Martin')).toBeInTheDocument()
    expect(screen.getByText('1 conversation')).toBeInTheDocument()
  })

  it('le filtre par rôle ne garde que ce rôle', async () => {
    renderPage('/messages')
    await screen.findByText('Chargée Dev')
    await userEvent.selectOptions(screen.getByRole('combobox', { name: /^Rôle/ }), 'ADMIN')
    expect(screen.queryByText('Chargée Dev')).not.toBeInTheDocument()
    expect(screen.getByText('Anne Martin')).toBeInTheDocument()
  })

  it('combine recherche, rôle et « Non lues »', async () => {
    renderPage('/messages')
    await screen.findByText('Chargée Dev')
    await userEvent.click(screen.getByRole('radio', { name: 'Non lues' }))
    await userEvent.selectOptions(screen.getByRole('combobox', { name: /^Rôle/ }), 'SUPER_ADMIN')
    expect(await screen.findByText(/Aucune conversation non lue|Aucune conversation trouvée/)).toBeInTheDocument()
    expect(screen.queryByText('Anne Martin')).not.toBeInTheDocument()
  })

  it('n\'a aucune violation d\'accessibilité avec la barre d\'outils', async () => {
    const { container } = renderPage('/messages')
    await screen.findByText('Anne Martin')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('la liste des conversations est dans une carte arrondie (comme les autres pages)', () => {
    const css = stripComments(cssSheets['src/features/messagerie/pages/MessagesPage.module.css'])
    expect(css).toMatch(/\.listPane[^{]*\{[^}]*border:\s*1px solid var\(--border\)/)
    expect(css).toMatch(/\.listPane[^{]*\{[^}]*border-radius:\s*30px/)
  })

  it('le bouton d\'action reprend le style des pages de comptes (--color-action, en haut à droite)', () => {
    const css = stripComments(cssSheets['src/features/messagerie/pages/MessagesPage.module.css'])
    expect(css).toMatch(/\.createButton\s*\{[^}]*background-color:\s*var\(--color-action\)/)
    expect(css).toMatch(/\.header\s*\{[^}]*justify-content:\s*space-between/)
  })
})

describe('MessagesPage — fil', () => {
  beforeEach(() => {
    mockSession('STAGIAIRE')
    mockConversations()
    mockMarkRead()
  })

  it('affiche le nom de l\'interlocuteur, ses messages et la saisie quand on peut lui écrire', async () => {
    withAnneAsFormateur()
    mockThread(10)
    renderPage('/messages/10')
    expect(await screen.findByRole('heading', { level: 2, name: 'Anne Martin' })).toBeInTheDocument()
    expect(await threadPane().findByText('Rendez-vous lundi ?')).toBeInTheDocument()
    expect(await screen.findByLabelText('Message')).toBeInTheDocument()
  })

  it('un message envoyé arrive dans le fil et la saisie est vidée', async () => {
    withAnneAsFormateur()
    const calls = mockSendMessage()
    mockThread(10)
    renderPage('/messages/10')
    await userEvent.type(await screen.findByLabelText('Message'), 'Merci')
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer' }))
    expect(await screen.findByText('Message envoyé')).toBeInTheDocument()
    expect(calls.bodies).toEqual([{ recipientIds: [10], content: 'Merci' }])
  })

  it('fil existant avec une personne hors destinataires : lecture seule avec avis', async () => {
    mockFormationList([]) // plus aucun formateur : Anne n'est plus autorisée
    mockThread(10)
    renderPage('/messages/10')
    expect(await threadPane().findByText('Rendez-vous lundi ?')).toBeInTheDocument()
    expect(await screen.findByText('Vous ne pouvez pas écrire à cette personne')).toBeInTheDocument()
    expect(screen.queryByLabelText('Message')).not.toBeInTheDocument()
  })

  it('aucun fil et hors destinataires : « Conversation introuvable » avec Retour', async () => {
    mockFormationList([])
    mockThread(999, [])
    renderPage('/messages/999')
    expect(await screen.findByText('Conversation introuvable')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Retour aux conversations' })).toHaveAttribute('href', '/messages')
    expect(screen.queryByLabelText('Message')).not.toBeInTheDocument()
  })

  it('un fil absent du back (404) hors destinataires est aussi introuvable', async () => {
    mockFormationList([])
    mockThread(999, [], { errorStatus: 404 })
    renderPage('/messages/999')
    expect(await screen.findByText('Conversation introuvable')).toBeInTheDocument()
  })

  it('aucun fil mais destinataire autorisé : fil vide et saisie pour écrire le premier message', async () => {
    withAnneAsFormateur()
    mockThread(10, [])
    renderPage('/messages/10')
    expect(await screen.findByText(/Aucun message pour le moment/)).toBeInTheDocument()
    expect(await screen.findByLabelText('Message')).toBeInTheDocument()
  })

  it('annonce la vérification des droits tant que les destinataires chargent', async () => {
    withAnneAsFormateur()
    mockThread(10)
    renderPage('/messages/10')
    expect(await screen.findByText('Vérification des droits d\'écriture…')).toBeInTheDocument()
  })

  it('propose « Retour aux conversations » vers la liste', async () => {
    withAnneAsFormateur()
    mockThread(10)
    renderPage('/messages/10')
    expect(await screen.findByRole('link', { name: 'Retour aux conversations' })).toHaveAttribute('href', '/messages')
  })

  it('n\'a aucune violation d\'accessibilité', async () => {
    withAnneAsFormateur()
    mockThread(10)
    const { container } = renderPage('/messages/10')
    await screen.findByLabelText('Message')
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('MessagesPage — nouvelle conversation', () => {
  it('stagiaire : propose les formateurs de ses formations, puis ouvre le fil choisi', async () => {
    mockSession('STAGIAIRE')
    mockConversations([])
    withAnneAsFormateur()
    mockThread(10)
    mockMarkRead()
    renderPage('/messages')
    await userEvent.click(await screen.findByRole('button', { name: 'Nouvelle conversation' }))
    const picker = await screen.findByRole('region', { name: 'Nouvelle conversation' })
    const link = await within(picker).findByRole('link', { name: /Anne Martin/ })
    expect(link).toHaveAttribute('href', '/messages/10')
    await userEvent.click(link)
    expect(await screen.findByRole('heading', { level: 2, name: 'Anne Martin' })).toBeInTheDocument()
  })

  it('chargée de formation : propose les formateurs et stagiaires actifs, avec leur rôle', async () => {
    mockSession('SUPER_ADMIN')
    mockConversations([])
    mockAccountList('formateurs', FORMATEURS)
    mockAccountList('stagiaires', STAGIAIRES)
    renderPage('/messages')
    await userEvent.click(await screen.findByRole('button', { name: 'Nouvelle conversation' }))
    const picker = await screen.findByRole('region', { name: 'Nouvelle conversation' })
    const links = await within(picker).findAllByRole('link')
    expect(links.map((a) => a.textContent)).toEqual(['Anne Martin — Formateur', 'Léa Petit — Stagiaire'])
  })

  it('formateur sans aucun destinataire connu : message explicite', async () => {
    mockSession('ADMIN')
    mockConversations([])
    mockAccountList('stagiaires', [])
    renderPage('/messages')
    await userEvent.click(await screen.findByRole('button', { name: 'Nouvelle conversation' }))
    expect(await screen.findByText('Aucun destinataire disponible pour le moment.')).toBeInTheDocument()
  })

  it('ne charge aucun destinataire avant d\'ouvrir « Nouvelle conversation »', async () => {
    mockSession('SUPER_ADMIN')
    mockConversations(CONVERSATIONS)
    const formateurs = mockAccountList('formateurs', FORMATEURS)
    const stagiaires = mockAccountList('stagiaires', STAGIAIRES)
    renderPage('/messages')
    await screen.findByText('Anne Martin')
    await new Promise((resolve) => setTimeout(resolve, 80))
    expect(formateurs.count + stagiaires.count).toBe(0)
  })

  it('signale une erreur de chargement des destinataires avec « Réessayer »', async () => {
    mockSession('STAGIAIRE')
    mockConversations([])
    mockFormationList([])
    server.use(http.get(`${API_URL}/formations`, () => HttpResponse.json({ status: 500, message: 'x', details: [] }, { status: 500 })))
    renderPage('/messages')
    await userEvent.click(await screen.findByRole('button', { name: 'Nouvelle conversation' }))
    expect(await screen.findByText('Impossible de charger les destinataires.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeInTheDocument()
  })
})
