import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { mockChangePassword, mockUpdateProfile } from '../../../test/profile'
import { renderWithProviders } from '../../../test/render'
import { USERS, mockSession } from '../../../test/session'
import ChangePasswordForm from './ChangePasswordForm'
import EmailNotificationToggle from './EmailNotificationToggle'
import ProfileInfo from './ProfileInfo'

describe('ProfileInfo', () => {
  it('affiche prénom, nom, e-mail et rôle libellé, sans champ modifiable', () => {
    const { container } = renderWithProviders(<ProfileInfo user={USERS.STAGIAIRE} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Mes informations' })).toBeInTheDocument()
    expect(screen.getByText('Stagiaire Dev')).toBeInTheDocument()
    expect(screen.getByText('stagiaire@adac.test')).toBeInTheDocument()
    expect(screen.getByText('Stagiaire', { selector: 'dd' })).toBeInTheDocument()
    expect(container.querySelector('input')).toBeNull()
  })

  it('libelle le rôle de la chargée de formation', () => {
    renderWithProviders(<ProfileInfo user={USERS.SUPER_ADMIN} />)
    expect(screen.getByText('Chargée de formation')).toBeInTheDocument()
  })

  it('rend un nom contenant du HTML en texte', () => {
    const { container } = renderWithProviders(<ProfileInfo user={{ ...USERS.ADMIN, prenom: '<img src=x onerror=alert(1)>' }} />)
    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByText(/<img src=x onerror=alert\(1\)>/)).toBeInTheDocument()
  })
})

describe('EmailNotificationToggle', () => {
  function renderToggle(user = USERS.STAGIAIRE, options) {
    mockSession('STAGIAIRE')
    const api = mockUpdateProfile(user, options)
    renderWithProviders(<EmailNotificationToggle />, { withSession: true })
    return api
  }

  it('reprend l’état de la session et explique que les e-mails de sécurité sont toujours envoyés', async () => {
    renderToggle()
    const toggle = await screen.findByRole('switch', { name: 'Recevoir les notifications par e-mail' })
    expect(toggle).toBeChecked()
    expect(screen.getByText(/e-mails de sécurité \(activation, réinitialisation\) sont toujours envoyés/)).toBeInTheDocument()
  })

  it('enregistre le changement tout de suite et l’annonce', async () => {
    const api = renderToggle()
    await userEvent.click(await screen.findByRole('switch', { name: 'Recevoir les notifications par e-mail' }))
    await waitFor(() => expect(api.patched).toEqual([{ emailNotificationsEnabled: false }]))
    expect(await screen.findByRole('status')).toHaveTextContent('Préférences enregistrées')
    expect(screen.getByRole('switch')).not.toBeChecked()
  })

  it('revient à l’état précédent et annonce l’erreur quand le back refuse', async () => {
    renderToggle(USERS.STAGIAIRE, { error: { status: 500, message: 'Service indisponible' } })
    await userEvent.click(await screen.findByRole('switch', { name: 'Recevoir les notifications par e-mail' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Service indisponible')
    await waitFor(() => expect(screen.getByRole('switch')).toBeChecked())
    expect(screen.queryByText('Préférences enregistrées')).not.toBeInTheDocument()
  })

  it('n’a aucune violation jest-axe', async () => {
    mockSession('STAGIAIRE')
    const { container } = renderWithProviders(<EmailNotificationToggle />, { withSession: true })
    await screen.findByRole('switch')
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('ChangePasswordForm', () => {
  const fill = async (actuel, nouveau, confirmation) => {
    if (actuel) await userEvent.type(screen.getByLabelText('Mot de passe actuel'), actuel)
    if (nouveau) await userEvent.type(screen.getByLabelText('Nouveau mot de passe'), nouveau)
    if (confirmation) await userEvent.type(screen.getByLabelText('Confirmation du mot de passe'), confirmation)
    await userEvent.click(screen.getByRole('button', { name: 'Changer le mot de passe' }))
  }

  it('valide les champs sans appeler le back', async () => {
    const api = mockChangePassword()
    renderWithProviders(<ChangePasswordForm />)
    await fill()
    expect(await screen.findAllByText(/.+/, { selector: '[id$="-error"]' })).not.toHaveLength(0)
    expect(api.changed).toEqual([])
  })

  it('refuse un nouveau mot de passe qui ne respecte pas les règles ou ne correspond pas', async () => {
    const api = mockChangePassword()
    renderWithProviders(<ChangePasswordForm />)
    await fill('Ancien1234', 'court', 'autre')
    expect(await screen.findByText(/au moins 8 caractères/i)).toBeInTheDocument()
    expect(api.changed).toEqual([])
  })

  it('envoie ancien et nouveau mot de passe, annonce le succès et vide les champs', async () => {
    const api = mockChangePassword()
    renderWithProviders(<ChangePasswordForm />)
    await fill('Ancien1234', 'Nouveau1234', 'Nouveau1234')
    expect(await screen.findByRole('status')).toHaveTextContent('Mot de passe modifié')
    expect(api.changed).toEqual([{ oldPassword: 'Ancien1234', newPassword: 'Nouveau1234' }])
    expect(screen.getByLabelText('Mot de passe actuel')).toHaveValue('')
    expect(screen.getByLabelText('Nouveau mot de passe')).toHaveValue('')
    expect(screen.getByLabelText('Confirmation du mot de passe')).toHaveValue('')
  })

  it('affiche le message du back (401) et vide les champs', async () => {
    mockChangePassword({ error: { status: 401, message: 'Ancien mot de passe incorrect' } })
    renderWithProviders(<ChangePasswordForm />)
    await fill('Mauvais1234', 'Nouveau1234', 'Nouveau1234')
    expect(await screen.findByRole('alert')).toHaveTextContent('Ancien mot de passe incorrect')
    expect(screen.getByLabelText('Nouveau mot de passe')).toHaveValue('')
  })

  it('propose « Mot de passe actuel oublié ? » vers la réinitialisation', () => {
    renderWithProviders(<ChangePasswordForm />)
    expect(screen.getByRole('link', { name: 'Mot de passe actuel oublié ?' })).toHaveAttribute('href', '/mot-de-passe-oublie')
  })

  it('n’a aucune violation jest-axe', async () => {
    const { container } = renderWithProviders(<ChangePasswordForm />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
