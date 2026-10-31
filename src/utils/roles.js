// Rôles du back (source de vérité, lus via GET /auth/me) et libellés affichés (D33).
export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  STAGIAIRE: "STAGIAIRE",
};

export const roleLabels = {
  [ROLES.SUPER_ADMIN]: "Chargée de formation",
  [ROLES.ADMIN]: "Formateur",
  [ROLES.STAGIAIRE]: "Stagiaire",
};

// Rôles autorisés dans les écrans de gestion (le back reste l'autorité, D9).
export const MANAGEMENT_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN];
