import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import Alert from '../../../components/atoms/Alert/Alert'
import BackButton from '../../../components/molecules/BackButton/BackButton'
import FormField from '../../../components/molecules/FormField/FormField'
import { PageShell } from '../../../templates/PageShell/PageShell'
import { useCategories } from '../../categories/hooks'
import { emptyValues, fromType, toRequest, validateDocumentType } from '../documentTypeForm'
import { DEADLINE_ANCHOR_LABELS, FORMATS } from '../documentTypeLabels'
import { useCreateDocumentType, useDocumentTypes, useUpdateDocumentType } from '../hooks'
import styles from './DocumentTypePages.module.css'

const LIST_PATH = '/admin/documents'
const CONFLICT = 409

const toggle = (list, value) => (list.includes(value) ? list.filter((item) => item !== value) : [...list, value])

// Les formats gardent l'ordre de la liste, quel que soit l'ordre des clics : corps envoyé stable.
const toggleFormat = (selected, value) =>
  FORMATS.map((format) => format.value).filter((candidate) =>
    candidate === value ? !selected.includes(candidate) : selected.includes(candidate),
  )

// Catégories proposées : les actives, plus celles déjà liées au type même désactivées (design.md § 6).
function categoryChoices(categories, type) {
  const choices = new Map()
  for (const category of categories) if (category.isActive) choices.set(category.id, category)
  for (const category of type?.categories ?? []) choices.set(category.id, categories.find((c) => c.id === category.id) ?? category)
  return [...choices.values()]
}

const CategoryChoices = ({ type, selected, onToggle, error }) => {
  const { data, isLoading, isError, error: loadError } = useCategories()
  if (isLoading) return <p role="status">Chargement des catégories…</p>
  if (isError) return <Alert variant="error">{loadError.message}</Alert>

  return (
    <>
      <div className={styles.choices}>
        {categoryChoices(data, type).map((category) => (
          <label key={category.id} className={styles.choice}>
            <input
              type="checkbox"
              checked={selected.includes(category.id)}
              onChange={() => onToggle(category.id)}
            />
            {category.nom}
          </label>
        ))}
      </div>
      {error && (
        <Alert variant="error" id="categoryIds-error">
          {error}
        </Alert>
      )}
    </>
  )
}

