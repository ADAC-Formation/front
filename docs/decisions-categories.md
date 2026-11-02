# Décisions — catégories de formation (tickets 048 et 049)

Décisions prises avec Manon (`/grill-me-with-docs`). Complète `decisions-formations.md` (F1, F5, F7, F12 : catégorie lue dans la formation, sélecteur de catégories actives, filtre reporté). Numérotation propre à ce thème : C1, C2…

## C1 — Deux changes : `category-management` (049) puis `category-picker` (048)
- Date : 2026-11-02
- **Décision** : le travail sur les catégories est découpé en deux changes. (1) `category-management` : la page de gestion `/formations/categories` branchée sur l'API (lister toutes les catégories, créer, modifier, activer / désactiver) ; elle remplace le mock `utils/categories.js`. (2) `category-picker` : « Créer nouvelle catégorie » à la volée dans le formulaire de formation (réutilise le formulaire de catégorie du premier change) et le filtre par catégorie sur la liste des formations (report de F5).
- **Pourquoi** : relecture plus facile, un commit par groupe de tâches ; le second change dépend du formulaire de catégorie du premier.
- **Alternatives écartées** : un seul change pour les trois ; trois changes (le filtre seul est trop petit).
