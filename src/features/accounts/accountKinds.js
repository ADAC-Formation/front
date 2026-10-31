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
    createLabel: 'Créer un formateur',
    basePath: '/admin/formateurs',
  },
  stagiaires: {
    kind: 'stagiaires',
    role: ROLES.STAGIAIRE,
    title: 'Stagiaires',
    singular: 'stagiaire',
    emptyLabel: 'Aucun stagiaire',
    createLabel: 'Créer un stagiaire',
    basePath: '/admin/stagiaires',
  },
}

// Seule la chargée de formation gère les comptes ; le formateur les consulte (D54).
export const canManageAccounts = (user) => user?.role === ROLES.SUPER_ADMIN

export const fullName = (account) => `${account.prenom} ${account.nom}`
