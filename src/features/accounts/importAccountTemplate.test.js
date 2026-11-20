import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ACCOUNT_IMPORT_COLUMNS, ACCOUNT_ROLE_LABELS } from './importAccountColumns'
import { ACCOUNT_TEMPLATE_FILE_NAME, downloadAccountTemplate } from './importAccountTemplate'

// Les bibliothèques sont mockées : le vrai contenu du .xlsx est vérifié au passage manuel.
const toFile = vi.fn().mockResolvedValue(undefined)
const writeExcelFile = vi.fn(() => ({ toFile }))
const dataValidationFeature = { name: 'data-validation' }

vi.mock('write-excel-file/browser', () => ({ default: (...args) => writeExcelFile(...args) }))
vi.mock('@onparallel/write-excel-file-data-validation', () => ({ default: dataValidationFeature }))

const valueOf = (cell) => (cell !== null && typeof cell === 'object' ? cell.value : cell)

async function generate() {
  await downloadAccountTemplate()
  const [sheets, options] = writeExcelFile.mock.calls[0]
  return { sheets, options, sheet: sheets[0] }
}

beforeEach(() => {
  toFile.mockClear()
  writeExcelFile.mockClear()
})

describe('downloadAccountTemplate (NOTES-09)', () => {
  it('écrit une seule feuille, avec les colonnes nom, prenom, email, role sur la première ligne', async () => {
    const { sheets, sheet } = await generate()
    expect(sheets).toHaveLength(1)
    expect(sheet.data[0].map(valueOf)).toEqual(['nom', 'prenom', 'email', 'role'])
    expect(ACCOUNT_IMPORT_COLUMNS.map((column) => column.key)).toEqual(['nom', 'prenom', 'email', 'role'])
  })

  it('ajoute une ligne d’exemple', async () => {
    const { sheet } = await generate()
    expect(sheet.data[1].map(valueOf)).toEqual(ACCOUNT_IMPORT_COLUMNS.map((column) => column.example))
  })

  it('propose Formateur et Stagiaire en liste déroulante sur les 200 lignes de la colonne role', async () => {
    const { sheet, options } = await generate()
    expect(options.features).toEqual([dataValidationFeature])
    expect(sheet.dataValidation).toHaveLength(1)
    const [{ cellRange, validation }] = sheet.dataValidation
    expect(cellRange).toEqual({ from: { row: 2, column: 4 }, to: { row: 201, column: 4 } })
    expect(validation).toMatchObject({ type: 'list', values: ACCOUNT_ROLE_LABELS })
    expect(ACCOUNT_ROLE_LABELS).toEqual(['Formateur', 'Stagiaire'])
  })

  it('enregistre le fichier sous le nom du modèle', async () => {
    await generate()
    expect(toFile).toHaveBeenCalledWith(ACCOUNT_TEMPLATE_FILE_NAME)
    expect(ACCOUNT_TEMPLATE_FILE_NAME).toBe('modele-import-comptes.xlsx')
  })
})
