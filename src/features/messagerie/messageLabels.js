// Libellés partagés par la liste des conversations et le fil.

const dateTimeFormat = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

// « 2026-11-03T09:45:10.02948Z » (OffsetDateTime du back, UTC avec décalage) → heure locale : « 3 nov. 2026, 10:45 ».
// Une date absente ou invalide donne une chaîne vide (le back ne devrait pas en envoyer, mais la page ne plante pas).
export function formatMessageDate(isoDateTime) {
  const date = new Date(isoDateTime)
  return isoDateTime && !Number.isNaN(date.getTime()) ? dateTimeFormat.format(date) : ''
}

// Un compte absent (supprimé, anonymisé) est désigné sans planter.
export const displayName = (user) => (user ? `${user.prenom} ${user.nom}` : 'Expéditeur inconnu')
