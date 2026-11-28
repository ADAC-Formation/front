import { useState } from 'react'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { renderWithProviders } from '../../../test/render'
import { FORMATIONS, mockFormationList, mockFormationListError } from '../../../test/formations'
import FormationPicker from './FormationPicker'

const ACTIVE_LABEL = 'Premiers secours PSC1 — du 10 mars 2026 au 12 mars 2026'
const EXCEL_LABEL = 'Excel niveau 1 — du 2 février 2026 au 3 février 2026'

// Composant contrôlé : ce harnais garde la sélection comme le fait la page.
function Harness({ initial = [], spy, ...options }) {
  const [ids, setIds] = useState(initial)
  return (
    <FormationPicker
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
const search = () => screen.getByRole('searchbox', { name: 'Rechercher une formation' })

describe('FormationPicker', () => {
  it('liste seulement les formations actives, avec leurs dates, dans un groupe nommé', async () => {
    const calls = mockFormationList(FORMATIONS)
    render({ legend: 'Formations (facultatif)' })
    expect(await screen.findByRole('checkbox', { name: ACTIVE_LABEL })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: EXCEL_LABEL })).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: /Gestes et postures/ })).not.toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Formations (facultatif)' })).toBeInTheDocument()
    expect(calls.urls[0]).toContain('status=ACTIVE')
  })

  it('coche et décoche en renvoyant la liste des identifiants', async () => {
    mockFormationList(FORMATIONS)
    const spy = vi.fn()
    render({ spy })
    await userEvent.click(await screen.findByRole('checkbox', { name: ACTIVE_LABEL }))
    expect(spy).toHaveBeenLastCalledWith([101])
    await userEvent.click(screen.getByRole('checkbox', { name: EXCEL_LABEL }))
    expect(spy).toHaveBeenLastCalledWith([101, 102])
    await userEvent.click(screen.getByRole('checkbox', { name: ACTIVE_LABEL }))
    expect(spy).toHaveBeenLastCalledWith([102])
  })

  it('cherche sans tenir compte de la casse ni des accents et garde la sélection', async () => {
    mockFormationList(FORMATIONS)
    render({ initial: [102] })
    await screen.findByRole('checkbox', { name: ACTIVE_LABEL })
    await userEvent.type(search(), 'PREMIERS')
    expect(screen.getByRole('checkbox', { name: ACTIVE_LABEL })).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: EXCEL_LABEL })).not.toBeInTheDocument()
    await userEvent.clear(search())
    expect(screen.getByRole('checkbox', { name: EXCEL_LABEL })).toBeChecked()
  })

  it('annonce le nombre de formations sélectionnées', async () => {
    mockFormationList(FORMATIONS)
    render()
    await screen.findByRole('checkbox', { name: ACTIVE_LABEL })
    expect(screen.getByRole('status')).toHaveTextContent('Aucune formation sélectionnée')
    await userEvent.click(screen.getByRole('checkbox', { name: ACTIVE_LABEL }))
    expect(screen.getByRole('status')).toHaveTextContent('1 formation sélectionnée')
    await userEvent.click(screen.getByRole('checkbox', { name: EXCEL_LABEL }))
    expect(screen.getByRole('status')).toHaveTextContent('2 formations sélectionnées')
  })

  it('ne propose pas les formations exclues (déjà suivies)', async () => {
    mockFormationList(FORMATIONS)
    render({ excludeIds: [101] })
    expect(await screen.findByRole('checkbox', { name: EXCEL_LABEL })).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: ACTIVE_LABEL })).not.toBeInTheDocument()
  })

  it('annonce « Aucune formation active à proposer. » quand il n’y en a pas', async () => {
    mockFormationList([FORMATIONS[2]])
    render()
    expect(await screen.findByText('Aucune formation active à proposer.')).toBeInTheDocument()
  })

  it('affiche une erreur avec « Réessayer » qui relance le chargement', async () => {
    mockFormationListError(500)
    render()
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Impossible de charger les formations.')
    mockFormationList(FORMATIONS)
    await userEvent.click(within(alert.parentElement).getByRole('button', { name: 'Réessayer' }))
    expect(await screen.findByRole('checkbox', { name: ACTIVE_LABEL })).toBeInTheDocument()
  })

  // NOTES-26 (J12) : filtre par catégorie, au-dessus de la recherche.
  describe('filtre par catégorie', () => {
    const category = () => screen.getByRole('combobox', { name: 'Catégorie' })

    it('propose « Toutes les catégories » puis seulement les catégories qui ont une formation à proposer', async () => {
      mockFormationList(FORMATIONS)
      render()
      await screen.findByRole('checkbox', { name: ACTIVE_LABEL })
      const options = within(category()).getAllByRole('option').map((option) => option.textContent)
      // « Ancienne catégorie » n'a qu'une formation archivée : elle n'apparaît pas.
      expect(options).toEqual(['Toutes les catégories', 'Numérique', 'Secourisme'])
      expect(category()).toHaveValue('')
    })

    it('ne garde que les formations de la catégorie choisie et garde la sélection masquée', async () => {
      mockFormationList(FORMATIONS)
      render({ initial: [101] })
      await screen.findByRole('checkbox', { name: ACTIVE_LABEL })
      await userEvent.selectOptions(category(), 'Numérique')
      expect(screen.getByRole('checkbox', { name: EXCEL_LABEL })).toBeInTheDocument()
      expect(screen.queryByRole('checkbox', { name: ACTIVE_LABEL })).not.toBeInTheDocument()
      expect(screen.getByText('1 formation sélectionnée')).toBeInTheDocument()
      await userEvent.selectOptions(category(), 'Toutes les catégories')
      expect(screen.getByRole('checkbox', { name: ACTIVE_LABEL })).toBeChecked()
    })

    it('se combine avec la recherche et reste affiché quand rien ne correspond', async () => {
      mockFormationList(FORMATIONS)
      render()
      await screen.findByRole('checkbox', { name: ACTIVE_LABEL })
      await userEvent.selectOptions(category(), 'Numérique')
      await userEvent.type(search(), 'secours')
      expect(screen.getByText('Aucune formation trouvée.')).toBeInTheDocument()
      expect(category()).toBeInTheDocument()
    })

    it('ne propose pas la catégorie dont toutes les formations sont exclues', async () => {
      mockFormationList(FORMATIONS)
      render({ excludeIds: [102] })
      await screen.findByRole('checkbox', { name: ACTIVE_LABEL })
      const options = within(category()).getAllByRole('option').map((option) => option.textContent)
      expect(options).toEqual(['Toutes les catégories', 'Secourisme'])
    })
  })

  it('n’a pas de violation d’accessibilité', async () => {
    mockFormationList(FORMATIONS)
    const { container } = render()
    await screen.findByRole('checkbox', { name: ACTIVE_LABEL })
    expect(await axe(container)).toHaveNoViolations()
  })
})
