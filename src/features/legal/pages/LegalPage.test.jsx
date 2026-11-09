import { screen, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import LegalPage from './LegalPage'
import { LEGAL_INFO } from '../legalInfo'
import { renderWithProviders } from '../../../test/render'

function renderLegal() {
  return renderWithProviders(<LegalPage />, { route: '/mentions-legales' })
}

describe('LegalPage', () => {
  it('a un titre de page et les deux parties, mentions légales puis confidentialité', () => {
    renderLegal()
    expect(screen.getByRole('heading', { level: 1, name: 'Mentions légales et confidentialité' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Mentions légales' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Confidentialité' })).toBeInTheDocument()
  })

  it('donne un « Retour » vers l’accueil', () => {
    renderLegal()
    expect(screen.getByRole('link', { name: 'Retour' })).toHaveAttribute('href', '/')
  })

  it('dit sans détour que les informations fournies par l’ADAC ne sont pas encore renseignées', () => {
    renderLegal()
    const identity = screen.getByRole('region', { name: 'Éditeur du portail' })
    for (const label of ['SIRET', 'Numéro de déclaration d’activité']) {
      expect(within(identity).getByText(label)).toBeInTheDocument()
    }
    expect(within(identity).getAllByText('À renseigner par l’ADAC').length).toBeGreaterThanOrEqual(2)
    const privacy = screen.getByRole('region', { name: 'Confidentialité' })
    expect(within(privacy).getByText(/Durée de conservation des données/)).toBeInTheDocument()
    expect(within(privacy).getAllByText('À renseigner par l’ADAC')).toHaveLength(1)
  })

  it('affiche la valeur dès qu’elle est fournie, sans mention « à renseigner »', () => {
    const original = { ...LEGAL_INFO }
    Object.assign(LEGAL_INFO, { siret: '123 456 789 00012', retention: '1 an après la fin de la formation' })
    try {
      renderLegal()
      expect(screen.getByText('123 456 789 00012')).toBeInTheDocument()
      expect(screen.getByText(/1 an après la fin de la formation/)).toBeInTheDocument()
    } finally {
      Object.assign(LEGAL_INFO, original)
    }
  })

  it('décrit ce que le portail fait des données, conformément à D31', () => {
    renderLegal()
    const privacy = screen.getByRole('region', { name: 'Confidentialité' })
    expect(within(privacy).getByText(/cookie/i)).toBeInTheDocument()
    expect(within(privacy).getByText(/aucun outil d’analyse/i)).toBeInTheDocument()
    expect(within(privacy).getByText(/polices.*hébergées/i)).toBeInTheDocument()
  })

  it('n’a aucune violation d’accessibilité (jest-axe)', async () => {
    const { container } = renderLegal()
    expect(await axe(container)).toHaveNoViolations()
  })
})
