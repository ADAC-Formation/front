# Tasks

## 1. Préparation

- [x] 1.1 Vérifier que l'on est sur `feature/documents` (au niveau de `dev`, rien de nouveau), que `npm run check` est vert au départ et que `git -C ../../back-readonly status` est propre ; rafraîchir le back (`git -C ../../back-readonly pull`) et relire `tech.md` §3 (`GET /formations`, inscriptions) et §6 (`/documents`) pour voir si Charlotte a déjà répondu à Q13
- [x] 1.2 Corriger `docs/decisions-documents.md` G9 (« `/profil` » → route existante `/profile`) ; écrire dans `docs/spec.md` les critères de TICKET-028 (spec `stagiaire-documents`, G8–G12) pour validation de Manon ; vérifier que le fichier les contient

## 2. Logique pure et appels (TDD)

- [x] 2.1 RED : `documentFiles.test.js` — `inscriptionIdOf` (champ présent, absent, `null`, non numérique) ; `hooks.test.jsx` — `uploadDocument` / `useUploadDocuments` avec `{ inscriptionId }` (champ multipart `inscriptionId`, jamais `formationId`), cible invalide (les deux ou aucun) refusée sans appel, `useDocuments({ inscriptionId })` (clé et paramètre `inscriptionId`, désactivable avec `enabled`) ; les tests de 027 doivent rester verts ; confirmer RED
- [x] 2.2 Ajouter `inscriptionIdOf` à `documentFiles.js`, généraliser `api.js` et `hooks.js` à une cible `{ formationId }` ou `{ inscriptionId }` (appels de `DocumentSection` mis à jour) ; GREEN
- [x] 2.3 Étendre `src/test/documents.js` : liste et dépôt par `inscriptionId` (état séparé), `calls.uploaded` avec `inscriptionId` ; vérifier qu'un appel non déclaré fait échouer le test
- [x] 2.4 Commit `feat: target documents by inscription`

## 3. Liste sans expéditeur ni suppression (TDD)

- [x] 3.1 RED : `DocumentList.test.jsx` — `showSender={false}` n'affiche aucun nom d'expéditeur, sans `canDelete` aucun « Supprimer » ; le comportement par défaut de 027 est inchangé ; confirmer RED
- [x] 3.2 Ajouter `showSender` (vrai par défaut) à `DocumentList.jsx` ; GREEN
- [x] 3.3 Commit `feat: let the document list hide the sender`

## 4. Section « Mes documents » (TDD)

