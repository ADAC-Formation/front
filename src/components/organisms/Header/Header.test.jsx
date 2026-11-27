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

// D67 (suite) : le nom va sur l'accueil, « Envoyer un retour » en bas à droite de la page.
describe('SiteHeader — contenu de la rangée', () => {
  it.each(['SUPER_ADMIN', 'ADMIN', 'STAGIAIRE'])('n’affiche plus ni le nom ni « Envoyer un retour » pour %s', async (role) => {
    mockSession(role)
    mockNotificationApi()
    renderWithProviders(<SiteHeader />, { withSession: true })
    await screen.findByRole('button', { name: /Notifications/ })
    expect(screen.queryByRole('link', { name: /Dev/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Envoyer un retour' })).not.toBeInTheDocument()
  })

  it('garde déconnexion, cloche, mode sombre et accessibilité, dans cet ordre', async () => {
    mockSession('SUPER_ADMIN')
    mockNotificationApi()
    renderWithProviders(<SiteHeader />, { withSession: true })
    await screen.findByRole('button', { name: /Notifications/ })
    const names = screen.getAllByRole('button').map((button) => button.getAttribute('aria-label') ?? button.textContent)
    expect(names[0]).toBe('Se déconnecter')
    expect(names[1]).toMatch(/^Notifications/)
    expect(names.at(-1)).toBe("Options d'accessibilité")
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
    expect(within(row()).getByRole('button', { name: /^Notifications/ })).toBeInTheDocument()
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

  it('Échap ne replie pas la rangée quand le panneau des notifications est ouvert', async () => {
    await renderHeader()
    await scrollPageTo(400)
    await userEvent.click(bubble())
    await userEvent.click(screen.getByRole('button', { name: /^Notifications/ }))
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
