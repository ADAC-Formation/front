import { FORMATIONS } from '../../test/formations'
import { USERS } from '../../test/session'
import {
  EMPTY_VALUES,
  changedFields,
  nextEndDate,
  toRequest,
  validateDateRange,
  valuesFromFormation,
} from './formationForm'

const [secours, excel] = FORMATIONS
const byTheTrainingOfficer = { ...secours, formateur: USERS.SUPER_ADMIN }

describe('valuesFromFormation', () => {
  it('préremplit les champs depuis la formation (identifiants en texte pour les listes)', () => {
    expect(valuesFromFormation(secours)).toEqual({
      intitule: 'Premiers secours PSC1',
      description: 'Gestes de premiers secours.',
      dateDebut: '2026-03-10',
      dateFin: '2026-03-12',
      modalite: 'PRESENTIEL',
      categoryId: '1',
      formateurId: '2',
    })
  })

  it('remplace une description absente par un texte vide', () => {
    expect(valuesFromFormation(excel).description).toBe('')
  })

  it('laisse le formateur vide quand la formation est assignée à la chargée de formation', () => {
    expect(valuesFromFormation(byTheTrainingOfficer).formateurId).toBe('')
  })
})

describe('toRequest', () => {
  const values = {
    intitule: '  Excel niveau 1 ',
    description: '  ',
    dateDebut: '2026-02-02',
    dateFin: '2026-02-03',
    modalite: 'VISIO',
    categoryId: '2',
    formateurId: '',
  }

  it('retire les espaces, convertit les identifiants et met null pour les champs vides', () => {
    expect(toRequest(values)).toEqual({
      intitule: 'Excel niveau 1',
      description: null,
      dateDebut: '2026-02-02',
      dateFin: '2026-02-03',
      modalite: 'VISIO',
      categoryId: 2,
      formateurId: null,
    })
  })

  it('envoie les identifiants choisis comme nombres', () => {
    expect(toRequest({ ...values, description: 'Texte', formateurId: '12' })).toMatchObject({
      description: 'Texte',
      formateurId: 12,
    })
  })

  it('part de valeurs vides sans lever d’erreur', () => {
    expect(toRequest(EMPTY_VALUES).formateurId).toBeNull()
  })
})

describe('changedFields', () => {
  it('renvoie un objet vide quand rien ne change', () => {
    expect(changedFields(secours, valuesFromFormation(secours))).toEqual({})
  })

  it('ne renvoie que le champ modifié', () => {
    const values = { ...valuesFromFormation(secours), intitule: 'PSC1 recyclage' }
    expect(changedFields(secours, values)).toEqual({ intitule: 'PSC1 recyclage' })
  })

  it("ignore un changement qui ne fait qu'ajouter des espaces", () => {
    const values = { ...valuesFromFormation(secours), intitule: ' Premiers secours PSC1 ' }
    expect(changedFields(secours, values)).toEqual({})
  })

  it('renvoie les identifiants en nombres', () => {
    const values = { ...valuesFromFormation(secours), categoryId: '2', formateurId: '12' }
    expect(changedFields(secours, values)).toEqual({ categoryId: 2, formateurId: 12 })
  })

  it("envoie l'identifiant de la chargée de formation quand on repasse à « assigné à la chargée de formation » (le back ignore null en PUT)", () => {
    const values = { ...valuesFromFormation(secours), formateurId: '' }
    expect(changedFields(secours, values, { trainingOfficerId: 1 })).toEqual({ formateurId: 1 })
  })

  it('ne renvoie rien pour le formateur quand la formation est déjà assignée à la chargée de formation', () => {
    expect(changedFields(byTheTrainingOfficer, valuesFromFormation(byTheTrainingOfficer))).toEqual({})
  })

  it('renvoie description: null quand on efface la description', () => {
    const values = { ...valuesFromFormation(secours), description: '' }
    expect(changedFields(secours, values)).toEqual({ description: null })
  })
})

describe('validateDateRange', () => {
  it('accepte une plage valide et un seul jour', () => {
    expect(validateDateRange('2026-03-10', '2026-03-12')).toBeNull()
    expect(validateDateRange('2026-03-10', '2026-03-10')).toBeNull()
  })

  it('refuse une date de fin avant la date de début', () => {
    expect(validateDateRange('2026-03-12', '2026-03-10')).toBe(
      'La date de fin ne peut pas précéder la date de début.',
    )
  })

  it('laisse la validation des champs vides à la règle « obligatoire »', () => {
    expect(validateDateRange('', '2026-03-10')).toBeNull()
    expect(validateDateRange('2026-03-10', '')).toBeNull()
  })
})

describe('nextEndDate', () => {
  it('préremplit « Au » quand elle est vide', () => {
    expect(nextEndDate('', '2026-03-10', '')).toBe('2026-03-10')
  })

  it('suit « Du » tant que « Au » valait l’ancienne date de début', () => {
    expect(nextEndDate('2026-03-10', '2026-03-14', '2026-03-10')).toBe('2026-03-14')
  })

  it('ne touche pas à « Au » quand elle a été choisie séparément', () => {
    expect(nextEndDate('2026-03-10', '2026-03-14', '2026-03-20')).toBe('2026-03-20')
  })
})
