import { useState } from 'react'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { renderWithProviders } from '../../../test/render'
import { server } from '../../../test/msw/server'
import { API_URL } from '../../../test/session'
import { STAGIAIRES, mockAccountList } from '../../../test/accounts'
import StagiairePicker from './StagiairePicker'

const marc = { id: 22, email: 'marc@adac.test', prenom: 'Marc', nom: 'Dubois', role: 'STAGIAIRE', isActive: true, emailNotificationsEnabled: true }
const elodie = { id: 23, email: 'elodie@adac.test', prenom: 'Élodie', nom: 'Roux', role: 'STAGIAIRE', isActive: true, emailNotificationsEnabled: true }
const ACCOUNTS = [...STAGIAIRES, marc, elodie] // Léa 20, Omar 21 (désactivé), Marc 22, Élodie 23

// Le composant est contrôlé : ce harnais garde la sélection comme le fait la page.
function Harness({ initial = [], spy, ...options }) {
  const [ids, setIds] = useState(initial)
  return (
    <StagiairePicker
      {...options}
      selectedIds={ids}
      onChange={(next) => {
        spy?.(next)
        setIds(next)
      }}
    />
  )
}

const render = (props) => renderWithProviders(<Harness {...props} />)
const checkbox = (name) => screen.getByRole('checkbox', { name })
const search = () => screen.getByRole('searchbox', { name: 'Rechercher un stagiaire' })

