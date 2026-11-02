import { describe, expect, it } from 'vitest'
import { IMPORT_COLUMNS, MODALITES } from './importColumns'

// Colonnes provisoires de tech.md § POST /formations/import (R10 : à refaire quand le fichier
// réel d'ADAC arrive).
describe('IMPORT_COLUMNS', () => {
  it('suit l’ordre A à G de tech.md', () => {
    expect(IMPORT_COLUMNS.map((column) => column.key)).toEqual([
      'intitule',
      'description',
      'dateDebut',
      'dateFin',
      'modalite',
      'categorie',
      'formateur',
    ])
  })

  it('marque obligatoires toutes les colonnes sauf description et formateur', () => {
    const optional = IMPORT_COLUMNS.filter((column) => !column.required).map((column) => column.key)

    expect(optional).toEqual(['description', 'formateur'])
  })

  it('donne un format et un exemple non vides à chaque colonne', () => {
    for (const column of IMPORT_COLUMNS) {
      expect(column.format, column.key).toBeTruthy()
      expect(column.example, column.key).toBeTruthy()
    }
  })

  it('propose un exemple de modalité accepté par le back', () => {
    const modalite = IMPORT_COLUMNS.find((column) => column.key === 'modalite')

    expect(MODALITES).toContain(modalite.example)
  })

  it('accepte VISIO, PRESENTIEL et MIXTE', () => {
    expect(MODALITES).toEqual(['VISIO', 'PRESENTIEL', 'MIXTE'])
  })

  it('met les dates d’exemple au format AAAA-MM-JJ, la fin pas avant le début', () => {
    const example = (key) => IMPORT_COLUMNS.find((column) => column.key === key).example

    expect(example('dateDebut')).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(example('dateFin')).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(example('dateFin') >= example('dateDebut')).toBe(true)
  })
})
