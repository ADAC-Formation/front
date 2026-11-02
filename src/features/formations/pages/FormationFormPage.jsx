import { useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router'
import Alert from '../../../components/atoms/Alert/Alert'
import BackButton from '../../../components/molecules/BackButton/BackButton'
import FormField from '../../../components/molecules/FormField/FormField'
import { PageShell } from '../../../templates/PageShell/PageShell'
import { ROLES } from '../../../utils/roles'
import { validateRequired } from '../../../utils/validation'
import { useAccounts } from '../../accounts/hooks'
import { useCurrentUser } from '../../auth/hooks'
import CategoryFormDialog from '../../categories/components/CategoryFormDialog'
import { useCategories, useCreateCategory } from '../../categories/hooks'
import { EMPTY_VALUES, changedFields, nextEndDate, toRequest, validateDateRange, valuesFromFormation } from '../formationForm'
import { modaliteLabel } from '../formationLabels'
import { useCreateFormation, useFormation, useUpdateFormation } from '../hooks'
import styles from './FormationForm.module.css'

const MODALITES = ['VISIO', 'PRESENTIEL', 'MIXTE']
const AUTO_FORMATEUR_LABEL = 'Assigné à la chargée de formation'

// Catégorie et formateur d'une formation existante restent choisissables même s'ils ne figurent
// plus dans la liste des actifs (catégorie désactivée, formateur suspendu) : on ne les perd pas
// à la modification, mais on ne les propose pas pour une autre formation.
function categoryOptions(categories, formation) {
  const options = categories.map((category) => ({ value: String(category.id), label: category.nom, couleur: category.couleur }))
  const current = formation?.category
  if (current && !categories.some((category) => category.id === current.id)) {
    options.push({ value: String(current.id), label: `${current.nom} (désactivée)`, couleur: current.couleur })
  }
  return options
}

// Création d'une catégorie sans quitter le formulaire (C6) : la boîte est hors du `<form>` pour que
// sa validation ne soumette pas la formation. La catégorie créée est ensuite sélectionnée.
const CreateCategoryDialog = ({ onCreated, onCancel }) => {
  const create = useCreateCategory()
  return (
    <CategoryFormDialog
      error={create.error?.message}
      isPending={create.isPending}
      onCancel={onCancel}
      onSubmit={(request) => create.mutate(request, { onSuccess: onCreated })}
    />
  )
}

function formateurOptions(formateurs, formation) {
  const options = formateurs.map((formateur) => ({
    value: String(formateur.id),
    label: `${formateur.prenom} ${formateur.nom}`,
  }))
  const current = formation?.formateur
  const isListed = current && formateurs.some((formateur) => formateur.id === current.id)
  if (current && current.role !== ROLES.SUPER_ADMIN && !isListed) {
    options.push({ value: String(current.id), label: `${current.prenom} ${current.nom}` })
  }
  return options
}

// Chargement d'une liste de choix : message annoncé, ou erreur avec « Réessayer ».
const ChoiceNotice = ({ query, loadingLabel }) => {
  if (query.isLoading) return <p role="status">{loadingLabel}</p>
  if (!query.isError) return null
  return (
    <div className={styles.fieldNotice}>
      <Alert variant="error">{query.error.message}</Alert>
      <button type="button" className={styles.secondaryButton} onClick={() => query.refetch()}>
        Réessayer
      </button>
    </div>
  )
}

const FormationForm = ({ formation, onReload }) => {
  const navigate = useNavigate()
  const { user } = useCurrentUser()
  const create = useCreateFormation()
  const update = useUpdateFormation(formation?.id)
  const mutation = formation ? update : create

  const categories = useCategories({ active: true })
  const formateurs = useAccounts('formateurs', { active: true })

  const defaultValues = formation ? valuesFromFormation(formation) : EMPTY_VALUES
  const [previousStart, setPreviousStart] = useState(defaultValues.dateDebut)

  const { register, handleSubmit, setValue, getValues, control, formState: { errors } } = useForm({ defaultValues })
  const chosenCategoryId = useWatch({ control, name: 'categoryId' })

  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [createdCategory, setCreatedCategory] = useState(null)
  const createCategoryButton = useRef(null)
  // Une fois la catégorie créée et la liste rechargée, elle devient le choix du formulaire.
  useEffect(() => {
    if (createdCategory) setValue('categoryId', String(createdCategory.id), { shouldValidate: true })
  }, [createdCategory, setValue])
  const closeCategoryDialog = () => {
    setIsCreatingCategory(false)
    createCategoryButton.current?.focus()
  }

  const goTo = (id, notice) => navigate(`/formations/${id}`, notice ? { state: { notice } } : undefined)

  const submit = async (values) => {
    try {
      if (formation) {
        const changes = changedFields(formation, values, { trainingOfficerId: user?.id ?? null })
        if (Object.keys(changes).length === 0) return goTo(formation.id)
        await update.mutateAsync(changes)
        goTo(formation.id, 'formation-updated')
      } else {
        const created = await create.mutateAsync(toRequest(values))
        goTo(created.id, 'formation-created')
      }
    } catch {
      // L'erreur est affichée dans le bandeau (mutation.error) ; la saisie est conservée.
    }
  }

  const startField = register('dateDebut', {
    validate: (value) => validateRequired(value, 'La date de début') ?? true,
    onChange: (event) => {
      const start = event.target.value
      setValue('dateFin', nextEndDate(previousStart, start, getValues('dateFin')))
      setPreviousStart(start)
    },
  })

  const categoriesReady = categories.isSuccess
  const hasConflict = mutation.error?.status === 409
  const cancelPath = formation ? `/formations/${formation.id}` : '/formations'
  const categorySelectOptions = categoryOptions(categories.data ?? [], formation)
  if (createdCategory && !categorySelectOptions.some(({ value }) => value === String(createdCategory.id))) {
    categorySelectOptions.push({ value: String(createdCategory.id), label: createdCategory.nom, couleur: createdCategory.couleur })
  }
  const selectedCategory = categorySelectOptions.find(({ value }) => value === String(chosenCategoryId))
  const formateurSelectOptions = formateurOptions(formateurs.data ?? [], formation)

  return (
    <>
    <form className={styles.card} onSubmit={handleSubmit(submit)} noValidate>
      <div className={styles.notices}>
        {mutation.error &&
          (hasConflict ? (
            <>
              <Alert variant="error">
                Cette formation a été modifiée entre-temps. Rechargez-la avant de réessayer : votre saisie sera remplacée.
              </Alert>
              <button type="button" className={styles.secondaryButton} onClick={onReload}>
                Recharger
              </button>
            </>
          ) : (
            <Alert variant="error">{mutation.error.message}</Alert>
          ))}
      </div>

      <fieldset className={styles.section}>
        <legend className={styles.sectionTitle}>Informations générales</legend>
        <p className={styles.sectionDescription}>Les informations principales de la formation.</p>

        <div className={styles.formGrid}>
          <div className={styles.fullWidth}>
            <FormField
              label="Intitulé"
              placeholder="Ex. Développer l'estime et la confiance en soi"
              required
              error={errors.intitule?.message}
              {...register('intitule', { validate: (value) => validateRequired(value, "L'intitulé") ?? true })}
            />
          </div>

          <div className={styles.fullWidth}>
            <FormField as="textarea" label="Description" rows={4} error={errors.description?.message} {...register('description')} />
          </div>

          <div className={styles.fullWidth}>
            {categoriesReady ? (
              <div className={styles.categoryRow}>
                <div className={styles.categorySelect}>
                  <FormField
                    as="select"
                    label="Catégorie"
                    required
                    error={errors.categoryId?.message}
                    {...register('categoryId', { validate: (value) => validateRequired(value, 'La catégorie') ?? true })}
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categorySelectOptions.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </FormField>
                </div>
                {selectedCategory && (
                  <span
                    className={styles.categorySwatch}
                    data-testid="category-swatch"
                    style={{ backgroundColor: selectedCategory.couleur }}
                    aria-hidden="true"
                  />
                )}
                <button
                  type="button"
                  ref={createCategoryButton}
                  className={styles.secondaryButton}
                  onClick={() => setIsCreatingCategory(true)}
                >
                  Créer une catégorie
                </button>
              </div>
            ) : (
              <ChoiceNotice query={categories} loadingLabel="Chargement des catégories…" />
            )}
          </div>
        </div>
      </fieldset>

      <fieldset className={styles.section}>
        <legend className={styles.sectionTitle}>Organisation</legend>
        <p className={styles.sectionDescription}>Les informations pratiques concernant la formation.</p>

        <div className={styles.formGrid}>
          <FormField
            type="date"
            label="Du"
            required
            error={errors.dateDebut?.message}
            {...startField}
          />

          <FormField
            type="date"
            label="Au"
            required
            error={errors.dateFin?.message}
            {...register('dateFin', {
              validate: (value) =>
                validateRequired(value, 'La date de fin') ?? validateDateRange(getValues('dateDebut'), value) ?? true,
            })}
          />

          <FormField
            as="select"
            label="Modalité"
            required
            error={errors.modalite?.message}
            {...register('modalite', { validate: (value) => validateRequired(value, 'La modalité') ?? true })}
          >
            <option value="">Sélectionner une modalité</option>
            {MODALITES.map((modalite) => (
              <option key={modalite} value={modalite}>
                {modaliteLabel(modalite)}
              </option>
            ))}
          </FormField>

          <div>
            {formateurs.isLoading ? (
              <ChoiceNotice query={formateurs} loadingLabel="Chargement des formateurs…" />
            ) : (
              <>
                <FormField as="select" label="Formateur" {...register('formateurId')}>
                  <option value="">{AUTO_FORMATEUR_LABEL}</option>
                  {formateurSelectOptions.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </FormField>
                <ChoiceNotice query={formateurs} loadingLabel="" />
              </>
            )}
          </div>
        </div>
      </fieldset>

      <div className={styles.actions}>
        <Link className={styles.cancelButton} to={cancelPath}>
          Annuler
        </Link>
        <button type="submit" className={styles.submitButton} disabled={mutation.isPending || !categoriesReady}>
          {formation ? 'Enregistrer' : 'Créer la formation'}
        </button>
      </div>
    </form>
    {isCreatingCategory && (
      <CreateCategoryDialog
        onCreated={(category) => {
          setCreatedCategory(category)
          closeCategoryDialog()
        }}
        onCancel={closeCategoryDialog}
      />
    )}
    </>
  )
}

// `/formations/creer` (création) ou `/formations/:formationId/modifier` (modification, SUPER_ADMIN).
const FormationFormPage = () => {
  const { formationId } = useParams()
  const isEdit = Boolean(formationId)
  const { data: formation, dataUpdatedAt, isLoading, isError, error, refetch } = useFormation(formationId, { enabled: isEdit })

  if (!isEdit) {
    return (
      <PageShell className={styles.page}>
        <BackButton to="/formations" />
        <header className={`${styles.header} ${styles.headerWithAction}`}>
          <div>
            <h1 className={styles.title}>Créer une nouvelle formation</h1>
            <p className={styles.intro}>Renseignez les informations nécessaires pour créer une nouvelle formation.</p>
          </div>
          <Link className={styles.actionButton} to="/formations/importer">
            Importer un fichier Excel
          </Link>
        </header>
        <FormationForm />
      </PageShell>
    )
  }

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
        <BackButton to="/formations">Retour aux formations</BackButton>
        <div className={styles.errorState}>
          <Alert variant="error">
            {error.status === 404 ? 'Formation introuvable ou non accessible' : error.message}
          </Alert>
          {error.status !== 404 && (
            <button type="button" className={styles.submitButton} onClick={() => refetch()}>
              Réessayer
            </button>
          )}
        </div>
      </PageShell>
    )
  }

  if (formation.status === 'ARCHIVED') {
    return (
      <PageShell className={styles.page}>
        <BackButton to={`/formations/${formation.id}`}>Retour à la formation</BackButton>
        <div className={styles.errorState}>
          <Alert variant="error">Cette formation est archivée : elle ne peut plus être modifiée.</Alert>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell className={styles.page}>
      <BackButton to={`/formations/${formation.id}`} />
      <header className={styles.header}>
        <h1 className={styles.title}>Modifier la formation</h1>
        <p className={styles.intro}>Corrigez les informations de « {formation.intitule} ».</p>
      </header>
      {/* `key` : après « Recharger », le formulaire repart des valeurs à jour. */}
      <FormationForm key={dataUpdatedAt} formation={formation} onReload={() => refetch()} />
    </PageShell>
  )
}

export default FormationFormPage
