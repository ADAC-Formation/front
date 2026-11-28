import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { LEGAL_INFO } from '../../legal/legalInfo'
import { mockChangePassword } from '../../../test/profile'
import { renderWithProviders } from '../../../test/render'
import { USERS } from '../../../test/session'
import ChangePasswordForm from './ChangePasswordForm'
import PersonalDataSection from './PersonalDataSection'
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

describe('PersonalDataSection', () => {
  it('affiche le contact fourni par l’ADAC, sans mention « à renseigner »', () => {
    const original = { ...LEGAL_INFO }
    Object.assign(LEGAL_INFO, { privacyContact: 'rgpd@adac.test' })
    try {
      renderWithProviders(<PersonalDataSection />)
      expect(screen.getByText('rgpd@adac.test')).toBeInTheDocument()
      expect(screen.queryByText('À renseigner par l’ADAC')).not.toBeInTheDocument()
    } finally {
      Object.assign(LEGAL_INFO, original)
    }
  })

  it('n’a aucune violation jest-axe', async () => {
    const { container } = renderWithProviders(<PersonalDataSection />)
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

  // Contrat réel (tech.md, PATCH /users/me/password, mergé dans le back : PR #18) : 204 ; 400 règle du mot de passe ;
  // 403 ancien mot de passe faux (volontairement pas 401, qui veut dire « session expirée ») ; 429 verrou après
  // 5 ancien mots de passe erronés en 15 min. Le formulaire affiche le message du back dans tous les cas.
  it.each([
    [403, 'Ancien mot de passe incorrect'],
    [429, 'Trop de tentatives. Réessayez dans 15 minutes.'],
    [400, 'Le nouveau mot de passe ne respecte pas la règle'],
  ])('affiche le message du back (%i) et vide les champs', async (status, message) => {
    mockChangePassword({ error: { status, message } })
    renderWithProviders(<ChangePasswordForm />)
    await fill('Mauvais1234', 'Nouveau1234', 'Nouveau1234')
    expect(await screen.findByRole('alert')).toHaveTextContent(message)
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
