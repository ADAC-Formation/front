import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { renderWithProviders } from '../../../test/render'
import { AccessibilityMenu } from './Accessibility'

const STORAGE_KEY = 'app-theme-preferences'
const html = () => document.documentElement

async function openMenu() {
  await userEvent.click(screen.getByRole('button', { name: "Options d'accessibilité" }))
}
const click = (name) => userEvent.click(screen.getByRole('button', { name }))

describe('menu Accessibilité', () => {
  beforeEach(() => {
    localStorage.clear()
    html().className = ''
  })

  it('propose les mêmes options que le site ADAC', async () => {
    renderWithProviders(<AccessibilityMenu />)
    await openMenu()
    for (const name of [
      'Augmenter le texte', 'Diminuer le texte', 'Niveau de gris', 'Haut contraste',
      'Contraste négatif', 'Arrière-plan clair', 'Liens soulignés', 'Police lisible', 'Réinitialiser',
    ]) {
      expect(screen.getByRole('button', { name: new RegExp(name) })).toBeInTheDocument()
    }
    expect(screen.getByRole('link', { name: /Plan de site/ })).toHaveAttribute('href', '/plan-du-site')
    expect(screen.getByRole('link', { name: /Retour d'expérience/ })).toHaveAttribute(
      'href',
      'https://www.adac.asso.fr/contact-nouvelle-version/',
    )
  })

  it('Augmenter / Diminuer le texte avance par paliers et s’arrête aux bornes', async () => {
    renderWithProviders(<AccessibilityMenu />)
    await openMenu()
    expect(screen.getByRole('button', { name: /Diminuer le texte/ })).toBeDisabled()
    await click(/Augmenter le texte/)
    expect(html()).toHaveClass('text-step-1')
    await click(/Augmenter le texte/)
    await click(/Augmenter le texte/)
    expect(html()).toHaveClass('text-step-3')
    expect(screen.getByRole('button', { name: /Augmenter le texte/ })).toBeDisabled()
    await click(/Diminuer le texte/)
    expect(html()).toHaveClass('text-step-2')
    expect(html()).not.toHaveClass('text-step-3')
  })

  it.each([
    ['Niveau de gris', 'grayscale'],
    ['Haut contraste', 'high-contrast'],
    ['Contraste négatif', 'negative-contrast'],
    ['Arrière-plan clair', 'light-background'],
    ['Liens soulignés', 'underline-links'],
    ['Police lisible', 'readable-font'],
  ])('« %s » pose puis retire la classe %s et indique son état', async (label, className) => {
    renderWithProviders(<AccessibilityMenu />)
    await openMenu()
    const button = () => screen.getByRole('button', { name: new RegExp(label) })
    expect(button()).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(button())
    expect(html()).toHaveClass(className)
    expect(button()).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(button())
    expect(html()).not.toHaveClass(className)
  })

  it('Haut contraste fonctionne aussi en mode sombre', async () => {
    html().classList.add('dark')
    renderWithProviders(<AccessibilityMenu />)
    await openMenu()
    await click(/Haut contraste/)
    expect(html()).toHaveClass('high-contrast')
  })

  it('Réinitialiser retire toutes les options sauf le mode sombre', async () => {
    renderWithProviders(<AccessibilityMenu />)
    await openMenu()
    await click(/Augmenter le texte/)
    await click(/Niveau de gris/)
    await click(/Police lisible/)
    await click(/Réinitialiser/)
    for (const c of ['text-step-1', 'grayscale', 'readable-font']) expect(html()).not.toHaveClass(c)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toMatchObject({ fontStep: 0, grayscale: false })
  })

  it('le stockage ne contient que des préférences d’affichage (D31)', async () => {
    renderWithProviders(<AccessibilityMenu />)
    await openMenu()
    await click(/Augmenter le texte/)
    await click(/Haut contraste/)
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    expect(Object.keys(stored).sort()).toEqual([
      'fontStep', 'grayscale', 'highContrast', 'isDark', 'lightBackground',
      'negativeContrast', 'readableFont', 'underlineLinks',
    ])
    expect(stored).toMatchObject({ fontStep: 1, highContrast: true })
    expect(Object.keys(localStorage)).toEqual([STORAGE_KEY])
  })

  it('migre l’ancienne préférence « grand texte » vers le palier 125 %', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ isDark: false, fontSize: 'large', highContrast: false }))
    renderWithProviders(<AccessibilityMenu />)
    expect(html()).toHaveClass('text-step-2')
  })

  it('n’a aucune violation d’accessibilité (jest-axe)', async () => {
    const { container } = renderWithProviders(<AccessibilityMenu />)
    await openMenu()
    expect(await axe(container)).toHaveNoViolations()
  })
})
