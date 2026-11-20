import { ACCOUNT_IMPORT_COLUMNS, ACCOUNT_ROLE_LABELS, MAX_ACCOUNT_ROWS } from './importAccountColumns'

export const ACCOUNT_TEMPLATE_FILE_NAME = 'modele-import-comptes.xlsx'

const SHEET = 'Comptes' // le back ne lit que la première feuille
const FIRST_DATA_ROW = 2
const ROLE_COLUMN = ACCOUNT_IMPORT_COLUMNS.findIndex((column) => column.key === 'role') + 1 // 1 = colonne A

const bold = (value) => ({ value, fontWeight: 'bold' })

function accountSheet() {
  return {
    sheet: SHEET,
    data: [
      ACCOUNT_IMPORT_COLUMNS.map((column) => bold(column.key)),
      ACCOUNT_IMPORT_COLUMNS.map((column) => ({ value: column.example })),
    ],
    dataValidation: [
      {
        cellRange: {
          from: { row: FIRST_DATA_ROW, column: ROLE_COLUMN },
          to: { row: FIRST_DATA_ROW + MAX_ACCOUNT_ROWS - 1, column: ROLE_COLUMN },
        },
        validation: {
          type: 'list',
          values: ACCOUNT_ROLE_LABELS,
          errorTitle: 'Valeur non valide',
          error: 'Choisissez Formateur ou Stagiaire dans la liste.',
        },
      },
    ],
  }
}

// Modèle généré au clic, comme celui des formations (F18) : il ne peut pas diverger des colonnes attendues.
// Les bibliothèques sont importées à la demande pour rester hors du bundle d'entrée (D59).
export async function downloadAccountTemplate() {
  const [{ default: writeExcelFile }, { default: dataValidation }] = await Promise.all([
    import('write-excel-file/browser'),
    import('@onparallel/write-excel-file-data-validation'),
  ])
  await writeExcelFile([accountSheet()], { features: [dataValidation] }).toFile(ACCOUNT_TEMPLATE_FILE_NAME)
}
