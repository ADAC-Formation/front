## 1. Préparation

- [x] 1.1 Vérifier que l'on est sur `feature/formations`, que `npm run check` est vert au départ et que `git -C ../../back-readonly status` est propre ; rafraîchir le back (`git -C ../../back-readonly pull`) et relire `tech.md` §2–4 (`POST` / `PUT /formations`, `GET /categories`, `GET /users/formateurs`)
- [x] 1.2 Écrire dans `docs/spec.md` les critères de TICKET-025 (hors import Excel, reporté, F11) tirés de la spec `formation-management`, pour validation de Manon ; vérifier que le fichier les contient

## 2. Logique pure du formulaire (TDD)

- [x] 2.1 RED : `src/features/formations/formationForm.test.js` — `valuesFromFormation`, `toRequest` (trim, description vide → `null`, `formateurId` vide → `null`, identifiants en nombres), `changedFields` (rien de modifié → `{}`, un seul champ, formateur repassé à « auto » → `formateurId: null`), `validateDateRange` (valide, inversée, un seul jour) ; confirmer RED
- [x] 2.2 Créer `formationForm.js` ; GREEN
- [x] 2.3 Commit `feat: add formation form logic`

## 3. Catégories et mutations (TDD)

- [x] 3.1 Créer `src/test/categories.js` (catégories fictives au format `CategoryResponse`, `mockCategories` avec `?active=true`, erreur 500) et étendre `src/test/formations.js` (`mockCreateFormation` 201/400, `mockUpdateFormation` 200/400/409) ; vérifier qu'un appel non déclaré fait échouer le test
- [x] 3.2 RED : `src/features/categories/hooks.test.jsx` (liste des catégories actives, `active=true` transmis, erreur) et complément de `src/features/formations/hooks.test.jsx` (`useCreateFormation` envoie le corps et invalide `['formations']`, `useUpdateFormation` envoie `PUT`, `400` et `409` remontent en `ApiError`) ; confirmer RED
- [x] 3.3 Créer `features/categories/{api,hooks}.js` (`useCategories`) et ajouter `createFormation` / `updateFormation` à `features/formations/api.js` et `useCreateFormation` / `useUpdateFormation` à `hooks.js` ; GREEN
- [x] 3.4 Commit `feat: add categories and formation write hooks`

## 4. Champs de formulaire (TDD)

- [x] 4.1 RED : `src/components/molecules/FormField/FormField.test.jsx` — `as="select"` rend un `<select>` avec ses options, `as="textarea"` une zone de texte, étiquette associée, `aria-invalid` et `aria-describedby` sur erreur, comportement par défaut inchangé (`<input>`) ; confirmer RED
- [x] 4.2 Étendre `FormField` (prop `as`, `children`) et les styles de `FormInput` aux deux balises ; `npm run test -- FormField auth accounts` GREEN (pas de régression sur les pages d'auth et de comptes)
- [x] 4.3 Commit `feat: let FormField render select and textarea controls`

## 5. Formulaire de création et de modification (TDD)

- [ ] 5.1 RED : `src/features/formations/pages/FormationFormPage.test.jsx` — champs du contrat sans référence / public / lieu / documents, champs obligatoires vides sans appel, « Au » préremplie par « Du », plage inversée refusée, formation d'un jour, catégories actives listées (+ erreur avec « Réessayer »), formateur facultatif (`formateurId: null`) et choisi, corps de `POST`, création → redirection vers `/formations/<id>` avec « Formation créée », `400` en bandeau avec saisie conservée, bouton désactivé pendant l'envoi, annulation sans appel ; modification : préremplissage, seuls les champs modifiés, rien modifié → aucun appel, catégorie désactivée conservée, formation archivée refusée, `404`, `409` avec « Recharger », retour au détail avec « Formation mise à jour » ; erreurs liées aux champs ; un check jest-axe en création et un en modification ; confirmer RED
- [ ] 5.2 Créer `FormationFormPage` et `FormationForm.module.css` (design de la coque, sections « Informations générales » et « Organisation », reprise de `CreateFormationPage.module.css` sans la section documents) ; GREEN
- [ ] 5.3 Commit `feat: wire the formation form to the API`

## 6. Détail, routes et nettoyage (TDD)

- [ ] 6.1 RED : compléter `FormationDetailPage.test.jsx` (lien « Modifier » pour `SUPER_ADMIN` sur formation active, absent pour `ADMIN`, `STAGIAIRE` et formation archivée ; bandeaux « Formation créée » / « Formation mise à jour » reçus par navigation) et `router.test.jsx` (création et modification : formateur → « Accès refusé », stagiaire → « Accès refusé », visiteur → `/login`, chargée de formation → formulaire) ; confirmer RED
- [ ] 6.2 Ajouter « Modifier » et `FormationNotice` au détail, étendre `FormationNotice` (`formation-created`, `formation-updated`), pointer `formations/creer` sur `FormationFormPage` et ajouter `formations/:formationId/modifier` dans `router.jsx` (`lazyPage`, derrière `RequireRole` `SUPER_ADMIN`) ; GREEN
- [ ] 6.3 Supprimer `components/Pages/CreateFormationPage/` ; vérifier qu'aucun import ne subsiste (`grep CreateFormationPage src`) ; `utils/categories.js` reste pour `CategoryManagement` ; adapter les tests de routeur et de feuilles de style qui citaient l'ancienne page
- [ ] 6.4 `npm run check` vert (lint + tests + build + budget du bundle)
- [ ] 6.5 Commit `feat: route the formation form and remove the mocked create page`

## 7. Documentation et passage manuel

- [ ] 7.1 Mettre à jour `CLAUDE.md` (« État actuel » : formulaire de formation branché ; reste mocké : `utils/categories.js` pour 049), `docs/decisions-formations.md` si une décision a évolué, et `docs/points-pour-charlotte.md` (comportement observé de `PUT` avec `formateurId: null`)
- [ ] 7.2 Commit `docs: record the formation form`
- [ ] 7.3 Passage manuel contre le vrai back local (comptes de `docs/dev/seed-local-admin.sql`, voir `docs/dev/README.md`) : créer une formation d'un jour et de plusieurs jours, sans formateur et avec un formateur, redirection vers le détail avec le bandeau, modifier un champ, repasser le formateur à « Assigné à la chargée de formation » (tester `formateurId: null`), erreur `400`, catégorie désactivée, formation archivée, lecture au clavier et zoom 200 % — ne pas cocher sans l'avoir fait (Docker requis)
- [ ] 7.4 Relecture de Manon ; PR unique vers `dev` à sa demande seulement, aucun push avant

## Workflow follow-up

- Archiver ce change après `formations-list-detail` (`/opsx:archive`) et lister les demandes encore ouvertes pour Charlotte (Q3, Q9, comportement de `PUT`).
- Change suivant de la branche : import Excel (F11), puis 048/049 (catégories), puis `feature/documents`.
