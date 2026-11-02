// Seul endroit qui connaît les valeurs de `entityType` (tech.md § 8) : présentation et cible de
// navigation d'une notification. On ne se fie jamais à la chaîne `type` (NEW_MESSAGE,
// DOCUMENT_UPLOADED, FORMATION_UPDATED…) ni à une valeur future : tout le reste est « other »,
// sans cible, plutôt qu'une erreur (N7).

const KINDS = {
  // entityId = id de l'autre participant de la conversation, pas celui du message (N1).
  MESSAGE: { kind: 'message', label: 'Message', pathFor: (id) => `/messages/${id}` },
  // entityId = id de la formation, aussi pour un document déposé.
  FORMATION: { kind: 'formation', label: 'Formation', pathFor: (id) => `/formations/${id}` },
}

const NEUTRAL = { kind: 'other', label: 'Notification' }

export function describeNotification({ entityType, entityId }) {
  const known = KINDS[entityType]
  if (!known) return { ...NEUTRAL, path: null }
  const hasId = entityId !== null && entityId !== undefined
  return { kind: known.kind, label: known.label, path: hasId ? known.pathFor(entityId) : null }
}
