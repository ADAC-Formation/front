// Libellés partagés par la liste des conversations et le fil.

const dateTimeFormat = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

// « 2026-11-02T10:05:00 » (LocalDateTime du back, sans fuseau) → « 2 nov. 2026, 10:05 ».
export const formatMessageDate = (isoDateTime) => dateTimeFormat.format(new Date(isoDateTime))

export const displayName = (user) => `${user.prenom} ${user.nom}`
