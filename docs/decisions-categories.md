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

## C4 — Activation : boutons texte, confirmation à la désactivation seulement
- Date : 2026-11-02
- **Décision** : chaque ligne a un bouton « Désactiver » ou « Réactiver » (texte explicite, nom accessible avec le nom de la catégorie). « Désactiver » ouvre une confirmation (`ConfirmDialog`) qui explique l'effet : la catégorie n'apparaît plus dans le choix de catégorie d'une formation mais reste affichée sur les formations qui la portent déjà. « Réactiver » est immédiat. L'interrupteur et l'info-bulle au survol de la coque sont abandonnés.
- **Pourquoi** : la confirmation suit le ticket 049 ; l'info-bulle au survol est inaccessible au clavier et au tactile, le texte de la confirmation donne la même explication à tout le monde ; réactiver est sans risque.
- **Alternatives écartées** : garder l'interrupteur et son info-bulle ; désactivation sans confirmation.

## C5 — Hypothèses retenues pour le change `category-management` (à corriger si besoin)
- Date : 2026-11-02
- **Décision** : (1) la page `/formations/categories` reste réservée à la chargée de formation (`SUPER_ADMIN`, garde existante) ; le formateur et le stagiaire reçoivent « Accès refusé » ; (2) la liste affiche toutes les catégories (actives et désactivées) dans l'ordre du back, avec pastille, nom et état « Active » / « Désactivée » en texte ; aucune action de suppression (`tech.md` §3, US-017 AC-05) ; (3) création, modification, activation et désactivation confirment par un message annoncé (`role="status"`) sur la page, sans navigation ; (4) `409` (nom déjà utilisé) s'affiche dans la modale, qui reste ouverte avec la saisie ; (5) `utils/categories.js` (mock) est supprimé avec le rebranchement de `CategoryManagement` (D11) ; (6) la liste des catégories du sélecteur de formation (`['categories','list','active']`) est invalidée après toute écriture.
- **Pourquoi** : suit `tech.md` §3, US-017 et les patrons des comptes et des formations ; ce sont des choix sans enjeu de périmètre.
- **Alternatives écartées** : tri alphabétique côté client (l'ordre du back suffit pour l'instant) ; message de confirmation par navigation (la page ne change pas).

## C6 — Sélecteur de formation : `<select>` natif conservé, création à la volée à côté
- Date : 2026-11-02
- **Décision** : le choix de catégorie du formulaire de formation reste un `<select>` natif (nom seul dans les options). Un bouton « Créer une catégorie » à côté ouvre `CategoryFormDialog` sans quitter le formulaire ; à la création, la nouvelle catégorie est sélectionnée. Une pastille d'aperçu (couleur) accompagne la catégorie choisie.
- **Pourquoi** : accessibilité et simplicité (C3 : la couleur ne porte jamais seule l'information) ; une liste ARIA personnalisée coûterait cher pour un gain visuel.
- **Alternatives écartées** : liste déroulante personnalisée avec pastille dans chaque option (ticket 048).

## C7 — Filtre par catégorie : `<select>` côté client, toutes les catégories
- Date : 2026-11-02
- **Décision** : sur la liste des formations, un `<select>` « Catégorie » (défaut « Toutes les catégories »), listant toutes les catégories de `GET /categories` (actives et désactivées), filtre côté client comme la recherche (F5). Visible pour la chargée de formation et le formateur, pas pour le stagiaire (ticket 048, US-004 AC-07).
- **Pourquoi** : une formation peut porter une catégorie désactivée ; la filtrer doit rester possible.
- **Alternatives écartées** : catégories actives seulement ; pastilles radio (déborde si les catégories se multiplient) ; paramètre `?categoryId` du back (le reste du filtrage est client).
