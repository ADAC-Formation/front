import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApiError } from '../../../api/ApiError'
import { STAGIAIRES } from '../../../test/accounts'
import RecipientPreview from './RecipientPreview'

const marc = { id: 22, email: 'marc@adac.test', prenom: 'Marc', nom: 'Dubois', role: 'STAGIAIRE', isActive: true }
const RECIPIENTS = [STAGIAIRES[0], marc]

describe('RecipientPreview', () => {
  it('annonce le chargement', () => {
    render(<RecipientPreview isLoading />)
    expect(screen.getByRole('status')).toHaveTextContent('Chargement des destinataires')
  })

  it('liste les destinataires par leur nom seulement, sans e-mail', () => {
    render(<RecipientPreview recipients={RECIPIENTS} />)
    const items = screen.getAllByRole('listitem')
    expect(items.map((item) => item.textContent)).toEqual(['Léa Petit', 'Marc Dubois'])
    expect(screen.queryByText(/@adac\.test/)).not.toBeInTheDocument()
  })

  it('annonce le nombre de destinataires, au pluriel', () => {
    render(<RecipientPreview recipients={RECIPIENTS} />)
    expect(screen.getByRole('status')).toHaveTextContent('2 destinataires')
  })

  it('annonce le nombre de destinataires, au singulier', () => {
    render(<RecipientPreview recipients={[marc]} />)
    expect(screen.getByRole('status')).toHaveTextContent('1 destinataire')
    expect(screen.getByRole('status')).not.toHaveTextContent('1 destinataires')
  })

  it('a un titre « Destinataires » et une liste atteignable au clavier (défilement)', () => {
    render(<RecipientPreview recipients={RECIPIENTS} />)
    expect(screen.getByRole('heading', { name: 'Destinataires' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Destinataires' })).toHaveAttribute('tabindex', '0')
  })

  it('une liste vide donne « Aucun destinataire correspondant »', () => {
    render(<RecipientPreview recipients={[]} />)
    expect(screen.getByText('Aucun destinataire correspondant')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('un 400 du back (aucun destinataire) donne aussi « Aucun destinataire correspondant »', () => {
    render(<RecipientPreview error={new ApiError({ status: 400, message: 'Aucun destinataire', details: [] })} />)
    expect(screen.getByText('Aucun destinataire correspondant')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('une autre erreur affiche une alerte avec « Réessayer »', async () => {
    const onRetry = vi.fn()
    render(<RecipientPreview error={new ApiError({ status: 500, message: 'x', details: [] })} onRetry={onRetry} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Impossible de charger les destinataires.')
    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
    // Sans argument : `refetch` de TanStack lirait l'événement du clic comme ses options.
    expect(onRetry).toHaveBeenCalledWith()
  })
})
