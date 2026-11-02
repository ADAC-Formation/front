# Tasks

## 1. Préparation

- [x] 1.1 Vérifier que l'on est sur `feature/formations`, que `npm run check` est vert au départ et que `git -C ../../back-readonly status` est propre ; rafraîchir le back (`git -C ../../back-readonly pull`) et relire `tech.md` §4 (`POST /formations/import`) et `ExcelImportUtil` (format des erreurs)
- [x] 1.2 Écrire dans `docs/spec.md` les critères de l'import (spec `formation-import`, colonnes provisoires, R10) pour validation de Manon ; vérifier que le fichier les contient

## 2. Logique pure (TDD)

- [x] 2.1 RED : `importErrors.test.js` (entrées `ligne N, colonne X : texte` → lignes ; entrée non reconnue, « et d'autres erreurs » et message générique → `others` ; message vide ; colonne ou texte contenant `:`), `importFile.test.js` (`.xlsx` accepté, majuscules `.XLSX` acceptées, autre extension refusée, 2 Mo accepté, 2 Mo + 1 octet refusé, messages distincts) et `importColumns.test.js` (sept colonnes dans l'ordre A–G de `tech.md`, obligatoires et exemple pour chacune) ; confirmer RED
- [x] 2.2 Créer `importColumns.js`, `importErrors.js` et `importFile.js` ; GREEN
- [x] 2.3 Commit `feat: add formation import logic`

## 3. Modèle téléchargeable (TDD)

- [x] 3.1 Installer `write-excel-file` (version 4 exacte, vérifier `npm audit` et la licence) ; RED : `importTemplate.test.js` avec la bibliothèque mockée — l'en-tête transmis est exactement la liste des colonnes, une ligne d'exemple suit, le fichier s'appelle `modele-import-formations.xlsx` ; confirmer RED
- [x] 3.2 Créer `importTemplate.js` (import dynamique de `write-excel-file/browser`) ; GREEN
- [x] 3.3 Commit `feat: generate the formation import template`

## 4. Appel d'import (TDD)

- [x] 4.1 Ajouter `mockImportFormations` à `src/test/formations.js` (201 avec N formations, 400 avec message, 403, réseau, capture du `FormData`) ; RED : complément de `hooks.test.jsx` — `useImportFormations` envoie le fichier dans le champ `file` en `multipart/form-data`, invalide `['formations']` au succès, `400` remonte en `ApiError` avec le message du back ; confirmer RED
- [x] 4.2 Ajouter `importFormations` à `api.js` (`FormData`, `Content-Type: undefined`) et `useImportFormations` à `hooks.js` ; GREEN
- [x] 4.3 Commit `feat: add the formation import request`

## 5. Page d'import (TDD)

- [x] 5.1 RED : `FormationImportPage.test.jsx` — consignes et sept colonnes affichées, bouton « Télécharger le modèle » (appelle la génération), bouton « Importer » inactif sans fichier, fichier autre que `.xlsx` et fichier de plus de 2 Mo refusés sans appel, envoi avec le champ `file` et bouton désactivé pendant l'envoi, `201` → redirection vers `/formations` avec le bandeau (« 3 formations importées », « 1 formation importée »), `400` → tableau Ligne / Colonne / Problème et liste des entrées non reconnues, nouveau fichier efface les erreurs, serveur injoignable et `403` en bandeau annoncé avec fichier conservé, « Retour » vers la liste ; complément de `FormationNotice` pour le nombre ; un check jest-axe sans erreurs et un avec tableau d'erreurs ; confirmer RED
- [x] 5.2 Créer `FormationImportPage.jsx` et sa feuille de style (CSS Modules, jetons, `rem`, aucun `outline` supprimé : `css-hygiene` et `focus-ring` restent verts) ; étendre `FormationNotice` (`formations-imported`, `count`) ; GREEN
- [x] 5.3 Commit `feat: add the formation import page`

## 6. Lien, route et intégration (TDD)

- [ ] 6.1 RED : compléter `FormationListPage.test.jsx` (lien « Importer un fichier Excel » pour la chargée de formation, absent pour formateur et stagiaire) et `router.test.jsx` (`/formations/importer` : formateur et stagiaire → « Accès refusé », visiteur → `/login`, chargée de formation → page d'import) ; confirmer RED
- [ ] 6.2 Ajouter le lien à `FormationListPage` et la route `formations/importer` à `router.jsx` (`lazyPage`, `RequireRole` `SUPER_ADMIN`, avant `formations/:formationId`) ; GREEN
- [ ] 6.3 `npm run check` vert (lint + tests + build + budget du bundle : la bibliothèque et la page restent hors de l'entrée)
- [ ] 6.4 Commit `feat: route the formation import and link it from the list`

## 7. Documentation et passage manuel

- [ ] 7.1 Mettre à jour `CLAUDE.md` (« État actuel » : import branché sur les colonnes provisoires, R10 ouvert), `docs/decisions-formations.md` si une décision a évolué (le passage manuel peut en ajouter) et `docs/points-pour-charlotte.md` (Q12 à jour avec ce qui est constaté)
- [ ] 7.2 Commit `docs: record the formation import`
- [ ] 7.3 Passage manuel contre le vrai back local (comptes de `docs/dev/seed-local-admin.sql`, voir `docs/dev/README.md`) : télécharger le modèle et l'ouvrir dans Excel ou LibreOffice ; compléter une ligne avec une catégorie et un formateur existants, importer → bandeau et formation dans la liste ; fichier avec une catégorie inconnue, une date invalide et une modalité invalide → tableau ligne / colonne sans aucune formation créée ; fichier `.txt` renommé en `.xlsx` ; fichier de plus de 2 Mo ; formateur et stagiaire refusés ; lecture au clavier et zoom 200 % — ne pas cocher sans l'avoir fait (Docker requis)
- [ ] 7.4 Relecture de Manon ; PR unique vers `dev` à sa demande seulement, aucun push avant

## Workflow follow-up

- Archiver ce change après la relecture (`/opsx:archive`) et lister les demandes encore ouvertes pour Charlotte (Q3, Q9, Q11, Q12).
- Quand le vrai fichier d'ADAC arrive : refaire `importColumns.js`, le modèle et les tests de contrat ; ajouter une décision qui lève R10.
- Changes suivants de la branche : 048/049 (catégories), puis `feature/documents`.
