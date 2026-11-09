import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import Alert from '../../../components/atoms/Alert/Alert'
import FormButton from '../../../components/atoms/FormButton/FormButton'
import FormField from '../../../components/molecules/FormField/FormField'
import { useSendMessage } from '../hooks'
import { REMAINING_WARNING_THRESHOLD, remainingCharacters, validateMessage } from '../messageForm'
import styles from './MessageComposer.module.css'

// Messages d'erreur lisibles pour les refus connus du back (D12) ; le reste affiche le message du back.
function sendErrorMessage(error) {
  if (error.status === 403) return 'Vous ne pouvez pas écrire à cette personne.'
  if (error.status === 404) return 'Ce destinataire est introuvable.'
  return error.message
}

// Saisie d'un message à `recipientId`. Entrée insère un saut de ligne ; seul « Envoyer » envoie.
// Le texte est conservé quand l'envoi échoue.
const MessageComposer = ({ recipientId }) => {
  const { register, handleSubmit, reset, control, formState } = useForm({ defaultValues: { content: '' } })
  const { mutate, isPending } = useSendMessage()
  const [sendError, setSendError] = useState(null)
  const [sent, setSent] = useState(false)

  const remaining = remainingCharacters(useWatch({ control, name: 'content' }) ?? '')

  const onSubmit = ({ content }) => {
    setSendError(null)
    setSent(false)
    mutate(
      { recipientId, content },
      {
        onSuccess: () => {
          reset({ content: '' })
          setSent(true)
        },
        onError: (error) => setSendError(sendErrorMessage(error)),
      },
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.form}>
      <FormField
        as="textarea"
        label="Message"
        name="content"
        rows={4}
        error={formState.errors.content?.message}
        {...register('content', { validate: (value) => validateMessage(value) ?? true })}
      />

      {remaining <= REMAINING_WARNING_THRESHOLD && (
        <p role="status" className={styles.counter}>
          {remaining >= 0 ? `${remaining} caractères restants` : `${-remaining} caractères en trop`}
        </p>
      )}

      {sendError && <Alert>{sendError}</Alert>}
      {sent && !sendError && <Alert variant="success">Message envoyé</Alert>}

      <div className={styles.actions}>
        <FormButton type="submit" disabled={isPending}>
          Envoyer
        </FormButton>
      </div>
    </form>
  )
}

export default MessageComposer
