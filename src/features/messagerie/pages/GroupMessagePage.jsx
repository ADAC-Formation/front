import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router'
import Alert from '../../../components/atoms/Alert/Alert'
import FormButton from '../../../components/atoms/FormButton/FormButton'
import BackButton from '../../../components/molecules/BackButton/BackButton'
import ConfirmDialog from '../../../components/molecules/ConfirmDialog/ConfirmDialog'
import FormField from '../../../components/molecules/FormField/FormField'
import { PageShell } from '../../../templates/PageShell/PageShell'
import { useCurrentUser } from '../../auth/hooks'
import GroupFilters from '../components/GroupFilters'
import RecipientPreview from '../components/RecipientPreview'
import { canExcludeRecipients, effectiveFilter, filterTypesFor, isFilterComplete } from '../groupFilters'
import { useGroupPreview, useSendGroupMessage } from '../hooks'
import { REMAINING_WARNING_THRESHOLD, remainingCharacters, validateMessage } from '../messageForm'
import styles from './GroupMessagePage.module.css'

const plural = (count, one, many) => (count === 1 ? one : many)

// Messages d'erreur lisibles pour les refus connus du back (D12) ; le reste affiche le message du back.
function sendErrorMessage(error) {
  if (error.status === 403) return "Vous n'avez pas le droit d'écrire à ce groupe."
  if (error.status === 404) return 'Formation ou stagiaire introuvable.'
  return error.message
}

// Composition d'un message groupé (ticket 032, US-014 ; décisions H12 à H17) : filtre, aperçu automatique des
// destinataires, texte, puis confirmation avant l'envoi. Un envoi réussi revient sur `/messages` avec le nombre
// de destinataires dans l'état de navigation (rien n'est stocké dans le navigateur, D31).
const GroupMessageForm = ({ user }) => {
  const navigate = useNavigate()
  const [filter, setFilter] = useState(() => ({ type: filterTypesFor(user.role)[0], formationId: '', userIds: [] }))
  // Destinataires décochés dans l'aperçu (H20) : tout le monde est coché au départ et à chaque changement de filtre.
  const [excludedIds, setExcludedIds] = useState(() => new Set())
  const [confirmingContent, setConfirmingContent] = useState(null)
  const [sendError, setSendError] = useState(null)

  const { register, handleSubmit, control, formState } = useForm({ defaultValues: { content: '' } })
  const remaining = remainingCharacters(useWatch({ control, name: 'content' }) ?? '')

  const preview = useGroupPreview(filter)
  const { mutate, isPending } = useSendGroupMessage()

  const complete = isFilterComplete(filter)
  // Seulement un aperçu réussi : après un rechargement raté, TanStack garde l'ancienne liste en `data`.
  const previewed = preview.isSuccess ? preview.data : []
  const canExclude = canExcludeRecipients(user.role, filter)
  const recipients = canExclude ? previewed.filter((recipient) => !excludedIds.has(recipient.id)) : previewed
  const count = recipients.length
  const canSend = complete && count > 0

  const changeFilter = (next) => {
    setFilter(next)
    setExcludedIds(new Set())
  }

  const toggleRecipient = (id) =>
    setExcludedIds((current) => {
      const next = new Set(current)
      if (!next.delete(id)) next.add(id)
      return next
    })

  const askConfirmation = ({ content }) => {
    setSendError(null)
    setConfirmingContent(content)
  }

  const send = () => {
    if (isPending) return
    mutate(
      { filter: effectiveFilter(filter, previewed, recipients), content: confirmingContent },
      {
        onSuccess: (message) => navigate('/messages', { state: { groupSent: message.recipients?.length ?? count } }),
        onError: (error) => {
          setConfirmingContent(null)
          setSendError(sendErrorMessage(error))
        },
      },
    )
  }

  return (
    <>
      <GroupFilters user={user} filter={filter} onChange={changeFilter} />

      {complete && (
        <RecipientPreview
          recipients={previewed}
          excludedIds={excludedIds}
          onToggle={canExclude ? toggleRecipient : undefined}
          isLoading={preview.isLoading}
          error={preview.error}
          onRetry={preview.refetch}
        />
      )}

      <form onSubmit={handleSubmit(askConfirmation)} noValidate className={styles.form}>
        <FormField
          as="textarea"
          label="Message"
          name="content"
          rows={6}
          error={formState.errors.content?.message}
          {...register('content', { validate: (value) => validateMessage(value) ?? true })}
        />

        {remaining <= REMAINING_WARNING_THRESHOLD && (
          <p role="status" className={styles.counter}>
            {remaining >= 0 ? `${remaining} caractères restants` : `${-remaining} caractères en trop`}
          </p>
        )}

        {sendError && <Alert>{sendError}</Alert>}

        <div className={styles.actions}>
          <FormButton type="submit" disabled={!canSend || isPending}>
            {canSend ? `Envoyer à ${count} ${plural(count, 'destinataire', 'destinataires')}` : 'Envoyer'}
          </FormButton>
        </div>
      </form>

      {confirmingContent !== null && (
        <ConfirmDialog
          title={`Envoyer ce message à ${count} ${plural(count, 'personne', 'personnes')} ?`}
          confirmLabel="Envoyer"
          disabled={isPending}
          onConfirm={send}
          onCancel={() => !isPending && setConfirmingContent(null)}
        >
          Le message sera envoyé à chaque destinataire et ne pourra pas être rappelé.
        </ConfirmDialog>
      )}
    </>
  )
}

const GroupMessagePage = () => {
  const { user } = useCurrentUser()

  return (
    <PageShell className={styles.page}>
      <BackButton to="/messages" />
      <h1 className={styles.title}>Message groupé</h1>
      {user && <GroupMessageForm user={user} />}
    </PageShell>
  )
}

export default GroupMessagePage
