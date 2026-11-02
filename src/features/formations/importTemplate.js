import { IMPORT_COLUMNS } from './importColumns'

export const TEMPLATE_FILE_NAME = 'modele-import-formations.xlsx'

// Modèle généré au clic (F18) : il ne peut pas diverger des colonnes attendues. La bibliothèque
// est importée à la demande pour rester hors du bundle d'entrée (D59).
export async function downloadImportTemplate() {
  const { default: writeExcelFile } = await import('write-excel-file/browser')

  const header = IMPORT_COLUMNS.map((column) => ({ value: column.key, fontWeight: 'bold' }))
  const example = IMPORT_COLUMNS.map((column) => ({ value: column.example }))

  await writeExcelFile([header, example]).toFile(TEMPLATE_FILE_NAME)
}
