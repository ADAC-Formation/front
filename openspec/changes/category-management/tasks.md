# Tasks

## 1. Préparation

- [x] 1.1 Vérifier que l'on est sur `feature/formations`, que `npm run check` est vert au départ et que `git -C ../../back-readonly status` est propre ; rafraîchir le back (`git -C ../../back-readonly pull`) et relire `tech.md` §3 (`/categories`) et `CreateCategoryRequest` / `UpdateCategoryRequest` (validation du nom et de la couleur)
- [x] 1.2 Écrire dans `docs/spec.md` les critères de TICKET-049 (spec `category-management`, décisions C1–C5) pour validation de Manon ; vérifier que le fichier les contient

## 2. Logique pure du formulaire (TDD)

- [x] 2.1 RED : `src/features/categories/categoryForm.test.js` — `validateCategoryName` (vide, espaces seuls, 255 caractères accepté, 256 refusé), `validateCategoryColor` (`#12427c`, `#271BB4` acceptés ; `12427c`, `#12427`, `#GGGGGG`, `#1242 7c` refusés), `toRequest` (nom nettoyé, couleur en majuscules) et `hasChanged` (rien de modifié, nom seul, couleur seule, couleur changée de casse seulement → inchangée) ; confirmer RED
- [x] 2.2 Créer `categoryForm.js` ; GREEN
- [x] 2.3 Commit `feat: add category form logic`

## 3. Écritures et rafraîchissement (TDD)

- [ ] 3.1 Étendre `src/test/categories.js` : `mockCreateCategory`, `mockUpdateCategory`, `mockSetCategoryActive` (corps reçu, `201` / `200`, `409`, `404`, erreur réseau) ; vérifier qu'un appel non déclaré fait échouer le test
- [ ] 3.2 RED : compléter `src/features/categories/hooks.test.jsx` — `useCreateCategory` envoie `{ nom, couleur }`, `useUpdateCategory` envoie `PUT`, `useSetCategoryActive` appelle `activate` puis `deactivate`, chaque succès recharge la liste complète, la liste des actives et les formations, un `409` remonte en `ApiError` sans rechargement ; confirmer RED
- [ ] 3.3 Ajouter `createCategory`, `updateCategory`, `setCategoryActive` à `api.js` et les trois hooks à `hooks.js` (invalidation de `['categories']` et `['formations']`) ; GREEN
- [ ] 3.4 Commit `feat: add category write hooks`

## 4. Boîtes de dialogue accessibles (TDD)

- [ ] 4.1 Vérifier que `ConfirmDialog.test.jsx` couvre le focus initial sur « Annuler », Échap, Tab bouclé et le retour du focus ; l'étendre si une de ces garanties manque (elles protègent le refactor)
- [ ] 4.2 RED : `src/hooks/useModalFocus.test.jsx` — le hook boucle Tab / Maj+Tab sur boutons, champs, listes et liens non désactivés, ignore les éléments désactivés, place le focus initial demandé, ferme à Échap et rend le focus ; confirmer RED
- [ ] 4.3 Extraire `useModalFocus` de `ConfirmDialog` et l'utiliser dans `ConfirmDialog` ; GREEN avec les tests existants des comptes et de l'archivage de formation (`npm run test -- ConfirmDialog accounts FormationDetailPage`)
- [ ] 4.4 RED : `src/features/categories/components/CategoryFormDialog.test.jsx` — création (champs vides, titre « Créer une catégorie »), modification (préremplie, titre « Modifier la catégorie »), focus initial sur « Nom », Tab bouclé dans la boîte, Échap, couleur : sélecteur et champ hexadécimal synchronisés et pastille, erreurs liées aux champs (nom vide, hexadécimal invalide, aucun appel), `409` et autres erreurs annoncés dans la boîte avec saisie conservée, bouton désactivé pendant l'envoi, un check jest-axe ; confirmer RED
- [ ] 4.5 Créer `CategoryFormDialog.jsx` et sa feuille de style (habillage de `ConfirmDialog`, jetons, `rem`) ; GREEN
- [ ] 4.6 Commit `feat: add the category form dialog`

## 5. Page de gestion (TDD)

- [ ] 5.1 RED : `src/features/categories/pages/CategoryManagementPage.test.jsx` — liste complète (actives et désactivées) avec pastille, nom, état en texte et total ; chargement, vide, erreur avec « Réessayer » ; aucun « Supprimer » ; création (boîte, `POST`, boîte fermée, catégorie listée, « Catégorie créée » annoncé, `409` dans la boîte, annulation sans appel) ; modification (préremplie, `PUT` avec les deux champs, « Catégorie mise à jour », rien modifié → pas d'appel, `409`, `404`) ; désactivation (confirmation nommant la catégorie et expliquant l'effet, annulation et Échap sans appel, confirmation → `deactivate`, « Désactivée », « Catégorie désactivée ») ; réactivation immédiate (`activate`, « Catégorie réactivée », échec annoncé) ; focus rendu au bouton d'origine ; jest-axe page seule, boîte ouverte et erreur de champ ; confirmer RED
- [ ] 5.2 Créer `CategoryManagementPage.jsx` et `CategoryManagement.module.css` (design de la coque sans formulaire en ligne ni interrupteur) ; GREEN
- [ ] 5.3 Commit `feat: wire the category management page to the API`

## 6. Route et nettoyage (TDD)

- [ ] 6.1 RED : adapter `router.test.jsx` (la chargée de formation voit la page « Catégories » avec `mockCategories` ; formateur et stagiaire → « Accès refusé » sans appel aux catégories ; visiteur → `/login`) et `lazy-routes.test.jsx` si elle cite la page ; confirmer RED là où le comportement change
- [ ] 6.2 Pointer `formations/categories` sur la nouvelle page (`lazyPage`, derrière `RequireRole` `SUPER_ADMIN`) ; supprimer `components/Pages/Categories/` et `utils/categories.js` ; vérifier qu'aucun import ne subsiste (`grep -r "utils/categories\|Pages/Categories" src`) ; GREEN
- [ ] 6.3 `npm run check` vert (lint + tests + build + budget du bundle : la page reste hors de l'entrée)
- [ ] 6.4 Commit `feat: route the category management page and remove the mock`

## 7. Documentation et passage manuel

- [ ] 7.1 Mettre à jour `CLAUDE.md` (« État actuel » : catégories branchées, plus de mock, boîtes de dialogue partagées), `docs/decisions-categories.md` si une décision a évolué
- [ ] 7.2 Commit `docs: record the category management`
- [ ] 7.3 Passage manuel contre le vrai back local (comptes de `docs/dev/seed-local-admin.sql`, voir `docs/dev/README.md`) : lister les catégories ; créer ; créer avec un nom déjà pris (`409`) ; couleur par le sélecteur et par le code ; modifier nom et couleur puis vérifier la liste des formations ; désactiver (confirmation) puis vérifier qu'elle n'est plus proposée dans « Créer une formation » ; réactiver ; formateur et stagiaire refusés ; clavier (focus dans les boîtes, Échap, retour du focus) et zoom 200 % — ne pas cocher sans l'avoir fait (Docker requis)
- [ ] 7.4 Relecture de Manon ; la PR unique vers `dev` se fait au dernier change de la branche et à sa demande, aucun push avant

## Workflow follow-up

- Archiver ce change après la relecture (`/opsx:archive`).
- Change suivant de la branche : `category-picker` (création à la volée dans le formulaire de formation, réutilise `CategoryFormDialog`, et filtre par catégorie sur la liste ; C1).
