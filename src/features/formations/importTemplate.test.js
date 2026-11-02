import { beforeEach, describe, expect, it, vi } from 'vitest'
import { IMPORT_COLUMNS } from './importColumns'
import { downloadImportTemplate, TEMPLATE_FILE_NAME } from './importTemplate'

// Les bibliothèques sont mockées : le vrai contenu du .xlsx (listes déroulantes comprises) est
// vérifié au passage manuel.
const toFile = vi.fn().mockResolvedValue(undefined)
const writeExcelFile = vi.fn(() => ({ toFile }))
const dataValidationFeature = { name: 'data-validation' }

vi.mock('write-excel-file/browser', () => ({ default: (...args) => writeExcelFile(...args) }))
vi.mock('@onparallel/write-excel-file-data-validation', () => ({ default: dataValidationFeature }))

const CATEGORIES = [{ nom: 'Secourisme' }, { nom: 'Numérique, avancé' }, { nom: 'Gestes "pro"' }]
const FORMATEURS = [
  { email: 'anne@adac.test', prenom: 'Anne', nom: 'Martin' },
  { email: 'paul@adac.test', prenom: 'Paul', nom: 'Durand' },
]

const valueOf = (cell) => (cell !== null && typeof cell === 'object' ? cell.value : cell)
const column = (key) => IMPORT_COLUMNS.findIndex((c) => c.key === key) + 1 // 1 = colonne A

async function generate(lists = { categories: CATEGORIES, formateurs: FORMATEURS }) {
  await downloadImportTemplate(lists)
  const [sheets, options] = writeExcelFile.mock.calls[0]
  const [importSheet, listsSheet] = sheets
  const validationOf = (key) =>
    importSheet.dataValidation.find(({ cellRange }) => cellRange.from.column === column(key))
  return { sheets, options, importSheet, listsSheet, validationOf }
}

beforeEach(() => {
  toFile.mockClear()
  writeExcelFile.mockClear()
})

describe('downloadImportTemplate — feuille Import', () => {
  it('est la première feuille (le back ne lit que celle-là), nommée Import', async () => {
    const { sheets, importSheet } = await generate()
    expect(sheets).toHaveLength(2)
    expect(importSheet.sheet).toBe('Import')
  })

  it('met les colonnes attendues, dans l’ordre A à G, sur la première ligne', async () => {
    const { importSheet } = await generate()
    expect(importSheet.data[0].map(valueOf)).toEqual(IMPORT_COLUMNS.map((c) => c.key))
  })

  it('ajoute une ligne d’exemple dont catégorie et formateur restent à choisir dans la liste', async () => {
    const { importSheet } = await generate()
    const example = importSheet.data[1].map(valueOf)
    const exampleOf = (key) => example[column(key) - 1]

    expect(importSheet.data).toHaveLength(2)
    expect(exampleOf('intitule')).toBe(IMPORT_COLUMNS[0].example)
    expect(exampleOf('dateDebut')).toBe('2026-03-10')
    expect(exampleOf('modalite')).toBe('PRESENTIEL')
    expect(exampleOf('categorie')).toBeUndefined()
    expect(exampleOf('formateur')).toBeUndefined()
  })
})

describe('downloadImportTemplate — listes déroulantes', () => {
  it('enregistre la fonctionnalité de validation de données', async () => {
    const { options } = await generate()
    expect(options.features).toEqual([dataValidationFeature])
  })

  it('propose VISIO, PRESENTIEL et MIXTE pour la modalité, sur les lignes 2 à 1001', async () => {
    const { validationOf } = await generate()
    const { cellRange, validation } = validationOf('modalite')

    expect(cellRange.from).toEqual({ row: 2, column: column('modalite') })
    expect(cellRange.to).toEqual({ row: 1001, column: column('modalite') })
    expect(validation.type).toBe('list')
    expect(validation.values).toEqual(['VISIO', 'PRESENTIEL', 'MIXTE'])
  })

  it('propose les catégories actives depuis l’onglet Listes, colonne A', async () => {
    const { validationOf } = await generate()
    const { cellRange, validation } = validationOf('categorie')

    expect(cellRange.to.row).toBe(1001)
    expect(validation.type).toBe('list')
    expect(validation.valuesRange).toBe('Listes!$A$2:$A$4')
  })

  it('propose les e-mails des formateurs actifs depuis l’onglet Listes, colonne B', async () => {
    const { validationOf } = await generate()

    expect(validationOf('formateur').validation.valuesRange).toBe('Listes!$B$2:$B$3')
  })

  it('refuse (stop) une valeur hors liste, avec un message en français', async () => {
    const { validationOf } = await generate()
    for (const key of ['modalite', 'categorie', 'formateur']) {
      const { validation } = validationOf(key)
      expect(validation.error, key).toMatch(/liste|choisissez/i)
      expect(validation.errorStyle ?? 'stop', key).toBe('stop')
    }
  })

  it('accepte une catégorie contenant virgule ou guillemets (liste dans une feuille, pas en ligne)', async () => {
    const { listsSheet } = await generate()
    const names = listsSheet.data.slice(1).map((row) => valueOf(row[0]))
    expect(names).toEqual(['Secourisme', 'Numérique, avancé', 'Gestes "pro"'])
  })
})

describe('downloadImportTemplate — feuille Listes', () => {
  it('est la seconde feuille, nommée Listes', async () => {
    const { listsSheet } = await generate()
    expect(listsSheet.sheet).toBe('Listes')
  })

  it('a un en-tête puis catégories (A), e-mails (B) et noms des formateurs (C)', async () => {
    const { listsSheet } = await generate()
    const rows = listsSheet.data.map((row) => row.map(valueOf))

    expect(rows[0]).toHaveLength(3)
    expect(rows[1]).toEqual(['Secourisme', 'anne@adac.test', 'Anne Martin'])
    expect(rows[2]).toEqual(['Numérique, avancé', 'paul@adac.test', 'Paul Durand'])
    expect(rows[3][0]).toBe('Gestes "pro"')
    expect(rows[3][1]).toBeUndefined()
  })

  it('ne crée pas de liste déroulante pour une liste vide', async () => {
    const { importSheet } = await generate({ categories: [], formateurs: FORMATEURS })
    const columns = importSheet.dataValidation.map(({ cellRange }) => cellRange.from.column)

    expect(columns).not.toContain(column('categorie'))
    expect(columns).toContain(column('formateur'))
    expect(columns).toContain(column('modalite'))
  })
})

describe('downloadImportTemplate — fichier', () => {
  it('enregistre le fichier sous modele-import-formations.xlsx', async () => {
    await generate()

    expect(TEMPLATE_FILE_NAME).toBe('modele-import-formations.xlsx')
    expect(toFile).toHaveBeenCalledWith('modele-import-formations.xlsx')
  })

  it('génère un modèle même sans listes (modalité seule)', async () => {
    await downloadImportTemplate()
    expect(toFile).toHaveBeenCalledTimes(1)
  })

  it('laisse remonter une erreur de génération', async () => {
    toFile.mockRejectedValueOnce(new Error('boom'))

    await expect(downloadImportTemplate({ categories: [], formateurs: [] })).rejects.toThrow('boom')
  })
})
