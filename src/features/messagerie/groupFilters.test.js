import { FORMATIONS, AUTRE_FORMATEUR } from '../../test/formations'
import { USERS } from '../../test/session'
import { ROLES } from '../../utils/roles'
import {
  FILTER_TYPES,
  filterTypesFor,
  formationsOfTrainer,
  isFilterComplete,
  toPreviewParams,
  toSendBody,
} from './groupFilters'

describe('filterTypesFor', () => {
  it('propose les trois filtres à la chargée de formation', () => {
    expect(filterTypesFor(ROLES.SUPER_ADMIN)).toEqual([
      FILTER_TYPES.FORMATION,
      FILTER_TYPES.MISSING_DOCS,
      FILTER_TYPES.MANUAL,
    ])
  })

  it('ne propose que « Formation » au formateur', () => {
    expect(filterTypesFor(ROLES.ADMIN)).toEqual([FILTER_TYPES.FORMATION])
  })

  it('ne propose rien au stagiaire ni à un rôle inconnu', () => {
    expect(filterTypesFor(ROLES.STAGIAIRE)).toEqual([])
    expect(filterTypesFor(undefined)).toEqual([])
  })
})

describe('formationsOfTrainer', () => {
  it('ne garde que les formations dont le formateur est celui connecté', () => {
    const mine = formationsOfTrainer(FORMATIONS, USERS.ADMIN.id)
    expect(mine.map((formation) => formation.formateur.id)).toEqual(mine.map(() => USERS.ADMIN.id))
    expect(mine.length).toBeGreaterThan(0)
    expect(mine.length).toBeLessThan(FORMATIONS.length)
  })

  it("exclut les formations d'un autre formateur", () => {
    const mine = formationsOfTrainer(FORMATIONS, USERS.ADMIN.id)
    expect(mine.some((formation) => formation.formateur.id === AUTRE_FORMATEUR.id)).toBe(false)
  })

  it('renvoie une liste vide sans formation ou sans identifiant', () => {
    expect(formationsOfTrainer([], USERS.ADMIN.id)).toEqual([])
    expect(formationsOfTrainer(undefined, USERS.ADMIN.id)).toEqual([])
    expect(formationsOfTrainer(FORMATIONS, undefined)).toEqual([])
  })
})

describe('isFilterComplete', () => {
  it('« Formation » est complet seulement quand une formation est choisie', () => {
    expect(isFilterComplete({ type: FILTER_TYPES.FORMATION })).toBe(false)
    expect(isFilterComplete({ type: FILTER_TYPES.FORMATION, formationId: '' })).toBe(false)
    expect(isFilterComplete({ type: FILTER_TYPES.FORMATION, formationId: '101' })).toBe(true)
    expect(isFilterComplete({ type: FILTER_TYPES.FORMATION, formationId: 101 })).toBe(true)
  })

  it('« Sélection libre » est complet seulement avec au moins une personne', () => {
    expect(isFilterComplete({ type: FILTER_TYPES.MANUAL })).toBe(false)
    expect(isFilterComplete({ type: FILTER_TYPES.MANUAL, userIds: [] })).toBe(false)
    expect(isFilterComplete({ type: FILTER_TYPES.MANUAL, userIds: [4] })).toBe(true)
  })

  it('« Documents manquants » est toujours complet', () => {
    expect(isFilterComplete({ type: FILTER_TYPES.MISSING_DOCS })).toBe(true)
  })

  it('un filtre absent ou de type inconnu est incomplet', () => {
    expect(isFilterComplete(undefined)).toBe(false)
    expect(isFilterComplete({})).toBe(false)
    expect(isFilterComplete({ type: 'AUTRE' })).toBe(false)
  })
})

describe('toPreviewParams', () => {
  it('« Formation » envoie filterType et formationId en nombre', () => {
    expect(toPreviewParams({ type: FILTER_TYPES.FORMATION, formationId: '101' })).toEqual({
      filterType: 'FORMATION',
      formationId: 101,
    })
  })

  it('« Documents manquants » envoie seulement filterType', () => {
    expect(toPreviewParams({ type: FILTER_TYPES.MISSING_DOCS, formationId: '101', userIds: [4] })).toEqual({
      filterType: 'MISSING_DOCS',
    })
  })

  it('« Sélection libre » envoie filterType et userIds', () => {
    expect(toPreviewParams({ type: FILTER_TYPES.MANUAL, userIds: [4, 7], formationId: '101' })).toEqual({
      filterType: 'MANUAL',
      userIds: [4, 7],
    })
  })
})

describe('toSendBody', () => {
  it('« Formation » : formationId seulement, sans userIds', () => {
    expect(toSendBody({ type: FILTER_TYPES.FORMATION, formationId: '101', userIds: [4] }, 'Bonjour')).toEqual({
      content: 'Bonjour',
      filter: { type: 'FORMATION', formationId: 101 },
    })
  })

  it('« Documents manquants » : ni formationId ni userIds', () => {
    expect(toSendBody({ type: FILTER_TYPES.MISSING_DOCS, formationId: '101', userIds: [4] }, 'Bonjour')).toEqual({
      content: 'Bonjour',
      filter: { type: 'MISSING_DOCS' },
    })
  })

  it('« Sélection libre » : userIds seulement, sans formationId', () => {
    expect(toSendBody({ type: FILTER_TYPES.MANUAL, userIds: [4, 7], formationId: '101' }, 'Bonjour')).toEqual({
      content: 'Bonjour',
      filter: { type: 'MANUAL', userIds: [4, 7] },
    })
  })

  it('conserve le texte tel quel, sans le rogner (H9)', () => {
    const { content } = toSendBody({ type: FILTER_TYPES.MISSING_DOCS }, '  Bonjour\nà tous  ')
    expect(content).toBe('  Bonjour\nà tous  ')
  })
})
