# Tasks

Deux branches : **back** `feature/formation-inscriptions` (depuis `origin/dev` dans `../back-readonly`, jamais sur `dev`) et **front** `feature/formation-inscriptions` (depuis `dev`). Le back vient en premier ; le front se construit sur le contrat de `design.md` §1 avec des mocks, puis se vérifie sur le vrai back local. Chaque tâche « RED » finit par un test qui échoue pour la bonne raison.

## 1. Préparation

- [x] 1.1 Plan validé par Manon (2026-11-23) (exigé par `AGENTS.md` du back)
- [x] 1.2 Back : `git fetch`, branche depuis `origin/dev` ; relire `AGENTS.md`, `CLAUDE.md`, `docs/BACKEND_WORKFLOW.md` ; suite de départ verte (hors l'échec intermittent connu `NotificationRepositoryTest.bellQueryOrdersMostRecentFirst`)
- [x] 1.3 Back : `docs/tickets/TICKET-053.md` et ligne dans `TICKETS.md`
- [x] 1.4 Front : branche depuis `dev`, `npm run check` vert au départ

> Back fait en **un seul commit** `6cab382` (2.3, 3.5 et 4.3 réunis) : le workflow du back veut un commit par ticket, avec fiche, statut et rapport de passation dedans.

## 2. Back : inscrire un stagiaire jamais activé (J2, TDD)

- [x] 2.1 RED : `InscriptionServiceImplTest` — stagiaire inactif jamais activé → inscrit ; inactif déjà activé (suspendu) → `ResourceNotFoundException`
- [x] 2.2 `findStagiaireOrThrow` avec `activationService.hasEverActivated` ; GREEN
- [x] 2.3 Commit `feat(inscriptions): allow enrolling a stagiaire who has not activated yet`

## 3. Back : désinscrire (J6, J7, TDD)

- [x] 3.1 RED : test sur base réelle : désinscrire un stagiaire qui a un document sur la formation (constater l'échec actuel, clé étrangère)
- [x] 3.2 RED : `InscriptionServiceImplTest` — formation archivée → `ConflictException` ; documents de l'inscription supprimés, puis l'inscription ; fichiers supprimés du stockage ; échec du stockage journalisé sans erreur ; inscription absente → aucune erreur
- [x] 3.3 RED : `InscriptionControllerTest` — `409` sur formation archivée
- [x] 3.4 `DocumentRepository.findAllByInscription`, `deleteInscription` ; GREEN
- [x] 3.5 Commit `feat(inscriptions): delete the inscription's documents on unenroll and refuse archived formations`

## 4. Back : documents et vérification

- [x] 4.1 `tech.md` (règles du `POST` et du `DELETE`), ticket à « Done »
- [x] 4.2 Suite complète verte ; rebuild du conteneur local depuis la branche ; essai à la main (`curl`) : inscrire un compte jamais activé, désinscrire avec un document
- [x] 4.3 Commit `docs(inscriptions): document the enrollment rules`
- [x] 4.4 Front : entrée dans `docs/charlotte/changements-back.md` (dont le risque : suppression définitive de preuves Qualiopi)

## 5. Front : données (TDD)

- [ ] 5.1 Mocks MSW `mockEnroll()` / `mockUnenroll()` dans `src/test/`
- [ ] 5.2 RED puis GREEN : `enrollStagiaire`, `unenrollStagiaire`, `useEnrollStagiaires` (séquentiel, `409` = réussite, résultat `{ enrolled, failed }`), `useUnenrollStagiaire` (invalidations), `inscriptionOutcome.js`
- [ ] 5.3 Commit `feat(inscriptions): add the enroll and unenroll API calls`

## 6. Front : sélecteurs (TDD)

- [ ] 6.1 RED puis GREEN : `FormationPicker` (formations actives, recherche, sélection conservée, nombre annoncé, `excludeIds`, erreur + « Réessayer », jest-axe)
- [ ] 6.2 RED puis GREEN : `StagiairePicker` options `includePending` et `excludeIds` (suspendus jamais proposés) ; message groupé inchangé
- [ ] 6.3 Commit `feat(inscriptions): add the formation picker and extend the stagiaire picker`

## 7. Front : création d'un stagiaire (TDD)

- [ ] 7.1 RED : `AccountFormPage` — section absente pour un formateur et en modification ; aucune formation → parcours inchangé ; deux formations → `POST /users` puis deux `POST` dans l'ordre, page du stagiaire avec récapitulatif ; échec partiel ; `409` sur le compte → aucune inscription
- [ ] 7.2 Mise en œuvre ; GREEN
- [ ] 7.3 Commit `feat(inscriptions): enroll a stagiaire in formations when creating the account`

## 8. Front : page du stagiaire (TDD)

- [ ] 8.1 RED : `AccountDetailPage` — section « Formations », récapitulatif de création, « Inscrire à une formation », « Désinscrire » avec confirmation, formation archivée sans action, formateur sans action, vide, erreur, jest-axe
- [ ] 8.2 Mise en œuvre ; GREEN
- [ ] 8.3 Commit `feat(inscriptions): manage a stagiaire's formations from their page`

## 9. Front : page de la formation (TDD)

- [ ] 9.1 RED : `FormationDetailPage` — « Inscrire des stagiaires » (jamais activés inclus, suspendus et inscrits exclus), échecs par nom, « Désinscrire » avec le nombre de documents, archivée sans action, formateur sans action, jest-axe
- [ ] 9.2 Mise en œuvre ; GREEN
- [ ] 9.3 Commit `feat(inscriptions): enroll and unenroll stagiaires from the formation page`

## 10. Clôture

- [ ] 10.1 `npm run check` vert
- [ ] 10.2 Passage manuel sur le vrai back local (branche back du change) : les trois parcours, un échec partiel, une désinscription avec document
- [ ] 10.3 Docs : `etat-front.md`, `CLAUDE.md` (règles à retenir), `spec.md` (cases cochées)
- [ ] 10.4 Relecture (D30) ; fusion dans `dev` sur demande de Manon
