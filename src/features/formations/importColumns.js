// Colonnes attendues par POST /formations/import (tech.md § POST /formations/import).
// PROVISOIRE (R10, D14, F16) : le fichier réel d'ADAC n'est pas arrivé. C'est le seul endroit
// qui cite les colonnes : les consignes de la page et le modèle téléchargeable les lisent ici.

export const MODALITES = ['VISIO', 'PRESENTIEL', 'MIXTE']

// Ordre = colonnes A à G du fichier. `key` est l'intitulé exact de la colonne attendue par le back.
export const IMPORT_COLUMNS = [
  { key: 'intitule', required: true, format: 'Texte', example: 'Premiers secours PSC1' },
  { key: 'description', required: false, format: 'Texte', example: 'Gestes de premiers secours' },
  { key: 'dateDebut', required: true, format: 'AAAA-MM-JJ ou cellule date Excel', example: '2026-03-10' },
  { key: 'dateFin', required: true, format: 'AAAA-MM-JJ ou cellule date Excel', example: '2026-03-12' },
  { key: 'modalite', required: true, format: MODALITES.join(', '), example: 'PRESENTIEL' },
  { key: 'categorie', required: true, format: 'Nom exact d’une catégorie existante', example: 'Secourisme' },
  {
    key: 'formateur',
    required: false,
    format: 'E-mail d’un formateur actif ; vide : la chargée de formation est assignée',
    example: 'formateur@adac.test',
  },
]
