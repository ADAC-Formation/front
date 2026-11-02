import { beforeEach, describe, expect, it, vi } from 'vitest'
import { IMPORT_COLUMNS } from './importColumns'
import { downloadImportTemplate, TEMPLATE_FILE_NAME } from './importTemplate'

// La bibliothèque est mockée : le vrai contenu du .xlsx est vérifié au passage manuel.
const toFile = vi.fn().mockResolvedValue(undefined)
const writeExcelFile = vi.fn(() => ({ toFile }))

vi.mock('write-excel-file/browser', () => ({ default: (...args) => writeExcelFile(...args) }))

const valueOf = (cell) => (cell !== null && typeof cell === 'object' ? cell.value : cell)

beforeEach(() => {
  toFile.mockClear()
  writeExcelFile.mockClear()
})

describe('downloadImportTemplate', () => {
  it('met les colonnes attendues, dans l’ordre A à G, sur la première ligne', async () => {
    await downloadImportTemplate()

    const [sheetData] = writeExcelFile.mock.calls[0]
    expect(sheetData[0].map(valueOf)).toEqual(IMPORT_COLUMNS.map((column) => column.key))
  })

  it('ajoute une ligne d’exemple alignée sur les colonnes', async () => {
    await downloadImportTemplate()

    const [sheetData] = writeExcelFile.mock.calls[0]
    expect(sheetData).toHaveLength(2)
    expect(sheetData[1].map(valueOf)).toEqual(IMPORT_COLUMNS.map((column) => column.example))
  })

  it('enregistre le fichier sous modele-import-formations.xlsx', async () => {
    await downloadImportTemplate()

    expect(TEMPLATE_FILE_NAME).toBe('modele-import-formations.xlsx')
    expect(toFile).toHaveBeenCalledWith('modele-import-formations.xlsx')
  })

  it('laisse remonter une erreur de génération', async () => {
    toFile.mockRejectedValueOnce(new Error('boom'))

    await expect(downloadImportTemplate()).rejects.toThrow('boom')
  })
})
