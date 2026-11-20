# Tasks

Deux branches : **back** `feature/document-types` (depuis `origin/dev` dans `../back-readonly`, jamais sur `dev`) et **front** `feature/document-types-catalogue` (depuis `dev`). Le back vient en premier : le front se construit sur le contrat de `design.md` (points 3 et 4) avec des mocks, puis se vérifie sur le vrai back local. Chaque tâche « RED » finit par un test qui échoue pour la bonne raison.

## 1. Préparation

- [x] 1.1 Plan validé par Manon (point exigé par `AGENTS.md` du back : un humain valide le plan avant le travail)
- [x] 1.2 Back : `git fetch`, branche `feature/document-types` depuis `origin/dev` ; relire `AGENTS.md`, `CLAUDE.md`, `docs/BACKEND_WORKFLOW.md` ; suite de départ verte (hors les 3 échecs liés aux données locales, voir `changements-back.md`)
- [ ] 1.3 Front : branche `feature/document-types-catalogue` depuis `dev`, `npm run check` vert au départ
- [x] 1.4 Back : ticket `docs/tickets/TICKET-051.md` (format des tickets existants) et ligne dans `TICKETS.md`

## 2. Back : base et entité (TDD)

- [x] 2.1 RED : `DocumentTypeRepositoryTest` (base réelle, comme `CategoryRepositoryTest`) — enregistrer un type avec deux catégories et le relire ; nom en double refusé quelle que soit la casse (index unique) ; `deadline_days` sans `deadline_anchor` refusé ; jours hors de 0 à 365 refusés ; `findAllByIsActive`
- [x] 2.2 Migration `V6__add_document_types.sql`, entité `DocumentType`, enum `DeadlineAnchor`, `DocumentTypeRepository` ; GREEN
- [x] 2.3 Commit `feat(document-types): add the document types table and entity`

## 3. Back : service (TDD)

- [x] 3.1 RED : `DocumentTypeServiceImplTest` — créer (nom normalisé, catégories liées), nom en double `409` (casse ignorée), portée « toutes » avec des catégories `400`, portée « certaines » sans catégorie `400`, catégorie inconnue `404`, délai incomplet `400`, jours hors bornes `400`, format inconnu `400`, liste de formats vide traitée comme absente, modifier (`409` si le nom appartient à un autre type, même nom autorisé pour lui-même), activer et désactiver, type inconnu `404`, liste filtrée par `active`
- [x] 3.2 `DocumentTypeService(Impl)`, DTO `CreateDocumentTypeRequest` / `UpdateDocumentTypeRequest` / `DocumentTypeResponse` (`@JsonProperty("isRequired" | "isSensitive" | "isActive")`), `DocumentTypeMapper` ; GREEN
- [x] 3.3 Commit `feat(document-types): add the document types service`

## 4. Back : contrôleur (TDD)

- [x] 4.1 RED : `DocumentTypeControllerTest` — chaque endpoint de `design.md` point 3 : `201`, `200`, `204` jamais utilisé ; `403` pour ADMIN et STAGIAIRE sur chacun (liste comprise) ; `401` sans session ; `400` de validation ; `404` ; `409`
- [x] 4.2 `DocumentTypeController` (`/api/document-types`, `@PreAuthorize("hasRole('SUPER_ADMIN')")`, Swagger comme `CategoryController`) ; GREEN
- [x] 4.3 `docs/tech.md` (section « Types de document », ajoutée après les catégories), `docs/DB_MODEL.md` et `.mmd` ; commit `feat(document-types): expose /api/document-types`
- [x] 4.4 Suite complète du back : aucun échec nouveau ; reconstruire le back local et vérifier à la main avec `curl` (création, doublon, délai invalide, `403` formateur) ; consigner dans `docs/charlotte/changements-back.md` (entrée « prêt à relire », branche et commit) et mettre `etat-front.md` à jour

## 5. Front : logique pure (TDD)

