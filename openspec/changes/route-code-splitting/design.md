# Design

## Context

- **Mesure de départ** (`npm run build`, `dev` au 2026-10-31) : `index-*.js` 470,64 kB / 149,74 kB gzip, CSS 39,63 kB / 7,06 kB gzip, `Logo-Dark.png` 230 kB, `Logo-Blanc.png` 70 kB. Un seul chunk JS.
- `src/router/router.jsx` importe 22 modules en statique (pages, gardes, pages d'auth, comptes) et exporte `routes` (utilisé tel quel par `createMemoryRouter` dans les tests) et `router` (`createBrowserRouter`). Tous les composants de pages ont un `export default`.
- `main.jsx` monte `QueryClientProvider` > `ThemeProvider` > `RouterProvider`. La session est la requête `['auth','me']` (`features/auth/hooks.js`), lancée seulement quand `RequireAuth` se monte ; `fetchCurrentUser` traite le 401 comme « visiteur ».
- `react-router` 8 (mode bibliothèque, routeur de données) : la propriété `lazy` d'une route accepte une fonction qui renvoie `{ Component }` ; le routeur résout la promesse pendant la navigation, avant d'afficher la route (documentation React Router, « Lazy load route modules »). Pendant le chargement initial, c'est le `HydrateFallback` de route qui s'affiche ; lors d'une navigation, l'ancienne page reste visible jusqu'à l'arrivée de la nouvelle (d'où le besoin d'un indicateur, `useNavigation`).
- Le skill `react-best-practices` (`bundle-dynamic-imports`, `bundle-conditional`) vise Next.js ; le principe vaut ici avec `lazy` du routeur plutôt que `next/dynamic`.
- Pas de conflit avec une spec existante. Le change `ui-structure-cleanup` touche aussi `router.jsx`/`Layout` (voir Risques).

## Goals / Non-Goals

**Goals:**
- Sortir le code des pages du fichier d'entrée, sans changer leur comportement.
- Qu'un échec réseau ou une version déployée entre-temps ne donne jamais un écran blanc.
- Éviter la cascade « code de la page puis `/auth/me` ».
- Protéger le résultat par un budget vérifié automatiquement.

**Non-Goals:**
- Découpage « vendor », préchargement au survol, SSR, optimisation d'images, re-rendus (voir proposal.md).
- Modifier les fichiers des pages (elles gardent `export default`).

## Decisions

1. **Un petit utilitaire `lazyPage(() => import('…'))` dans `router.jsx`** qui renvoie `{ lazy: async () => ({ Component: (await load()).default }) }`. Les pages ne changent pas. *Alternative écartée* : exporter `Component` depuis chaque page (touche 20 fichiers pour rien) ; `React.lazy` + `Suspense` (le routeur de données gère déjà l'attente et les erreurs de route).
2. **Granularité : un import dynamique par page, regroupement laissé à Rollup.** Les modules partagés (React Hook Form, `FormField`, `BackButton`, etc.) deviennent des chunks communs automatiquement. Pas de `manualChunks`. On regarde le résultat à la mesure et on n'intervient que s'il est mauvais.
3. **Reste dans le fichier d'entrée** : `Root`, `Layout`, en-tête, logo, `UserProvider`, gardes (`RequireAuth`, `RequireRole`, `PublicOnly`), `AccessDeniedPage` (importée par `RequireRole`), `SessionLoader`, hooks et API d'auth, thème, client axios, TanStack Query. Ces éléments servent à chaque page ou à décider quoi charger.
4. **Chargement annoncé** : `HydrateFallback` sur la route racine (même texte et même rôle que `SessionLoader` : `<p role="status">Chargement…</p>`) pour le premier affichage ; dans `Layout`, un composant `NavigationStatus` lit `useNavigation()` et rend une région `role="status"` « Chargement de la page… » (masquée visuellement) tant que `state === 'loading'`. L'emplacement exact du `HydrateFallback` (racine ou route de garde, pour garder logo et en-tête visibles) est tranché par un test pendant l'implémentation ; les deux respectent la spec.
5. **Échec de chargement** : `errorElement` sur la route racine, composant `RouteError` (`src/router/RouteError.jsx`) : `Alert` d'erreur « Cette page n'a pas pu être chargée. Vérifiez votre connexion, puis réessayez. » + bouton « Réessayer » qui fait `window.location.reload()`. Il sert aussi de filet pour toute erreur de rendu de route (aujourd'hui l'écran d'erreur par défaut du routeur, en anglais).
6. **Session en parallèle** : `prefetchSession(queryClient)` dans `features/auth/hooks.js` (même clé `['auth','me']`, même `fetchCurrentUser`, même `staleTime`), appelée dans `main.jsx` avant `render`. Elle n'attend pas et ne lève pas d'erreur. Les gardes lisent ensuite le cache via `useCurrentUser`, sans seconde requête. *Alternative écartée* : `loader` de route racine (change l'architecture de la session décidée en D52).
7. **Budget** : `build.manifest: true` dans `vite.config.js` produit `dist/.vite/manifest.json`. `scripts/check-bundle.mjs` lit le manifeste, calcule le gzip du fichier d'entrée (`zlib.gzipSync`), le compare à `bundle-budget.json` (`{ "entryGzipBytes": … }`) et échoue si l'entrée importe statiquement un fichier sous `src/components/Pages/` ou `src/features/*/pages/`. La logique (pure : manifeste + tailles + budget → liste d'erreurs) est testée par Vitest ; le script n'est qu'une enveloppe. Branché à `npm run check` après `build`. Le budget est fixé après mesure : valeur obtenue + 10 %.
8. **Protocole de mesure** : avant et après, `npm run build` sur la même machine ; consigner dans D59 : taille du fichier d'entrée (brut et gzip), nombre de chunks, taille de la page de connexion (entrée + son chunk).

## Risks / Trade-offs

- [Onglet ouvert pendant un déploiement : les chunks dont le nom a changé répondent 404] → `RouteError` + « Réessayer » recharge l'application ; information pour Charlotte (`points-pour-charlotte.md`) : `index.html` devrait être servi sans cache long, les fichiers `assets/*` hachés avec cache long. Le front ne peut pas le garantir seul.
- [Cascade code puis session] → décision 6.
- [Clignotement « Chargement… » sur réseau rapide] → l'indicateur de navigation est une région `status` invisible et le premier affichage montre déjà ce texte aujourd'hui (`SessionLoader`) ; pas de nouveau saut visuel notable.
- [Tests de routes existants supposent un rendu synchrone] → ils utilisent déjà `findBy…` pour presque tout ; les cas restants sont corrigés dans la tâche correspondante, sans changer ce qu'ils vérifient.
- [Gain réel inconnu avant mesure : React, React DOM, le routeur, TanStack Query et axios restent dans l'entrée] → le budget n'est fixé qu'après la première mesure ; si le gain est faible, le change l'indique honnêtement dans D59.
- [Conflit de fusion avec `ui-structure-cleanup` (`router.jsx`, `Layout`)] → petits blocs distincts ; celui qui fusionne en second rejoue ses tests après résolution.
- [`lazy` du routeur charge le module avant de rendre : une page chargée en échec bloque la navigation] → couvert par `RouteError`.

## Open Questions

- Aucune qui change les specs ou les tâches : l'emplacement du `HydrateFallback` (décision 4) se tranche par test.
