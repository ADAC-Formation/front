# Proposal

## Why

Le détail d'une formation réserve une section « Documents » qui affiche « arriveront bientôt » (F3, F13) : la chargée de formation et les formateurs ne peuvent pas déposer de supports, les stagiaires ne peuvent pas les récupérer, alors que c'est la raison d'être du portail (remplacer les envois par e-mail, preuves Qualiopi). Le back expose tout le nécessaire (`GET` / `POST /documents`, `GET /documents/{id}/download`, `DELETE /documents/{id}`, TICKET-026 « Done ») ; TICKET-027 demande la partie front. Décisions de cadrage : `docs/decisions-documents.md` G1–G6.

## What Changes

- Remplacer l'emplacement réservé du détail de formation par une section « Documents » branchée sur `GET /documents?formationId=` : icône par type, nom du fichier (en texte), taille lisible, date d'envoi, nom de l'expéditeur (jamais son e-mail) ; états chargement, erreur avec « Réessayer » et liste vide « Aucun document disponible pour le moment » (G6).
- Téléchargement : un bouton par document appelle `GET /documents/{id}/download` par le client axios en blob, puis enregistre le fichier sous son nom d'origine ; `fileUrl` n'est jamais utilisée. Erreurs `403` / `404` affichées dans l'interface (G1).
- Dépôt : zone de glisser-déposer et bouton « Choisir des fichiers » (clavier), plusieurs fichiers. Contrôle côté client (pdf, jpg / jpeg, png, docx ; 10 Mo) puis un `POST /documents` multipart par fichier, envoyés l'un après l'autre ; les refus (client ou `400` / `403`) sont listés par fichier et annoncés sans bloquer les autres ; la liste est rechargée à la fin (G4).
- Suppression : « Supprimer » ouvre `ConfirmDialog`, puis `DELETE /documents/{id}` et rechargement de la liste ; message annoncé (G5).
- Droits affichés exactement comme ceux du back : chargée de formation partout ; formateur : dépôt sur ses formations seulement, suppression de ses propres envois seulement ; stagiaire : lecture et téléchargement (G2). Formation archivée : lecture et téléchargement seulement (G3).
- Nouveau code dans `src/features/documents/` (D32) ; le détail de formation n'y importe que `DocumentSection`.

Côté back : aucun changement requis. Deux points à confirmer avec Charlotte, consignés dans `docs/points-pour-charlotte.md` : le ticket parle d'« URL signée » alors que `tech.md` décrit un proxy binaire (le front suit `tech.md`, D40) ; le dépôt et la suppression sur formation archivée ne sont pas refusés par le back (règle d'interface seulement).

Hors périmètre : documents ciblés par stagiaire (`inscriptionId`) et dépôt par le stagiaire (TICKET-028, profil), notifications d'envoi (côté back), aperçu en ligne des PDF et images, barre de progression, inscrire / désinscrire.

## Capabilities

### New Capabilities
- `formation-documents`: consulter, télécharger, déposer et supprimer les documents d'une formation depuis son détail, selon le rôle et l'état de la formation.

### Modified Capabilities
- `formation-browsing`: l'exigence « Emplacement des documents » (section réservée, aucun appel `/documents`) est supprimée, remplacée par la capacité `formation-documents`.

## Impact

- Code : nouveau `src/features/documents/` (`api.js`, `hooks.js`, `documentFiles.js` pour le contrôle des fichiers et les libellés, `components/DocumentSection.jsx`, `DocumentDropzone.jsx`, `DocumentList.jsx` et feuilles de style) ; `src/features/formations/pages/FormationDetailPage.jsx` et son test (rend `DocumentSection` à la place de la note ; ses tests déclarent désormais `GET /documents`) ; `src/test/documents.js` (helpers MSW).
- API (lecture seule, `tech.md` §6, TICKET-026) : `GET /documents?formationId=`, `POST /documents` (multipart `file` + `formationId`, `201` → `DocumentResponse`, `400`, `403`), `GET /documents/{id}/download` (binaire), `DELETE /documents/{id}` (`204`, `403`, `404`). Ticket front : TICKET-027 (branche `feature/documents`).
- Dépendances : aucune nouvelle (`ConfirmDialog`, `Alert`, TanStack Query, axios existent).
- Docs : `docs/spec.md`, `docs/decisions-documents.md`, `docs/points-pour-charlotte.md`, `CLAUDE.md` (« État actuel »).
- Budget du bundle : la section est dans la page de détail déjà chargée à la demande ; vérifier que `npm run check` reste vert.