- [x] 4.1 RED : `components/StagiaireDocSection.test.jsx` — chargement et erreur des formations avec « Réessayer » ; aucune formation (« Vous n'êtes inscrit à aucune formation pour le moment ») ; une sous-section par formation, actives avant archivées ; liste des documents de l'inscription (type, nom, taille, date, sans expéditeur) ; liste vide (« Aucun document déposé pour cette formation ») ; erreur de liste limitée à sa formation ; zone de dépôt sur formation active, absente sur formation archivée ; dépôt valide (`POST` avec `inscriptionId`, succès annoncé, document dans la liste) ; `.exe` refusé sans appel ; `400` / `403` du back sur un fichier sans bloquer les autres ; téléchargement réussi et erreur `403` ; aucun « Supprimer » ; formation sans `inscriptionId` (« Dépôt indisponible pour le moment », aucun appel `/documents`) ; nom de fichier avec HTML rendu en texte ; jest-axe ; confirmer RED
- [x] 4.2 Extraire `UploadNotices` de `DocumentSection.jsx` (tests de 027 verts), créer `StagiaireDocSection.jsx` (et `InscriptionDocuments`) et sa feuille de style (jetons, `rem`) ; GREEN
- [x] 4.3 Commit `feat: add the stagiaire documents section`

## 5. Page de profil et route (TDD)

- [x] 5.1 RED : `features/profile/pages/ProfilePage.test.jsx` — stagiaire : titre « Mon profil » et section « Mes documents » ; ADMIN et SUPER_ADMIN : titre seul, section absente, aucun appel `/documents` ; page enveloppée dans `PageShell` (un seul `<main>`, celui du `Layout`) ; jest-axe ; test de route : `/profile` charge la nouvelle page (router) ; confirmer RED
- [x] 5.2 Créer `features/profile/pages/ProfilePage.jsx`, supprimer `components/Pages/Stagiaire/ProfilePage/`, mettre à jour `router/router.jsx` (`lazyPage`, route `profile`) ; GREEN avec `npm run test -- ProfilePage router`
- [x] 5.3 Commit `feat: add Mes documents to the profile page`

## 6. Documentation et vérification

- [x] 6.1 Passage manuel sur le vrai back local (fait par Manon le 2026-11-09, OK) (**débloqué le 2026-11-09 : le back `dev` envoie `inscriptionId`, G15 ; reconstruire l'image depuis `dev`**) : lire `inscriptionId`, déposer plusieurs fichiers, refus d'un `.exe` et de plus de 10 Mo, télécharger, formation archivée, vérifier que le document est visible côté chargée de formation (`GET /documents?inscriptionId=`), supprimer un de ses dépôts, vérifier le `403` sur le dépôt d'un autre par appel direct
- [x] 6.2 Mettre à jour `CLAUDE.md` (« État actuel » : documents du stagiaire branchés, hypothèse `inscriptionId` isolée dans `inscriptionIdOf`, page de profil dans `features/profile/`, tout test qui rend la page de profil déclare `mockDocumentApi()` et les formations), `docs/decisions-documents.md` (constats d'implémentation) et `docs/points-pour-charlotte*.md` si le passage manuel révèle des écarts
- [x] 6.3 `npm run check` vert (lint + tests + build + budget du bundle) ; `git -C ../../back-readonly status` propre ; relecture (`/code-review`) et correction des remarques bloquantes
- [x] 6.4 Commit `docs: record the stagiaire documents`

## 7. Dépôt sur la page de la formation, résumé sur le profil (G16, 2026-11-09)

- [x] 7.1 RED puis GREEN : `DocumentList` (`locationOf`, `onDownload` facultatif), `MyDocumentsSection` (ex-`StagiaireDocSection`, une seule formation), `DocumentsSummary` + `useMyDocuments`, détail de formation (section pour le stagiaire seulement), profil (résumé)
- [x] 7.2 Docs : `decisions-documents.md` (G16), `spec.md`, `CLAUDE.md`, ce change
- [x] 7.3 Le passage manuel (6.1) se fait sur cette version : déposer et supprimer depuis `/formations/:id`, retrouver le document avec son lien depuis `/profile`

## 8. Documents envoyés vus par les managers (G17, 2026-11-09)

- [x] 8.1 RED puis GREEN : `SentDocuments`, `StagiaireDocumentsSection`, `useStagiaireInscriptions`, « Stagiaires inscrits » du détail de formation, `AccountDetailPage` (stagiaires)
- [x] 8.2 Docs : `decisions-documents.md` (G17), `spec.md`, `CLAUDE.md`, `points-pour-charlotte*.md` (Q16), `questions-pour-adac.md`
- [ ] 8.3 Passage manuel : en chargée de formation puis en formateur, vérifier la coche, le lien de téléchargement, le profil d'un stagiaire (formation hors périmètre du formateur ignorée)
- [ ] 8.4 Checklist nommée par document requis : bloquée sur les réponses de l'ADAC (`docs/questions-pour-adac.md` §A)

## Workflow follow-up

- Archiver le change (`/opsx:archive`) et synchroniser les specs : `stagiaire-documents` ajoutée.
- 028 est le dernier ticket de `feature/documents` : la PR vers `dev` s'ouvre sur demande explicite de Manon (D3, D43), de préférence après le passage manuel (6.1, Q13 traitée par le back).
