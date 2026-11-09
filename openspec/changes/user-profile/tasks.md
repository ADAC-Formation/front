# Tasks

Branche `feature/profile` (depuis `dev`). TDD : tests rouges avant le code.

## 1. Contrat et données (TDD)

- [x] 1.1 RED : `features/profile/hooks.test.jsx` — `useUpdateEmailNotifications` (PATCH `{ emailNotificationsEnabled }`, session mise à jour de façon optimiste, retour arrière sur erreur) et `useChangePassword` (PATCH `/users/me/password` `{ oldPassword, newPassword }`) ; `Axiosclient` : un 401 sur `/users/me/password` n'appelle pas le gestionnaire de session expirée
- [x] 1.2 Écrire `features/profile/api.js`, `hooks.js` et ajouter la route exemptée ; GREEN
- [x] 1.3 Commit `feat(profile): add profile queries and mutations`

## 2. Composants (TDD)

- [x] 2.1 RED : `ProfileInfo`, `EmailNotificationToggle` et `ChangePasswordForm` (scénarios de la spec : lecture seule, interrupteur immédiat / retour arrière / annonces, validation sans appel, succès vide les champs, 401 affiché sans déconnexion, lien « Mot de passe actuel oublié ? », jest-axe)
- [x] 2.2 Écrire les composants et leurs feuilles CSS Modules (jetons, `rem`) ; GREEN
- [x] 2.3 Commit `feat(profile): add info, email toggle and password sections`

## 3. Page (TDD)

- [x] 3.1 RED : `ProfilePage.test.jsx` — les trois rôles voient informations, notifications et mot de passe ; seul le stagiaire voit « Mes documents » ; jest-axe
- [x] 3.2 Brancher les sections dans `ProfilePage.jsx` ; GREEN
- [x] 3.3 Commit `feat(profile): complete the profile page`

## 4. Clôture

- [x] 4.1 `npm run check` vert ; mettre à jour `CLAUDE.md`, `docs/spec.md` et `docs/points-pour-charlotte.md` (Q1 : route toujours absente du back `dev`)
- [ ] 4.2 Passage manuel sur le vrai back local (informations, interrupteur ; le mot de passe attend la route du back), puis `/code-review` et archivage
