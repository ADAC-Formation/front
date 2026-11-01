# Portail de Formation ADAC — Contexte projet (frontend)

## Vue d'ensemble

Portail de gestion des formations pour l'ADAC, remplaçant les échanges email individuels par une plateforme centralisée. La chargée de formation y publie les formations, dépose les documents et communique avec les stagiaires, en conformité avec les critères Qualiopi. Ce repo porte l'interface (formations, documents, messagerie, notifications).

## Équipe

- **Manon** → frontend (ce repo, code à la racine) — **elle ne possède que le front**
- **Charlotte** → backend (`ADAC-Formation/back`, repo séparé), base de données et déploiement

## Structure du projet — deux repos séparés

Pas un monorepo : `front` et `back` sont deux repos GitHub distincts sous l'organisation `ADAC-Formation`.
Ce repo (`ADAC-Formation/front`, racine git = `ADAC Front/front`) porte le code frontend. La documentation partagée et l'infra vivent dans le repo `back` (Charlotte gère le déploiement) ; le seul fichier de contrat à lire là-bas est `docs/tech.md`.

```
front/ (ce repo)                back-readonly/ (clone local, LECTURE SEULE)
├── src/                        ├── src/ ... Spring Boot
│   ├── api/                    ├── docs/
│   ├── components/             │   ├── tech.md   ← contrat API
│   │   ├── atoms/              │   ├── DESIGN.md, STORIES.md, TICKETS.md
│   │   ├── molecules/          │   └── USERFLOW.md, INFRASTRUCTURE.md
│   │   ├── organisms/          └── CLAUDE.md
│   │   └── Pages/
│   ├── features/       ← nouveau code, par domaine (D32)
│   ├── router/
│   ├── templates/PageShell
│   ├── Layout/
│   └── utils/
├── public/
├── docs/               ← documentation du front (en français)
│   ├── plan-de-proyecto.md
│   ├── decisions-*.md  ← D1–D33
│   ├── spec.md
│   └── dev/seed-local-admin.sql
├── index.html
├── vite.config.js
├── eslint.config.js
├── package.json
└── CLAUDE.md           ← ce fichier
```

Clone local du back : `../../back-readonly` (branche `dev`).

## Fichiers de référence

| Fichier                                      | Rôle                                                                     |
| -------------------------------------------- | ------------------------------------------------------------------------ |
| `../../back-readonly/docs/tech.md`           | Contrat API complet — endpoints, DTOs, codes HTTP                        |
| `../../back-readonly/docs/DESIGN.md`         | Palette ADAC, typographie Manrope, composants                            |
| `../../back-readonly/docs/STORIES.md`        | User stories                                                             |
| `../../back-readonly/docs/TICKETS.md`        | Tickets (lignes « front » à implémenter)                                 |
| `../../back-readonly/docs/USERFLOW.md`       | Parcours utilisateurs                                                    |
| `../../back-readonly/docs/INFRASTRUCTURE.md` | Infra / déploiement (info seulement)                                     |
| `../../back-readonly/docs/STACK.md`          | Stack de test prévue (Vitest + Testing Library + MSW)                    |
| `docs/decisions-front-foundations.md`        | Décisions en vigueur D1–D33 du front                                     |
| `docs/design-front.md`                       | Design du front (structure de `DESIGN.md`) — référence visuelle, D41     |
| `docs/points-pour-charlotte.md`              | Décisions, impacts sur le back, questions et conflits `tech.md`          |
| `docs/spec.md`, `docs/plan-de-proyecto.md`   | Spec et plan du front                                                    |

**En cas de conflit entre documents du back, `docs/tech.md` l'emporte** (D40) ; les conflits relevés sont dans `docs/points-pour-charlotte.md` §4. Utiliser la branche `dev` du back, pas `main` (obsolète). Rafraîchir : `git -C ../../back-readonly pull` (fetch en lecture seule autorisé).

## Rôles utilisateurs

Rôles du back (source de vérité, rôle lu via `GET /auth/me`) :

- `SUPER_ADMIN` — Chargée de formation : accès total
- `ADMIN` — Formateur : lecture + messagerie + ajout docs
- `STAGIAIRE` — Apprenant : lecture de ses formations + messagerie

