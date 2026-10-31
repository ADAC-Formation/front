## 1. Préparation

- [x] 1.1 Créer `feature/users` depuis `dev` (`git switch -c feature/users dev`) ; vérifier que `npm run check` est vert au départ et que `git -C ../../back-readonly status` est propre
- [x] 1.2 Écrire dans `docs/spec.md` les critères de TICKET-021 (+ édition TICKET-050, lecture seule ADMIN) tirés de la spec du change, pour validation de Manon ; vérifier que le fichier les contient
- [x] 1.3 Consigner dans `docs/decisions-front-foundations.md` les décisions D54+ (ADMIN en lecture seule sur les comptes ; périmètre reporté : formations, « Envoyer un message », profil, import ; `tech.md` l'emporte sur le ticket 021 pour suspendre/réactiver) ; vérifier la numérotation à la suite de D53

## 2. API et hooks des comptes (TDD)

- [x] 2.1 Étendre `src/test/session.js`/`handlers` si besoin et créer les handlers MSW `/users/*` (liste avec `?active`, création 201/409, détail 200/404, `PUT` 200/409, `deactivate`/`reactivate` 200/403) ; vérifier qu'un appel non déclaré fait échouer le test
- [x] 2.2 RED : `src/features/accounts/hooks.test.jsx` — liste formateurs / stagiaires, `active=true` transmis, création met à jour la liste, `409` remonte une `ApiError`, détail `404`, édition ne renvoie que les champs modifiés, suspension / réactivation mettent à jour le détail et la liste ; confirmer RED
- [x] 2.3 Créer `api.js` et `hooks.js` (`useAccounts`, `useAccount`, `useCreateAccount`, `useUpdateAccount`, `useSetAccountActive`) ; `npm run test -- accounts` GREEN
- [x] 2.4 Commit `feat: add accounts API and query hooks`

## 3. Liste des formateurs et des stagiaires (TDD)

- [x] 3.1 RED : `AccountListPage.test.jsx` — chargement, liste, vide, erreur + « Réessayer », filtre Tous/Actifs/Suspendus (SUPER_ADMIN), absence de filtre et de boutons de gestion (ADMIN), suspension avec confirmation et annulation, réactivation, check jest-axe ; confirmer RED
- [x] 3.2 Créer `AccountListPage` (tableau desktop, cartes mobile) et la molécule `ConfirmDialog` accessible (focus, Échap, retour du focus) avec son test ; `npm run test -- accounts` GREEN
- [x] 3.3 Commit `feat: add formateur and stagiaire list pages`

## 4. Création et édition (TDD)

- [x] 4.1 RED : `AccountFormPage.test.jsx` — champs vides / e-mail invalide sans appel, succès 201 → retour à la liste avec confirmation annoncée, `409` en ligne avec valeurs conservées, stagiaire envoie `formationIds: []`, édition préremplie, avertissement de changement d'e-mail d'un compte actif, check jest-axe ; confirmer RED
- [x] 4.2 Créer `AccountFormPage` (React Hook Form + `validateRequired`/`validateEmail`) pour création et édition ; GREEN
- [x] 4.3 Commit `feat: add account creation and edit forms`

## 5. Détail d'un compte (TDD)

- [ ] 5.1 RED : `AccountDetailPage.test.jsx` — informations et libellé de rôle (D33), `404` « Compte introuvable », boutons Modifier / Suspendre selon le rôle, contenu rendu en texte, check jest-axe ; confirmer RED
- [ ] 5.2 Créer `AccountDetailPage` ; GREEN
- [ ] 5.3 Commit `feat: add account detail page`

## 6. Routes et menu Gestion (TDD)

- [ ] 6.1 RED : tests du routeur (visiteur → `/login`, `STAGIAIRE` refusé sur les listes, `ADMIN` accepté sur listes/détails et refusé sur `/nouveau`, `SUPER_ADMIN` accepté partout) et de `ManagementMenu` (liens « Créer » des formateurs/stagiaires absents pour `ADMIN`) ; confirmer RED
- [ ] 6.2 Ajouter les routes `/admin/formateurs[/nouveau|/:id]` et `/admin/stagiaires[/nouveau|/:id]` dans `router.jsx`, adapter `ManagementMenu` ; GREEN
- [ ] 6.3 `npm run check` vert (lint + tests + build)
- [ ] 6.4 Commit `feat: route account screens and hide create links for formateurs`

## 7. Documentation et passage manuel

- [ ] 7.1 Mettre à jour `docs/points-pour-charlotte.md` (résultat du test `formationIds: []`, liste stagiaires de l'ADMIN « ses formations » vs D46, rappel ligne 5 sur deactivate/reactivate) et `CLAUDE.md` (section « État actuel » : comptes branchés)
- [ ] 7.2 Commit `docs: record account management decisions and update project context`
- [ ] 7.3 Passage manuel contre le vrai back local avec les comptes de `docs/dev/seed-local-admin.sql` : création formateur et stagiaire, e-mail déjà utilisé, édition, changement d'e-mail d'un compte activé, suspension / réactivation, lecture seule en ADMIN, accès refusé en STAGIAIRE — ne pas cocher sans l'avoir fait (Docker requis)
- [ ] 7.4 Relecture de Manon ; PR unique vers `dev` (dernier ticket de `feature/users`) uniquement à sa demande, aucun push avant

## Workflow follow-up

- Archiver le change après relecture (`/opsx:archive`) et lister les demandes encore ouvertes pour Charlotte.
