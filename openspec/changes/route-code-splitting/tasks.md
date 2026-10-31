## 1. Préparation et mesure de départ

- [ ] 1.1 Partir de `dev` à jour (branche `feature/route-code-splitting` déjà créée) ; vérifier `npm run check`. Rappel : le test d'auth « vide la session et redirige vers /login » est instable sur `dev`, le relancer avant de conclure à une régression
- [ ] 1.2 Relever la mesure de départ (`npm run build` : entrée brut et gzip, CSS, images) et l'inscrire dans `docs/decisions-front-foundations.md` sous D59 (section « Avant ») ; vérifier que les chiffres correspondent à ceux de design.md (470,64 kB / 149,74 kB gzip)

## 2. Outil de budget (TDD)

- [ ] 2.1 RED : `scripts/bundle-budget.test.js` — fonction pure `checkBundle({ manifest, entryGzipBytes, budget })` : réussit sous le budget et sans page dans l'entrée ; échoue avec les deux valeurs au-dessus ; échoue en nommant un fichier sous `src/components/Pages/` ou `src/features/*/pages/` importé statiquement par l'entrée (y compris indirectement) ; confirmer RED
- [ ] 2.2 Créer `scripts/bundle-budget.js` (logique) et `scripts/check-bundle.mjs` (lit `dist/.vite/manifest.json`, gzip de l'entrée, `bundle-budget.json`, code de sortie) ; activer `build.manifest` dans `vite.config.js` ; GREEN ; vérifier que `node scripts/check-bundle.mjs` échoue aujourd'hui (pages dans l'entrée), ce qui prouve que le contrôle détecte le problème
- [ ] 2.3 Commit `chore: add bundle budget check script`

## 3. Session demandée dès le démarrage (TDD)

- [ ] 3.1 RED : test de `prefetchSession` dans `features/auth/hooks.test.jsx` — remplit `['auth','me']` (200 → utilisateur, 401 → `null`), ne lève jamais d'erreur (500), et un `useCurrentUser` monté ensuite ne refait aucune requête (un seul appel MSW) ; confirmer RED
- [ ] 3.2 Ajouter `prefetchSession` à `features/auth/hooks.js` et l'appeler dans `main.jsx` avant `render` ; GREEN
- [ ] 3.3 Commit `perf: start the session request at app startup`

## 4. Routes chargées à la demande (TDD)

- [ ] 4.1 RED : `src/router/lazy-routes.test.jsx` — `lazyPage` renvoie une fonction `lazy` qui résout `{ Component }` depuis l'export par défaut ; les routes `/login`, `/formations`, `/admin/formateurs` s'affichent après attente (`findBy…`) ; un visiteur reste redirigé vers `/login`, un `STAGIAIRE` voit « Accès refusé » sur `/admin/formateurs`, un utilisateur connecté sur `/login` va au tableau de bord ; confirmer RED sur l'utilitaire
- [ ] 4.2 Remplacer les imports statiques de pages de `router.jsx` par `lazyPage(() => import(...))` (pages d'auth, accueil, menu Gestion, formations, détail, catégories, création, profil, messages, notifications, comptes) ; garder gardes, `Root` et `AccessDeniedPage` en statique ; GREEN
- [ ] 4.3 Adapter les tests de routes existants (`router.test.jsx`, `accounts-routes.test.jsx`) là où ils supposent un rendu synchrone, sans changer ce qu'ils vérifient ; `npm run test` vert (relancer si seul le test d'auth instable échoue)
- [ ] 4.4 Commit `perf: load pages lazily by route`

## 5. Chargement annoncé et échec de chargement (TDD)

- [ ] 5.1 RED : tests — premier affichage sur une route non chargée : `status` « Chargement… » présent puis page ; navigation vers une page non chargée : région `status` « Chargement de la page… » puis disparition ; échec d'un `import()` (module qui rejette) : `alert` « Cette page n'a pas pu être chargée… » + bouton « Réessayer » qui appelle `window.location.reload` (espion) ; jest-axe sur `RouteError` ; confirmer RED
- [ ] 5.2 Créer `src/router/RouteError.jsx`, ajouter `errorElement` et `HydrateFallback` à la route racine (emplacement du `HydrateFallback` tranché par le test : logo et en-tête visibles si possible), et `NavigationStatus` dans `Layout` ; GREEN
- [ ] 5.3 Commit `feat: announce page loading and handle chunk load failures`

## 6. Mesure, budget et documentation

- [ ] 6.1 `npm run build` : relever la mesure après (entrée brut et gzip, nombre de chunks, entrée + chunk de la page de connexion) et la comparer à la mesure de départ ; si le gain de la page de connexion est inférieur à 20 % de l'entrée de départ, le dire tel quel dans D59 et proposer un découpage supplémentaire sans l'appliquer
- [ ] 6.2 Créer `bundle-budget.json` (taille mesurée + 10 %), ajouter `node scripts/check-bundle.mjs` à `npm run check` après le build ; `npm run check` vert (lint + tests + build + budget) ; vérifier qu'une page ré-importée statiquement le ferait échouer (essai local annulé aussitôt)
- [ ] 6.3 Compléter D59 (avant / après, budget), noter dans `docs/points-pour-charlotte.md` la recommandation de cache (`index.html` non mis en cache long, `assets/*` hachés en cache long ; information seulement), mettre à jour `CLAUDE.md` (« État actuel » et commande `check`) ; vérifier que les chiffres de D59 viennent de la mesure
- [ ] 6.3b Commit `docs: record bundle measurement and enforce the entry budget`
- [ ] 6.4 Passage manuel contre le vrai back local : onglet Réseau — `/login` ne télécharge aucun chunk de formations / comptes ; connexion puis navigation sur chaque page ; connexion lente (Slow 3G) : « Chargement… » visible et annoncé ; réseau coupé puis clic vers une page non chargée : message d'erreur et « Réessayer » ; `GET /auth/me` part avant le chunk de la page et une seule fois — ne pas cocher sans l'avoir fait
- [ ] 6.5 Relecture de Manon ; merge dans `dev` uniquement à sa demande

## Workflow follow-up

- Archiver le change après relecture (`/opsx:archive`).
- Ouvrir à part : poids des images du logo (`Logo-Dark.png` 230 kB), test d'auth instable.
