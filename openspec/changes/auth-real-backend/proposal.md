# Proposal

## Why

Aujourd'hui, personne ne peut réellement se connecter : `LoginPage` fait un `console.log`, l'état « connecté » est un faux `isAuthenticated` stocké dans `localStorage` par le thème, le rôle est choisi à la main par `RoleSwitcher`, et aucune route n'est gardée. Le back est prêt (`POST /auth/login`, `GET /auth/me`, activation, réinitialisation). Tout le reste du portail (formations, messagerie, documents) dépend d'un utilisateur réel avec un rôle réel ; c'est donc le premier branchement sur le vrai back. Les fondations (client axios, `ApiError`, `setUnauthorizedHandler`, Vitest/MSW/axe) existent depuis `setup-front-foundations`.

## What Changes

**Côté affecté : front uniquement** (aucune demande de changement au back ; deux questions déjà ouvertes dans `points-pour-charlotte.md` Q2). Tickets back : TICKET-016 (connexion), TICKET-017 (activation), TICKET-018 (mot de passe oublié / réinitialisation), TICKET-008 pour le câblage.

- Session : un `UserProvider` basé sur `GET /auth/me` (aucun jeton ni donnée personnelle dans le navigateur, D31), un hook `useCurrentUser`, `login`/`logout` (TanStack Query). Branchement de `setUnauthorizedHandler` : un 401 hors connexion vide la session et redirige vers `/login` avec « session expirée », sans rechargement dur.
- Connexion branchée sur `POST /auth/login` : champs e-mail + mot de passe, erreurs en ligne (401, 403 compte non activé, 429), redirection vers le tableau de bord. Déconnexion via `POST /auth/logout`.
- Pages **activation** (`/activation`) et **mot de passe oublié / réinitialisation** (`/mot-de-passe-oublie`, `/reinitialisation`) branchées sur `activate`, `resend-activation`, `forgot-password`, `reset-password`, avec bandeau de succès sur `/login`.
- Validateurs maison dans `src/utils/validation.js` (e-mail, mot de passe 8–72 car. + 1 majuscule + 1 chiffre, confirmation) et formulaires React Hook Form (D13).
- Gardes de routes `RequireAuth` / `RequireRole` (D9) ; routes `/admin`, `/formateur`, `/stagiaire` remplacées par un tableau de bord unique `/` dont la tuile dépend du rôle réel. Libellés de rôles alignés sur le back : `SUPER_ADMIN` → « Chargée de formation », `ADMIN` → « Formateur », `STAGIAIRE` → « Stagiaire » (D33).
- **BREAKING (interne)** : suppression de `RoleSwitcher` et de `dev-role`, du faux `isAuthenticated`/`toggleAuth` du thème (et de sa persistance), de `ProtectedRoute`, de `utils/routeManager.jsx` et de l'ancien `UserProvider` (restes d'un autre projet). Les anciens chemins `/admin`, `/formateur`, `/stagiaire` disparaissent.
- Correction d'un bug de casse qui ferait échouer le build Linux/CI : `Layout.jsx` importe `./layout.module.css` alors que le fichier s'appelle `Layout.module.css`.

**Hors périmètre** : renommage des routes de gestion vers `/gestion/*` et le tableau de bord à 4 tuiles (TICKET-043), pages formations/catégories/messagerie (changes suivants, y compris la protection fine de leurs données), création de comptes (TICKET-021), page profil / changement de mot de passe, règles CSS `high-contrast`/`text-large`, refonte visuelle.

## Capabilities

### New Capabilities
- `user-session`: identité de l'utilisateur courant (rôle lu via `/auth/me`), connexion, déconnexion, expiration de session, accès aux routes selon l'authentification et le rôle.
- `account-credentials`: activation de compte par code, renvoi de code, mot de passe oublié et réinitialisation, avec les règles de mot de passe et les messages du back.

### Modified Capabilities
<!-- Aucune : l'exigence « Session expirée sur 401 » de `api-client` ne change pas ; son application (redirection vers /login) est spécifiée dans `user-session`. -->
- Aucune

## Impact

- **Code** : `src/context/` (nouveau `UserProvider`, suppression de l'ancien), `src/hooks/` (`useCurrentUser`, `useLogin`, `useLogout`, hooks d'activation/réinitialisation), `src/router/router.jsx`, `src/Layout/Layout.jsx` (retrait de `RoleSwitcher`, correction de la casse CSS), `src/components/Pages/LoginPage`, nouvelles pages d'activation et de récupération, `LoginForm`, `LoginButton`, `HomePage`, `utils/roles.js`, `use-theme.js` (retrait de l'auth), `src/utils/validation.js`.
- **Docs** : `docs/spec.md` (critères TICKET-016/017/018), `docs/decisions-front-foundations.md` (nouvelles décisions), `docs/points-pour-charlotte.md` (Q2 : e-mail dans le lien d'activation ; 2 incohérences d'AC), `CLAUDE.md`.
- **Dépendances** : aucune nouvelle (TanStack Query et React Hook Form déjà installés).
- **Tests** : MSW pour tous les cas d'erreur de `tech.md` ; un check jest-axe par page (connexion, activation, mot de passe oublié, réinitialisation).
- **Écarts documentaires à signaler** : le plan (§ connexion) parle d'« identifiant », `tech.md` d'e-mail → e-mail (D40) ; US-001 AC-01 nomme le bouton « Commencer la session » alors que la coque actuelle dit « SE CONNECTER » (voir design).
