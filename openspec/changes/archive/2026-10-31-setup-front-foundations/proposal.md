# Proposal

## Why

Le front a été écrit avant tout processus structuré (mocks, restes d'un autre projet, aucun test). Avant de nettoyer l'existant et de le brancher sur le vrai back, il faut des fondations : une pile de tests installée (la règle TDD du projet est impossible à appliquer aujourd'hui), une porte de qualité `npm run check` verte, et un client API unique qui normalise les erreurs (D12). Sans cela, chaque change suivant (auth, catégories, formations…) repose sur du sable et la CI échoue (`npm run lint` : 12 erreurs).

## What Changes

**Côté affecté : front uniquement.** Aucune demande de changement au back.

- Installer la pile de tests : Vitest, Testing Library (`@testing-library/react`, `jest-dom`, `user-event`), MSW, jest-axe, jsdom (D4, D15) ; configuration Vitest, `setupTests`, serveur MSW partagé.
- Ajouter les scripts `npm run test` et `npm run check` (lint + test + build, gate pré-commit D26) ; brancher `npm test` dans `.github/workflows/ci.yml` (remplace le TODO).
- Corriger les 12 erreurs ESLint de l'ancien code (`React` inutilisé, `BookOpen` inutilisé, `ThemeProvider` fast-refresh, `UserProvider` setState dans un effet, `routeManager` hook hors composant). Aucun changement de comportement visible.
- Finaliser `src/api/Axiosclient.js` : intercepteur de réponse qui normalise toute erreur en `ApiError {status, message, details}`, avec la règle 401 (D12). Les hooks TanStack Query et les pages ne sont pas touchés ici.
- Installer et monter `@tanstack/react-query` (`QueryClientProvider`) et `react-hook-form`, sans les utiliser encore au-delà d'un test d'exemple (D8, D13).
- Premier test de bout en bout de l'outillage (smoke test jest-axe sur une page existante) pour prouver que la pile fonctionne.
- Consigner dans `docs/` toute nouvelle décision (D-numéro suivant).

**Hors périmètre** : `UserProvider`/`RequireAuth`/`RequireRole` et le login branché (change suivant « auth »), suppression de `RoleSwitcher` et des mocks `simFormations`/`categories` (changes de rebranchement), règles CSS `text-large`/`high-contrast`, refonte visuelle.

## Capabilities

### New Capabilities
- `api-client`: client HTTP unique du front (cookie HttpOnly `jwt`, `withCredentials`, aucun en-tête Authorization) et normalisation des erreurs de l'API en `ApiError` avec comportement défini pour 401/403/404/409/429/5xx/réseau.

### Modified Capabilities
<!-- Aucune : pas de spec existante dans openspec/specs/. -->

## Impact

- **Code** : `src/api/Axiosclient.js` (+ nouveau module `ApiError`), `src/main.jsx` (QueryClientProvider), corrections lint dans `src/Layout`, `src/components/**`, `src/context/**`, `src/utils/routeManager.jsx`.
- **Config/outillage** : `package.json` (dépendances + scripts), `vite.config.js` (bloc `test`), `eslint.config.js` (globals de test), `.github/workflows/ci.yml`.
- **Docs** : `docs/decisions-front-foundations.md`, `CLAUDE.md` (retirer « à ajouter »/« pas encore installée »).
- **Tickets back** : TICKET-010 (CI/Docker, à confirmer avec Charlotte pour l'ajout de `npm test`) ; les tickets front fonctionnels (008, 016–018…) sont débloqués mais pas implémentés ici.
- **Dépendances** : ajout de dev-deps de test et de `@tanstack/react-query`, `react-hook-form`.
