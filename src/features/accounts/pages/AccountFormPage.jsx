import { useForm, useWatch } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router'
import Alert from '../../../components/atoms/Alert/Alert'
import FormButton from '../../../components/atoms/FormButton/FormButton'
import BackButton from '../../../components/molecules/BackButton/BackButton'
import FormField from '../../../components/molecules/FormField/FormField'
import { validateEmail, validateRequired } from '../../../utils/validation'
import { ACCOUNT_KINDS, fullName } from '../accountKinds'
import AccountNotFound from '../components/AccountNotFound'
import { useAccount, useCreateAccount, useUpdateAccount } from '../hooks'
import styles from './AccountPages.module.css'

const EMPTY_VALUES = { prenom: '', nom: '', email: '' }

// Formulaire commun à la création et à la modification (React Hook Form + validateurs, D13).
// En modification, `account` préremplit les champs et seuls les champs changés sont envoyés.
const AccountForm = ({ config, account }) => {
  const navigate = useNavigate()
  const create = useCreateAccount(config.kind)
  const update = useUpdateAccount(account?.id)
  const mutation = account ? update : create

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: account
      ? { nom: account.nom, prenom: account.prenom, email: account.email }
      : EMPTY_VALUES,
  })

  const typedEmail = useWatch({ control, name: 'email' })
  const emailChanged = account && typedEmail.trim() !== account.email
  const mustWarnAboutSessions = emailChanged && account.isActive

  const submit = async (values) => {
    const trimmed = {
      nom: values.nom.trim(),
      prenom: values.prenom.trim(),
      email: values.email.trim(),
    }
    try {
      if (account) {
        await update.mutateAsync({ original: account, values: trimmed })
        navigate(`${config.basePath}/${account.id}`, { state: { notice: 'account-updated' } })
      } else {
        await create.mutateAsync(trimmed)
        navigate(config.basePath, { state: { notice: 'account-created' } })
      }
    } catch (error) {
      // E-mail déjà pris : erreur sur le champ, valeurs conservées. Autres erreurs : bandeau.
      if (error.status === 409) setError('email', { message: error.message })
    }
  }

  const otherError = mutation.error && mutation.error.status !== 409 ? mutation.error : null

  return (
    <div className={styles.page}>
      {account ? (
        <BackButton to={`${config.basePath}/${account.id}`} />
      ) : (
        <BackButton to={config.basePath}>Retour aux {config.title.toLowerCase()}</BackButton>
      )}

      <h1 className={styles.title}>
        {account ? `Modifier ${fullName(account)}` : config.createLabel}
      </h1>

      <form className={styles.card} onSubmit={handleSubmit(submit)} noValidate>
        {otherError && <Alert variant="error">{otherError.message}</Alert>}

        <FormField
          label="Prénom"
          autoComplete="off"
          required
          error={errors.prenom?.message}
          {...register('prenom', { validate: (value) => validateRequired(value, 'Le prénom') ?? true })}
        />
        <FormField
          label="Nom"
          autoComplete="off"
          required
          error={errors.nom?.message}
          {...register('nom', { validate: (value) => validateRequired(value, 'Le nom') ?? true })}
        />
        <FormField
          label="Adresse e-mail"
          type="email"
          autoComplete="off"
          required
          error={errors.email?.message}
          {...register('email', { validate: (value) => validateEmail(value) ?? true })}
        />

        {mustWarnAboutSessions && (
          <Alert variant="info">
            Ce compte est actif : après le changement d&apos;adresse, la personne devra se reconnecter.
          </Alert>
        )}

        <div className={styles.actions}>
          <FormButton type="submit" disabled={mutation.isPending}>
            {account ? 'Enregistrer' : 'Créer le compte'}
          </FormButton>
          <Link to={account ? `${config.basePath}/${account.id}` : config.basePath}>Annuler</Link>
        </div>
      </form>
    </div>
  )
}

// `/admin/<kind>/nouveau` (création) ou `/admin/<kind>/:id/modifier` (modification).
const AccountFormPage = ({ kind }) => {
  const config = ACCOUNT_KINDS[kind]
  const { id } = useParams()
  const { data: account, isLoading, isError, error } = useAccount(id, { enabled: Boolean(id) })

  if (!id) return <AccountForm config={config} />
  if (isLoading) return <p role="status">Chargement…</p>
  if (isError) {
    return error.status === 404 ? (
      <AccountNotFound backPath={config.basePath} backLabel={`Retour aux ${config.title.toLowerCase()}`} />
    ) : (
      <div className={styles.page}>
        <Alert variant="error">{error.message}</Alert>
      </div>
    )
  }

  return <AccountForm config={config} account={account} />
}

export default AccountFormPage
