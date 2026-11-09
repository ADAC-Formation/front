import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import Alert from '../../../components/atoms/Alert/Alert'
import FormButton from '../../../components/atoms/FormButton/FormButton'
import FormField from '../../../components/molecules/FormField/FormField'
import { validatePassword, validatePasswordConfirmation, validateRequired } from '../../../utils/validation'
import { useChangePassword } from '../hooks'
import styles from './ProfileSections.module.css'

// « Mot de passe » (P4) : ancien, nouveau, confirmation. Les champs sont vidés après un succès comme après un échec.
const ChangePasswordForm = ({ className }) => {
  const change = useChangePassword()
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: { oldPassword: '', password: '', confirmation: '' } })

  const submit = async ({ oldPassword, password }) => {
    try {
      await change.mutateAsync({ oldPassword, newPassword: password })
    } catch {
      // L'erreur du back est exposée par `change.error`.
    }
    reset()
  }

  return (
    <section className={className} aria-labelledby="profile-password-title">
      <h2 id="profile-password-title">Mot de passe</h2>
      <form className={styles.form} onSubmit={handleSubmit(submit)} noValidate>
        {change.isError && <Alert variant="error">{change.error.message}</Alert>}
        {change.isSuccess && <Alert variant="success">Mot de passe modifié</Alert>}

        <FormField
          label="Mot de passe actuel"
          type="password"
          autoComplete="current-password"
          error={errors.oldPassword?.message}
          {...register('oldPassword', { validate: (value) => validateRequired(value, 'Le mot de passe actuel') ?? true })}
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

        <div className={styles.actions}>
          <FormButton type="submit" disabled={change.isPending}>
            Changer le mot de passe
          </FormButton>
          <Link to="/mot-de-passe-oublie">Mot de passe actuel oublié ?</Link>
        </div>
      </form>
    </section>
  )
}

export default ChangePasswordForm
