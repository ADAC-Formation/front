import { useId, useRef } from 'react'
import { useForm } from 'react-hook-form'
import Alert from '../../../components/atoms/Alert/Alert'
import FormField from '../../../components/molecules/FormField/FormField'
import { useModalFocus } from '../../../hooks/useModalFocus'
import { FEEDBACK_IMAGE_TYPES, validateFeedbackImage, validateFeedbackMessage } from '../../../utils/validation'
import { useSendFeedback } from '../hooks'
import styles from './FeedbackDialog.module.css'

const TYPES = [
  { value: 'BUG', label: 'Bug' },
  { value: 'SUGGESTION', label: 'Suggestion' },
]

// Boîte « Envoyer un retour » (spec client-feedback, D-2) : type, message, capture facultative.
// Elle envoie elle-même le retour ; `onSent` est appelé après un envoi accepté (201), `onCancel`
// sur « Annuler » ou Échap. En cas d'erreur (400, 429, 503, réseau), la boîte reste ouverte avec
// la saisie et affiche le message du back.
const FeedbackDialog = ({ onSent, onCancel }) => {
  const titleId = useId()
  const typeErrorId = useId()
  const dialogRef = useRef(null)
  const firstTypeRef = useRef(null)
  const handleKeyDown = useModalFocus({ dialogRef, initialFocusRef: firstTypeRef, onCancel })

  const sendFeedback = useSendFeedback()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { type: '', message: '' } })

  const { ref: registerTypeRef, ...typeProps } = register('type', {
    validate: (value) => (value ? true : 'Choisissez le type de retour.'),
  })

  // Une seule requête par envoi, même sur un double clic : le bouton est désactivé pendant
  // `isSubmitting` (validation + requête, puisque `submit` attend la réponse) et après un envoi
  // accepté, qui ne doit jamais repartir même si la boîte n'est pas encore fermée.
  const locked = isSubmitting || sendFeedback.isSuccess

  const submit = async ({ type, message, screenshot }) => {
    try {
      await sendFeedback.mutateAsync({ type, message: message.trim(), screenshot: screenshot?.[0] ?? null })
    } catch {
      return // erreur affichée depuis l'état de la mutation ; la saisie reste pour réessayer
    }
    onSent()
  }

  return (
    <div className={styles.backdrop}>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Échap et piège du focus de la boîte de dialogue (useModalFocus) */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={styles.dialog}
        onKeyDown={handleKeyDown}
      >
        <h2 id={titleId} className={styles.title}>
          Envoyer un retour
        </h2>

        {sendFeedback.isError && <Alert variant="error">{sendFeedback.error.message}</Alert>}

        <form className={styles.form} onSubmit={handleSubmit(submit)} noValidate>
          <fieldset
            className={styles.types}
            aria-invalid={errors.type ? 'true' : undefined}
            aria-describedby={errors.type ? typeErrorId : undefined}
          >
            <legend className={styles.legend}>Type de retour</legend>
            {TYPES.map(({ value, label }, index) => (
              <label key={value} className={styles.typeOption}>
                <input
                  type="radio"
                  value={value}
                  {...typeProps}
                  ref={(element) => {
                    registerTypeRef(element)
                    if (index === 0) firstTypeRef.current = element
                  }}
                />
                {label}
              </label>
            ))}
            {errors.type && (
              <Alert variant="error" id={typeErrorId}>
                {errors.type.message}
              </Alert>
            )}
          </fieldset>

          <FormField
            as="textarea"
            label="Message"
            rows={5}
            required
            error={errors.message?.message}
            {...register('message', { validate: (value) => validateFeedbackMessage(value) ?? true })}
          />

          <div className={styles.screenshot}>
            <FormField
              type="file"
              label="Capture d’écran (facultatif, png, jpeg ou webp, 3 Mo maximum)"
              accept={FEEDBACK_IMAGE_TYPES.join(',')}
              error={errors.screenshot?.message}
              {...register('screenshot', { validate: (files) => validateFeedbackImage(files?.[0]) ?? true })}
            />
            <p className={styles.hint}>Évitez d’inclure des données personnelles de stagiaires dans la capture.</p>
          </div>

          <p className={styles.context}>Envoyé avec votre retour : page, navigateur, taille d’écran, version.</p>

          <div className={styles.actions}>
            <button type="button" className={styles.cancel} onClick={onCancel}>
              Annuler
            </button>
            <button type="submit" className={styles.submit} disabled={locked}>
              {isSubmitting ? 'Envoi…' : 'Envoyer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default FeedbackDialog
