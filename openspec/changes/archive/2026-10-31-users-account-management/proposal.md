# Proposal

## Why

La chargée de formation ne peut aujourd'hui créer aucun compte : les tuiles « Formateurs » et « Stagiaires » du menu Gestion pointent vers `/admin/formateurs`, `/admin/formateurs/nouveau`, `/admin/stagiaires`, `/admin/stagiaires/nouveau`, qui n'existent pas dans le routeur. Or il n'y a pas d'inscription publique : sans comptes, personne ne peut activer son accès, et formations, messagerie et documents n'ont pas d'utilisateurs à qui s'adresser. Le back est prêt (TICKET-019, 050) et l'auth est branchée (`auth-real-backend`) : c'est le prochain maillon de la chaîne.

## What Changes

**Côté affecté : front uniquement** (aucune demande de changement au back ; un point d'information pour Charlotte, voir design). Tickets : TICKET-021 (front, branche `feature/users`), TICKET-019 et TICKET-050 (back, déjà livrés) pour le contrat.

- Pages de liste **Formateurs** et **Stagiaires** (`GET /users/formateurs`, `GET /users/stagiaires`) avec filtre actifs / suspendus pour la chargée de formation.
- **Création** d'un formateur ou d'un stagiaire (`POST /users/formateurs|stagiaires`) : formulaire validé côté client, erreur `409` « e-mail déjà utilisé » en ligne, confirmation « Compte créé, e-mail d'activation envoyé ».
- **Suspendre / réactiver** un compte (`PATCH /users/{id}/deactivate|reactivate`) depuis la liste et le détail.
- **Page détail** d'un compte (`GET /users/{id}`) et **édition** nom / prénom / e-mail (`PUT /users/{id}`, SUPER_ADMIN), avec avertissement que changer l'e-mail d'un compte déjà activé déconnecte l'utilisateur (effet de bord documenté dans `tech.md`).
- **Formateur (ADMIN) en lecture seule** : il peut consulter listes (comptes actifs) et détails, sans bouton de création, d'édition ni de suspension. Nouvelle décision à consigner (le ticket 021 réservait tout au SUPER_ADMIN ; `tech.md` autorise la lecture à ADMIN).
- Routes `/admin/formateurs[/nouveau|/:id]` et `/admin/stagiaires[/nouveau|/:id]` ajoutées au routeur ; le menu Gestion masque les liens « Créer » pour le formateur.
- Code dans `src/features/accounts/` (D32).

**Hors périmètre** (reporté, à consigner dans la doc) :
- Colonne « formations » et choix des formations à la création d'un stagiaire (`feature/formations` ; la création envoie `formationIds: []`).
- Bouton « Envoyer un message » du détail (`feature/messagerie`).
- Page Profil / `PATCH /users/me` et changement de mot de passe (Q1 ouverte).
- Import Excel de stagiaires (D14, ticket distinct).
- Toute modification du back ou appel d'écriture sur `ADAC-Formation`.

## Capabilities

### New Capabilities
- `account-management`: consultation, création, édition, suspension et réactivation des comptes formateurs et stagiaires, avec les droits propres à chaque rôle.

### Modified Capabilities
- Aucune (les gardes de rôle de `user-session` ne changent pas ; elles sont simplement appliquées aux nouvelles routes).

## Impact

- **Code** : nouveau `src/features/accounts/` (api, hooks TanStack Query, pages liste / création / détail, tests) ; `src/router/router.jsx` ; `src/components/Pages/ManagementMenu/ManagementMenu.jsx` (liens « Créer » selon le rôle) ; `src/utils/validation.js` (champ obligatoire nom / prénom déjà couvert par `validateRequired`, e-mail par `validateEmail`).
- **Tests** : MSW pour `/users/*` (200, 201, 403, 404, 409) ; un check jest-axe par page (2 listes, création, détail).
- **Docs** : `docs/spec.md` (critères TICKET-021 + 050), `docs/decisions-front-foundations.md` (nouvelles décisions D54+), `docs/points-pour-charlotte.md` (écart ticket 021 : `PATCH /users/{id}` avec `isActive` vs endpoints `deactivate`/`reactivate` de `tech.md`, déjà ligne 5), `CLAUDE.md` (état actuel).
- **Dépendances** : aucune nouvelle.
