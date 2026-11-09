# Proposal

## Why

La page `/profile` n'affiche que le résumé des documents du stagiaire. Chaque utilisateur doit pouvoir y voir ses informations, choisir de recevoir ou non les notifications par e-mail (ticket 036) et changer son mot de passe (ticket 044). Décisions : `docs/decisions-profil.md` (P1–P5).

## What Changes

- Section « Mes informations » en lecture seule (prénom, nom, e-mail, rôle libellé), tous rôles.
- Section « Notifications par e-mail » : interrupteur enregistré immédiatement par `PATCH /users/me`, optimiste avec retour arrière, confirmation et erreur annoncées.
- Section « Mot de passe » : formulaire ancien / nouveau / confirmation vers `PATCH /users/me/password` (route annoncée, pas encore dans le back `dev`, Q1) ; un `401` ne déconnecte pas.
- La section « Mes documents » du stagiaire est inchangée.

Hors périmètre : modification du nom ou de l'e-mail, suppression du compte.

## Capabilities

- `user-profile` (nouvelle).

## Impact

- `src/features/profile/` (api, hooks, composants), `src/api/Axiosclient.js` (route exemptée), `ProfilePage.jsx`.
- Côté back : Q1 (route de changement de mot de passe et ses codes d'erreur).
