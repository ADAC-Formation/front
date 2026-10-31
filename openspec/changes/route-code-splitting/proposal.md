# Proposal

## Why

Le front est livré en **un seul fichier JavaScript** : `npm run build` sur `dev` (2026-10-31, pages de comptes comprises) donne `index-*.js` = **470,64 kB** (149,74 kB en gzip), plus 39,63 kB de CSS. La cause est visible dans `src/router/router.jsx` : 22 imports statiques, aucun `lazy()`. Un visiteur qui n'ouvre que `/login` télécharge donc aussi le code de la création de formation, des catégories, des comptes, etc. Ce volume ne fera que croître avec les prochaines branches (documents, messagerie, notifications, tableau de bord). Mieux vaut poser le découpage maintenant, avant qu'il coûte cher, et le protéger par un budget mesuré.

Source de la piste : revue avec le skill `react-best-practices` (catégorie `bundle-*`, priorité « critique »).

## What Changes

**Côté affecté : front uniquement.** Pas de ticket back. Un point d'information pour Charlotte (cache de `index.html` après un déploiement, voir design). Décisions concernées : D32 (organisation du code), D15 (accessibilité).

- **Chargement des pages par route** : chaque page est importée à la demande (`lazy` du routeur, `import()` dynamique). Le gabarit (`Root`, `Layout`, en-tête, logo), les gardes (`RequireAuth`, `RequireRole`, `PublicOnly`), la session et le thème restent dans le fichier d'entrée. Les fichiers des pages ne changent pas.
- **Retour visuel et vocal pendant le chargement** : état « Chargement… » annoncé au premier affichage, et indicateur de navigation (région `status`) quand on change de page.
- **Échec de chargement d'une page** (réseau coupé, nouvelle version déployée pendant que l'onglet est ouvert) : message clair avec « Réessayer », jamais un écran blanc.
- **Pas de cascade réseau** : la requête `GET /auth/me` démarre dès le lancement de l'application, en parallèle du téléchargement de la page, au lieu d'attendre qu'elle soit montée.
- **Budget de bundle** : un fichier de budget (taille gzip maximale du fichier d'entrée) et un script de contrôle, branché sur `npm run check` après le build ; il échoue aussi si le code d'une page se retrouve dans le fichier d'entrée.
- **Mesure avant / après** consignée dans `docs/` (décision D59).

**Hors périmètre** :
- re-rendus, mémoïsation, `useMemo` (catégories `rerender-*` / `js-*` du skill) ;
- découpage « vendor » pour le cache long terme, préchargement au survol (`bundle-preload`) ;
- le poids des images : `Logo-Dark.png` fait 230 kB et `Logo-Blanc.png` 70 kB (hors JS, mais plus lourds que n'importe quelle page) — constat à traiter dans un change séparé ;
- la configuration `nginx` (Charlotte) et le test d'auth instable.

## Capabilities

### New Capabilities
- `page-loading`: comment les pages se chargent (à la demande par route), ce que l'utilisateur voit et entend pendant le chargement ou en cas d'échec, et le budget de taille qui protège le fichier d'entrée.

### Modified Capabilities
- Aucune (les exigences de `user-session` sur gardes et redirections ne changent pas ; un scénario de non-régression les reprend).

## Impact

- **Code** : `src/router/router.jsx` (routes `lazy`, `errorElement`, `HydrateFallback`), nouveau `src/router/RouteError.jsx`, `src/Layout/Layout.jsx` (indicateur de navigation), `src/main.jsx` et `src/features/auth/` (préchargement de la session), `vite.config.js` (`build.manifest`), nouveau `scripts/check-bundle.mjs` + `bundle-budget.json`, `package.json` (`check`).
- **Tests** : routeur (chargement annoncé, erreur de chargement, gardes inchangées), préchargement de session, logique du budget ; les tests de routes existants attendent désormais les pages avec `findBy…`.
- **Docs** : `docs/decisions-front-foundations.md` (D59), `docs/points-pour-charlotte.md` (cache d'`index.html`), `CLAUDE.md`.
- **Dépendances** : aucune.
- **Conflit possible** avec le change `ui-structure-cleanup`, qui modifie aussi `router.jsx` et `Layout` : les deux branches partent de `dev` ; la seconde à fusionner reprend les changements de la première.
