// Libellés partagés par la liste des conversations et le fil.

const dateTimeFormat = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

// « 2026-11-03T09:45:10.02948Z » (OffsetDateTime du back, UTC avec décalage) → heure locale : « 3 nov. 2026, 10:45 ».
export const formatMessageDate = (isoDateTime) => dateTimeFormat.format(new Date(isoDateTime))

export const displayName = (user) => `${user.prenom} ${user.nom}`
