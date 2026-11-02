# Design

## Context

- Contrat (`tech.md` §6, TICKET-026) : `GET /documents?formationId=` → `DocumentResponse[]` ; `POST /documents` multipart (`file`, `formationId` ou `inscriptionId`, un seul des deux) → `201` ; `GET /documents/{id}/download` → flux binaire (proxy, pas de redirection) ; `DELETE /documents/{id}` → `204`. `DocumentResponse` : `id`, `fileName`, `fileUrl` (Supabase, inutilisée côté front), `fileSize` (octets), `mimeType`, `uploadedBy` (`UserResponse`), `formationId`, `inscriptionId`, `createdAt`. Le back valide l'extension et la signature (pdf, jpg, png, docx), 10 Mo au plus, et refuse un formateur hors de ses formations (`403`) ; la suppression est réservée à la chargée de formation ou à l'auteur de l'envoi.
- État actuel : `FormationDetailPage` rend une section « Documents » avec une note, sans appel (F3, exigence « Emplacement des documents » de `formation-browsing`). Le détail connaît déjà l'utilisateur (`useCurrentUser`) et la formation (`formateur`, `status`). `features/formations/api.js` montre le patron multipart (`Content-Type: undefined` pour laisser le navigateur écrire la limite). `ConfirmDialog` existe, avec le piège de focus partagé (`useModalFocus`).
- Voir `proposal.md` pour la motivation et `docs/decisions-documents.md` (G1–G6).

## Goals / Non-Goals

**Goals:**
- Section fidèle au contrat et aux droits réels du back, sans bouton menant à un `403`.
- Règles (types, taille, droits, libellés) en fonctions pures testées sans rendu.
- Le dépôt par le stagiaire (028) pourra réutiliser `api.js`, `documentFiles.js` et `DocumentDropzone` tels quels.

**Non-Goals:**
- Documents ciblés par stagiaire (`inscriptionId`) et dépôt par le stagiaire (TICKET-028).
- Aperçu en ligne, barre de progression, reprise d'un envoi interrompu, envois en parallèle.
- Toute modification du back ou de `tech.md`.

## Decisions

