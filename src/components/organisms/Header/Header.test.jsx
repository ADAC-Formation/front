import { act, fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { renderWithProviders } from '../../../test/render'
import { mockNoSession, mockSession } from '../../../test/session'
import { mockNotificationApi } from '../../../test/notifications'
import { SiteHeader } from './Header'

const settle = () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 150)) })

describe('SiteHeader — cloche de notifications', () => {
  it('affiche la cloche pour un utilisateur connecté', async () => {
    mockSession('STAGIAIRE')
    mockNotificationApi()
    renderWithProviders(<SiteHeader />, { withSession: true })
    expect(await screen.findByRole('button', { name: 'Notifications, 3 non lues' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Se déconnecter' })).toBeInTheDocument()
  })

  it('n’affiche aucune cloche ni appel /notifications pour un visiteur', async () => {
    mockNoSession()
    const calls = mockNotificationApi()
    renderWithProviders(<SiteHeader />, { withSession: true, route: '/login' })
    await settle()
    expect(screen.queryByRole('button', { name: /Notifications/ })).not.toBeInTheDocument()
    expect(calls.unread).toBe(0)
  })

  it('ne présente aucune violation jest-axe', async () => {
    mockSession('ADMIN')
    mockNotificationApi()
    const { container } = renderWithProviders(<SiteHeader />, { withSession: true })
    await screen.findByRole('button', { name: /Notifications, 3/ })
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('SiteHeader — bouton de retour', () => {
  it('place « Envoyer un retour » juste avant la cloche pour la chargée de formation', async () => {
    mockSession('SUPER_ADMIN')
    mockNotificationApi()
    renderWithProviders(<SiteHeader />, { withSession: true })

    const feedback = await screen.findByRole('button', { name: 'Envoyer un retour' })
    const bell = await screen.findByRole('button', { name: /Notifications/ })
    const buttons = screen.getAllByRole('button')
    expect(buttons.indexOf(feedback)).toBe(buttons.indexOf(bell) - 1)
  })

  it('n’affiche pas le bouton de retour pour un stagiaire', async () => {
    mockSession('STAGIAIRE')
    mockNotificationApi()
    renderWithProviders(<SiteHeader />, { withSession: true })
    await screen.findByRole('button', { name: /Notifications/ })
    expect(screen.queryByRole('button', { name: 'Envoyer un retour' })).not.toBeInTheDocument()
  })
})

describe('SiteHeader — nom de l’utilisateur', () => {
  it.each([
    ['SUPER_ADMIN', 'Chargée Dev', 'Chargée de formation'],
    ['ADMIN', 'Formateur Dev', 'Formateur'],
    ['STAGIAIRE', 'Stagiaire Dev', 'Stagiaire'],
  ])('affiche le nom et le rôle de %s sous le bandeau, avec un lien vers le profil', async (role, name, label) => {
    mockSession(role)
    mockNotificationApi()
    renderWithProviders(<SiteHeader />, { withSession: true })
    const link = await screen.findByRole('link', { name: new RegExp(`${name}`) })
    expect(link).toHaveAttribute('href', '/profile')
    expect(link).toHaveTextContent(label)
  })

  it('n’affiche aucun nom pour un visiteur', async () => {
    mockNoSession()
    mockNotificationApi()
    renderWithProviders(<SiteHeader />, { withSession: true, route: '/login' })
    await settle()
    expect(screen.queryByRole('link', { name: /Dev/ })).not.toBeInTheDocument()
  })
})

// NOTES-35 (D67) : sur ordinateur, l'en-tête se replie en bulle dès que la page a défilé ; sur téléphone et
// tablette (< 1024 px), il reste en haut de la page, sans bulle. jsdom n'a ni matchMedia ni défilement :
// on les simule.
describe('SiteHeader — bulle au défilement (NOTES-35)', () => {
  const realMatchMedia = window.matchMedia
  const setDesktop = (isDesktop) => {
    window.matchMedia = (query) => ({
      matches: query === '(min-width: 1024px)' ? isDesktop : false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })
  }
  const scrollPageTo = (y) =>
    act(() => {
      Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
      fireEvent.scroll(window)
    })
  const row = () => screen.getByRole('button', { name: 'Se déconnecter' }).closest('[data-header-row]')
  const bubble = () => screen.getByRole('button', { name: /^Menu de l'en-tête/ })
  const renderHeader = async (role = 'SUPER_ADMIN') => {
    mockSession(role)
    mockNotificationApi()
    const view = renderWithProviders(<SiteHeader />, { withSession: true })
    await screen.findByRole('button', { name: /Notifications, 3/ })
    return view
  }

  beforeEach(() => setDesktop(true))
  afterEach(async () => {
    window.matchMedia = realMatchMedia
    await scrollPageTo(0)
  })

  it('en haut de page : toute la rangée, sans bulle', async () => {
    await renderHeader()
    expect(screen.queryByRole('button', { name: /^Menu de l'en-tête/ })).not.toBeInTheDocument()
    expect(row()).not.toHaveAttribute('inert')
  })

  it('après défilement : une bulle fermée, la rangée repliée hors d’atteinte', async () => {
    await renderHeader()
    await scrollPageTo(400)
    expect(bubble()).toHaveAttribute('aria-expanded', 'false')
    expect(row()).toHaveAttribute('inert')
  })

  it('la bulle annonce les notifications non lues', async () => {
    await renderHeader()
    await scrollPageTo(400)
    expect(bubble()).toHaveAccessibleName("Menu de l'en-tête, 3 notifications non lues")
  })

  it('un clic sur la bulle déroule la rangée, qu’elle contrôle', async () => {
    await renderHeader()
    await scrollPageTo(400)
    await userEvent.click(bubble())
    expect(bubble()).toHaveAttribute('aria-expanded', 'true')
    expect(row()).not.toHaveAttribute('inert')
    expect(bubble()).toHaveAttribute('aria-controls', row().id)
    expect(within(row()).getByRole('link', { name: /Chargée Dev/ })).toBeInTheDocument()
  })

  it('reste déroulée pendant le défilement', async () => {
    await renderHeader()
    await scrollPageTo(400)
    await userEvent.click(bubble())
    await scrollPageTo(900)
    expect(bubble()).toHaveAttribute('aria-expanded', 'true')
  })

  it('Échap replie la rangée et rend le focus à la bulle', async () => {
    await renderHeader()
    await scrollPageTo(400)
    await userEvent.click(bubble())
    await userEvent.keyboard('{Escape}')
    expect(bubble()).toHaveAttribute('aria-expanded', 'false')
    expect(bubble()).toHaveFocus()
  })

  it('Échap ferme d’abord le menu d’accessibilité ouvert, sans replier la rangée', async () => {
    await renderHeader()
    await scrollPageTo(400)
    await userEvent.click(bubble())
    await userEvent.click(screen.getByRole('button', { name: "Options d'accessibilité" }))
    await userEvent.keyboard('{Escape}')
    expect(screen.getByRole('button', { name: "Options d'accessibilité" })).toHaveAttribute('aria-expanded', 'false')
    expect(bubble()).toHaveAttribute('aria-expanded', 'true')
  })

  it('un clic ailleurs dans la page replie la rangée', async () => {
    await renderHeader()
    await scrollPageTo(400)
    await userEvent.click(bubble())
    fireEvent.mouseDown(document.body)
    expect(bubble()).toHaveAttribute('aria-expanded', 'false')
  })

  it('revenir en haut de page déroule la rangée et retire la bulle', async () => {
    await renderHeader()
    await scrollPageTo(400)
    await scrollPageTo(0)
    expect(screen.queryByRole('button', { name: /^Menu de l'en-tête/ })).not.toBeInTheDocument()
    expect(row()).not.toHaveAttribute('inert')
  })

  // Une boîte de dialogue ou un panneau ouvert depuis la rangée y garde le focus : la replier les rendrait inertes.
  it('reste déroulée tant que le focus clavier est dans la rangée, puis se replie quand il en sort', async () => {
    await renderHeader()
    const logout = screen.getByRole('button', { name: 'Se déconnecter' })
    act(() => logout.focus())
    await scrollPageTo(400)
    expect(bubble()).toHaveAttribute('aria-expanded', 'true')
    expect(row()).not.toHaveAttribute('inert')
    expect(logout).toHaveFocus()
    act(() => logout.blur())
    expect(bubble()).toHaveAttribute('aria-expanded', 'false')
  })

  it('Échap ne replie pas la rangée quand la boîte « Envoyer un retour » est ouverte', async () => {
    await renderHeader()
    await scrollPageTo(400)
    await userEvent.click(bubble())
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer un retour' }))
    await screen.findByRole('dialog')
    await userEvent.keyboard('{Escape}')
    expect(row()).not.toHaveAttribute('inert')
  })

  it('téléphone et tablette : jamais de bulle, même après défilement', async () => {
    setDesktop(false)
    await renderHeader()
    await scrollPageTo(400)
    expect(screen.queryByRole('button', { name: /^Menu de l'en-tête/ })).not.toBeInTheDocument()
    expect(row()).not.toHaveAttribute('inert')
  })

  it('ne présente aucune violation jest-axe, bulle fermée puis ouverte', async () => {
    const { container } = await renderHeader()
    await scrollPageTo(400)
    expect(await axe(container)).toHaveNoViolations()
    await userEvent.click(bubble())
    expect(await axe(container)).toHaveNoViolations()
  })
})
