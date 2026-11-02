# Design

## Context

- Contrat (`tech.md` §3, lu aussi dans `CreateCategoryRequest` / `UpdateCategoryRequest` du back `dev`, lecture seule) : `GET /categories` (`?active=true`), `POST /categories` `{ nom, couleur }` (`201`, `409` nom déjà utilisé), `PUT /categories/{id}` (`nom` et `couleur` tous deux obligatoires, `409`), `PATCH /categories/{id}/activate` et `/deactivate` (`200`). `nom` non vide, 255 caractères au plus ; `couleur` `^#[0-9A-Fa-f]{6}$`. Pas de suppression. `CategoryResponse` : `id`, `nom`, `couleur`, `isActive`, `createdAt`.
- État actuel : `features/categories/` ne lit que les catégories (`api.js`, `hooks.js` : `useCategories`, clés `['categories','list','active'|'all']`). La page est `components/Pages/Categories/CategoryManagement.jsx` (mock `utils/categories.js`, formulaire d'édition en ligne, interrupteur avec info-bulle, bouton « Créer » sans effet), routée sur `/formations/categories` derrière `RequireRole` `SUPER_ADMIN`, liée depuis la liste des formations et le menu Gestion.
- La formation embarque sa catégorie complète (F7) : renommer ou recolorer une catégorie change l'affichage des formations, dont les caches sont sous `['formations']`.
- `ConfirmDialog` : dialogue modal accessible, mais son piège de focus ne connaît que les boutons.
- Patrons à suivre : `features/accounts/hooks.js` (mutations, rafraîchissement des listes après réponse du back, pas d'état optimiste), `AccountFormPage` (validateurs à la main dans `utils/validation.js`, erreurs liées aux champs), `lazyPage` et budget du bundle (D59).
- Voir `proposal.md` pour la motivation et `docs/decisions-categories.md` (C1–C5).

## Goals / Non-Goals

**Goals:**
- Page de gestion fidèle au contrat, sans état local de données (le back fait foi).
- Un seul formulaire nom + couleur, réutilisable tel quel par la création à la volée du change suivant.
- Dialogues accessibles pour les champs de formulaire, sans régression de `ConfirmDialog`.

**Non-Goals:**
- Création à la volée dans le formulaire de formation et filtre par catégorie (change `category-picker`).
- Tri, recherche ou pagination des catégories (une liste courte, ordre du back).
- Nombre de formations par catégorie (absent de `CategoryResponse`).

## Decisions

### 1. Logique pure dans `categoryForm.js`
`validateCategoryName(value)` (requis après trim, 255 au plus), `validateCategoryColor(value)` (`^#[0-9A-Fa-f]{6}$`), `toRequest({ nom, couleur })` (nom trim, couleur en majuscules), `hasChanged(category, values)` (compare après normalisation). Messages en français, comme `validation.js` (les validateurs de catégorie restent dans le module de la fonctionnalité : ils ne servent pas ailleurs).
- *Pourquoi* : règles testées sans rendu ; le change `category-picker` les réutilise.
- *Alternative écartée* : les mettre dans `utils/validation.js` (fonctions propres à un seul domaine).

### 2. Mutations et rafraîchissement : `hooks.js`
`useCreateCategory()`, `useUpdateCategory(id)` (corps `{ nom, couleur }`), `useSetCategoryActive()` (`{ id, active }` → `PATCH activate|deactivate`). À chaque succès : invalider `['categories']` (liste complète et liste des actives) et `['formations']` (la catégorie est embarquée). Le tableau affiché vient de la réponse rechargée du back, jamais d'un état optimiste.
- *Pourquoi* : même schéma que les comptes ; le sélecteur du formulaire de formation et les cartes de formation restent justes.
- *Alternative écartée* : mettre à jour le cache à la main (risque de divergence avec le back, ordre de la liste).

### 3. Piège de focus partagé : `useModalFocus`
Extraire de `ConfirmDialog` un hook `useModalFocus({ dialogRef, initialFocusRef, onCancel })` : focus initial, Échap (arrête la propagation et appelle `onCancel`), Tab / Maj+Tab bouclés sur les éléments focalisables (`button`, `input`, `select`, `textarea`, `a[href]`, non désactivés), retour du focus à l'élément actif d'avant l'ouverture. `ConfirmDialog` l'utilise (comportement inchangé : focus initial sur « Annuler ») ; son fichier de test existant sert de filet. `CategoryFormDialog` l'utilise avec le focus initial sur « Nom ».
- *Pourquoi* : une seule implémentation du piège de focus, qui couvre désormais les champs ; l'alternative dupliquerait 40 lignes sensibles.
- *Alternative écartée* : copier la logique dans un second composant (deux comportements à maintenir).

### 4. `CategoryFormDialog`
Boîte modale (`role="dialog"`, `aria-modal`, nommée par son titre « Créer une catégorie » / « Modifier la catégorie », même habillage que `ConfirmDialog`) avec un `<form>` : champ « Nom » (`FormField`), couleur = `<input type="color">` + champ « Couleur (hexadécimal) » + pastille d'aperçu, boutons « Annuler » et « Créer » / « Enregistrer ». Formulaire en React Hook Form (D8, D13) avec les validateurs de `categoryForm.js` ; le sélecteur natif et le champ hexadécimal partagent la même valeur (le sélecteur reçoit la valeur en minuscules, seule forme qu'il accepte, et n'est mis à jour que si le champ texte est valide). Le composant reçoit `category` (édition) ou rien (création), `onSubmit(values)` et gère l'erreur du back : `409` et autres messages dans un `Alert` annoncé en tête de boîte, saisie conservée, bouton désactivé pendant l'envoi. Il ne connaît pas la page : il est réutilisable par le change `category-picker`.
- *Pourquoi* : un composant de saisie unique (C2) ; le champ hexadécimal garantit l'usage au clavier et au lecteur d'écran (C3).
- *Alternative écartée* : formulaire en ligne dans la ligne de la liste (la coque), abandonné par C2.

### 5. Page `CategoryManagementPage` dans `features/categories/pages/`
Rend dans `PageShell` : `BackButton` vers `/formations`, titre « Catégories », bouton « Créer une catégorie », puis la carte listant les catégories (pastille, nom, état en texte, « Modifier », « Désactiver » / « Réactiver » dont le nom accessible contient le nom de la catégorie). Un seul état local `dialog` (`null`, `{ kind: 'create' }`, `{ kind: 'edit', category }`, `{ kind: 'deactivate', category }`) et un `notice` (texte du dernier succès, `Alert` `success`, rôle `status`). Chargement, vide et erreur avec « Réessayer » comme la liste des formations. Désactiver : `ConfirmDialog` avec le texte de l'effet ; réactiver : appel direct, erreur annoncée dans un `Alert` d'erreur. La page lit `useCategories()` (toutes) : les écritures la rechargent par invalidation.
- *Pourquoi* : l'état de la liste vient du back (D52 : rien dans le stockage du navigateur) ; un état `dialog` unique empêche deux boîtes ouvertes à la fois.
- *Alternative écartée* : interrupteur et info-bulle de la coque (C4).

### 6. Route, nettoyage, tests
`router.jsx` : `formations/categories` pointe sur la nouvelle page via `lazyPage`, toujours derrière `RequireRole` `SUPER_ADMIN`. Suppression de `components/Pages/Categories/` (la feuille de style est reprise dans `features/categories/pages/CategoryManagement.module.css`, design inchangé sauf les formulaires en ligne et l'interrupteur) et de `utils/categories.js`. Tests (TDD, avant le code) : `categoryForm.test.js`, hooks (corps, invalidation, erreurs), `useModalFocus` via `ConfirmDialog.test.jsx` et `CategoryFormDialog.test.jsx`, `CategoryManagementPage.test.jsx` (liste, création, modification, désactivation, réactivation, erreurs, aucune suppression, jest-axe), routeur (accès par rôle, désormais avec `mockCategories`). Helpers MSW d'écriture dans `src/test/categories.js`.

## Risks / Trade-offs

- [Le refactor du piège de focus régresse `ConfirmDialog`, utilisé par les comptes et l'archivage] → ses tests existants restent verts avant et après l'extraction (tâche dédiée) ; aucun changement de comportement attendu.
- [Le sélecteur natif `<input type="color">` ne s'affiche pas de la même façon partout et n'accepte que `#rrggbb` en minuscules] → le champ hexadécimal est la saisie de référence, le sélecteur n'est qu'une aide ; la valeur envoyée est mise en majuscules.
- [Deux modifications simultanées de la même catégorie : le dernier `PUT` gagne, le back n'a pas de verrou sur les catégories] → cas rare à une seule chargée de formation ; la liste est rechargée après chaque écriture.
- [Une catégorie désactivée reste modifiable et visible sur les formations existantes (voulu par `tech.md`)] → l'état « Désactivée » est écrit en texte sur la ligne.
- [Renommer une catégorie change l'affichage de toutes ses formations] → c'est le comportement documenté (`tech.md` §3, simple clé étrangère) ; les caches des formations sont invalidés.

## Migration Plan

Aucune donnée à migrer. Suppression de la coque et du mock dans le commit qui branche la nouvelle page. Retour arrière : revert.

## Open Questions

- Aucune qui change la spec, l'approche ou les tâches.
