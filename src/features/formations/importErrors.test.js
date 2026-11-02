import { describe, expect, it } from 'vitest'
import { parseImportErrors } from './importErrors'

describe('parseImportErrors', () => {
  it('lit une entrée « ligne N, colonne X : texte »', () => {
    expect(parseImportErrors('ligne 3, colonne categorie : "X" introuvable')).toEqual({
      rows: [{ line: 3, column: 'categorie', problem: '"X" introuvable' }],
      others: [],
    })
  })

  it('découpe les entrées jointes par « | »', () => {
    const message =
      'ligne 3, colonne categorie : "X" introuvable | ligne 5, colonne dateDebut : date invalide (attendu AAAA-MM-JJ)'

    expect(parseImportErrors(message).rows).toEqual([
      { line: 3, column: 'categorie', problem: '"X" introuvable' },
      { line: 5, column: 'dateDebut', problem: 'date invalide (attendu AAAA-MM-JJ)' },
    ])
  })

  it('garde un « : » dans le texte du problème', () => {
    const { rows } = parseImportErrors('ligne 2, colonne formateur : "a:b@adac.test" introuvable ou inactif')

    expect(rows).toEqual([{ line: 2, column: 'formateur', problem: '"a:b@adac.test" introuvable ou inactif' }])
  })

  it('range une entrée non reconnue dans others, telle quelle', () => {
    expect(parseImportErrors('Format invalide, seuls les fichiers .xlsx sont acceptés')).toEqual({
      rows: [],
      others: ['Format invalide, seuls les fichiers .xlsx sont acceptés'],
    })
  })

  it('sépare les lignes reconnues des autres entrées, dans l’ordre', () => {
    const message =
      "ligne 2, colonne intitule : valeur manquante | ... et d'autres erreurs (limite de 50 atteinte)"

    expect(parseImportErrors(message)).toEqual({
      rows: [{ line: 2, column: 'intitule', problem: 'valeur manquante' }],
      others: ["... et d'autres erreurs (limite de 50 atteinte)"],
    })
  })

  it('traite le message générique comme une entrée non reconnue', () => {
    const generic = 'Une erreur est survenue. Veuillez réessayer.'

    expect(parseImportErrors(generic)).toEqual({ rows: [], others: [generic] })
  })

  it.each([undefined, null, '', '   '])('ne renvoie rien pour %j', (message) => {
    expect(parseImportErrors(message)).toEqual({ rows: [], others: [] })
  })

  it('ignore les entrées vides et les espaces autour', () => {
    expect(parseImportErrors('  ligne 4, colonne modalite : valeur manquante  |  | ').rows).toEqual([
      { line: 4, column: 'modalite', problem: 'valeur manquante' },
    ])
  })
})