describe('StagiairePicker', () => {
  it('annonce le chargement puis liste les stagiaires actifs par leur nom, sans e-mail', async () => {
    const calls = mockAccountList('stagiaires', ACCOUNTS)
    render()
    expect(screen.getByRole('status')).toHaveTextContent('Chargement')
    expect(await screen.findByRole('checkbox', { name: 'Léa Petit' })).toBeInTheDocument()
    expect(calls.urls[0]).toContain('active=true')
    expect(screen.getAllByRole('checkbox')).toHaveLength(3)
    expect(screen.queryByRole('checkbox', { name: 'Omar Benali' })).not.toBeInTheDocument()
    expect(screen.queryByText(/@adac\.test/)).not.toBeInTheDocument()
  })

  it('a un groupe nommé et une recherche libellée', async () => {
    mockAccountList('stagiaires', ACCOUNTS)
    render()
    await screen.findByRole('checkbox', { name: 'Léa Petit' })
    expect(screen.getByRole('group', { name: 'Stagiaires' })).toBeInTheDocument()
    expect(search()).toBeInTheDocument()
  })

  it('coche et décoche une personne en renvoyant la liste des identifiants', async () => {
    mockAccountList('stagiaires', ACCOUNTS)
    const spy = vi.fn()
    render({ spy })
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Léa Petit' }))
    expect(spy).toHaveBeenLastCalledWith([20])
    await userEvent.click(checkbox('Marc Dubois'))
    expect(spy).toHaveBeenLastCalledWith([20, 22])
    await userEvent.click(checkbox('Léa Petit'))
    expect(spy).toHaveBeenLastCalledWith([22])
  })

  it('affiche les personnes déjà sélectionnées comme cochées', async () => {
    mockAccountList('stagiaires', ACCOUNTS)
    render({ initial: [22] })
    expect(await screen.findByRole('checkbox', { name: 'Marc Dubois' })).toBeChecked()
    expect(checkbox('Léa Petit')).not.toBeChecked()
  })

  it('cherche sans tenir compte de la casse ni des accents', async () => {
    mockAccountList('stagiaires', ACCOUNTS)
    render()
    await screen.findByRole('checkbox', { name: 'Léa Petit' })
    await userEvent.type(search(), 'ELODIE')
    expect(screen.getAllByRole('checkbox')).toHaveLength(1)
    expect(checkbox('Élodie Roux')).toBeInTheDocument()
  })

  it('annonce « Aucun stagiaire trouvé. » quand la recherche ne donne rien', async () => {
    mockAccountList('stagiaires', ACCOUNTS)
    render()
    await screen.findByRole('checkbox', { name: 'Léa Petit' })
    await userEvent.type(search(), 'zzz')
    expect(screen.getByText('Aucun stagiaire trouvé.')).toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })

  it('« Tout sélectionner » coche seulement les résultats affichés et garde le reste', async () => {
    mockAccountList('stagiaires', ACCOUNTS)
    const spy = vi.fn()
    render({ initial: [20], spy })
    await screen.findByRole('checkbox', { name: 'Léa Petit' })
    await userEvent.type(search(), 'ma') // Marc Dubois seulement
    await userEvent.click(screen.getByRole('button', { name: 'Tout sélectionner' }))
    expect(spy).toHaveBeenLastCalledWith([20, 22])
  })

  it('« Tout sélectionner » sans doublon quand une personne est déjà cochée', async () => {
    mockAccountList('stagiaires', ACCOUNTS)
    const spy = vi.fn()
    render({ initial: [22], spy })
    await screen.findByRole('checkbox', { name: 'Léa Petit' })
    await userEvent.click(screen.getByRole('button', { name: 'Tout sélectionner' }))
    expect(spy).toHaveBeenLastCalledWith([22, 20, 23])
  })

  it('garde la sélection quand la recherche change', async () => {
    mockAccountList('stagiaires', ACCOUNTS)
    render()
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Léa Petit' }))
    await userEvent.type(search(), 'Marc')
    expect(screen.queryByRole('checkbox', { name: 'Léa Petit' })).not.toBeInTheDocument()
    await userEvent.clear(search())
    expect(checkbox('Léa Petit')).toBeChecked()
    expect(screen.getByRole('status')).toHaveTextContent('1 sélectionné')
  })

  it('annonce le nombre de personnes cochées', async () => {
    mockAccountList('stagiaires', ACCOUNTS)
    render()
    await screen.findByRole('checkbox', { name: 'Léa Petit' })
    expect(screen.getByRole('status')).toHaveTextContent('Aucun stagiaire sélectionné')
    await userEvent.click(checkbox('Léa Petit'))
    expect(screen.getByRole('status')).toHaveTextContent('1 sélectionné')
    await userEvent.click(checkbox('Marc Dubois'))
    expect(screen.getByRole('status')).toHaveTextContent('2 sélectionnés')
  })

  it('annonce « Aucun stagiaire actif. » quand la liste est vide', async () => {
    mockAccountList('stagiaires', [])
    render()
    expect(await screen.findByText('Aucun stagiaire actif.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Tout sélectionner' })).not.toBeInTheDocument()
  })

  it('affiche une erreur avec « Réessayer » qui relance le chargement', async () => {
    server.use(http.get(`${API_URL}/users/stagiaires`, () => HttpResponse.json({ status: 500, message: 'x', details: [] }, { status: 500 })))
    render()
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Impossible de charger les stagiaires.')
    mockAccountList('stagiaires', ACCOUNTS)
    await userEvent.click(within(alert.parentElement).getByRole('button', { name: 'Réessayer' }))
    expect(await screen.findByRole('checkbox', { name: 'Léa Petit' })).toBeInTheDocument()
  })

  describe('pour inscrire (includePending, excludeIds)', () => {
    const suspendu = { id: 24, email: 'sam@adac.test', prenom: 'Sam', nom: 'Morel', role: 'STAGIAIRE', isActive: false, activated: true, emailNotificationsEnabled: true }

    it('propose les actifs et les comptes jamais activés, jamais les suspendus', async () => {
      const calls = mockAccountList('stagiaires', [...ACCOUNTS, suspendu])
      render({ includePending: true })
      expect(await screen.findByRole('checkbox', { name: 'Omar Benali' })).toBeInTheDocument()
      expect(checkbox('Léa Petit')).toBeInTheDocument()
      expect(screen.queryByRole('checkbox', { name: 'Sam Morel' })).not.toBeInTheDocument()
      expect(calls.urls[0]).not.toContain('active=true')
    })

    it('ne propose pas les stagiaires exclus (déjà inscrits)', async () => {
      mockAccountList('stagiaires', ACCOUNTS)
      render({ includePending: true, excludeIds: [20, 22] })
      expect(await screen.findByRole('checkbox', { name: 'Omar Benali' })).toBeInTheDocument()
      expect(screen.queryByRole('checkbox', { name: 'Léa Petit' })).not.toBeInTheDocument()
      expect(screen.queryByRole('checkbox', { name: 'Marc Dubois' })).not.toBeInTheDocument()
    })

    it('annonce « Aucun stagiaire à inscrire. » quand tous sont exclus', async () => {
      mockAccountList('stagiaires', STAGIAIRES)
      render({ includePending: true, excludeIds: [20, 21] })
      expect(await screen.findByText('Aucun stagiaire à inscrire.')).toBeInTheDocument()
    })
  })
})
