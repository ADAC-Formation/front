// Informations de la page « Mentions légales et confidentialité ». Une valeur `null` s'affiche
// « À renseigner par l'ADAC » : ces informations ne figurent pas sur le site de l'ADAC et ne doivent
// jamais être inventées (HU-S02, docs/adac/adac-site-reference.md §6). Les renseigner ici suffit, la page
// n'a pas d'autre texte à modifier. `privacyContact` et `legalBasis` (RGPD, NOTES-04) servent aussi au profil.
export const LEGAL_INFO = {
  name: 'ADAC',
  address: '35 rue Pierre et Dominique Ponchardier, 42100 Saint-Étienne',
  email: 'adac@adac.asso.fr',
  phone: '04 77 33 65 34',
  siret: null,
  activityDeclaration: null,
  publicationDirector: null,
  host: null,
  retention: null,
  // Personne ou adresse à qui écrire pour exercer ses droits (référent ou DPO de l'ADAC).
  privacyContact: null,
  // Ex. exécution de la formation, obligation légale de l'organisme de formation : à confirmer par l'ADAC.
  legalBasis: null,
}
