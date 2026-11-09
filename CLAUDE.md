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
| `docs/questions-pour-adac.md`                | Questions pour l'ADAC (documents obligatoires, champs d'une formation) — pas pour Charlotte |
| `docs/spec.md`, `docs/plan-de-proyecto.md`   | Spec et plan du front                                                    |

**En cas de conflit entre documents du back, `docs/tech.md` l'emporte** (D40) ; les conflits relevés sont dans `docs/points-pour-charlotte.md` §4. Utiliser la branche `dev` du back, pas `main` (obsolète). Rafraîchir : `git -C ../../back-readonly pull` (fetch en lecture seule autorisé).

## Rôles utilisateurs

Rôles du back (source de vérité, rôle lu via `GET /auth/me`) :

- `SUPER_ADMIN` — Chargée de formation : accès total
- `ADMIN` — Formateur : lecture + messagerie + ajout docs
- `STAGIAIRE` — Apprenant : lecture de ses formations + messagerie

Libellés affichés : Chargée de formation / Formateur / Stagiaire (D33). D46 (l'emporte sur `tech.md`, exception à D40) : le formateur voit toutes les formations en lecture seule, « Mes formations » par défaut, **côté client seulement** : le back ne le permet pas encore et Charlotte demande de **ne rien développer de plus** avant la décision commune (Q3, Q8.2), qui attend l'avis de l'ADAC (`docs/questions-pour-adac.md` §C).
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
- Dates : tous les DTO renvoient des `OffsetDateTime` (`2026-11-03T09:45:10.02948Z`, Q7) ; `new Date(…)` les convertit à l'heure locale.

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

**Requêtes non déclarées** : `src/test/setup.js` fait échouer le test qui lance une requête sans mock MSW (la page avale l'erreur, et la réponse tombait dans le test suivant, qui échouait au hasard). Une page qui appelle `/formations`, `/categories`, `/auth/me`… doit avoir ses mocks dans chaque test qui la rend. Un mock qui répond après une déconnexion doit répondre 401, comme le vrai back.

## État actuel / pièges (travail en cours)

- Auth branchée (change `auth-real-backend`, D52) : la session est la requête `['auth','me']` (`features/auth/hooks.js`, `useCurrentUser`) ; `features/auth/UserProvider.jsx` branche le 401 de `Axiosclient.js` (`setUnauthorizedHandler`, `ApiError` D12) ; gardes `RequireAuth` / `RequireRole` / `PublicOnly` ; pages connexion, activation, mot de passe oublié, réinitialisation. Les hooks TanStack Query des autres ressources ne sont pas encore écrits (sauf les comptes, ci-dessous).
- Comptes branchés (change `users-account-management`, D54) : `src/features/accounts/` (listes, création, modification, détail, suspension / réactivation) sur `/admin/formateurs` et `/admin/stagiaires` ; la chargée de formation gère, le formateur consulte en lecture seule. Le bouton « Envoyer un message » est branché (change `messagerie-individuelle`, ci-dessous). Reportés : colonne formations (inscriptions, après `feature/formations`), profil et import Excel.
- Pages chargées à la demande (change `route-code-splitting`, D59) : `lazyPage(() => import(...))` dans `router/router.jsx` ; gabarit, gardes, session et thème restent dans l'entrée ; `RouteError` (chargement raté, adresse inconnue) ; la session part dès `main.jsx` (`prefetchSession`). `bundle-budget.json` + `scripts/check-bundle.mjs` (dans `npm run check`) font échouer le build si l'entrée dépasse le budget ou contient une page : après avoir ajouté une page, l'importer avec `lazyPage`.
- `npm run lint` est propre (0 erreur) ; `npm run check` vert (lint + tests + build + budget).
- Gabarit et accessibilité (change `ui-structure-cleanup`, D57–D58) : toute page s'enveloppe dans `templates/PageShell` (un `<div>` ; le seul `<main>` est celui de `Layout`) qui fournit le dégagement sous le logo (`--page-top`) — ne jamais redéfinir `padding-top` ni le conteneur ; **Toute page a un « Retour »** (`BackButton` avec destination explicite), sauf l'accueil et les pages publiques : en ajoutant une page, y mettre `<BackButton to="…" />` ; le garde-fou `src/router/back-button-coverage.test.js` lit le routeur et échoue sinon (dette connue : plan du site, à vider). Les options d'affichage (`text-step-1..3`, `high-contrast` clair et sombre, `grayscale`, `negative-contrast`, `light-background`, `underline-links`, `readable-font`, D60) ont des règles dans `index.css` : écrire les `font-size` en `rem`, les couleurs en jetons (`--color-action`, `--color-on-yellow`…), et ne jamais supprimer un `outline` sans remplacement (anneau global `:focus-visible`). Des tests lisent les feuilles de style (`src/test/css-hygiene.test.js`, `display-preferences.test.js`, `focus-ring.test.js`) et échouent sinon.
- Formations branchées (changes `formations-list-detail`, `formation-form` et `formation-import`, F1–F24 dans `docs/decisions-formations.md`) : `src/features/formations/` ; liste et détail sur `/formations` (et `/admin/formations`), formulaire de création et de modification sur `/formations/creer` et `/formations/:id/modifier` (SUPER_ADMIN ; dates du/au, catégorie de `GET /categories?active=true`, formateur de `GET /users/formateurs?active=true`, redirection vers la formation créée). La catégorie est lue dans la formation ; le formateur a « Mes formations / Toutes » côté client (D46) ; le stagiaire ne voit que le nombre d'inscrits ; section « Documents » : voir le bullet « Documents de formation » ci-dessous. Contrat (Q11, confirmé) : à la modification `formateurId` absent ou `null` = inchangé, donc le front envoie l'identifiant de la chargée (voir F15). Import Excel (`/formations/importer`, SUPER_ADMIN, F16–F24 ; bouton dans « Créer une nouvelle formation », format dans l'aide « ? ») : colonnes **provisoires** de `tech.md` (R10, le fichier réel d'ADAC n'est pas arrivé) définies dans `features/formations/importColumns.js` seulement ; modèle `.xlsx` généré dans le navigateur (`write-excel-file` + son extension de validation de données, chargés à la demande) avec listes déroulantes (modalité, catégories et formateurs actifs lus au clic, F24) ; contrôle `.xlsx` + 2 Mo avant envoi ; le `400` du back arrive en une seule chaîne (`ligne N, colonne X : texte` jointes par « | »), découpée par `importErrors.js` (Q12). Reporté : inscrire / désinscrire. Création de catégorie à la volée et filtre par catégorie : voir le change `category-picker` ci-dessous.
- Catégories branchées (change `category-management`, C1–C5 dans `docs/decisions-categories.md`) : `src/features/categories/` ; page `/formations/categories` (SUPER_ADMIN) : lister toutes les catégories, créer / modifier dans une boîte de dialogue (`CategoryFormDialog`, nom + couleur `#RRGGBB`, réutilisable par 048), désactiver avec confirmation, réactiver ; jamais de suppression. Toute écriture recharge `['categories']` et `['formations']` (la formation embarque sa catégorie : renommer ou recolorer change aussi leur affichage). Le piège de focus des boîtes modales est dans `hooks/useModalFocus.js` (`ConfirmDialog` et `CategoryFormDialog`). Le mock `utils/categories.js` n'existe plus.
- Sélecteur de catégorie (change `category-picker`, C6–C7, ticket 048) : le formulaire de formation garde son `<select>` natif et ajoute « Créer une catégorie » (`CategoryFormDialog` rendue hors du `<form>`, la catégorie créée est sélectionnée, pastille d'aperçu) ; la liste des formations a un `<select>` « Catégorie » (toutes les catégories, filtre côté client, chargée de formation et formateur). Toute page qui rend `FormationListPage` dans un test doit déclarer `mockCategories()`.
- Documents de formation (change `formation-documents`, G1–G7 dans `docs/decisions-documents.md`, ticket 027) : `src/features/documents/` ; section « Documents » du détail de formation (`DocumentSection`) : liste, téléchargement (blob par axios, jamais `fileUrl`), dépôt multi-fichiers par glisser-déposer ou « Choisir des fichiers » (contrôle pdf / jpg / jpeg / png / docx et 10 Mo avant envoi (liste du back, Q5), un `POST /documents` par fichier, refus listés par fichier), suppression avec confirmation. Droits affichés = droits du back (`documentFiles.js` : chargée de formation partout ; formateur : dépôt sur ses formations, suppression de ses envois ; stagiaire : lecture) ; formation archivée en lecture seule (règle d'interface, à confirmer avec Charlotte). Tout test qui rend le détail de formation doit déclarer `mockDocumentApi()` (`src/test/documents.js`). Pour tester un vrai dépôt en local, `dev-compose/.env` doit contenir un vrai bucket Supabase (`SUPABASE_URL` = URL du projet seule, sans `/rest/v1/` ; sinon le back répond `502`). Les documents du stagiaire sont dans le bullet suivant (028).
- Documents du stagiaire (change `stagiaire-documents`, G8–G12, G15, G16 dans `docs/decisions-documents.md`, ticket 028) : **le dépôt est sur la page de la formation** (`/formations/:id`, stagiaire seulement) : `MyDocumentsSection` (`features/documents/`) sous « Documents » (qui reste en lecture seule pour lui) : ses dépôts sur cette formation, téléchargement, zone de dépôt de 027 si la formation est active, « Supprimer » (avec confirmation) seulement sur ses propres dépôts (`uploadedBy` = lui) et formation active (`canDeleteDocument`). **Le profil** (`/profile`, `features/profile/pages/ProfilePage.jsx`) affiche « Mes documents » en résumé en lecture seule (`DocumentsSummary`, `useMyDocuments`) : tous ses dépôts, le plus récent d'abord, chacun avec « Déposé dans <formation> » (lien vers la formation) ; `DocumentList` : `locationOf`, `onDownload` facultatif. `uploadDocument` / `useDocuments` / `useUploadDocuments` prennent une cible `{ formationId }` ou `{ inscriptionId }` (exactement un des deux). **Contrat (Q13 traitée par le back le 2026-11-09, G15)** : `FormationResponse.inscriptionId` n'est renseigné que pour le stagiaire inscrit ; le front le lit **seulement** par `inscriptionIdOf` (`documentFiles.js`) et affiche « Dépôt indisponible pour le moment » sans aucun appel `/documents` quand il manque. Le dépôt envoie `inscriptionId` **seul** (avec `formationId`, le back répond `403`). Le raccourci de développement `VITE_DEV_INSCRIPTION_IDS` (G14) est retiré. Tout test qui rend le détail d'une formation déclare `mockDocumentApi()` ; tout test qui rend le profil ou `DocumentsSummary` déclare `mockFormationList()` (formations avec `inscriptionId`) et `mockDocumentApi(docs, { uploader: USERS.STAGIAIRE })`.
- Documents envoyés par les stagiaires, vus par la chargée de formation et le formateur (change `stagiaire-documents`, G17) : `SentDocuments` (`features/documents/`) = une ligne d'état par inscription : coche verte + « Documents envoyés » (au moins un document dont `uploadedBy` est le stagiaire, état dit en texte) ou « Aucun document envoyé », puis un lien-bouton par fichier (blob par axios). Utilisé dans « Stagiaires inscrits » du détail d'une formation (une liste `GET /documents?inscriptionId=` par inscrit) et dans `StagiaireDocumentsSection` du profil d'un stagiaire (`AccountDetailPage`, `kind === 'stagiaires'`). Le back n'a pas d'appel « inscriptions d'un compte » : `useStagiaireInscriptions` (`features/formations/hooks.js`) parcourt les listes d'inscrits des formations de l'appelant ; `403` / `404` ignorés (formation hors périmètre du formateur). **Pas de checklist nommée** : le back n'a pas de « document requis », et la liste est d'abord une question pour l'ADAC (`docs/questions-pour-adac.md` §A, pas pour Charlotte pour l'instant) ; Q16 de `docs/points-pour-charlotte.md` = inscriptions d'un compte. Tout test qui rend le détail d'une formation en manager ou `AccountDetailPage` d'un stagiaire déclare `mockDocumentApi()` ; ce dernier déclare aussi `mockFormationList()` (et `mockInscriptions()` par formation).
- Messagerie individuelle (change `messagerie-individuelle`, H1–H9 dans `docs/decisions-messagerie.md`, ticket 031) : `src/features/messagerie/` ; `/messages` (liste, sondée 45 s) et `/messages/:userId` (fil + saisie, texte seul, 1–5000 caractères) dans `pages/MessagesPage.jsx` (deux volets par requête de conteneur en `rem` ; écran étroit : un volet à la fois). Qui peut écrire à qui : `recipients.js` (pur, H1), lu en **un seul point** par `useRecipients` ; ouvrir un fil marque les reçus non lus par un `PATCH` chacun (`markThreadRead` dans `api.js`). Page calquée sur les autres (H11) : « Retour », bouton « Nouvelle conversation » en haut à droite, recherche par nom + menu « Rôle » + pastilles « Toutes / Non lues » (filtres côté navigateur, `conversationFilters.js`), liste dans une carte arrondie. Pastille « non lus » sur la tuile Messages (`Tile` : `badge` + `badgeLabel`, `useUnreadCount`) et bouton « Envoyer un message » sur le détail d'un compte (`canWriteToAccount`). **Pièges** : (1) `src/test/msw/handlers.js` répond `[]` à `GET /api/messages` par défaut (la pastille l'appelle en arrière-plan à chaque rendu de l'accueil ; sinon la requête tardive fait échouer le test suivant) ; un test sur la liste ou la pastille déclare `mockConversations()` (`src/test/messages.js`) ; (2) le détail d'un compte vu par un formateur lit sa liste de stagiaires : déclarer `mockConversations([])` et `mockAccountList('stagiaires', …)` ; (3) `Thread` doit être rendu avec `key={userId}` (mémoire de lecture par fil) ; (4) aucune page ne redéfinit `.back` (`back-links.test.jsx`). **Ouvert côté back, d'accord de principe (2026-11-09)** : Q14 (`GET /messages/recipients`, la chargée de formation n'est atteignable en premier par un formateur ou un stagiaire que si elle est déjà connue : conversation, ou formateur d'une formation) et Q15 (`PATCH /messages/conversations/{conversationId}/read`, un fil lu en un appel) dans `docs/points-pour-charlotte.md`. Le back local confirme le contrat (201, `400` `content: must not be blank` / `size must be between 0 and 5000`, `PATCH …/read` idempotent, fil inconnu = `200 []`). Reporté : envoi groupé (ticket 032, change suivant).
- Notifications (change `notifications-bell-history`, N1–N9 dans `docs/decisions-notifications.md`, ticket 035) : `src/features/notifications/` ; cloche `NotificationBell` dans `SiteHeader` (rien sans session, aucun appel `/notifications` pour un visiteur ; elle se garde elle-même), panneau des non lues (« ✕ » = `DELETE`, retire de la cloche seulement ; « Tout marquer comme lu » ; lien vers l'historique) et page `/notifications` (filtre de statut envoyé au back en `?read=`, tri par date côté client, plafond de 200, aucune suppression). Requêtes `['notifications','unread']` (sondage 45 s, en pause onglet masqué) et `['notifications','all',statut]` ; mises à jour optimistes avec retour arrière ; `useOpenNotification()` est l'unique chemin « marquer comme lue puis naviguer » (cloche et historique). Cible et icône viennent de `entityType` seulement (`notificationTargets.js` : `MESSAGE` → `/messages/:entityId` avec `entityId` = autre participant, `FORMATION` → `/formations/:entityId`, le reste est neutre) ; `/messages/:userId` pointe sur la coque `MessagesPage` jusqu'à `feature/messagerie`. Tout test qui rend le gabarit complet avec une session (`SiteHeader`, `Layout`, le routeur) doit déclarer `mockNotificationApi()` (`src/test/notifications.js`), sinon MSW fait échouer le test. Reporté : bascule e-mail (036) avec la page profil. Budget : l'entrée est à ~102 Ko gzip sur 109 Ko (la page d'historique, pourtant chargée à la demande, a fait remonter ~8 Ko dans l'entrée : cause non élucidée).
- Mise en page mobile (change `mobile-layout-fixes`, D61) : les grilles de tuiles (`ManagementMenu`, `TileGroup`) utilisent des requêtes de conteneur en `rem` (elles suivent « Grand texte », pas `@media`), colonne unique par défaut ; le survol des tuiles de Gestion est sous `@media (hover: hover)` + `@container`, avec `:focus-within`. Ne jamais masquer un libellé en `display: none` (le bouton perd son nom) : masquage visuel + seuil à 1150 px. Garde-fous dans `src/test/mobile-layout.test.js`.

## Git & process

- Convention : Conventional Commits. Une branche par thème comme le back (`feature/setup`, `feature/auth`, `feature/users`, `feature/categories`, `feature/formations`, `feature/documents`, `feature/messagerie`, `feature/notifications`, `feature/dashboard`), un commit par ticket, une seule PR vers `dev` au dernier ticket de la branche (D3, D43).
- Nouveau travail à partir de `dev` (pas de `categorie`) : une branche `feature/<thème>` créée depuis `dev` (D3). **Aucun push sans demande explicite de Manon.** `API` local == ancien `dev`. Le stash `wip-canCreate-ManagementMenu` garde un changement `canCreate` inachevé de l'ancien checkout `formation`.
- Done = `npm run check` vert + tests avec check jest-axe par page + passage manuel sur le vrai back local + docs à jour + relecture (D30).
- Projet annexe : pas de jalons ni de planning (D29). Board : https://github.com/orgs/ADAC-Formation/projects/1 (cartes brouillon, pas d'issues).

## Docs & Spec-Driven Development

Voir `docs/` (`plan-de-proyecto.md`, `decisions-*.md`, `spec.md`). Docs en français ; chaînes d'UI en français, identifiants de code en anglais. Résoudre les questions ouvertes avec `/grill-me-with-docs` avant de planifier ; consigner chaque décision au fil de l'eau.
