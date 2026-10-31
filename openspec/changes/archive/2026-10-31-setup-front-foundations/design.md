# Design

## Context

État observé : pas de Vitest/MSW/Testing Library/jest-axe, ni TanStack Query ni React Hook Form dans `package.json` ; scripts `dev`, `build`, `lint`, `preview` seulement. `src/api/Axiosclient.js` est déjà conforme au cookie (`withCredentials`, `VITE_API_URL`) mais l'intercepteur D12 est un TODO. `npm run lint` : 12 erreurs (`React` inutilisé dans 7 fichiers, `BookOpen` inutilisé, `ThemeProvider` exporte un hook et un composant, `UserProvider` appelle setState dans un effet, `routeManager` appelle `useContext` hors hook). `ci.yml` existe (lint + build + image) avec un TODO pour `npm test`. Voir `proposal.md` pour la motivation.

Contraintes : D4 (tests avec chaque ticket), D12 (erreurs), D13 (RHF), D15 (jest-axe), D8 (TanStack Query), D26 (`npm run check`, révisée par D5). Le back n'est jamais modifié.

## Goals / Non-Goals

**Goals:**
- Pile de tests utilisable immédiatement par les changes suivants (un test de page = rendu + MSW + `axe`).
- `npm run check` vert et identique en local et en CI.
- Un seul point où les erreurs HTTP sont transformées, testé avec MSW.

**Non-Goals:**
- Écrire les hooks TanStack Query par ressource ou le contexte d'auth (change « auth »).
- Corriger la logique métier ou le visuel des pages existantes.
- Réécrire `UserProvider`/`routeManager` : on les rend seulement propres pour le lint (ils seront remplacés).

## Decisions

1. **Vitest configuré dans `vite.config.js`** (`test: { environment: 'jsdom', globals: true, setupFiles: './src/test/setup.js', css: false }`). Alternative écartée : `vitest.config.js` séparé — une seule config partage les plugins Vite.
2. **Setup de test unique** `src/test/setup.js` : `@testing-library/jest-dom/vitest`, `expect.extend(toHaveNoViolations)` de jest-axe, démarrage/reset/arrêt du serveur MSW (`onUnhandledRequest: 'error'` pour détecter tout appel non mocké). Handlers de base dans `src/test/msw/handlers.js`, serveur dans `src/test/msw/server.js`. Helper `renderWithProviders` (`src/test/render.jsx`) : `QueryClient` neuf sans retry, `MemoryRouter`, `ThemeProvider`.
3. **`ApiError`** : classe dans `src/api/ApiError.js` (`status`, `message`, `details`, `isNetworkError`). L'intercepteur de réponse la lève pour toute erreur ; corps non standard → message générique français ; réseau → `status` indéfini + `isNetworkError`. Alternative écartée : renvoyer l'`AxiosError` brut et normaliser dans chaque hook (D12, duplication).
4. **401 sans dépendance circulaire** : l'intercepteur n'importe pas le routeur. `Axiosclient.js` expose `setUnauthorizedHandler(fn)` ; le handler sera enregistré plus tard par le futur `UserProvider`/routeur (navigation SPA sans rechargement). Exclus du handler : `POST /auth/login` et `GET /auth/me`. Dans ce change, le handler par défaut ne fait rien (testé avec un handler espion). Alternative écartée : `window.location.href = '/login'` (rechargement dur, interdit par D12).
5. **Providers** : `QueryClientProvider` ajouté dans `main.jsx` autour du `ThemeProvider` ; `QueryClient` créé dans `src/api/queryClient.js` (pas de retry sur 401/403/404). `react-hook-form` installé, non utilisé ici.
6. **Scripts** : `"test": "vitest run"`, `"test:watch": "vitest"`, `"check": "npm run lint && npm run test && npm run build"`. CI : remplacer les étapes lint + build par `npm run check` (avec `VITE_API_URL: /api`).
7. **Lint** : retirer les imports inutiles ; séparer le contexte et le hook de `ThemeProvider` dans des fichiers dédiés (fast-refresh) ; `UserProvider` : supprimer l'effet qui lit `localStorage` (contraire à D31, disparaît avec le change auth) et laisser l'état initial vide ; `routeManager` : renommer en hook `useRouteManager` s'il est encore importé, sinon le rendre inoffensif. Ajouter les globals de test dans `eslint.config.js`.

## Risks / Trade-offs

- [Versions récentes (ESLint 10, Vite 8, React Router 8) peuvent être incompatibles avec une dépendance de test] → vérifier via Context7 avant d'installer, épingler les versions qui passent.
- [Supprimer la lecture `localStorage` de `UserProvider` change un composant non monté] → aucun impact utilisateur, conforme à D31 ; consigné dans les décisions.
- [`onUnhandledRequest: 'error'` fait échouer les tests qui font des appels réseau implicites] → voulu ; chaque test déclare ses handlers.
- [Le check jest-axe de la page smoke peut révéler de vraies violations] → consigner dans `docs/` et ne corriger que le trivial ; le reste devient des tâches des changes de page.
- [`ci.yml` touche au flux de Charlotte (TICKET-010)] → le front le possède (D5 révisée) ; l'informer via `docs/points-pour-charlotte.md`.

## Migration Plan

Changements additifs sauf les corrections lint. Ordre : outillage → tests rouges du client API → implémentation → lint → CI. Retour arrière : revert par commit (un commit par groupe de tâches). Aucun déploiement côté back.
