import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { renderWithProviders } from '../../../test/render'
import { AccessibilityMenu } from './Accessibility'

const STORAGE_KEY = 'app-theme-preferences'

async function openMenu() {
  await userEvent.click(screen.getByRole('button', { name: "Options d'accessibilité" }))
}

describe('menu Accessibilité', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
  })

  it('« Taille du texte » pose et retire la classe text-large sur <html>', async () => {
    renderWithProviders(<AccessibilityMenu />)
    await openMenu()
    await userEvent.click(screen.getByRole('button', { name: /Taille du texte/ }))
    expect(document.documentElement).toHaveClass('text-large')
    await userEvent.click(screen.getByRole('button', { name: /Taille du texte/ }))
    expect(document.documentElement).not.toHaveClass('text-large')
  })

  it('« Contraste élevé » pose la classe high-contrast, aussi en mode sombre', async () => {
    document.documentElement.classList.add('dark')
    renderWithProviders(<AccessibilityMenu />)
    await openMenu()
    await userEvent.click(screen.getByRole('button', { name: /Contraste élevé/ }))
    expect(document.documentElement).toHaveClass('high-contrast')
  })

  it('le stockage ne contient que des préférences d’affichage (D31)', async () => {
    renderWithProviders(<AccessibilityMenu />)
    await openMenu()
    await userEvent.click(screen.getByRole('button', { name: /Taille du texte/ }))
    await userEvent.click(screen.getByRole('button', { name: /Contraste élevé/ }))
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    expect(Object.keys(stored).sort()).toEqual(['fontSize', 'highContrast', 'isDark'])
    expect(stored).toMatchObject({ fontSize: 'large', highContrast: true })
    expect(Object.keys(localStorage)).toEqual([STORAGE_KEY])
  })

  it('n’a aucune violation d’accessibilité (jest-axe)', async () => {
    const { container } = renderWithProviders(<AccessibilityMenu />)
    await openMenu()
    expect(await axe(container)).toHaveNoViolations()
  })
})