Libellés affichés : Chargée de formation / Formateur / Stagiaire (D33). D46 (l'emporte sur `tech.md`, exception à D40) : le formateur voit toutes les formations en lecture seule, « Mes formations » par défaut ; demande de changement au back en cours (Q3).
Les rôles du front (`utils/roles.js` : `ROLES`, `roleLabels`) sont alignés sur ceux du back.

## Back-end en LECTURE SEULE — règle absolue

- **Ne jamais modifier, committer ni pousser dans `../../back-readonly`** (URL de push désactivée).
- **Ne jamais lancer d'appel `gh`/API en écriture sur `ADAC-Formation`** (PR, issues, commentaires, boards) sauf demande explicite de Manon.
- `git -C ../../back-readonly status` doit rester propre.
- Tickets front à implémenter = lignes « front » de `TICKETS.md` du back (008, 016–018, 021, 024, 025, 027, 028, 031, 032, 035, 036, 043, 044, 048, 049).

## Règle TDD — obligatoire sur chaque ticket

1. Lire `STACK.md` du back pour identifier les frameworks de test
2. Écrire les tests **avant** le code (ils doivent être rouges)
3. Lancer les tests → confirmer RED
4. Écrire le minimum de code pour les faire passer
5. Lancer les tests → confirmer GREEN
6. Refactoriser si nécessaire

**Ne jamais écrire de code d'implémentation avant que les tests du ticket existent.**

Stack de test : Vitest + Testing Library + MSW + jest-axe (D4, D15) — installée (`npm run test`). Un check jest-axe par page ; helper `renderWithProviders` dans `src/test/render.jsx`, serveur MSW dans `src/test/msw/` (tout appel non déclaré fait échouer le test).

## Démarrer le frontend en local — checklist

1. `npm install`
2. **Le back doit tourner** sur `http://localhost:8080` (Docker compose depuis `../../back-readonly` + `docs/dev/docker-compose.dev.yml` — voir « Back en local » ci-dessous et `docs/dev/README.md`).
3. **`.env` à la racine, obligatoire** (git-ignoré) : `cp .env.example .env` (`VITE_API_URL=http://localhost:8080/api`). Sans lui, le front interroge le serveur Vite au lieu du back ; redémarrer `npm run dev` après modification.
4. `npm run dev` — le serveur Vite démarre sur `http://localhost:5173` (origine CORS par défaut du back, ne pas changer de port)
5. Vérifier : la page s'affiche et `GET /auth/me` répond (401 si non connecté, c'est normal)

## Commandes utiles

### Frontend (racine de ce repo)

```bash
npm install
npm run dev                  # démarrer (http://localhost:5173)
npm run build                # build production
npm run lint                 # eslint (flat config)
npm run preview              # prévisualiser le build
npm run test                 # lancer les tests (Vitest)
npm run check                # lint + test + build + budget du bundle (gate pre-commit, D26 ; aussi exécuté par la CI)
```

### Backend (repo séparé, lecture seule ici)

Cloné dans `../../back-readonly`. Lancé uniquement via Docker compose (voir ci-dessous) ; ne rien y modifier.
Swagger UI : `http://localhost:8080/swagger-ui.html`

### Docker

Le `Dockerfile` (build node20 → nginx:alpine + `curl` pour le healthcheck), `.dockerignore` et `.github/workflows/ci.yml` (lint + build, push de l'image vers `ghcr.io/adac-formation/front` : tags `X.Y.Z`/`X.Y`/`latest` sur un tag git `vX.Y.Z`, `main`/`dev` + SHA sur push de branche, D45) vivent **dans ce repo**, écrits selon la spec de Charlotte (`INFRASTRUCTURE.md` §4, D5 révisée). **Charlotte** garde le `docker-compose.yml`, `nginx.conf` (monté dans l'image front), le déploiement et le CD. `VITE_API_URL` est injectée au **build** (`/api` en prod, même origine). À confirmer avec elle : TICKET-010.

## Back en local (D16–D20)

- Docker compose depuis `../../back-readonly` + `docs/dev/docker-compose.dev.yml` (D53) + `ADAC/dev-compose/.env` hors dépôts (secrets, comptes dev personnels Mailtrap/Supabase). Commandes : `docs/dev/README.md`.
- Le back ne crée aucun SUPER_ADMIN : utiliser `docs/dev/seed-local-admin.sql`.

## Auth — point clé

JWT stocké en **cookie HttpOnly** `jwt` (pas de header Authorization, **aucun token dans localStorage**).
Axios doit avoir `withCredentials: true` sur toutes les requêtes. Utilisateur de session : `GET /auth/me`.
Voir `tech.md` section « Configuration » pour les détails.

```js
// src/api/ — client axios unique
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api',
  withCredentials: true, // cookie jwt HttpOnly, jamais de header Authorization
});
```

- URL de base : local `http://localhost:8080/api` ; prod même origine (`/api/` proxifié par nginx sur `portail.adac.asso.fr`).
- Erreurs : `{status, message, details[]}` ; gérer 401/403/409/429 via un seul intercepteur `ApiError` (D12).
- Mot de passe : 8–72 caractères, ≥1 majuscule, ≥1 chiffre.
- Afficher `content` des notifications/messages **en texte, jamais en HTML** (XSS).

## Frontend — architecture

```
Route (react-router 8, createBrowserRouter — src/router/router.jsx)
  → Layout/Layout.jsx (enveloppe toutes les routes)
  → RequireAuth / RequireRole (garde par rôle issu de /auth/me)
  → Page (components/Pages ou features/<nom>/)
  → hooks TanStack Query
  → client axios (withCredentials)
  → API back
```

