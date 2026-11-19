import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes, useLocation } from 'react-router'
import { axe } from 'jest-axe'
import { renderWithProviders } from '../../../test/render'
import { mockSession } from '../../../test/session'
import { STAGIAIRES, mockAccountList } from '../../../test/accounts'
import { mockFormationList } from '../../../test/formations'
import { STAGIAIRE_LEA, mockGroupPreview, mockSendGroupMessage } from '../../../test/messages'
import GroupMessagePage from './GroupMessagePage'

const marc = { id: 22, email: 'marc@adac.test', prenom: 'Marc', nom: 'Dubois', role: 'STAGIAIRE', isActive: true, emailNotificationsEnabled: true }
const RECIPIENTS = [STAGIAIRE_LEA, marc]

// Ce que `/messages` reçoit après un envoi : le nombre de destinataires passé dans l'état de navigation.
function MessagesLanding() {
  const { state } = useLocation()
  return <p>liste des messages, envoyé à {state?.groupSent ?? 'personne'}</p>
}

function renderPage(role = 'SUPER_ADMIN') {
  mockSession(role)
  mockFormationList()
  return renderWithProviders(
    <Routes>
      <Route path="/messages/groupe" element={<GroupMessagePage />} />
      <Route path="/messages" element={<MessagesLanding />} />
    </Routes>,
    { route: '/messages/groupe', withSession: true },
  )
}

const chooseFormation = async (name = 'Premiers secours PSC1') =>
  userEvent.selectOptions(await screen.findByRole('combobox', { name: 'Formation concernée' }), name)
const field = () => screen.getByLabelText('Message')
const sendButton = () => screen.getByRole('button', { name: /^Envoyer( à \d+ destinataires?)?$/ })

async function readyToSend(text = 'Bonjour à tous') {
  await chooseFormation()
  await screen.findByRole('button', { name: 'Envoyer à 2 destinataires' })
  await userEvent.type(field(), text)
}

