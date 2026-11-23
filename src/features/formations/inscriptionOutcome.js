// Textes des inscriptions et désinscriptions (J4, J6, J8). Tout est rendu en texte par l'appelant.

// Récapitulatif de `useEnrollStagiaires` : `{ enrolled, failed }` → `{ enrolledText, failedText }`, `null`
// pour une partie vide. `nameOf(pair)` : ce que l'on nomme (intitulé de la formation, ou nom du stagiaire) ;
// `enrolledLabel` : « Inscrit à » (page du stagiaire) ou « Inscrits » (page de la formation). Les raisons
// sont séparées par « ; » parce qu'un message du back peut contenir une virgule.
export function enrollmentSummary({ enrolled, failed }, { nameOf, enrolledLabel }) {
  const enrolledText = enrolled.length > 0 ? `${enrolledLabel} : ${enrolled.map(nameOf).join(', ')}.` : null
  const failedText =
    failed.length > 0
      ? `Inscription impossible : ${failed.map((pair) => `${nameOf(pair)} (${pair.message})`).join(' ; ')}.`
      : null
  return { enrolledText, failedText }
}

export const unenrollTitle = (stagiaireName, formationIntitule) =>
  `Désinscrire ${stagiaireName} de « ${formationIntitule} » ?`

// La désinscription supprime tous les documents de l'inscription (J6). `documentCount` : leur nombre quand
// la page le connaît déjà, sinon `null` / `undefined`.
export function unenrollWarning(documentCount) {
  if (documentCount == null) return 'Ses documents déposés sur cette formation seront supprimés définitivement.'
  if (documentCount === 0) return 'Aucun document n’est déposé sur cette formation pour ce stagiaire.'
  if (documentCount === 1) return 'Son document déposé sur cette formation sera supprimé définitivement.'
  return `Ses ${documentCount} documents déposés sur cette formation seront supprimés définitivement.`
}
