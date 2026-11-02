# Proposal

## Why

La page « Catégories » (`/formations/categories`) est une coque mockée : elle lit `utils/categories.js`, garde l'état en mémoire, son bouton « Créer une catégorie » ne fait rien et rien n'est envoyé au back. La chargée de formation ne peut donc ni corriger une catégorie (faute de frappe, couleur), ni en créer, ni en retirer une du choix de catégorie d'une formation. Le back expose tout ce qu'il faut (`POST` / `PUT /categories`, `PATCH …/activate` et `…/deactivate`, TICKET-047 « Done ») ; TICKET-049 demande la partie front. Décisions de cadrage : `docs/decisions-categories.md` C1–C5 (voir aussi F1, F5, F7, F12 dans `decisions-formations.md`).

## What Changes

- Brancher la page de gestion sur `GET /categories` : toutes les catégories (actives et désactivées), pastille de couleur, nom, état en texte « Active » / « Désactivée », dans l'ordre du back ; états chargement, vide et erreur avec « Réessayer ». Aucune action de suppression (`tech.md` §3, US-017 AC-05).
- « Créer une catégorie » et « Modifier » ouvrent une boîte de dialogue à nom + couleur (C2), un seul composant de formulaire. Couleur : sélecteur natif et champ hexadécimal synchronisés, `#RRGGBB` (C3). `POST /categories` ; `PUT /categories/{id}` (nom et couleur toujours envoyés). `409` (nom déjà utilisé) affiché dans la boîte, qui reste ouverte avec la saisie.
- « Désactiver » ouvre une confirmation qui explique l'effet, puis `PATCH …/deactivate` ; « Réactiver » est immédiat (`PATCH …/activate`) (C4). L'interrupteur et l'info-bulle au survol de la coque disparaissent.
- Chaque action réussie est confirmée par un message annoncé sur la page ; les caches des catégories (liste complète et liste des actives du formulaire de formation) et des formations sont rechargés, car la formation embarque sa catégorie (nom, couleur) (C5).
- Rendre la boîte de dialogue accessible aux champs de formulaire : le piège de focus de `ConfirmDialog` est extrait dans un hook partagé et inclut les champs.
- Déplacer la page dans `src/features/categories/` (D32) ; supprimer `components/Pages/Categories/` et le mock `utils/categories.js` (D11).

Côté back : aucune demande nouvelle, aucun écart relevé avec `tech.md` §3. Hors périmètre (change suivant `category-picker`, C1) : « Créer nouvelle catégorie » à la volée dans le formulaire de formation et filtre par catégorie sur la liste des formations.

## Capabilities

### New Capabilities
- `category-management`: gérer les catégories de formation (lister toutes, créer, modifier nom et couleur, désactiver avec confirmation, réactiver), réservé à la chargée de formation, sans suppression.

### Modified Capabilities

(aucune) — le lien « Gérer les catégories » de la liste (`formation-browsing`) et le sélecteur de catégories actives (`formation-management`) ne changent pas de comportement ; ils profitent seulement du rechargement des caches.

## Impact

- Code : `src/features/categories/` (`api.js`, `hooks.js`, nouveaux `categoryForm.js`, `components/CategoryFormDialog.jsx`, `pages/CategoryManagementPage.jsx` et sa feuille de style reprise de la coque) ; `src/components/molecules/ConfirmDialog/` (utilise le hook de focus extrait) ; nouveau hook partagé du piège de focus ; `src/router/router.jsx` (nouvelle page) ; `src/test/categories.js` (helpers MSW d'écriture) ; suppression de `components/Pages/Categories/` et de `utils/categories.js`.
- API (lecture seule, `tech.md` §3, TICKET-047) : `GET /categories`, `POST /categories`, `PUT /categories/{id}`, `PATCH /categories/{id}/activate` et `/deactivate` (`200` / `201` → `CategoryResponse`, `400`, `403`, `404`, `409`). Ticket front : TICKET-049.
- Dépendances : aucune nouvelle (`ConfirmDialog`, `Alert`, `FormField`, TanStack Query existent).
- Docs : `docs/spec.md`, `docs/decisions-categories.md`, `CLAUDE.md` (« État actuel » : les catégories ne sont plus mockées).
- Budget du bundle : page chargée avec `lazyPage`.