describe('GroupMessagePage — structure', () => {
  it('affiche le titre « Message groupé » et un « Retour » vers /messages', async () => {
    mockGroupPreview(RECIPIENTS)
    renderPage()
    expect(await screen.findByRole('heading', { level: 1, name: 'Message groupé' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Retour' })).toHaveAttribute('href', '/messages')
  })

  it('propose les 3 filtres à la chargée de formation', async () => {
    renderPage('SUPER_ADMIN')
    expect(await screen.findAllByRole('radio')).toHaveLength(3)
    expect(screen.getByRole('radio', { name: 'Formation' })).toBeChecked()
  })

  it("propose un seul filtre (Formation) au formateur, avec ses formations seulement", async () => {
    renderPage('ADMIN')
    expect(await screen.findAllByRole('radio')).toHaveLength(1)
    const select = await screen.findByRole('combobox', { name: 'Formation concernée' })
    expect([...select.options].map((option) => option.textContent)).toEqual(['Choisir une formation', 'Premiers secours PSC1'])
  })
})

describe('GroupMessagePage — aperçu', () => {
  it("n'appelle pas l'aperçu avant le choix d'une formation et garde l'envoi désactivé", async () => {
    const calls = mockGroupPreview(RECIPIENTS)
    renderPage()
    await screen.findByRole('combobox', { name: 'Formation concernée' })
    expect(calls.count).toBe(0)
    expect(sendButton()).toBeDisabled()
    expect(screen.queryByRole('heading', { name: 'Destinataires' })).not.toBeInTheDocument()
  })

  it('choisir une formation charge et affiche les destinataires, par leur nom', async () => {
    const calls = mockGroupPreview(RECIPIENTS)
    renderPage()
    await chooseFormation()
    expect(await screen.findByText('Léa Petit')).toBeInTheDocument()
    expect(screen.getByText('Marc Dubois')).toBeInTheDocument()
    expect(calls.searches[0].get('filterType')).toBe('FORMATION')
    expect(calls.searches[0].get('formationId')).toBe('101')
    expect(screen.queryByText(/@adac\.test/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Envoyer à 2 destinataires' })).toBeInTheDocument()
  })

  it('« Documents manquants » charge l\'aperçu sans autre paramètre', async () => {
    const calls = mockGroupPreview(RECIPIENTS)
    renderPage()
    await userEvent.click(await screen.findByRole('radio', { name: 'Documents manquants' }))
    expect(await screen.findByText('Léa Petit')).toBeInTheDocument()
    expect([...calls.searches[0].keys()]).toEqual(['filterType'])
    expect(calls.searches[0].get('filterType')).toBe('MISSING_DOCS')
  })

  it('« Sélection libre » charge l\'aperçu avec les personnes cochées', async () => {
    const calls = mockGroupPreview([STAGIAIRE_LEA])
    mockAccountList('stagiaires', STAGIAIRES)
    renderPage()
    await userEvent.click(await screen.findByRole('radio', { name: 'Sélection libre' }))
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Léa Petit' }))
    await screen.findByRole('button', { name: 'Envoyer à 1 destinataire' })
    expect(calls.searches[0].getAll('userIds')).toEqual(['20'])
  })

  it('0 destinataire : « Aucun destinataire correspondant » et envoi désactivé', async () => {
    mockGroupPreview([])
    renderPage()
    await chooseFormation()
    expect(await screen.findByText('Aucun destinataire correspondant')).toBeInTheDocument()
    expect(sendButton()).toBeDisabled()
  })

  it('un 400 du back (aucun destinataire) se comporte comme une liste vide', async () => {
    mockGroupPreview([], { errorStatus: 400, errorMessage: 'Aucun destinataire' })
    renderPage()
    await chooseFormation()
    expect(await screen.findByText('Aucun destinataire correspondant')).toBeInTheDocument()
    expect(sendButton()).toBeDisabled()
  })
})

describe('GroupMessagePage — saisie du texte (H9)', () => {
  it('refuse un message vide sans ouvrir la confirmation ni appeler le back', async () => {
    mockGroupPreview(RECIPIENTS)
    const calls = mockSendGroupMessage(RECIPIENTS)
    renderPage()
    await chooseFormation()
    await userEvent.click(await screen.findByRole('button', { name: 'Envoyer à 2 destinataires' }))
    expect(await screen.findByText('Le message est obligatoire.')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(calls.count).toBe(0)
  })

  it('refuse un message de plus de 5000 caractères', async () => {
    mockGroupPreview(RECIPIENTS)
    const calls = mockSendGroupMessage(RECIPIENTS)
    renderPage()
    await chooseFormation()
    await screen.findByRole('button', { name: 'Envoyer à 2 destinataires' })
    fireEvent.change(field(), { target: { value: 'a'.repeat(5001) } })
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer à 2 destinataires' }))
    expect(await screen.findByText(/ne doit pas dépasser 5000 caractères/)).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(calls.count).toBe(0)
  })
})

describe('GroupMessagePage — confirmation et envoi', () => {
  it('ouvre une confirmation avec le nombre de personnes, sans rien envoyer encore', async () => {
    mockGroupPreview(RECIPIENTS)
    const calls = mockSendGroupMessage(RECIPIENTS)
    renderPage()
    await readyToSend()
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer à 2 destinataires' }))
    const dialog = await screen.findByRole('dialog', { name: 'Envoyer ce message à 2 personnes ?' })
    expect(dialog).toBeInTheDocument()
    expect(calls.count).toBe(0)
  })

  it('accorde la confirmation au singulier', async () => {
    mockGroupPreview([STAGIAIRE_LEA])
    mockSendGroupMessage([STAGIAIRE_LEA])
    renderPage()
    await chooseFormation()
    await userEvent.type(field(), 'Bonjour')
    await userEvent.click(await screen.findByRole('button', { name: 'Envoyer à 1 destinataire' }))
    expect(await screen.findByRole('dialog', { name: 'Envoyer ce message à 1 personne ?' })).toBeInTheDocument()
  })

  it('« Annuler » ferme la confirmation, sans appel, en gardant le texte', async () => {
    mockGroupPreview(RECIPIENTS)
    const calls = mockSendGroupMessage(RECIPIENTS)
    renderPage()
    await readyToSend('Texte à garder')
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer à 2 destinataires' }))
    await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Annuler' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(calls.count).toBe(0)
    expect(field()).toHaveValue('Texte à garder')
  })

  it('« Envoyer » poste { content, filter } une fois puis revient sur /messages avec le nombre de destinataires', async () => {
    mockGroupPreview(RECIPIENTS)
    const calls = mockSendGroupMessage(RECIPIENTS)
    renderPage()
    await readyToSend('Bonjour à tous')
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer à 2 destinataires' }))
    await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Envoyer' }))
    expect(await screen.findByText('liste des messages, envoyé à 2')).toBeInTheDocument()
    expect(calls.bodies).toEqual([{ content: 'Bonjour à tous', filter: { type: 'FORMATION', formationId: 101 } }])
  })

  it('un double clic sur « Envoyer » ne poste qu\'un seul message', async () => {
    mockGroupPreview(RECIPIENTS)
    const calls = mockSendGroupMessage(RECIPIENTS, { delayMs: 100 })
    renderPage()
    await readyToSend()
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer à 2 destinataires' }))
    await userEvent.dblClick(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Envoyer' }))
    await screen.findByText('liste des messages, envoyé à 2')
    expect(calls.count).toBe(1)
  })

  it.each([
    [403, "Vous n'avez pas le droit d'écrire à ce groupe."],
    [404, 'Formation ou stagiaire introuvable.'],
  ])('un %i du back ferme la confirmation, affiche l\'erreur et garde le texte', async (status, message) => {
    mockGroupPreview(RECIPIENTS)
    mockSendGroupMessage(RECIPIENTS, { errorStatus: status })
    renderPage()
    await readyToSend('Texte conservé')
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer à 2 destinataires' }))
    await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Envoyer' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(field()).toHaveValue('Texte conservé')
    expect(screen.queryByText(/liste des messages/)).not.toBeInTheDocument()
  })
})

describe('GroupMessagePage — accessibilité', () => {
  it('sans violation jest-axe, aperçu et texte affichés', async () => {
    mockGroupPreview(RECIPIENTS)
    const { container } = renderPage()
    await readyToSend()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('sans violation jest-axe avec la confirmation ouverte', async () => {
    mockGroupPreview(RECIPIENTS)
    const { container } = renderPage()
    await readyToSend()
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer à 2 destinataires' }))
    await screen.findByRole('dialog')
    await waitFor(async () => expect(await axe(container)).toHaveNoViolations())
  })
})
