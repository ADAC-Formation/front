import { useForm } from 'react-hook-form'
import FormField from '../../../components/molecules/FormField/FormField'
import FormButton from '../../../components/atoms/FormButton/FormButton'
import Alert from '../../../components/atoms/Alert/Alert'
import {
  validateCode,
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
} from '../../../utils/validation'
import styles from './AuthForm.module.css'

// Formulaire commun à l'activation et à la réinitialisation : e-mail, code à 6 chiffres,
// nouveau mot de passe et confirmation (mêmes règles que le back, D13).
// `onSubmit` doit renvoyer une promesse : si elle échoue, les mots de passe sont vidés
// et les autres champs conservés. `error` est l'ApiError affichée en ligne (D12).
// `children` reçoit les actions supplémentaires (ex. « Renvoyer un code »), et
// `getEmail`, passé à `children`, lit l'e-mail courant sans soumettre le formulaire.
const CodePasswordForm = ({
  defaultEmail = '',
  onSubmit,
  error = null,
  isSubmitting = false,
  submitLabel,
  renderExtraActions,
}) => {
  const {
    register,
    handleSubmit,
    getValues,
    trigger,
    resetField,
    formState: { errors },
  } = useForm({
    defaultValues: { email: defaultEmail, code: '', password: '', confirmation: '' },
  })

  const submit = async ({ email, code, password }) => {
    try {
      await onSubmit({ email: email.trim(), code: code.trim(), newPassword: password })
    } catch {
      // L'erreur du back est déjà exposée par `error` ; on ne garde pas les mots de passe.
      resetField('password')
      resetField('confirmation')
    }
  }

  // Valide uniquement le champ e-mail puis renvoie sa valeur, ou null s'il est invalide.
  const readValidEmail = async () => ((await trigger('email')) ? getValues('email').trim() : null)

  return (
    <form className={styles.form} onSubmit={handleSubmit(submit)} noValidate>
      {error && <Alert variant="error">{error.message}</Alert>}

      <FormField
        label="Adresse e-mail"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email', { validate: (value) => validateEmail(value) ?? true })}
      />

      <FormField
        label="Code de vérification"
        inputMode="numeric"
        autoComplete="one-time-code"
        error={errors.code?.message}
        {...register('code', { validate: (value) => validateCode(value) ?? true })}
      />

      <FormField
        label="Nouveau mot de passe"
        type="password"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register('password', { validate: (value) => validatePassword(value) ?? true })}
      />

      <FormField
        label="Confirmation du mot de passe"
        type="password"
        autoComplete="new-password"
        error={errors.confirmation?.message}
        {...register('confirmation', {
          validate: (value) => validatePasswordConfirmation(getValues('password'), value) ?? true,
        })}
      />

      <FormButton type="submit" disabled={isSubmitting}>
        {submitLabel}
      </FormButton>

      {renderExtraActions?.(readValidEmail)}
    </form>
  )
}

export default CodePasswordForm
