// « Envoyer un retour » quitte l'en-tête pour un bouton rond en bas à droite (D67, suite). jsdom n'applique pas
// le CSS : on lit la feuille et les sources ; la géométrie réelle est vérifiée par le passage scripté de D67.
import { describe, expect, it } from 'vitest'
import { cssSheets, jsxSources, rulesOf, stripComments } from './css-sheets'

const sheet = stripComments(cssSheets['src/features/feedback/components/FeedbackButton.module.css'])
const rule = (selector) => rulesOf(sheet).find((r) => r.selector.trim() === selector)?.body ?? ''
const headerZ = Number(
  rulesOf(stripComments(cssSheets['src/components/organisms/Header/Header.module.css']))
    .find((r) => r.selector.trim() === '.header')
    ?.body.match(/z-index:\s*(\d+)/)?.[1],
)

describe('Bouton « Envoyer un retour » en bas à droite', () => {
  it('est fixé en bas à droite de la fenêtre', () => {
    const wrapper = rule('.wrapper')
    expect(wrapper).toMatch(/position:\s*fixed/)
    expect(wrapper).toMatch(/right:/)
    expect(wrapper).toMatch(/bottom:/)
  })

  // Sa boîte de dialogue est rendue dans le bouton : elle doit passer au-dessus de l'en-tête.
  it('passe au-dessus de l’en-tête', () => {
    expect(Number(rule('.wrapper').match(/z-index:\s*(\d+)/)?.[1])).toBeGreaterThan(headerZ)
  })

  it('déplie son libellé au focus clavier, et au survol seulement sur un appareil qui survole', () => {
    expect(sheet).toMatch(/\.button:focus-visible\s+\.label[^{]*\{[^}]*position:\s*static/)
    expect(sheet).toMatch(/@media\s*\(hover:\s*hover\)\s*\{[^@]*\.button:hover\s+\.label/)
  })

  it('ne masque jamais le libellé avec display: none', () => {
    for (const { selector, body } of rulesOf(sheet)) {
      if (/\.label\b/.test(selector)) expect(body).not.toMatch(/display:\s*none/)
    }
  })

  // Mesuré à 390 px, en bas de page : le bouton recouvrait « Mentions légales et confidentialité ». Sous 640 px,
  // le pied de page garde sous son lien la hauteur du bouton et de sa marge (3,25 + 1 rem).
  it('laisse le lien du pied de page dégagé sur téléphone', () => {
    const footer = stripComments(cssSheets['src/components/organisms/Footer/Footer.module.css'])
    const phone = footer.match(/@media\s*\(max-width:\s*639px\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? ''
    const bottom = phone.match(/\.footer\s*\{[^}]*padding-bottom:\s*([\d.]+)rem/)?.[1]
    expect(Number(bottom)).toBeGreaterThanOrEqual(3.25 + 1)
  })

  it('est rendu par le gabarit, plus par l’en-tête', () => {
    expect(jsxSources['src/Layout/Layout.jsx']).toMatch(/<FeedbackButton\s*\/>/)
    expect(jsxSources['src/components/organisms/Header/Header.jsx']).not.toMatch(/FeedbackButton/)
  })
})
