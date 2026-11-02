import { IMPORT_COLUMNS, MODALITES } from './importColumns'

export const TEMPLATE_FILE_NAME = 'modele-import-formations.xlsx'

const IMPORT_SHEET = 'Import' // le back ne lit que la première feuille
const LISTS_SHEET = 'Listes'
const FIRST_DATA_ROW = 2
const LAST_DATA_ROW = 1001 // le back accepte 1000 lignes au plus

// Colonne (1 = A) d'une colonne du fichier, lue dans la définition unique (importColumns.js).
const columnNumber = (key) => IMPORT_COLUMNS.findIndex((column) => column.key === key) + 1
const LIST_ROWS = { categories: 'A', formateurs: 'B' }

const cell = (value) => ({ value })
const bold = (value) => ({ value, fontWeight: 'bold' })

// Catégorie et formateur d'exemple restent vides : à choisir dans la liste déroulante. Un fichier
// importé tel quel est refusé par le back (« valeur manquante ») au lieu de créer une formation fictive.
const LEFT_TO_CHOOSE = new Set(['categorie', 'formateur'])

function importSheet({ categories, formateurs }) {
  const dropdown = (key, validation) => ({
    cellRange: {
      from: { row: FIRST_DATA_ROW, column: columnNumber(key) },
      to: { row: LAST_DATA_ROW, column: columnNumber(key) },
    },
    validation: { type: 'list', errorTitle: 'Valeur non valide', ...validation },
  })
  const listRange = (letter, count) => `${LISTS_SHEET}!$${letter}$2:$${letter}$${count + 1}`

  const dataValidation = [
    dropdown('modalite', { values: MODALITES, error: 'Choisissez VISIO, PRESENTIEL ou MIXTE dans la liste.' }),
  ]
  if (categories.length > 0) {
    dataValidation.push(
      dropdown('categorie', {
        valuesRange: listRange(LIST_ROWS.categories, categories.length),
        error: `Choisissez une catégorie de la liste (onglet « ${LISTS_SHEET} »).`,
      }),
    )
  }
  if (formateurs.length > 0) {
    dataValidation.push(
      dropdown('formateur', {
        valuesRange: listRange(LIST_ROWS.formateurs, formateurs.length),
        error: `Choisissez un formateur de la liste (onglet « ${LISTS_SHEET} »), ou laissez vide.`,
      }),
    )
  }

  return {
    sheet: IMPORT_SHEET,
    data: [
      IMPORT_COLUMNS.map((column) => bold(column.key)),
      IMPORT_COLUMNS.map((column) => cell(LEFT_TO_CHOOSE.has(column.key) ? undefined : column.example)),
    ],
    dataValidation,
  }
}

// Onglet de référence des listes déroulantes : catégories (A), e-mails des formateurs (B) et leur
// nom (C, pour s'y retrouver). Dans une feuille plutôt qu'en ligne : une liste en ligne est limitée
// à 255 caractères et refuse les virgules et les guillemets.
function listsSheet({ categories, formateurs }) {
  const rows = Math.max(categories.length, formateurs.length)
  const data = [[bold('categories'), bold('formateurs (e-mail)'), bold('nom du formateur')]]
  for (let index = 0; index < rows; index += 1) {
    const category = categories[index]
    const formateur = formateurs[index]
    data.push([
      cell(category?.nom),
      cell(formateur?.email),
      cell(formateur ? `${formateur.prenom} ${formateur.nom}` : undefined),
    ])
  }
  return { sheet: LISTS_SHEET, data }
}

// Modèle généré au clic (F18) : il ne peut pas diverger des colonnes attendues. `categories` et
// `formateurs` (actifs, tels que l'API les renvoie) alimentent les listes déroulantes (F24).
// Les bibliothèques sont importées à la demande pour rester hors du bundle d'entrée (D59).
export async function downloadImportTemplate({ categories = [], formateurs = [] } = {}) {
  const [{ default: writeExcelFile }, { default: dataValidation }] = await Promise.all([
    import('write-excel-file/browser'),
    import('@onparallel/write-excel-file-data-validation'),
  ])

  const lists = { categories, formateurs }
  await writeExcelFile([importSheet(lists), listsSheet(lists)], { features: [dataValidation] }).toFile(
    TEMPLATE_FILE_NAME,
  )
}
