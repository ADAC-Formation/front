// Colonnes attendues par POST /users/import (NOTES-09, tech.md § POST /api/users/import). Seul endroit qui
// cite les colonnes : l'aide de la page et le modèle téléchargeable les lisent ici.

export const ACCOUNT_ROLE_LABELS = ['Formateur', 'Stagiaire']

// Le back refuse un fichier de plus de 200 lignes de comptes (un e-mail d'activation par compte).
export const MAX_ACCOUNT_ROWS = 200

// Ordre = colonnes A à D du fichier. `key` est l'intitulé exact de la colonne attendue par le back.
export const ACCOUNT_IMPORT_COLUMNS = [
  { key: 'nom', format: 'Texte', example: 'Martin' },
  { key: 'prenom', format: 'Texte', example: 'Anne' },
  { key: 'email', format: 'Adresse e-mail, sans compte existant', example: 'anne.martin@exemple.fr' },
  { key: 'role', format: ACCOUNT_ROLE_LABELS.join(' ou '), example: 'Stagiaire' },
]
