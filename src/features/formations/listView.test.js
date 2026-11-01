import { FORMATIONS } from '../../test/formations'
import { formatDateRange, modaliteLabel } from './formationLabels'
import { filterFormations, sortFormations } from './listView'

const [secours, excel, postures] = FORMATIONS

describe('filterFormations', () => {
  it('renvoie tout sans critère', () => {
    expect(filterFormations(FORMATIONS, {})).toEqual(FORMATIONS)
  })

  it("cherche dans l'intitulé sans tenir compte de la casse ni des espaces autour", () => {
    expect(filterFormations(FORMATIONS, { search: '  EXCEL ' })).toEqual([excel])
  })

  it('cherche dans le nom du formateur', () => {
    expect(filterFormations(FORMATIONS, { search: 'durand' })).toEqual([excel])
    expect(filterFormations(FORMATIONS, { search: 'formateur dev' })).toEqual([secours, postures])
  })

  it('cherche dans le nom de la catégorie', () => {
    expect(filterFormations(FORMATIONS, { search: 'secourisme' })).toEqual([secours])
  })

  it('ne renvoie rien quand rien ne correspond', () => {
    expect(filterFormations(FORMATIONS, { search: 'inexistant' })).toEqual([])
  })

  it('ne garde que les formations du formateur demandé', () => {
    expect(filterFormations(FORMATIONS, { formateurId: 2 })).toEqual([secours, postures])
    expect(filterFormations(FORMATIONS, { formateurId: 12 })).toEqual([excel])
  })

  it('combine recherche et formateur', () => {
    expect(filterFormations(FORMATIONS, { search: 'gestes', formateurId: 2 })).toEqual([postures])
  })
})

describe('sortFormations', () => {
  it('trie par date de début croissante', () => {
    expect(sortFormations(FORMATIONS, 'date').map((f) => f.id)).toEqual([103, 102, 101])
  })

  it("trie par intitulé A-Z en ignorant les accents", () => {
    expect(sortFormations(FORMATIONS, 'intitule').map((f) => f.id)).toEqual([102, 103, 101])
  })

  it('trie par nom de formateur A-Z', () => {
    expect(sortFormations(FORMATIONS, 'formateur').map((f) => f.id)).toEqual([101, 103, 102])
  })

  it("ne modifie pas la liste d'origine", () => {
    const copy = [...FORMATIONS]
    sortFormations(FORMATIONS, 'intitule')
    expect(FORMATIONS).toEqual(copy)
  })
})

describe('modaliteLabel', () => {
  it('traduit les trois modalités', () => {
    expect(modaliteLabel('VISIO')).toBe('Visio')
    expect(modaliteLabel('PRESENTIEL')).toBe('Présentiel')
    expect(modaliteLabel('MIXTE')).toBe('Mixte')
  })

  it('renvoie la valeur brute si elle est inconnue', () => {
    expect(modaliteLabel('AUTRE')).toBe('AUTRE')
  })
})

describe('formatDateRange', () => {
  it('formate une plage de dates en français', () => {
    expect(formatDateRange('2026-03-10', '2026-03-12')).toBe('du 10 mars 2026 au 12 mars 2026')
  })

  it('formate un seul jour', () => {
    expect(formatDateRange('2026-03-10', '2026-03-10')).toBe('le 10 mars 2026')
  })
})
