import { useState } from 'react'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test/render'
import { USERS } from '../../../test/session'
import { STAGIAIRES, mockAccountList } from '../../../test/accounts'
import { FORMATIONS, mockFormationList, mockFormationListError } from '../../../test/formations'
import GroupFilters from './GroupFilters'

const EMPTY = { type: 'FORMATION', formationId: '', userIds: [] }

// Le composant est contrôlé : ce harnais garde le filtre comme le fait la page.
function Harness({ user, initial = EMPTY, spy }) {
  const [filter, setFilter] = useState(initial)
  return (
    <GroupFilters
      user={user}
      filter={filter}
      onChange={(next) => {
        spy?.(next)
        setFilter(next)
      }}
    />
  )
}

const render = (props) => renderWithProviders(<Harness {...props} />)
const radioNames = () => screen.getAllByRole('radio').map((radio) => radio.getAttribute('aria-label') ?? radio.labels[0].textContent)

describe('GroupFilters', () => {
  describe('types de filtre selon le rôle', () => {
    it('propose « Formation » puis « Sélection libre » à la chargée de formation (plus « Documents manquants », NOTES-17)', () => {
      mockFormationList()
      render({ user: USERS.SUPER_ADMIN })
      expect(radioNames()).toEqual(['Formation', 'Sélection libre'])
    })

    it('ne propose que « Formation » au formateur', () => {
      mockFormationList()
      render({ user: USERS.ADMIN })
      expect(radioNames()).toEqual(['Formation'])
    })

    it('coche le type du filtre courant', () => {
      mockFormationList()
      render({ user: USERS.SUPER_ADMIN, initial: { ...EMPTY, type: 'FORMATION' } })
      expect(screen.getByRole('radio', { name: 'Formation' })).toBeChecked()
      expect(screen.getByRole('radio', { name: 'Sélection libre' })).not.toBeChecked()
    })

    it('les types forment un groupe nommé', () => {
      mockFormationList()
      render({ user: USERS.SUPER_ADMIN })
      expect(screen.getByRole('radiogroup', { name: 'Choisir les destinataires' })).toBeInTheDocument()
    })
  })

  describe('« Formation »', () => {
    it('liste les formations actives (status=ACTIVE) pour la chargée de formation', async () => {
      const calls = mockFormationList()
      render({ user: USERS.SUPER_ADMIN })
      const select = await screen.findByRole('combobox', { name: 'Formation concernée' })
      expect(calls.urls[0]).toContain('status=ACTIVE')
      const options = [...select.options].map((option) => option.textContent)
      expect(options).toEqual(['Choisir une formation', 'Premiers secours PSC1', 'Excel niveau 1'])
    })

    it('ne liste que les formations du formateur connecté', async () => {
      mockFormationList()
      render({ user: USERS.ADMIN })
      const select = await screen.findByRole('combobox', { name: 'Formation concernée' })
      expect([...select.options].map((option) => option.textContent)).toEqual(['Choisir une formation', 'Premiers secours PSC1'])
    })

    it("renvoie l'identifiant de la formation choisie, en texte", async () => {
      mockFormationList()
      const spy = vi.fn()
      render({ user: USERS.SUPER_ADMIN, spy })
      await userEvent.selectOptions(await screen.findByRole('combobox', { name: 'Formation concernée' }), 'Excel niveau 1')
      expect(spy).toHaveBeenLastCalledWith({ type: 'FORMATION', formationId: '102', userIds: [] })
    })

    it('annonce le chargement des formations', () => {
      mockFormationList()
      render({ user: USERS.SUPER_ADMIN })
      expect(screen.getByRole('status')).toHaveTextContent('Chargement des formations')
    })

    it('annonce « Aucune formation active. » quand il n\'y en a pas', async () => {
      mockFormationList([FORMATIONS[2]]) // la seule formation est archivée
      render({ user: USERS.SUPER_ADMIN })
      expect(await screen.findByText('Aucune formation active.')).toBeInTheDocument()
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    })

    it('affiche une erreur avec « Réessayer » qui relance le chargement', async () => {
      mockFormationListError(500)
      render({ user: USERS.SUPER_ADMIN })
      expect(await screen.findByRole('alert')).toHaveTextContent('Impossible de charger les formations.')
      mockFormationList()
      await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }))
      expect(await screen.findByRole('combobox', { name: 'Formation concernée' })).toBeInTheDocument()
    })
  })

  describe('« Sélection libre »', () => {
    it('affiche la liste de stagiaires avec recherche', async () => {
      mockFormationList()
      mockAccountList('stagiaires', STAGIAIRES)
      render({ user: USERS.SUPER_ADMIN, initial: { ...EMPTY, type: 'MANUAL' } })
      expect(await screen.findByRole('checkbox', { name: 'Léa Petit' })).toBeInTheDocument()
      expect(screen.getByRole('searchbox', { name: 'Rechercher un stagiaire' })).toBeInTheDocument()
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    })

    it('remonte la sélection dans userIds, en gardant le type', async () => {
      mockFormationList()
      mockAccountList('stagiaires', STAGIAIRES)
      const spy = vi.fn()
      render({ user: USERS.SUPER_ADMIN, initial: { ...EMPTY, type: 'MANUAL' }, spy })
      await userEvent.click(await screen.findByRole('checkbox', { name: 'Léa Petit' }))
      expect(spy).toHaveBeenLastCalledWith({ type: 'MANUAL', formationId: '', userIds: [20] })
    })
  })

  describe('changer de type', () => {
    it('vide la formation et la sélection', async () => {
      mockFormationList()
      const spy = vi.fn()
      render({ user: USERS.SUPER_ADMIN, initial: { type: 'FORMATION', formationId: '101', userIds: [20] }, spy })
      mockAccountList('stagiaires', STAGIAIRES)
      await userEvent.click(screen.getByRole('radio', { name: 'Sélection libre' }))
      expect(spy).toHaveBeenLastCalledWith({ type: 'MANUAL', formationId: '', userIds: [] })
    })

    it("n'appelle pas le back pour les stagiaires tant que « Sélection libre » n'est pas choisi", async () => {
      mockFormationList()
      const calls = mockAccountList('stagiaires', STAGIAIRES)
      render({ user: USERS.SUPER_ADMIN })
      await screen.findByRole('combobox', { name: 'Formation concernée' })
      expect(calls.count).toBe(0)
    })
  })
})
