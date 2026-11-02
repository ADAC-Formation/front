import { useId, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import Alert from '../../../components/atoms/Alert/Alert'
import FormField from '../../../components/molecules/FormField/FormField'
import { useModalFocus } from '../../../hooks/useModalFocus'
import { hasChanged, toRequest, validateCategoryColor, validateCategoryName } from '../categoryForm'
import styles from './CategoryFormDialog.module.css'

const DEFAULT_COLOR = '#12427C'

// Seule forme que le sélecteur de couleur du navigateur accepte : `#rrggbb` en minuscules.
const pickerValue = (hex) => hex.toLowerCase()

// Boîte de dialogue de saisie d'une catégorie (nom + couleur), pour la création (sans `category`)
// et la modification (C2). `onSubmit` reçoit le corps prêt à envoyer (voir `toRequest`) ;
// `error` est le message du back à afficher (409…), `isPending` désactive l'envoi. Modifier sans
// rien changer ferme la boîte sans appel. La boîte ne connaît ni la page ni le back : elle sert
// aussi à la création à la volée du formulaire de formation.
const CategoryFormDialog = ({ category, onSubmit, onCancel, error, isPending = false }) => {
  const titleId = useId()
  const dialogRef = useRef(null)
  const nameRef = useRef(null)
  const handleKeyDown = useModalFocus({ dialogRef, initialFocusRef: nameRef, onCancel })

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: { nom: category?.nom ?? '', couleur: category?.couleur ?? DEFAULT_COLOR },
  })
  // Dernière couleur valide : sélecteur et pastille la gardent pendant une saisie incomplète.
  const [previewColor, setPreviewColor] = useState(pickerValue(category?.couleur ?? DEFAULT_COLOR))

  const { ref: registerNameRef, ...nameProps } = register('nom', {
    validate: (value) => validateCategoryName(value) ?? true,
  })
  const colorProps = register('couleur', {
    validate: (value) => validateCategoryColor(value) ?? true,
    onChange: (event) => {
      if (validateCategoryColor(event.target.value) === null) setPreviewColor(pickerValue(event.target.value))
    },
  })

  const handlePickerChange = (event) => {
    const chosen = event.target.value
    setPreviewColor(chosen)
    setValue('couleur', chosen.toUpperCase(), { shouldValidate: Boolean(errors.couleur) })
  }

  const submit = (values) => {
    if (category && !hasChanged(category, values)) {
      onCancel()
      return
    }
    onSubmit(toRequest(values))
  }

  return (
    <div className={styles.backdrop}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={styles.dialog}
        onKeyDown={handleKeyDown}
      >
        <h2 id={titleId} className={styles.title}>
          {category ? 'Modifier la catégorie' : 'Créer une catégorie'}
        </h2>

        {error && <Alert variant="error">{error}</Alert>}

        <form className={styles.form} onSubmit={handleSubmit(submit)} noValidate>
          <FormField
            label="Nom"
            required
            autoComplete="off"
            error={errors.nom?.message}
            {...nameProps}
            ref={(element) => {
              registerNameRef(element)
              nameRef.current = element
            }}
          />

          <div className={styles.colorRow}>
            <div className={styles.colorField}>
              <FormField
                label="Couleur (hexadécimal)"
                required
                autoComplete="off"
                spellCheck={false}
                error={errors.couleur?.message}
                {...colorProps}
              />
            </div>
            <input
              type="color"
              className={styles.picker}
              aria-label="Choisir une couleur"
              value={previewColor}
              onChange={handlePickerChange}
            />
            <span
              className={styles.preview}
              data-testid="color-preview"
              aria-hidden="true"
              style={{ backgroundColor: previewColor }}
            />
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancel} onClick={onCancel}>
              Annuler
            </button>
            <button type="submit" className={styles.submit} disabled={isPending}>
              {category ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CategoryFormDialog