// Formulaire commun à la création et à la modification : état local, règles dans documentTypeForm.js.
const DocumentTypeForm = ({ type }) => {
  const navigate = useNavigate()
  const create = useCreateDocumentType()
  const update = useUpdateDocumentType(type?.id)
  const mutation = type ? update : create

  const [values, setValues] = useState(() => (type ? fromType(type) : emptyValues()))
  const [errors, setErrors] = useState({})
  const [nameConflict, setNameConflict] = useState(null)

  const set = (patch) => setValues((current) => ({ ...current, ...patch }))
  const nameError = errors.nom ?? nameConflict

  const submit = async (event) => {
    event.preventDefault()
    const found = validateDocumentType(values)
    setErrors(found)
    setNameConflict(null)
    if (Object.keys(found).length > 0) return

    try {
      await mutation.mutateAsync(toRequest(values))
      navigate(LIST_PATH, { state: { notice: type ? 'document-type-updated' : 'document-type-created' } })
    } catch (error) {
      if (error.status === CONFLICT) setNameConflict(error.message)
    }
  }

  const otherError = mutation.error && mutation.error.status !== CONFLICT ? mutation.error : null

  return (
    <PageShell className={styles.page}>
      <BackButton to={LIST_PATH} />

      <h1 className={`${styles.title} ${styles.pageTitle}`}>
        {type ? `Modifier ${type.nom}` : 'Nouveau type de document'}
      </h1>
      <p className={styles.intro}>
        {type
          ? 'Les changements s’appliquent aux formations en cours.'
          : 'Un type de document décrit une pièce que les stagiaires doivent ou peuvent fournir.'}
      </p>

      <form className={`${styles.card} ${styles.form}`} onSubmit={submit} noValidate>
        {otherError && <Alert variant="error">{otherError.message}</Alert>}

        <FormField
          label="Nom"
          name="nom"
          autoComplete="off"
          required
          value={values.nom}
          error={nameError}
          onChange={(event) => {
            setNameConflict(null)
            set({ nom: event.target.value })
          }}
        />

        <FormField
          as="textarea"
          label="Texte d’aide"
          name="aide"
          rows={3}
          value={values.aide}
          error={errors.aide}
          onChange={(event) => set({ aide: event.target.value })}
        />

        <fieldset className={styles.group}>
          <legend>Caractéristiques</legend>
          <label className={styles.choice}>
            <input
              type="checkbox"
              checked={values.isRequired}
              onChange={(event) => set({ isRequired: event.target.checked })}
            />
            Obligatoire
          </label>
          <label className={styles.choice}>
            <input
              type="checkbox"
              checked={values.isSensitive}
              onChange={(event) => set({ isSensitive: event.target.checked })}
            />
            Sensible
          </label>
        </fieldset>

        <fieldset className={styles.group}>
          <legend>Portée</legend>
          <label className={styles.choice}>
            <input
              type="radio"
              name="scope"
              checked={values.scope === 'all'}
              onChange={() => set({ scope: 'all' })}
            />
            Toutes les formations
          </label>
          <label className={styles.choice}>
            <input
              type="radio"
              name="scope"
              checked={values.scope === 'categories'}
              onChange={() => set({ scope: 'categories' })}
            />
            Certaines catégories
          </label>
        </fieldset>

        {values.scope === 'categories' && (
          <fieldset className={styles.group} aria-describedby={errors.categoryIds ? 'categoryIds-error' : undefined}>
            <legend>Catégories concernées</legend>
            <CategoryChoices
              type={type}
              selected={values.categoryIds}
              error={errors.categoryIds}
              onToggle={(id) => set({ categoryIds: toggle(values.categoryIds, id) })}
            />
          </fieldset>
        )}

        <div className={styles.deadline}>
          <FormField
            as="select"
            label="Délai"
            name="deadlineAnchor"
            value={values.deadlineAnchor}
            onChange={(event) => set({ deadlineAnchor: event.target.value })}
          >
            <option value="">Aucun délai</option>
            {Object.entries(DEADLINE_ANCHOR_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </FormField>

          {values.deadlineAnchor !== '' && (
            <FormField
              label="Nombre de jours"
              name="deadlineDays"
              inputMode="numeric"
              autoComplete="off"
              value={values.deadlineDays}
              error={errors.deadlineDays}
              onChange={(event) => set({ deadlineDays: event.target.value })}
            />
          )}
        </div>

        <fieldset className={styles.group}>
          <legend>Formats acceptés</legend>
          <div className={styles.choices}>
            {FORMATS.map((format) => (
              <label key={format.value} className={styles.choice}>
                <input
                  type="checkbox"
                  checked={values.allowedFormats.includes(format.value)}
                  onChange={() => set({ allowedFormats: toggleFormat(values.allowedFormats, format.value) })}
                />
                {format.label}
              </label>
            ))}
          </div>
          <p className={styles.hint}>
            Sans format coché, la règle générale s’applique : PDF, JPG, JPEG, PNG, DOCX, XLSX, 10 Mo.
          </p>
        </fieldset>

        <div className={styles.formActions}>
          <Link className={styles.cancelButton} to={LIST_PATH}>
            Annuler
          </Link>
          <button type="submit" className={styles.submitButton} disabled={mutation.isPending}>
            {type ? 'Enregistrer' : 'Créer le type'}
          </button>
        </div>
      </form>
    </PageShell>
  )
}

const NotFound = () => (
  <PageShell className={styles.page}>
    <BackButton to={LIST_PATH} />
    <Alert variant="error">Type de document introuvable</Alert>
  </PageShell>
)

// Modification : le type est lu dans la liste (aucun `GET /{id}` côté back, design.md § 8).
const EditDocumentType = ({ id }) => {
  const { data, isLoading, isError, error } = useDocumentTypes()

  if (isLoading) {
    return (
      <PageShell className={styles.page}>
        <p role="status">Chargement…</p>
      </PageShell>
    )
  }
  if (isError) {
    return (
      <PageShell className={styles.page}>
        <BackButton to={LIST_PATH} />
        <Alert variant="error">{error.message}</Alert>
      </PageShell>
    )
  }

  const type = data.find((candidate) => candidate.id === Number(id))
  return type ? <DocumentTypeForm key={type.id} type={type} /> : <NotFound />
}

// `/admin/documents/nouveau` (création) ou `/admin/documents/:id/modifier` (modification).
const DocumentTypeFormPage = () => {
  const { id } = useParams()
  return id ? <EditDocumentType id={id} /> : <DocumentTypeForm />
}

export default DocumentTypeFormPage
