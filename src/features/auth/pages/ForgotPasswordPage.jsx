import { useForm } from 'react-hook-form'
import FormField from '../../../components/molecules/FormField/FormField'
import FormButton from '../../../components/atoms/FormButton/FormButton'
import Alert from '../../../components/atoms/Alert/Alert'
import TextLink from '../../../components/atoms/TextLink/TextLink'
import { validateEmail } from '../../../utils/validation'
import { useForgotPassword } from '../hooks'
import styles from '../components/AuthForm.module.css'

// Message identique que le compte existe ou non (anti-énumération, US-003 AC-02) :
// on n'affiche jamais le corps de la réponse, seulement ce texte fixe.
const GENERIC_CONFIRMATION = 'Si cet email existe, un code vous a été envoyé.'

const ForgotPasswordPage = () => {
  const forgot = useForgotPassword()
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({ defaultValues: { email: '' } })

  const resetLink = `/reinitialisation?${new URLSearchParams({ email: getValues('email').trim() })}`

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <h1 className={styles.title}>Mot de passe oublié</h1>
        <p className={styles.intro}>
          Saisissez votre adresse e-mail : vous recevrez un code pour choisir un nouveau mot de passe.
        </p>

        {forgot.isSuccess && <Alert variant="success">{GENERIC_CONFIRMATION}</Alert>}
        {forgot.error && <Alert variant="error">{forgot.error.message}</Alert>}

        <form
          className={styles.form}
          onSubmit={handleSubmit(({ email }) => forgot.mutate({ email: email.trim() }))}
          noValidate
        >
          <FormField
            label="Adresse e-mail"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email', { validate: (value) => validateEmail(value) ?? true })}
          />

          <FormButton type="submit" disabled={forgot.isPending}>
            Recevoir un code
          </FormButton>
        </form>

        {forgot.isSuccess && <TextLink to={resetLink}>J&apos;ai déjà un code</TextLink>}
        <TextLink to="/login">Retour à la connexion</TextLink>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
