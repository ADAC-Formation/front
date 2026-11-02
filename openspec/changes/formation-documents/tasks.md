# Tasks

## 1. Préparation

- [x] 1.1 Vérifier que l'on est sur `feature/documents` (créée depuis `feature/formations`), que `npm run check` est vert au départ et que `git -C ../../back-readonly status` est propre ; rafraîchir le back (`git -C ../../back-readonly pull`) et relire `tech.md` §6 (`/documents`) et `DocumentResponse`
- [x] 1.2 Écrire dans `docs/spec.md` les critères de TICKET-027 (spec `formation-documents`, décisions G1–G6) pour validation de Manon ; vérifier que le fichier les contient

## 2. Logique pure (TDD)

- [x] 2.1 RED : `src/features/documents/documentFiles.test.js` — `validateDocumentFile` (pdf, jpg, jpeg, png, docx acceptés quelle que soit la casse ; `.exe`, `.doc`, sans extension refusés ; 10 Mo pile accepté, 10 Mo + 1 octet refusé ; fichier vide refusé), `formatFileSize` (octets, Ko, Mo en français), `documentKind`, `canUploadDocument` et `canDeleteDocument` (chargée de formation, formateur de la formation ou d'un autre, auteur ou non, stagiaire, formation archivée) ; confirmer RED
- [x] 2.2 Créer `documentFiles.js` ; GREEN
- [x] 2.3 Commit `feat: add document file rules`

## 3. Appels, hooks et helpers MSW (TDD)

- [x] 3.1 Créer `src/test/documents.js` : `mockDocumentApi` (liste avec état en mémoire, `POST` multipart qui enregistre le nom et `formationId` reçus, téléchargement binaire, `DELETE`, erreurs `400` / `403` / `404`, erreur de téléchargement en JSON) ; vérifier qu'un appel non déclaré fait échouer le test
- [x] 3.2 RED : `src/features/documents/hooks.test.jsx` — `useDocuments` (clé par formation), `useUploadDocuments` (un `POST` par fichier valide dans l'ordre, refus client sans appel, `400` d'un fichier sans arrêter les suivants, rechargement unique à la fin), `useDeleteDocument` (rechargement après succès et après `404`), `downloadDocument` (blob reçu ; erreur `403` / `404` en blob devenue une `ApiError` avec le même statut et un message français) ; confirmer RED
- [x] 3.3 Créer `api.js`, `hooks.js` et `saveBlob.js` (adresse d'objet, lien temporaire, révocation) ; GREEN
- [x] 3.4 Commit `feat: add document API and hooks`

## 4. Liste et téléchargement (TDD)

- [x] 4.1 RED : `components/DocumentList.test.jsx` — une ligne par document (type en texte, nom, taille, date, expéditeur sans e-mail), nom contenant du HTML rendu en texte, « Télécharger » nommé avec le fichier, « Supprimer » seulement si permis, jest-axe ; confirmer RED
- [x] 4.2 Créer `DocumentList.jsx` et sa feuille de style (jetons, `rem`, `overflow-wrap`) ; GREEN
- [x] 4.3 Commit `feat: add the document list`

## 5. Zone de dépôt (TDD)

- [ ] 5.1 RED : `components/DocumentDropzone.test.jsx` — bouton « Choisir des fichiers » et champ fichier multiple avec types acceptés, `drop` de plusieurs fichiers transmet les fichiers, `dragover` n'ouvre pas le fichier dans le navigateur, texte des types et de la taille, désactivée pendant l'envoi avec « Envoi en cours… » annoncé, jest-axe ; confirmer RED
- [ ] 5.2 Créer `DocumentDropzone.jsx` et sa feuille de style ; GREEN
- [ ] 5.3 Commit `feat: add the document dropzone`

## 6. Section « Documents » (TDD)

- [ ] 6.1 RED : `components/DocumentSection.test.jsx` — chargement, erreur avec « Réessayer », liste vide « Aucun document disponible pour le moment » ; zone de dépôt par rôle (chargée de formation, formateur de la formation, formateur d'une autre, stagiaire) et absente sur formation archivée ; envoi de trois fichiers (ordre, « Envoi en cours… », liste rechargée) ; refus par fichier annoncés (type, taille, `400` du back) sans bloquer les autres ; téléchargement réussi (enregistrement simulé) et erreur `403` annoncée ; « Supprimer » par rôle et auteur, confirmation nommant le fichier, annulation (aucun appel, focus rendu), succès (« Document supprimé », liste rechargée), `404` et `403` ; confirmer RED
- [ ] 6.2 Créer `DocumentSection.jsx` (état `deleting`, résultats d'envoi, message de suppression) ; GREEN
- [ ] 6.3 Commit `feat: add the formation documents section`

## 7. Intégration au détail de formation (TDD)

- [ ] 7.1 RED : étendre `FormationDetailPage.test.jsx` — la section « Documents » liste les documents de la formation (appel `GET /documents?formationId=`) pour chaque rôle, plus de note « arriveront bientôt », un check jest-axe sur la page avec documents ; ajouter `mockDocumentApi()` aux tests du détail et du routeur qui rendent cette page ; confirmer RED
- [ ] 7.2 Remplacer la section réservée de `FormationDetailPage.jsx` par `<DocumentSection formation={formation} />` ; GREEN avec `npm run test -- FormationDetailPage router back-links`
- [ ] 7.3 Commit `feat: show the documents on the formation detail`

## 8. Documentation et vérification

- [ ] 8.1 Passage manuel sur le vrai back local (`docs/dev/README.md`) : déposer plusieurs fichiers (glisser-déposer et bouton), refus d'un `.exe` et d'un fichier de plus de 10 Mo, télécharger, supprimer, chaque rôle (chargée de formation, formateur de la formation et d'une autre, stagiaire inscrit), formation archivée ; consigner les écarts éventuels dans `docs/points-pour-charlotte.md`
- [ ] 8.2 Mettre à jour `CLAUDE.md` (« État actuel » : documents de formation branchés, `features/documents/`, tout test qui rend le détail déclare `mockDocumentApi()`), `docs/decisions-documents.md` (constats d'implémentation) et cocher les tâches de documentation
- [ ] 8.3 `npm run check` vert (lint + tests + build + budget du bundle) ; `git -C ../../back-readonly status` propre ; relecture (`/code-review`) et correction des remarques bloquantes
- [ ] 8.4 Commit `docs: record the formation documents`

## Workflow follow-up

- Archiver le change (`/opsx:archive`) et synchroniser les specs : `formation-documents` ajoutée, exigence « Emplacement des documents » retirée de `formation-browsing`.
- Branche `feature/documents` : TICKET-028 (documents du stagiaire, profil) suit sur la même branche ; la PR vers `dev` s'ouvre au dernier ticket de la branche (D3, D43), sur demande explicite de Manon.
