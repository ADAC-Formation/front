import { useSearchParams } from 'react-router'
import CodePasswordForm from '../components/CodePasswordForm'
import { useResetPassword } from '../hooks'
import styles from '../components/AuthForm.module.css'

const ResetPasswordPage = () => {
  const [params] = useSearchParams()
  const reset = useResetPassword()

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <h1 className={styles.title}>Nouveau mot de passe</h1>
        <p className={styles.intro}>
          Saisissez le code à 6 chiffres reçu par e-mail, puis choisissez votre nouveau mot de passe.
        </p>

        <CodePasswordForm
          defaultEmail={params.get('email') ?? ''}
          onSubmit={reset.mutateAsync}
          error={reset.error}
          isSubmitting={reset.isPending}
          submitLabel="Changer le mot de passe"
        />
      </div>
    </div>
  )
}

export default ResetPasswordPage
