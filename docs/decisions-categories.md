# Décisions — catégories de formation (tickets 048 et 049)

Décisions prises avec Manon (`/grill-me-with-docs`). Complète `decisions-formations.md` (F1, F5, F7, F12 : catégorie lue dans la formation, sélecteur de catégories actives, filtre reporté). Numérotation propre à ce thème : C1, C2…

## C1 — Deux changes : `category-management` (049) puis `category-picker` (048)
- Date : 2026-11-02
- **Décision** : le travail sur les catégories est découpé en deux changes. (1) `category-management` : la page de gestion `/formations/categories` branchée sur l'API (lister toutes les catégories, créer, modifier, activer / désactiver) ; elle remplace le mock `utils/categories.js`. (2) `category-picker` : « Créer nouvelle catégorie » à la volée dans le formulaire de formation (réutilise le formulaire de catégorie du premier change) et le filtre par catégorie sur la liste des formations (report de F5).
- **Pourquoi** : relecture plus facile, un commit par groupe de tâches ; le second change dépend du formulaire de catégorie du premier.
- **Alternatives écartées** : un seul change pour les trois ; trois changes (le filtre seul est trop petit).

## C2 — Créer et modifier une catégorie dans une modale
- Date : 2026-11-02
- **Décision** : sur la page de gestion, « Créer une catégorie » et « Modifier » ouvrent une boîte de dialogue (nom + couleur), comme le ticket 049. Le formulaire de catégorie est un composant unique, réutilisé par la création à la volée du change `category-picker` (048). Le formulaire en ligne de la coque est abandonné.
- **Pourquoi** : suit le ticket et prépare la modale de 048 ; une seule saisie de nom + couleur dans toute l'application.
- **Alternatives écartées** : formulaire en ligne comme la coque ; en ligne pour modifier et modale pour créer (deux façons de saisir la même chose).
- **À soigner** : modale accessible (focus piégé, Échap, retour du focus sur le bouton d'origine), cf. `ConfirmDialog`.

## C3 — Couleur : sélecteur natif + champ hexadécimal synchronisés
- Date : 2026-11-02
- **Décision** : la couleur se choisit avec un `<input type="color">` et un champ texte hexadécimal, synchronisés, plus une pastille d'aperçu. Validation côté client : `#RRGGBB` (majuscules ou minuscules, comme le back : `^#[0-9A-Fa-f]{6}$`). Le nom est obligatoire, 255 caractères au plus. Les deux champs sont obligatoires, y compris à la modification (`PUT` remplace nom et couleur).
- **Pourquoi** : toutes les couleurs sont possibles, y compris celles déjà en base (ex. `#271BB4`) ; le champ texte rend la saisie utilisable au clavier et au lecteur d'écran, et permet de coller une couleur connue.
- **Alternatives écartées** : sélecteur natif seul (aperçu variable selon le navigateur, pas de saisie d'un code connu) ; palette de couleurs ADAC fixe (les couleurs libres existantes ne seraient plus éditables).
- **Accessibilité** : la couleur ne porte jamais seule l'information (le nom est toujours affiché à côté de la pastille).
