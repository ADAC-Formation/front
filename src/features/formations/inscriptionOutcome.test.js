import { enrollmentSummary, unenrollTitle, unenrollWarning } from './inscriptionOutcome'

const intitules = { 1: 'Excel', 2: 'PSC1', 3: 'Postures' }
const formationName = (pair) => intitules[pair.formationId]

describe('enrollmentSummary (J4, J8)', () => {
  it('liste les réussites et les échecs avec leur raison', () => {
    const summary = enrollmentSummary(
      {
        enrolled: [{ formationId: 1 }, { formationId: 2 }],
        failed: [{ formationId: 3, message: 'Formation archivée, inscription impossible' }],
      },
      { nameOf: formationName, enrolledLabel: 'Inscrit à' },
    )
    expect(summary).toEqual({
      enrolledText: 'Inscrit à : Excel, PSC1.',
      failedText: 'Inscription impossible : Postures (Formation archivée, inscription impossible).',
    })
  })

  it('sépare plusieurs échecs par un point-virgule', () => {
    const { failedText } = enrollmentSummary(
      { enrolled: [], failed: [{ formationId: 1, message: 'A, B' }, { formationId: 2, message: 'C' }] },
      { nameOf: formationName, enrolledLabel: 'Inscrit à' },
    )
    expect(failedText).toBe('Inscription impossible : Excel (A, B) ; PSC1 (C).')
  })

  it('ne renvoie rien pour une partie vide', () => {
    expect(enrollmentSummary({ enrolled: [], failed: [] }, { nameOf: formationName, enrolledLabel: 'Inscrits' })).toEqual({
      enrolledText: null,
      failedText: null,
    })
  })
})

describe('unenrollTitle', () => {
  it('nomme le stagiaire et la formation', () => {
    expect(unenrollTitle('Léa Petit', 'PSC1')).toBe('Désinscrire Léa Petit de « PSC1 » ?')
  })
})

describe('unenrollWarning (J6)', () => {
  it.each([
    [undefined, 'Ses documents déposés sur cette formation seront supprimés définitivement.'],
    [null, 'Ses documents déposés sur cette formation seront supprimés définitivement.'],
    [0, 'Aucun document n’est déposé sur cette formation pour ce stagiaire.'],
    [1, 'Son document déposé sur cette formation sera supprimé définitivement.'],
    [2, 'Ses 2 documents déposés sur cette formation seront supprimés définitivement.'],
  ])('nombre de documents %s', (count, text) => {
    expect(unenrollWarning(count)).toBe(text)
  })
})