### 1. Logique pure dans `documentFiles.js`
`validateDocumentFile(file)` renvoie un message ou `null` (extension pdf, jpg, jpeg, png, docx insensible à la casse ; 10 Mo au plus, 10 × 1024 × 1024 octets comme le back ; fichier vide refusé), `formatFileSize(bytes)` (« 850 o », « 12 Ko », « 3,4 Mo », locale `fr`), `documentKind(fileName)` (« PDF », « Image », « Word » pour l'icône et son texte), `canUploadDocument(user, formation)` et `canDeleteDocument(user, formation, document)`.
- Droits : dépôt si la formation est active et (`SUPER_ADMIN`, ou `ADMIN` dont l'id est `formation.formateur.id`) ; suppression si la formation est active et (`SUPER_ADMIN`, ou `ADMIN` dont l'id est `document.uploadedBy.id`) ; le stagiaire jamais.
- *Pourquoi* : les règles de G2, G3 et G4 sont testées sans rendu, et 028 les réutilise.
- *Alternative écartée* : les écrire dans les composants (règles dispersées, testables seulement par rendu).

### 2. Appels et hooks : `api.js`, `hooks.js`
`listDocuments(formationId)`, `uploadDocument(file, formationId)` (FormData `file` + `formationId`, `Content-Type: undefined`), `downloadDocument(id)` (`responseType: 'blob'`), `deleteDocument(id)`. Hooks : `useDocuments(formationId)` (clé `['documents', formationId]`), `useUploadDocuments(formationId)`, `useDeleteDocument()`, `useDownloadDocument()`.
- `useUploadDocuments` expose `upload(files)` : contrôle chaque fichier, envoie les valides l'un après l'autre (`for … await`), collecte `{ file, error }` pour les refus (client ou `ApiError` du back), n'abandonne jamais sur une erreur, puis invalide `['documents', formationId]` une seule fois à la fin (même si tout a échoué : l'état du back fait foi). Il expose `isPending` et `rejections`.
- `useDeleteDocument` invalide `['documents']` en cas de succès et de `404` (le document n'existe plus) ; aucune mise à jour optimiste.
- *Pourquoi* : un `POST` par fichier est le contrat ; l'envoi séquentiel garde l'ordre, simplifie les messages par fichier et ménage le back (10 Mo par fichier).
- *Alternative écartée* : envois en parallèle (ordre de la liste non maîtrisé, rafales sur le back).

### 3. Téléchargement : blob puis enregistrement (G1)
`downloadDocument` demande le binaire par le client axios (cookie, intercepteur) ; `saveBlob(blob, fileName)` crée une adresse d'objet, clique un lien `download` temporaire, puis la révoque. Le nom vient de `DocumentResponse.fileName`, pas de l'en-tête.
- *Piège* : avec `responseType: 'blob'`, le corps d'une erreur (`403` / `404`) arrive en `Blob` et non en JSON, donc l'intercepteur `ApiError` (D12) ne lit pas le `message`. `downloadDocument` relit le blob d'erreur (`await blob.text()` puis `JSON.parse` protégé) et relance une `ApiError` avec le `status` et le message du back, ou un message par défaut.
- *Pourquoi* : le fichier est derrière la session ; l'erreur doit rester lisible dans l'interface.
- *Alternative écartée* : lien `<a href>` direct (cookie entre origines en local, JSON brut affiché en cas d'erreur).

### 4. Composants dans `features/documents/components/`
- `DocumentSection({ formation })` : lit `useCurrentUser`, appelle `useDocuments`, calcule `canUpload`, rend le titre « Documents », la zone de dépôt si permise, les résultats d'envoi, la liste et la confirmation de suppression (un seul état `deleting`, comme la page des catégories). Chargement, erreur et vide comme `InscritsSection`.
- `DocumentDropzone({ onFiles, disabled, isPending })` : zone `dragenter / dragover / drop` (empêche le comportement par défaut du navigateur, sinon il ouvre le fichier), plus `<input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.docx">` relié à un bouton « Choisir des fichiers » ; le texte de la zone dit les types et la taille permis ; état « Envoi en cours… » (`role="status"`), zone désactivée pendant un envoi.
- `DocumentList({ documents, canDelete, onDownload, onDelete, downloadError })` : `<ul>`, une ligne par document avec icône + type en texte, nom, taille, date, expéditeur, « Télécharger » et, si permis, « Supprimer » (noms accessibles avec le nom du fichier).
- *Pourquoi* : `DocumentSection` porte l'état et les hooks, les deux autres sont présentationnels et réutilisables par 028.
- *Alternative écartée* : tout dans `FormationDetailPage` (page déjà longue, mélange avec l'archivage et les inscrits).

### 5. Intégration au détail et nettoyage
`FormationDetailPage` remplace la `<section>` réservée par `<DocumentSection formation={formation} />`. Les tests existants du détail et du routeur qui rendent cette page déclarent `mockDocuments()` (un appel non déclaré fait échouer le test, `renderWithProviders`). La spec `formation-browsing` perd l'exigence « Emplacement des documents » (delta `REMOVED`). Les styles de la section vont dans `features/documents/` en jetons et `rem` (tests d'hygiène CSS existants).

### 6. Tests (TDD, avant le code)
`documentFiles.test.js` (types, taille aux bornes, tailles lisibles, droits par rôle × formation × auteur × archivage), `api`/`hooks.test.jsx` (corps multipart, séquence, collecte des refus, invalidation unique, erreur de blob relue, `404` à la suppression), `DocumentDropzone.test.jsx` (glisser-déposer, bouton, refus, désactivation), `DocumentList.test.jsx`, `DocumentSection.test.jsx` (rôles, archivée, vide, erreur, envoi de plusieurs fichiers, suppression avec confirmation et annulation, nom de fichier en texte, jest-axe) et ceux du détail. Helpers MSW dans `src/test/documents.js` (liste avec état, `POST`, téléchargement binaire, `DELETE`, erreurs).

## Risks / Trade-offs

- [Un fichier de 10 Mo passe en mémoire pour le téléchargement] → plafond du back à 10 Mo, acceptable ; pas de flux.
- [jsdom n'a ni `URL.createObjectURL` ni de téléchargement réel] → `saveBlob` isolée et simulée dans les tests ; vérification réelle lors du passage manuel.
- [Le glisser-déposer ne se teste pas fidèlement en jsdom] → les tests simulent `drop` avec un `dataTransfer` ; le bouton « Choisir des fichiers » couvre le clavier et le tactile ; vérification manuelle.
- [Plusieurs fichiers = plusieurs requêtes : un échec réseau au milieu] → les fichiers déjà envoyés restent ; le résultat par fichier dit lesquels ont échoué, la liste rechargée montre l'état réel.
- [Le formateur dépose sur une formation qu'on lui retire entre-temps] → le back répond `403`, affiché pour ce fichier ; la liste est rechargée.
- [Formation archivée en lecture seule seulement côté front (G3)] → demande consignée pour Charlotte ; un envoi direct à l'API resterait possible tant que le back ne le refuse pas.
- [Le nom d'un fichier peut contenir du balisage ou être très long] → rendu en texte, coupure des mots longs (`overflow-wrap`) dans la ligne.

## Migration Plan

Aucune donnée à migrer. Retour arrière : revert du commit d'intégration (la section redevient la note).

## Open Questions

- Aucune qui change la spec, l'approche ou les tâches. À confirmer avec Charlotte (sans bloquer) : refus du dépôt et de la suppression sur formation archivée.
