# Proposal

## Why

Les pages Formations (liste et détail) tournent encore sur des données mockées (`utils/simFormations.jsx`, `utils/categories.js`) alors que le back expose déjà `GET /formations`, `GET /formations/{id}`, `PATCH /formations/{id}/archive` et `GET /categories`. C'est le dernier ticket *Must* qui manque au cœur du portail (TICKET-024), et documents, messagerie et la colonne « formations » des comptes en dépendent. Décisions de cadrage : `docs/decisions-formations.md` (F1–F6).

## What Changes

- Brancher la liste des formations sur `GET /formations` (`?status=ACTIVE|ARCHIVED`) : cartes avec intitulé, dates, modalité, catégorie (pastille couleur + nom), formateur et nombre d'inscrits ; recherche et tri côté client (F5).
- Vue par rôle : `SUPER_ADMIN` voit tout et peut archiver ; `ADMIN` a les pastilles « Mes formations » (défaut) / « Toutes » filtrées côté client (D46, F2) et aucune action ; `STAGIAIRE` voit « Mes formations » (actives par défaut, archivées en pastille), sans action (F6).
- Brancher le détail sur `GET /formations/{id}` : titre, dates, modalité, catégorie, formateur, nombre d'inscrits, badge « Archivée » ; liste nominative des inscrits via `GET /formations/{id}/inscriptions` pour `SUPER_ADMIN` et `ADMIN` seulement (F3) ; emplacement « Documents » réservé, sans appel (F3).
- Bouton « Archiver » pour `SUPER_ADMIN` : confirmation, `PATCH /formations/{id}/archive`, retour à la liste ; `409` (verrou optimiste) → invitation à recharger (F4). Pas de bouton « Modifier » (arrive avec 025).
- Catégorie lue dans la formation elle-même (`category.nom`, `category.couleur`, toujours renseignée, même désactivée, `tech.md` `FormationResponse`) : aucun appel à `GET /categories` n'est nécessaire dans ce change (précise F1 : la lecture des catégories est celle de la réponse de formation ; l'endpoint `/categories` sert à 048/049). `ListItem` reçoit la couleur en propriété au lieu de la chercher dans le mock.
- Gérer proprement `404` (« Formation introuvable ou non accessible », D46) et `403` (« Accès refusé », D52) sur le détail.
- Supprimer `utils/simFormations.jsx` (D11). `utils/categories.js` reste : `CreateFormationPage` et `CategoryManagement` l'utilisent encore ; il disparaît avec 048/049.
- Retirer de la liste les pastilles de catégories mockées (le filtre par catégorie est reporté à 048, F5).

Côté back : aucune demande nouvelle ; ce change s'appuie sur la demande déjà ouverte `points-pour-charlotte.md` Q3 (D46) et Q9 (code de référence, non affiché).

Hors périmètre : création et import Excel (025), « Modifier », sélecteur de catégorie (048), gestion des catégories (049), documents (027/028), inscrire / désinscrire, colonne « formations » des comptes.

## Capabilities

### New Capabilities
- `formation-browsing`: consulter les formations selon le rôle (liste filtrable, détail, inscrits, catégorie) et archiver une formation, branchés sur les endpoints `/formations` et `/categories` de `tech.md`.

### Modified Capabilities

(aucune)

## Impact

- Code : `src/features/formations/` (nouveau : `api.js`, `hooks.js`, pages, composants, tests), `src/components/Pages/FormationsPage` et `FormationDetails` (déplacés ou réécrits), `src/components/molecules/ListItem` (couleur en propriété), `src/router/router.jsx` (imports `lazyPage` vers `features/formations`), `src/test/msw/handlers.js` ; suppression de `src/utils/simFormations.jsx`.
- API (lecture seule, `tech.md` §4–5) : `GET /formations`, `GET /formations/{id}`, `PATCH /formations/{id}/archive`, `GET /formations/{id}/inscriptions`.
- Dépendances : aucune nouvelle ; réutilise `ConfirmDialog`, `PageShell`, `BackButton`, TanStack Query, le client axios.
- Docs : `docs/spec.md` (critères de TICKET-024), `docs/decisions-formations.md`, `CLAUDE.md` (« État actuel »).
- Budget du bundle : pages chargées avec `lazyPage` ; `npm run check` doit rester vert.