- [ ] 5.1 RED : `documentTypeForm.test.js` — validation (nom vide, 255, aide 500, portée sans catégorie, délai sans nombre, jours hors de 0 à 365 ou non entiers), `toRequest` (portée « toutes » : `categoryIds` vide ; « certaines » : ids ; délai « Aucun » : ni jours ni repère ; formats cochés ; aide vide = `null`), `fromType` (aller-retour), `documentTypeLabels` (résumé de portée, libellé du délai, tri par nom sans casse ni accents)
- [ ] 5.2 Créer `documentTypeForm.js` et `documentTypeLabels.js` ; GREEN
- [ ] 5.3 Commit `feat(document-types): add the document type form rules`

## 6. Front : appels, hooks et mocks (TDD)

- [ ] 6.1 Créer `src/test/documentTypes.js` ; RED : `hooks.test.jsx` — liste (avec et sans `active`), création, modification et changement d'état invalident `['document-types']`, `409` et `404` remontent en `ApiError`
- [ ] 6.2 `api.js` et `hooks.js` ; GREEN
- [ ] 6.3 Commit `feat(document-types): add the document types requests`

## 7. Front : pages (TDD)

- [ ] 7.1 RED : `DocumentTypeListPage.test.jsx` (libellés de chaque type, tri, vide, erreur avec « Réessayer », désactivation avec confirmation et annulation sans appel, réactivation, erreur du back, un check jest-axe) ; `DocumentTypeFormPage.test.jsx` (création complète avec le corps exact, validations en ligne sans appel, `409` sous « Nom », modification préremplie et `PUT`, type introuvable, texte « formations en cours », un check jest-axe)
- [ ] 7.2 Créer les composants et pages (CSS Modules, jetons, `rem`, anneau de focus global) ; GREEN
- [ ] 7.3 Commit `feat(document-types): add the document types pages`

## 8. Front : Gestion, routes et plan du site (TDD)

- [ ] 8.1 RED : `ManagementMenu.test.jsx` mis à jour (trois tuiles, Profils à deux sections et ses liens, formateur : deux tuiles sans « Créer… » ni Documents) ; `ManagementTiles` (tuile à `sections`, CSS : libellés jamais coupés, actions visibles sans survol) ; `SiteMapPage` (« Documents » pour la chargée) ; test de route : un formateur est refusé sur `/admin/documents`
- [ ] 8.2 `ManagementTiles`, `ManagementMenu`, `SiteMapPage` ; trois routes dans le groupe chargée de `router.jsx` (`lazyPage`) ; GREEN, y compris `back-button-coverage`, `check-bundle` et les tests de gabarit
- [ ] 8.3 Commit `feat(document-types): add Documents and Profils to Gestion`

## 9. Données de développement et vérification

- [ ] 9.1 Ajouter la liste fictive à `docs/dev/seed-local-admin.sql` (rejouable) ; l'appliquer sur la base locale ; commit `chore(dev): seed the fictitious document types`
- [ ] 9.2 `npm run check` vert (lint, tests, build, budget du bundle)
- [ ] 9.3 Passage manuel sur le vrai back local (chargée) : créer, modifier, désactiver, réactiver ; doublon `409` ; portée par catégories ; vérifier au clavier ; mobile (320 px) et « Grand texte » (150 %) sur Gestion et sur le formulaire ; formateur : aucune entrée Documents ; consigner le résultat dans `decisions-documents.md` (G33)

## 10. Clôture

- [ ] 10.1 Docs : `docs/projet/spec.md` (critères de la tranche), `etat-front.md`, `CLAUDE.md` (route, mocks, piège éventuel), `changements-back.md` (état « poussé » quand Manon le décide)
- [ ] 10.2 Fusion de la branche front en avance rapide dans `dev` (D64) ; ne pousser ni ouvrir de PR sans demande explicite de Manon (la branche du back part en PR sur demande)
- [ ] 10.3 Archiver le change (`openspec archive`) ; résumer le résultat et lister les demandes encore ouvertes au back
