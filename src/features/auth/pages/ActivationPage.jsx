import { useSearchParams } from 'react-router'
import Alert from '../../../components/atoms/Alert/Alert'
import FormButton from '../../../components/atoms/FormButton/FormButton'
import CodePasswordForm from '../components/CodePasswordForm'
import { useActivate, useResendActivation } from '../hooks'
import styles from '../components/AuthForm.module.css'

// L'adresse peut être fournie par le lien reçu par e-mail (?email=…, question Q2 ouverte
// avec Charlotte) ; le champ reste toujours visible et modifiable.
const ActivationPage = () => {
  const [params] = useSearchParams()
  const activation = useActivate()
  const resend = useResendActivation()

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <h1 className={styles.title}>Activation du compte</h1>
        <p className={styles.intro}>
          Saisissez le code à 6 chiffres reçu par e-mail, puis choisissez votre mot de passe.
        </p>

        {resend.data && <Alert variant="success">{resend.data.message}</Alert>}
        {resend.error && <Alert variant="error">{resend.error.message}</Alert>}

        <CodePasswordForm
          defaultEmail={params.get('email') ?? ''}
          onSubmit={activation.mutateAsync}
          error={activation.error}
          isSubmitting={activation.isPending}
          submitLabel="Activer mon compte"
          renderExtraActions={(readValidEmail) => (
            <FormButton
              disabled={resend.isPending}
              onClick={async () => {
                const email = await readValidEmail()
                if (email) resend.mutate({ email })
              }}
            >
              Renvoyer un code
            </FormButton>
          )}
        />
      </div>
    </div>
  )
}

export default ActivationPage
