import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import Alert from '../../../components/atoms/Alert/Alert'
import BackButton from '../../../components/molecules/BackButton/BackButton'
import FormField from '../../../components/molecules/FormField/FormField'
import { PageShell } from '../../../templates/PageShell/PageShell'
import { useImportFormations } from '../hooks'
import { IMPORT_COLUMNS } from '../importColumns'
import { parseImportErrors } from '../importErrors'
import { checkImportFile } from '../importFile'
import { downloadImportTemplate } from '../importTemplate'
import styles from './FormationImport.module.css'

const BAD_REQUEST = 400
const TEMPLATE_ERROR = 'Le modèle n’a pas pu être généré. Réessayez.'

const plural = (count, singular, pluralForm) => (count > 1 ? pluralForm : singular)

// Consignes : colonnes attendues (provisoires, importColumns.js) et règle de la première ligne.
const ColumnsGuide = () => (
  <section className={styles.section} aria-labelledby="import-format">
    <h2 id="import-format" className={styles.sectionTitle}>
      Format du fichier
    </h2>
    <p className={styles.sectionDescription}>
      Un fichier Excel (.xlsx) dont la première ligne (l’en-tête) est ignorée, puis une ligne par formation. Si la
      colonne <code>formateur</code> est vide, la chargée de formation est assignée.
    </p>
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <caption className={styles.caption}>Colonnes attendues</caption>
        <thead>
          <tr>
            <th scope="col">Colonne</th>
            <th scope="col">Obligatoire</th>
            <th scope="col">Format</th>
          </tr>
        </thead>
        <tbody>
          {IMPORT_COLUMNS.map((column) => (
            <tr key={column.key}>
              <td>
                <code>{column.key}</code>
              </td>
              <td>{column.required ? 'Oui' : 'Non'}</td>
              <td>{column.format}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
)

// Retour d'un fichier refusé (400) : tableau Ligne / Colonne / Problème, puis les entrées que
// le front ne sait pas lire, telles quelles (F20). Les textes du back sont rendus en texte.
const ImportErrors = ({ message }) => {
  const { rows, others } = parseImportErrors(message)
  const total = rows.length + others.length

  return (
    <div className={styles.errors}>
      <Alert variant="error">
        {`Le fichier n’a pas été importé : ${total} ${plural(total, 'erreur', 'erreurs')}. Aucune formation n’a été créée.`}
      </Alert>

      {rows.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <caption className={styles.caption}>Erreurs du fichier</caption>
            <thead>
              <tr>
                <th scope="col">Ligne</th>
                <th scope="col">Colonne</th>
                <th scope="col">Problème</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row.line}-${row.column}-${index}`}>
                  <td>{row.line}</td>
                  <td>{row.column}</td>
                  <td>{row.problem}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {others.length > 0 && (
        <ul className={styles.otherErrors} aria-label="Autres erreurs">
          {others.map((entry, index) => (
            <li key={`${entry}-${index}`}>{entry}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

const FormationImportPage = () => {
  const navigate = useNavigate()
  const importMutation = useImportFormations()
  const [file, setFile] = useState(null)
  const [templateError, setTemplateError] = useState(false)

  const fileError = checkImportFile(file)
  const canSubmit = Boolean(file) && !fileError && !importMutation.isPending
  const error = importMutation.error

  const handleFileChange = (event) => {
    setFile(event.target.files?.[0] ?? null)
    importMutation.reset()
  }

  const handleTemplate = async () => {
    setTemplateError(false)
    try {
      await downloadImportTemplate()
    } catch {
      setTemplateError(true)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!canSubmit) return
    importMutation.mutate(file, {
      onSuccess: (created) =>
        navigate('/formations', {
          state: { notice: 'formations-imported', count: Array.isArray(created) ? created.length : 0 },
        }),
    })
  }

  return (
    <PageShell className={styles.page}>
      <BackButton to="/formations" />

      <header className={styles.header}>
        <h1 className={styles.title}>Importer des formations</h1>
        <p className={styles.intro}>
          Créez plusieurs formations d’un coup à partir d’un fichier Excel. Si une ligne est invalide, aucune formation
          n’est créée.
        </p>
      </header>

      <div className={styles.card}>
        <ColumnsGuide />

        <section className={styles.section} aria-labelledby="import-template">
          <h2 id="import-template" className={styles.sectionTitle}>
            Modèle
          </h2>
          <p className={styles.sectionDescription}>Téléchargez un fichier prêt à remplir, avec les bonnes colonnes.</p>
          <button type="button" className={styles.secondaryButton} onClick={handleTemplate}>
            Télécharger le modèle
          </button>
          {templateError && <Alert variant="error">{TEMPLATE_ERROR}</Alert>}
        </section>

        <form className={styles.section} onSubmit={handleSubmit} noValidate aria-labelledby="import-file">
          <h2 id="import-file" className={styles.sectionTitle}>
            Fichier à importer
          </h2>

          <FormField
            label="Fichier Excel (.xlsx, 2 Mo au plus)"
            type="file"
            name="file"
            accept=".xlsx"
            error={fileError ?? undefined}
            onChange={handleFileChange}
          />
          {file && !fileError && <p className={styles.fileName}>{`Fichier choisi : ${file.name}`}</p>}

          {error &&
            (error.status === BAD_REQUEST ? (
              <ImportErrors message={error.message} />
            ) : (
              <div className={styles.errors}>
                <Alert variant="error">{error.message}</Alert>
              </div>
            ))}

          <div className={styles.actions}>
            <Link className={styles.cancelButton} to="/formations">
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

export default FormationImportPage
