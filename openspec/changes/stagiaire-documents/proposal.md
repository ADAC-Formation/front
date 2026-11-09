# Proposal

> **Mise à jour du 2026-11-09 (G16)** : le dépôt, la liste détaillée, le téléchargement et la suppression des documents du stagiaire sont dans la section « Mes documents » du détail de chaque formation (`MyDocumentsSection`) ; le profil n'en garde qu'un résumé en lecture seule (`DocumentsSummary`) avec, pour chaque document, la formation où il a été déposé (lien). Les passages ci-dessous qui parlent de « sous-sections par formation sur le profil » sont remplacés par G16.

## Why

Le stagiaire ne peut pas remettre ses propres pièces (justificatifs, documents personnels) à la chargée de formation : il passe encore par e-mail, ce que le portail doit remplacer (Qualiopi). Le back sait recevoir un document rattaché à une inscription (`POST /documents` avec `inscriptionId`, TICKET-026 « Done ») ; TICKET-028 (US-012) demande la partie front : une section « Mes documents » sur la page de profil du stagiaire. Décisions de cadrage : `docs/decisions-documents.md` G8–G12.

## What Changes

- Page de profil (`/profile`, aujourd'hui un bouchon vide) : titre « Mon profil » dans `PageShell` et, pour le seul stagiaire, la section « Mes documents » (G9). ADMIN et SUPER_ADMIN ne voient que le titre ; le reste du profil est TICKET-044.
- « Mes documents » : une sous-section par formation de `GET /formations` (périmètre du stagiaire), actives d'abord puis archivées. Chaque sous-section liste les documents de l'inscription (`GET /documents?inscriptionId=`) avec téléchargement, et offre la zone de dépôt de 027 (glisser-déposer plusieurs fichiers ou « Choisir des fichiers ») quand la formation est active (G10).
- Mêmes règles de fichier que 027 (pdf, jpg / jpeg, png, docx ; 10 Mo ; un `POST /documents` multipart par fichier avec `inscriptionId` à la place de `formationId` ; refus listés par fichier ; succès annoncé ; liste rechargée), via les composants et fonctions existants (G12).
- Le stagiaire peut supprimer ses propres dépôts (bouton « Supprimer » avec confirmation, formation active) ; le back répond `403` pour ceux d'un autre (mis à jour le 2026-11-09, G15).
- **Contrat (G8, G11, G15)** : le back envoie `inscriptionId` dans `FormationResponse` pour le stagiaire inscrit (Q13 traitée le 2026-11-09). Le front le lit en un seul point (`inscriptionIdOf`) ; pour un stagiaire sans inscription, la sous-section affiche « Dépôt indisponible pour le moment », sans aucun appel `/documents`.
- Généralisation de `uploadDocument` / `useUploadDocuments` / `useDocuments` de `features/documents/` : la cible est `{ formationId }` ou `{ inscriptionId }` (exactement un des deux) ; le comportement de 027 ne change pas.

Côté back : la demande Q13 (`inscriptionId` dans `FormationResponse`, suppression de ses dépôts par le stagiaire) est traitée (back `dev`, commit `e1f7c35`).

Hors périmètre : voir ces documents côté chargée de formation (US-010, Q6), reste du profil (TICKET-044 : informations, mot de passe, bascule e-mail), suppression par le stagiaire, inscrire / désinscrire.

## Capabilities

### New Capabilities
- `stagiaire-documents`: le stagiaire consulte, télécharge et dépose ses propres documents, par formation, depuis sa page de profil.

### Modified Capabilities

Aucune. `formation-documents` (documents de la formation) reste inchangée ; les fonctions d'API partagées sont généralisées sans changer son comportement.

## Impact

- Code : `src/features/documents/` (`api.js`, `hooks.js`, nouveau `components/StagiaireDocSection.jsx` et sa feuille de style, `inscriptionIdOf` dans `documentFiles.js`) ; page de profil déplacée dans `src/features/profile/pages/ProfilePage.jsx` (D32 prévoit `features/profile`), route `profile` de `router/router.jsx` mise à jour (chargée avec `lazyPage`, D59) ; suppression de `components/Pages/Stagiaire/ProfilePage/` ; `src/test/documents.js` (helpers MSW pour `inscriptionId`).
- API (lecture seule, `tech.md` §3 et §6, TICKET-026) : `GET /formations`, `GET /documents?inscriptionId=`, `POST /documents` (`file` + `inscriptionId`, `201`, `400`, `403`), `GET /documents/{id}/download`. Ticket front : TICKET-028 (branche `feature/documents`, dernier ticket de la branche : la PR vers `dev` suit sur demande de Manon, D3 / D43).
- Dépendances : aucune nouvelle.
- Docs : `docs/spec.md`, `docs/decisions-documents.md`, `docs/points-pour-charlotte.md` (Q13), `CLAUDE.md` (« État actuel »).
- Budget du bundle : page chargée à la demande ; vérifier que `npm run check` reste vert.
