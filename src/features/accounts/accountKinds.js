import { ROLES } from '../../utils/roles'

// Les deux types de comptes gérés ici. `kind` est le segment d'URL de l'API (`/users/<kind>`)
// et des routes (`/admin/<kind>`).
export const ACCOUNT_KINDS = {
  formateurs: {
    kind: 'formateurs',
    role: ROLES.ADMIN,
    title: 'Formateurs',
    singular: 'formateur',
    emptyLabel: 'Aucun formateur',
    listTitle: 'Liste des formateurs',
    intro: 'Consultez les comptes des formateurs et retrouvez leurs informations.',
    createLabel: 'Créer un formateur',
    basePath: '/admin/formateurs',
  },
  stagiaires: {
    kind: 'stagiaires',
    role: ROLES.STAGIAIRE,
    title: 'Stagiaires',
    singular: 'stagiaire',
    emptyLabel: 'Aucun stagiaire',
    listTitle: 'Liste des stagiaires',
    intro: 'Consultez les comptes des stagiaires et retrouvez leurs informations.',
    createLabel: 'Créer un stagiaire',
    basePath: '/admin/stagiaires',
  },
}

// Page d'import Excel des comptes, formateurs et stagiaires à la fois (NOTES-09).
export const ACCOUNT_IMPORT_PATH = '/admin/comptes/importer'

// Seule la chargée de formation gère les comptes ; le formateur les consulte (D54).
export const canManageAccounts = (user) => user?.role === ROLES.SUPER_ADMIN

export const fullName = (account) => `${account.prenom} ${account.nom}`

// Statut d'un compte (Q8.3, tech.md § UserResponse) : `isActive: false` regroupe deux cas que le back distingue
// avec `activated` (« a déjà été activé au moins une fois »). Jamais activé : on renvoie le code d'activation
// (`reactivate` répondrait 409) ; suspendu : on réactive. Sans le champ (ancien back), un inactif est suspendu.
export const ACCOUNT_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  NEVER_ACTIVATED: 'never-activated',
}

export const accountStatusLabels = {
  [ACCOUNT_STATUS.ACTIVE]: 'Actif',
  [ACCOUNT_STATUS.SUSPENDED]: 'Suspendu',
  [ACCOUNT_STATUS.NEVER_ACTIVATED]: 'Jamais activé',
}

export function accountStatus(account) {
  if (account.isActive) return ACCOUNT_STATUS.ACTIVE
  return account.activated === false ? ACCOUNT_STATUS.NEVER_ACTIVATED : ACCOUNT_STATUS.SUSPENDED
}

export const activationCodeSentMessage = (account) => `Un nouveau code d'activation a été envoyé à ${fullName(account)}.`
