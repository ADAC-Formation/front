import { useState } from 'react'
import { Link } from 'react-router'
import Alert from '../../../components/atoms/Alert/Alert'
import BackButton from '../../../components/molecules/BackButton/BackButton'
import FormField from '../../../components/molecules/FormField/FormField'
import { PageShell } from '../../../templates/PageShell/PageShell'
import { checkImportFile } from '../../formations/importFile'
import styles from '../../formations/pages/FormationImport.module.css'
import { useImportAccounts } from '../hooks'
import { ACCOUNT_IMPORT_COLUMNS, MAX_ACCOUNT_ROWS } from '../importAccountColumns'
import { downloadAccountTemplate } from '../importAccountTemplate'

const BAD_REQUEST = 400
const TEMPLATE_ERROR = 'Le modèle n’a pas pu être généré. Réessayez.'

const plural = (count, singular, pluralForm) => (count > 1 ? pluralForm : singular)

// Aide du « ? » : règle de la première ligne et colonnes attendues (importAccountColumns.js).
const FormatHelp = ({ id, open }) => (
  <div id={id} className={styles.help} hidden={!open}>
    <h3 className={styles.helpTitle}>Format du fichier</h3>
    <p className={styles.sectionDescription}>
      {`Un fichier Excel (.xlsx) dont la première ligne (l’en-tête) est ignorée, puis une ligne par compte, ${MAX_ACCOUNT_ROWS} au plus. Toutes les colonnes sont obligatoires.`}
    </p>
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <caption className={styles.caption}>Colonnes attendues</caption>
        <thead>
          <tr>
            <th scope="col">Colonne</th>
            <th scope="col">Format</th>
          </tr>
        </thead>
        <tbody>
          {ACCOUNT_IMPORT_COLUMNS.map((column) => (
            <tr key={column.key}>
              <td>
                <code>{column.key}</code>
              </td>
              <td>{column.format}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

const createdMessage = (count) => {
  if (count === 0) return 'Aucun compte n’a été créé.'
  if (count === 1) return '1 compte créé. Il reçoit un e-mail d’activation.'
  return `${count} comptes créés. Chacun reçoit un e-mail d’activation.`
}

// Résultat ligne par ligne (TICKET-051) : comptes créés, puis les lignes refusées dans un tableau
// Ligne / Colonne / Problème. Les textes du back sont rendus en texte.
const ImportResult = ({ result }) => {
  const created = result.created?.length ?? 0
  const errors = result.errors ?? []
  const refusedLines = new Set(errors.map((error) => error.ligne)).size

  return (
    <div className={styles.errors}>
      <Alert variant={created > 0 ? 'success' : 'error'}>{createdMessage(created)}</Alert>

      {errors.length > 0 && (
        <>
          <p className={styles.sectionDescription}>
            {`${refusedLines} ${plural(refusedLines, 'ligne n’a pas été importée', 'lignes n’ont pas été importées')} : corrigez-les puis importez-les à nouveau.`}
          </p>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <caption className={styles.caption}>Lignes non importées</caption>
              <thead>
                <tr>
                  <th scope="col">Ligne</th>
                  <th scope="col">Colonne</th>
                  <th scope="col">Problème</th>
                </tr>
              </thead>
              <tbody>
                {errors.map((error, index) => (
                  <tr key={`${error.ligne}-${error.colonne}-${index}`}>
                    <td>{error.ligne}</td>
                    <td>{error.colonne}</td>
                    <td>{error.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

// Page « Importer des comptes » (NOTES-09) : chargée de formation seulement (route sous RequireRole).
const AccountImportPage = () => {
  const importMutation = useImportAccounts()
  const [file, setFile] = useState(null)
  const [templateError, setTemplateError] = useState(null)
  const [templateBusy, setTemplateBusy] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  const fileError = checkImportFile(file)
  const canSubmit = Boolean(file) && !fileError && !importMutation.isPending
  const error = importMutation.error

  const handleFileChange = (event) => {
    setFile(event.target.files?.[0] ?? null)
    importMutation.reset()
  }

  const handleTemplate = async () => {
    setTemplateError(null)
    setTemplateBusy(true)
    try {
      await downloadAccountTemplate()
    } catch {
      setTemplateError(TEMPLATE_ERROR)
    }
    setTemplateBusy(false)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (canSubmit) importMutation.mutate(file)
  }

  return (
    <PageShell className={styles.page}>
      <BackButton to="/admin/gestion" />

      <header className={styles.header}>
        <h1 className={styles.title}>Importer des comptes</h1>
        <p className={styles.intro}>
          Créez plusieurs comptes de formateurs et de stagiaires d’un coup à partir d’un fichier Excel. Les lignes
          valides sont créées, les autres vous sont signalées pour correction.
        </p>
      </header>

      <div className={styles.card}>
        <form className={styles.section} onSubmit={handleSubmit} noValidate aria-labelledby="import-file">
          <div className={styles.headingRow}>
            <h2 id="import-file" className={styles.sectionTitle}>
              Fichier à importer
            </h2>
            <button
              type="button"
              className={styles.helpButton}
              aria-label="Aide sur le format du fichier"
              aria-expanded={helpOpen}
              aria-controls="import-help"
              onClick={() => setHelpOpen((open) => !open)}
            >
              ?
            </button>
          </div>
          <FormatHelp id="import-help" open={helpOpen} />

          <FormField
            label="Fichier Excel (.xlsx, 2 Mo au plus)"
            type="file"
            name="file"
            accept=".xlsx"
            error={fileError ?? undefined}
            onChange={handleFileChange}
          />
          {file && !fileError && <p className={styles.fileName}>{`Fichier choisi : ${file.name}`}</p>}

          <div className={styles.template}>
            <h3 className={styles.helpTitle}>Modèle</h3>
            <p className={styles.sectionDescription}>
              Téléchargez un fichier prêt à remplir, avec les bonnes colonnes et une liste déroulante pour le rôle.
            </p>
            <button type="button" className={styles.secondaryButton} onClick={handleTemplate} disabled={templateBusy}>
              Télécharger le modèle
            </button>
            {templateError && <Alert variant="error">{templateError}</Alert>}
          </div>

          {importMutation.data && <ImportResult result={importMutation.data} />}

          {error && (
            <div className={styles.errors}>
              <Alert variant="error">
                {error.status === BAD_REQUEST
                  ? `Le fichier n’a pas été importé : ${error.message}. Aucun compte n’a été créé.`
                  : error.message}
              </Alert>
            </div>
          )}

          <div className={styles.actions}>
            <Link className={styles.cancelButton} to="/admin/gestion">
              Annuler
            </Link>
            <button type="submit" className={styles.submitButton} disabled={!canSubmit}>
              Importer
            </button>
          </div>
        </form>
      </div>
    </PageShell>
  )
}

export default AccountImportPage