- Vite + React 19, JS pur, CSS Modules par composant + tokens globaux dans `src/index.css`.
- Atomic Design : `src/components/{atoms,molecules,organisms,Pages}`, `templates/PageShell`.
- Nouveau code dans `src/features/<nom>/`, l'UI partagée reste dans `src/components/` (D32).
- État : TanStack Query + axios (données serveur) ; contextes React pour le reste : `ThemeProvider` (mode sombre, taille de police, contraste élevé, persistés dans localStorage) et `UserProvider` (contexte d'auth visé).
- Formulaires : React Hook Form + validateurs écrits à la main dans `src/utils/validation.js` (D8, D13).
- Routes sans préfixe de rôle ; `RoleSwitcher` supprimé (D9, D10, D52). Garder les coques UI des pages existantes et les rebrancher sur les DTOs ; supprimer `simFormations.jsx` / `categories.js` après rebranchement (D11).
- Desktop-first mais responsive, bonne UX tablette et mobile (D42) ; WCAG 2.1 AA, `lang="fr"` (D15). Le design est une décision du front, décrit dans `docs/design-front.md` (D2, D41) ; pour le reste, aligner sur le back (D1).
- Vie privée : aucune donnée personnelle dans le stockage navigateur, polices auto-hébergées, aucun tracker (D31).

## Tests frontend

| Couche | Outil | Ce qu'on teste |
|---|---|---|
| Composant / page | Vitest + Testing Library | Rendu, interactions, états de chargement/erreur |
| API | MSW | Contrat DTO, codes HTTP (401/403/409/429) |
| Accessibilité | jest-axe | Un check par page |

```bash
npm run test -- NomTest       # un test spécifique
```

## État actuel / pièges (travail en cours)

- Auth branchée (change `auth-real-backend`, D52) : la session est la requête `['auth','me']` (`features/auth/hooks.js`, `useCurrentUser`) ; `features/auth/UserProvider.jsx` branche le 401 de `Axiosclient.js` (`setUnauthorizedHandler`, `ApiError` D12) ; gardes `RequireAuth` / `RequireRole` / `PublicOnly` ; pages connexion, activation, mot de passe oublié, réinitialisation. Les hooks TanStack Query des autres ressources ne sont pas encore écrits (sauf les comptes, ci-dessous).
- Comptes branchés (change `users-account-management`, D54) : `src/features/accounts/` (listes, création, modification, détail, suspension / réactivation) sur `/admin/formateurs` et `/admin/stagiaires` ; la chargée de formation gère, le formateur consulte en lecture seule. Reportés : colonne formations et « Envoyer un message » (`feature/formations`, `feature/messagerie`), profil et import Excel.
- Pages chargées à la demande (change `route-code-splitting`, D59) : `lazyPage(() => import(...))` dans `router/router.jsx` ; gabarit, gardes, session et thème restent dans l'entrée ; `RouteError` (chargement raté, adresse inconnue) ; la session part dès `main.jsx` (`prefetchSession`). `bundle-budget.json` + `scripts/check-bundle.mjs` (dans `npm run check`) font échouer le build si l'entrée dépasse le budget ou contient une page : après avoir ajouté une page, l'importer avec `lazyPage`.
- `npm run lint` est propre (0 erreur) ; `npm run check` vert (lint + tests + build + budget).
- Gabarit et accessibilité (change `ui-structure-cleanup`, D57–D58) : toute page s'enveloppe dans `templates/PageShell` (un `<div>` ; le seul `<main>` est celui de `Layout`) qui fournit le dégagement sous le logo (`--page-top`) — ne jamais redéfinir `padding-top` ni le conteneur ; « Retour » = `BackButton` avec destination explicite. `text-large` (125 %) et `high-contrast` (clair et sombre) ont des règles dans `index.css` : écrire les `font-size` en `rem`, les couleurs en jetons (`--color-action`, `--color-on-yellow`…), et ne jamais supprimer un `outline` sans remplacement (anneau global `:focus-visible`). Des tests lisent les feuilles de style (`src/test/css-hygiene.test.js`, `display-preferences.test.js`, `focus-ring.test.js`) et échouent sinon.
- Données encore mockées (`utils/simFormations.jsx`, `utils/categories.js`).

## Git & process

- Convention : Conventional Commits. Une branche par thème comme le back (`feature/setup`, `feature/auth`, `feature/users`, `feature/categories`, `feature/formations`, `feature/documents`, `feature/messagerie`, `feature/notifications`, `feature/dashboard`), un commit par ticket, une seule PR vers `dev` au dernier ticket de la branche (D3, D43).
- Nouveau travail à partir de `dev` (pas de `categorie`) : une branche `feature/<thème>` créée depuis `dev` (D3). **Aucun push sans demande explicite de Manon.** `API` local == ancien `dev`. Le stash `wip-canCreate-ManagementMenu` garde un changement `canCreate` inachevé de l'ancien checkout `formation`.
- Done = `npm run check` vert + tests avec check jest-axe par page + passage manuel sur le vrai back local + docs à jour + relecture (D30).
- Projet annexe : pas de jalons ni de planning (D29). Board : https://github.com/orgs/ADAC-Formation/projects/1 (cartes brouillon, pas d'issues).

## Docs & Spec-Driven Development

Voir `docs/` (`plan-de-proyecto.md`, `decisions-*.md`, `spec.md`). Docs en français ; chaînes d'UI en français, identifiants de code en anglais. Résoudre les questions ouvertes avec `/grill-me-with-docs` avant de planifier ; consigner chaque décision au fil de l'eau.
