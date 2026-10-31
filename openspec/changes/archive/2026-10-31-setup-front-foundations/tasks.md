## 1. Outillage de test (infra : pas de test de comportement avant)

- [x] 1.1 Vérifier via Context7 les versions compatibles (Vitest, Testing Library avec React 19, MSW 2, jest-axe, jsdom) avec Vite 8 ; noter les versions retenues
- [x] 1.2 Installer les dev-deps : `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `msw`, `jest-axe`
- [x] 1.3 Ajouter le bloc `test` dans `vite.config.js` et créer `src/test/setup.js`, `src/test/msw/server.js`, `src/test/msw/handlers.js`
- [x] 1.4 Ajouter les globals de test dans `eslint.config.js` et les scripts `test`, `test:watch`, `check` dans `package.json`
- [x] 1.5 Écrire un test smoke de l'outillage (rendu d'un composant simple + `axe` + un handler MSW) et vérifier GREEN
- [x] 1.6 Commit `chore: set up Vitest, Testing Library, MSW and jest-axe`

## 2. Client API et ApiError (TDD)

- [x] 2.1 RED : écrire `src/api/Axiosclient.test.js` avec MSW couvrant chaque scénario de `specs/api-client/spec.md` (cookies, pas d'`Authorization`, URL de base, erreur standard 400, corps vide 502, réseau, 401 hors login → handler appelé, 401 login → pas de handler, 401 `/auth/me` → pas de handler, 403 compte non activé, 429)
- [x] 2.2 Lancer `npm run test` et confirmer RED
- [x] 2.3 Créer `src/api/ApiError.js`, l'intercepteur de réponse et `setUnauthorizedHandler` dans `Axiosclient.js`
- [x] 2.4 Lancer `npm run test` et confirmer GREEN ; refactoriser si nécessaire
- [x] 2.5 Installer `@tanstack/react-query` et `react-hook-form` (API vérifiée via Context7)
- [x] 2.6 RED puis GREEN : test de `src/api/queryClient.js` (pas de retry sur 401/403/404), puis création du fichier et montage de `QueryClientProvider` dans `src/main.jsx`
- [x] 2.7 Commit `feat: normalise API errors with ApiError and add query client`

## 3. Helpers de test partagés

- [x] 3.1 Créer `src/test/render.jsx` (`renderWithProviders`) avec un test d'usage
- [x] 3.2 Ajouter un check jest-axe sur une page existante (`HomePage`) ; consigner dans `docs/` les violations non triviales au lieu de les corriger ici
- [x] 3.3 Commit `test: add shared render helper and axe smoke check`

## 4. Correction des 12 erreurs ESLint

- [x] 4.1 Retirer `React` et `BookOpen` inutilisés (Layout, Stagiaire/*, TileLabel, TileGroup)
- [x] 4.2 Séparer contexte et hook de thème pour fast-refresh (`ThemeProvider`) et mettre à jour les imports
- [x] 4.3 Corriger `UserProvider` (plus d'effet avec setState ni de lecture `localStorage`, D31) et `routeManager`
- [x] 4.4 `npm run lint` à 0 erreur ; `npm run build` OK ; vérifier à la main que `npm run dev` affiche toujours les pages
- [x] 4.5 Commit `refactor: fix ESLint errors in legacy code`

## 5. Porte de qualité, CI et docs

- [x] 5.1 Remplacer lint + build par `npm run check` dans `.github/workflows/ci.yml` (garder `VITE_API_URL: /api`) et retirer le TODO
- [x] 5.2 Lancer `npm run check` complet : lint, tests et build verts
- [x] 5.3 Mettre à jour `CLAUDE.md` (stack de test installée, `test`/`check` existants, lint propre) et `docs/decisions-front-foundations.md` (suppression de la lecture `localStorage` de `UserProvider`, handler 401 injecté)
- [x] 5.4 Ajouter dans `docs/points-pour-charlotte.md` la note : la CI du front exécute `npm run check` (TICKET-010)
- [x] 5.5 Commit `chore: add npm run check to CI and update docs` ; relecture de Manon avant tout push (aucun push sans demande)
