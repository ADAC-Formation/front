## 1. Préparation

- [x] 1.1 Créer la branche `feature/auth` depuis `dev` (jamais depuis `categorie`) ; vérifier que `npm run check` est vert au départ
- [x] 1.2 Lister tous les usages à migrer : `grep` de `/admin"`, `/formateur`, `/stagiaire`, `homePath`, `roles`, `RoleSwitcher`, `dev-role`, `isAuthenticated`, `toggleAuth`, `ProtectedRoute`, `routeManager`, `UserProvider` ; noter le résultat dans le commit
- [x] 1.3 Écrire dans `docs/spec.md` les critères de TICKET-016, 017 et 018 (cas nominal + codes d'erreur de `tech.md`) pour validation de Manon (D49)

## 2. Validateurs (TDD)

- [x] 2.1 RED : `src/utils/validation.test.js` — e-mail, mot de passe (7 car., 73 car., sans majuscule, sans chiffre, valide), confirmation, code à 6 chiffres
- [x] 2.2 Confirmer RED, puis créer `src/utils/validation.js` ; confirmer GREEN
- [x] 2.3 Commit `feat: add form validators for email, password and code`

## 3. Composants de formulaire accessibles (TDD)

- [x] 3.1 RED : tests de `FormField` (étiquette liée, `error` → `aria-invalid` + `aria-describedby` + message) et de l'atome `Alert` (`role="alert"` / `role="status"`, contenu rendu en texte, jamais en HTML)
- [x] 3.2 Confirmer RED ; adapter `FormField`/`FormInput` (`error`, `ref`, props transmises) et créer `Alert` ; confirmer GREEN
- [x] 3.3 Commit `feat: make form fields accessible and add Alert component`

## 4. Session : API, hooks et provider (TDD)

- [x] 4.1 Créer `src/test/session.js` (`mockSession(role)` et `mockNoSession()` : handlers MSW pour `/auth/me`) et l'utiliser dans `renderWithProviders`
- [x] 4.2 RED : `src/features/auth/hooks.test.jsx` — `useCurrentUser` (200 → utilisateur ; 401 → `null` sans erreur ; 500 → erreur), `useLogin` (écrit `['auth','me']`, redirige vers `/`), `useLogout` (204 et 401 → cache vidé, redirection `/login`), 401 sur requête de données → cache vidé + `/login` avec notice « session expirée », rien dans `localStorage`/`sessionStorage`
- [x] 4.3 Confirmer RED ; créer `api.js`, `hooks.js`, `UserProvider.jsx` (enregistre/nettoie `setUnauthorizedHandler`, sans contexte parallèle) ; confirmer GREEN
- [x] 4.4 Commit `feat: add user session backed by GET /auth/me`

## 5. Gardes de routes (TDD)

- [x] 5.1 RED : tests de `RequireAuth` (chargement, visiteur → `/login`, connecté → contenu, `/auth/me` en 500 → erreur avec « Réessayer » sans redirection), `RequireRole` (rôle autorisé / « Accès refusé »), `PublicOnly` (connecté → `/`)
- [x] 5.2 Confirmer RED ; créer `guards/` et la page « Accès refusé » ; confirmer GREEN
- [x] 5.3 Commit `feat: add RequireAuth, RequireRole and PublicOnly route guards`

## 6. Page de connexion (TDD)

- [x] 6.1 RED : `LoginPage.test.jsx` — champs « Adresse e-mail » et « Mot de passe », champs vides sans appel, succès → `/` , 401/403/429/réseau → message en ligne annoncé, e-mail conservé, lien activation sur 403, lien « Mot de passe oublié / Activer mon compte », texte « Pas de compte ? Contactez votre administrateur », bandeaux `activated` / `password-reset` / `session-expired`, check jest-axe
- [x] 6.2 Confirmer RED ; recâbler `LoginForm` (React Hook Form + validateurs) et `LoginPage` (`useLogin`, `Alert`, notices) ; confirmer GREEN
- [x] 6.3 Commit `feat: connect login page to POST /auth/login`

## 7. Activation et récupération du mot de passe (TDD)

- [x] 7.1 RED : tests des pages `/activation`, `/mot-de-passe-oublie`, `/reinitialisation` — règle de mot de passe, confirmation, `?email=` prérempli et modifiable, succès → `/login` avec bandeau, `400` « Code invalide ou expiré », renvoi de code (200 / 429), message générique de `forgot-password`, un check jest-axe par page
- [x] 7.2 Confirmer RED ; créer les pages et les hooks `useActivate`, `useResendActivation`, `useForgotPassword`, `useResetPassword` ; confirmer GREEN
- [x] 7.3 Commit `feat: add account activation and password recovery pages`

## 8. Routeur, tableau de bord et nettoyage (TDD)

- [x] 8.1 RED : tests du routeur (visiteur sur route protégée → `/login`, `STAGIAIRE` sur `/admin/gestion` → « Accès refusé », `ADMIN` sur `/formations/categories` → refus, `SUPER_ADMIN` sur `/formations/creer` OK, `/` → tuile « Formations » pour `STAGIAIRE` et « Gestion » pour `SUPER_ADMIN`/`ADMIN`) ; test de `LoginButton` (« Se connecter » / « Se déconnecter ») ; test de libellés de rôles (D33)
- [x] 8.2 Confirmer RED ; créer `Root` (`UserProvider` + `Layout`), réécrire `router.jsx` (table des routes de la conception), recâbler `HomePage`/dashboard sur le rôle réel et `LoginButton` sur `useLogout`, réécrire `utils/roles.js` ; confirmer GREEN
- [x] 8.3 Supprimer `RoleSwitcher`, l'ancien `src/context/UserProvider.jsx`, `ProtectedRoute` s'il existe, `utils/routeManager.jsx`, `isAuthenticated`/`toggleAuth` de `use-theme.js` et `dev-role` ; corriger l'import `./layout.module.css` → `./Layout.module.css` ; vérifier qu'aucun usage ne subsiste (grep de 1.2)
- [x] 8.4 `npm run check` vert (lint + tests + build)
- [x] 8.5 Commit `refactor: remove simulated auth, role switcher and legacy routes`

## 9. Documentation et passage manuel

- [ ] 9.1 Consigner les décisions dans `docs/decisions-front-foundations.md` (session = requête `['auth','me']`, handler 401 sous le routeur, gardes, bandeaux via `location.state`, bouton « SE CONNECTER » conservé, e-mail au lieu d'identifiant)
- [ ] 9.2 Mettre à jour `docs/points-pour-charlotte.md` (Q2 toujours ouverte avec la solution retenue ; incohérences US-001 AC-01 « Commencer la session » et « identifiant » vs e-mail) et `CLAUDE.md` (section « État actuel » : auth, gardes, `RoleSwitcher` supprimé)
- [ ] 9.3 Commit `docs: record auth decisions and update project context`
- [ ] 9.4 Passage manuel contre le vrai back local (Docker requis) : connexion des trois rôles, mauvais mot de passe, compte non activé, activation par code, mot de passe oublié/réinitialisation, déconnexion, expiration de session, garde par rôle — bloqué tant que Docker Desktop n'est pas installé ; ne pas cocher sans l'avoir fait
- [ ] 9.5 Relecture de Manon ; PR/merge vers `dev` uniquement à sa demande
