# Décisions — fondations du front

## D1 — Principe directeur : s'aligner sur le back-end autant que possible
- Date : 2026-10-11
- **Décision** : en cas d'écart entre le front et le back (`dev`, `docs/tech.md`, `STORIES`, `DB_MODEL`, `DESIGN`), le front s'aligne sur le back, sauf raison documentée.
- **Pourquoi** : le back est quasi terminé (523 tests, 50 tickets) et appartient à Charlotte ; le front ne doit pas imposer de changements de contrat.
- **Alternatives écartées** : garder le front tel quel et demander des adaptations au back.
- Conséquences immédiates (à confirmer à la mise en œuvre) :
  - Auth : cookie HttpOnly `jwt`, `withCredentials: true`, session via `GET /auth/me`, aucun jeton en JS/localStorage ; `UserProvider` reconstruit autour de `/auth/me` ; `isAuthenticated` factice retiré de `ThemeProvider` ; 401 → vider l'état utilisateur et naviguer (pas de rechargement dur).
  - Rôles : `SUPER_ADMIN` / `ADMIN` (formateur) / `STAGIAIRE` (remplace ADMIN/FORMATEUR/STAGIAIRE de `utils/roles.js`).
  - Variable d'env : `VITE_API_URL`, avec `.env.example`.

## D2 — Design : on garde le thème actuel du front (exception à D1)
- **PRÉCISÉE le 2026-10-31 (D41)** : le design est une décision du front ; il est documenté dans `design-front.md` (même structure que `DESIGN.md`) et partagé avec Charlotte. Plus « à trancher avec le dev back ».
- Date : 2026-10-11
- **Décision** : conserver le thème actuel (Syne + Plus Jakarta Sans, tokens oklch, mode sombre / grand texte / contraste élevé). `DESIGN.md` du back (Manrope, `#cc3d34`, tuiles colorées, rayon 24px) n'est pas adopté pour l'instant.
- **Pourquoi** : choix de Manon ; moins de retravail ; le point doit être tranché avec le dev back.
- **Alternatives écartées** : adopter `DESIGN.md` immédiatement ; attendre ADAC avant de construire.
- **À faire** : point inscrit dans `meeting-points-back.md` pour la prochaine réunion avec Charlotte. Construire avec des tokens CSS pour que le changement reste peu coûteux.

## D3 — Branche de base : `categorie`, en local seulement
- Date : 2026-10-11
- **Décision** : le nouveau travail part de `categorie` (`0102107`, la plus avancée : contient `main`, `formation`, `dev`). Branches de travail locales ; **aucun push** tant que Manon ne le demande pas.
- **Constat (lecture seule)** : la branche locale `API` pointe sur `6002deb` = `dev` ; elle n'a aucun commit propre, rien n'est perdu. Branche courante : `formation` (`d388b58`) avec 3 fichiers modifiés non commités (`package.json`/lock : ajout d'axios ; `ManagementMenu.jsx` : drapeaux `canCreate`) et `src/api/Axiosclient.js` non suivi. `Axiosclient.js` est à réécrire (D1).
- **Pourquoi** : éviter de fusionner/pousser sur l'organisation sans demande explicite ; `categorie` évite de refaire du travail déjà écrit.
- **Alternatives écartées** : fusionner `categorie` dans `dev`/`main` d'abord (PRs sur l'org) ; rester sur `formation`.
- **Mise en œuvre** : au moment de passer à `categorie`, vérifier qu'aucun conflit ne perd les modifications non commitées (sinon `git stash` d'abord).

## D4 — Tests : Vitest + Testing Library + MSW, avec chaque HU
- Date : 2026-10-11
- **Décision** : installer Vitest + Testing Library + MSW dans TICKET-008 ; les tests s'écrivent avec chaque HU. MSW simule l'API selon `tech.md` (cookie, codes d'erreur) pour travailler sans le back.
- **Pourquoi** : aligné sur `STACK.md` du back (D1) et sur le DoD ; le front n'a aucun test aujourd'hui.
- **Alternatives écartées** : tests ciblés sans MSW ; aucun test pour l'instant.

## D5 — Dockerfile et CI du front : laissés à Charlotte
- **RÉVISÉE le 2026-10-31** : on suit `INFRASTRUCTURE.md` §4 du back (spec de Charlotte). `Dockerfile`, `.dockerignore` et CI (lint/build + push `ghcr.io/adac-formation/front`) vivent dans CE repo, écrits d'après sa spec ; Charlotte garde le compose, nginx, le déploiement et le CD (TICKET-041). À confirmer avec elle (TICKET-010) : c'est bien le CI du front qui build et push l'image (le doc back est contradictoire L57 vs L66/L344). Texte d'origine conservé ci-dessous.
- Date : 2026-10-11
- **Décision** : Charlotte écrit le Dockerfile du front (node20 → nginx) et le pipeline CI/CD (image ghcr, déploiement). Le front fournit seulement les instructions de build : `npm ci && npm run build`, variable `VITE_API_URL` injectée au build, sortie `dist/`.
- **Pourquoi** : le déploiement et l'infrastructure appartiennent à Charlotte ; cohérent avec la règle « aucune action sur son périmètre ».
- **Alternatives écartées** : Manon écrit Dockerfile + CI lint/test/build ; Manon écrit tout y compris le push ghcr.
- **Conséquence** : TICKET-010 passe en point à coordonner (`meeting-points-back.md` #3). Un workflow CI de lint/test du front reste souhaitable côté front : à re-décider ultérieurement (non tranché ici).

## D6 — Ligne de coupe MoSCoW : proposition conservée
- Date : 2026-10-11
- **Décision** : Must = 008, 016, 017, 018, 043, 024 ; Should = 021, 025, 027, 028, 031, 035 ; Could = 032, 036, 044, 048, 049 (voir `plan-de-proyecto.md` §1.5). Ordre de coupe : Could d'abord.
- **Pourquoi** : auth + dashboard + liste/détail formations ouvrent tout le reste ; la proposition correspond au besoin ADAC.
- **Alternatives écartées** : promouvoir documents + messagerie en Must ; promouvoir la gestion des catégories en Must.
- Note : la création de formation exige `categoryId` (back) ; 048 reste Could, mais un sélecteur minimal est nécessaire pour 025 (Should).

## D7 — Suivi : tableau GitHub Project dans l'organisation (création différée)
- Date : 2026-10-11
- **Décision** : le suivi se fera dans un GitHub Project (Kanban + milestones) de `ADAC-Formation`, colonnes Backlog / Ready / In progress / In review / Done, une carte par HU (les 17 tickets front). **Rien n'est créé tant que Manon ne donne pas un go explicite** (action d'écriture sur l'organisation, partagée avec Charlotte).
- **Pourquoi** : aucun suivi n'existe ; les tickets du back sont des fichiers Markdown.
- **Alternatives écartées** : suivi local dans `docs/` seulement ; deadline donnée tout de suite (aucune date fournie : jalons restent `[NEEDS CLARIFICATION]`).
- **À faire** : prévenir Charlotte avant création (`meeting-points-back.md` #5). Le scope `gh` « project » n'est peut-être pas accordé : à vérifier au moment du go.

## D8 — Couche données : TanStack Query + axios
- Date : 2026-10-11
- **Décision** : `@tanstack/react-query` + axios (`withCredentials`) ; un hook par ressource (`useFormations`, `useNotifications`…) dans `src/api/`. Sondage des notifications via `refetchInterval` (30–60 s, `GET /notifications/unread`) ; invalidation des requêtes après chaque mutation.
- **Pourquoi** : cache, rechargement, états chargement/erreur et sondage sans code maison ; testable avec MSW (D4).
- **Alternatives écartées** : axios + hooks maison ; axios appelé directement dans les composants.
- Vérifier l'API de la version courante via Context7 avant d'écrire du code.

## D9 — Routes sans préfixe de rôle, avec gardes
- Date : 2026-10-11
- **Décision** : routes communes à tous les rôles (`/` tableau de bord à 4 tuiles, `/formations`, `/formations/:id`, `/messages`, `/notifications`, `/profil`, `/gestion/*`). Le rôle vient de `GET /auth/me`. `<RequireAuth>` protège tout sauf login/activation/mot de passe oublié ; `<RequireRole>` protège `/gestion/*` et les écrans réservés. L'UI s'adapte au rôle ; l'autorité reste le back (403/404).
- **Pourquoi** : s'aligne sur `USERFLOW` du back (même dashboard, 1re tuile différente) et sur D1 ; supprime la duplication `HomePage role="…"`.
- **Alternatives écartées** : garder `/admin`, `/formateur`, `/stagiaire` ; approche hybride.
- **Conséquence** : `utils/routeManager.jsx`, `ProtectedRoute.jsx` et les routes actuelles sont à réécrire ; liens morts de `ManagementMenu` à reprendre.

## D10 — RoleSwitcher supprimé ; rôles simulés par MSW
- Date : 2026-10-11
- **Décision** : supprimer `RoleSwitcher` et `dev-role` (localStorage). Le rôle réel vient uniquement de `/auth/me`. Pour travailler sans le back, des gestionnaires MSW renvoient un utilisateur configurable (SUPER_ADMIN / ADMIN / STAGIAIRE) choisi par un drapeau d'environnement de dev, jamais livré en production.
- **Pourquoi** : une seule source de vérité pour le rôle (D1, D9) ; évite un contournement des gardes.
- **Alternatives écartées** : le garder sous `import.meta.env.DEV` ; le supprimer sans simulation.

## D11 — Pages existantes : on garde les coques UI, on recâble champ par champ
- Date : 2026-10-11
- **Décision** : conserver mises en page et CSS de `FormationsPage`, `FormationDetails`, `CreateFormationPage`, `CategoryManagement` ; remplacer les données simulées par des hooks TanStack Query, en faisant correspondre chaque champ aux DTO (`FormationResponse`, `CategoryResponse`…). Supprimer `utils/simFormations.jsx` et `utils/categories.js` une fois recâblées. Les écarts sont consignés par ticket.
- **Pourquoi** : le travail visuel existe déjà ; D1 impose le contrat comme référence.
- **Alternatives écartées** : audit préalable page par page ; reconstruction depuis `USERFLOW`.

## D12 — Erreurs : gestion centralisée + erreurs en ligne dans les formulaires
- Date : 2026-10-11
- **Décision** : l'intercepteur axios normalise toute erreur en un `ApiError {status, message, details}`. 401 → vider la session et rediriger vers `/login` avec « session expirée » (sans rechargement dur) ; 403 / 404 → pages dédiées ; 400 / 409 / 429 → messages en ligne issus de `message` / `details` ; toast global uniquement pour réseau / 500. Le contenu d'erreur est rendu en texte.
- **Pourquoi** : cohérence et testabilité avec MSW ; le back renvoie déjà des messages en français.
- **Alternatives écartées** : try/catch par page ; afficher le `message` brut partout.
- Points d'attention : le 404 du back est volontaire (anti-sondage d'existence) ; `/auth/login` 401 ne doit pas déclencher la redirection de session.

## D13 — Formulaires : React Hook Form + validateurs écrits à la main
- Date : 2026-10-11
- **Décision** : `react-hook-form` ; validateurs en fonctions pures dans `src/utils/validation.js` (mot de passe 8–72 car. + 1 majuscule + 1 chiffre, `dateFin ≥ dateDebut`, couleur `#RRGGBB`, e-mail, types/taille de fichier ≤ 10 Mo pour pdf/jpg/jpeg/png/docx…) reflétant les contraintes du back ; le back reste l'autorité (erreurs 400 affichées, D12). Adapter `FormInput`/`FormField` existants.
- **Pourquoi** : une seule dépendance, alignée sur `STACK.md` du back ; les validateurs sont faciles à tester.
- **Alternatives écartées** : RHF + Zod ; champs contrôlés sans bibliothèque.

## D14 — Import Excel : UI sur le contrat provisoire, signalée comme risque
- Date : 2026-10-11
- **Décision** : construire l'envoi du fichier et le tableau d'erreurs (ligne / colonne) selon `tech.md`, avec un modèle téléchargeable conforme aux colonnes provisoires (A intitule … G formateur). Risque R10 maintenu ; reprise probable quand ADAC envoie le vrai fichier.
- **Pourquoi** : ne pas bloquer TICKET-025 ; le contrat côté back existe.
- **Alternatives écartées** : différer l'import ; attendre la confirmation d'ADAC/Charlotte.
- **À faire** : demander à ADAC le fichier réel (`meeting-points-back.md` #6).

## D15 — Accessibilité : cible WCAG 2.1 AA, `lang="fr"`, bascules conservées
- Date : 2026-10-11
- **Décision** : cible WCAG 2.1 AA ; parcours complets au clavier, champs étiquetés, focus visible, contraste vérifié dans les 3 thèmes (clair, sombre, contraste élevé), `aria-live` pour erreurs et notifications ; `lang="fr"` dans `index.html` ; contrôles `jest-axe` dans les tests de composants (D4). Les bascules mode sombre / grand texte / contraste élevé restent.
- **Pourquoi** : public associatif du social, exigences Qualiopi, et c'est déjà un point fort du front.
- **Alternatives écartées** : effort sans cible formelle ; attendre le besoin exprimé par ADAC.
- Contrainte de D2 : tokens CSS conservés pour que les contrastes restent vérifiables.

## D16 — Développement quotidien contre le vrai back en local
- Date : 2026-10-11
- **Décision** : `npm run dev` parle toujours au vrai back lancé en local (Postgres + Spring Boot, `http://localhost:8080/api`, CORS `http://localhost:5173`). MSW sert aux **tests automatiques** (D4) uniquement, plus au développement ; D10 est ajusté en conséquence (plus de drapeau de rôle simulé en dev ; les tests injectent le rôle via les gestionnaires MSW).
- **Pourquoi** : moins d'écarts entre simulation et contrat ; le back est déjà terminé.
- **Alternatives écartées** : MSW par défaut avec drapeau pour le vrai back ; attendre une API de dev partagée de Charlotte.
- **Point ouvert (voir D17)** : lancer le back crée des fichiers (`.env`, `target/`) — ne doit pas se faire dans `back-readonly`.

## D17 — Le back se lance depuis `back-readonly`, avec `.env` ignoré par git
- Date : 2026-10-11
- **Décision** : lancer le back directement depuis `back-readonly`. `.env`, `.env.local` et `target/` y sont déjà dans `.gitignore` du back → `git status` reste propre ; aucun fichier suivi n'est modifié, aucun commit, push désactivé.
- **Pourquoi** : un seul dossier, choix de Manon.
- **Alternatives écartées** : second clone `back-run` ; docker compose depuis le dossier.
- **Vérification obligatoire** : `git -C back-readonly status` doit rester vide après chaque lancement.
- **Constat (2026-10-11)** : Java, Maven, Docker et psql sont absents de cette machine (`java`/`mvn`/`docker`/`psql` introuvables). D16 est donc bloqué tant que la chaîne d'outils n'est pas installée.

## D18 — Docker Desktop + compose ; surcharge de dev gardée hors de `back-readonly`
- Date : 2026-10-11
- **Décision** : installer Docker Desktop uniquement ; lancer le back via le `docker-compose.yml` de `back-readonly` **complété par un fichier de surcharge extérieur** (ex. `ADAC/dev-compose/docker-compose.dev.yml`, passé avec `-f`), plus un `.env` ignoré par git.
- **Constat (lecture de `docker-compose.yml`)** : le compose du back est orienté production : `db` et `backend` n'exposent aucun port, `SPRING_PROFILES_ACTIVE=prod` (Swagger désactivé, cookie `Secure` forcé), et le service `frontend` tire `ghcr.io/adac-formation/front` (image non publiée) avec nginx sur le port 80. Tel quel, il n'offre donc pas d'API sur `localhost:8080`.
- **Surcharge prévue** : publier `backend` sur `8080`, profil `dev`, désactiver le service `frontend` (profil compose), garder `db` interne. Le front tourne en `npm run dev` sur `5173` (CORS déjà prévu).
- **Alternatives écartées** : JDK + Maven + PostgreSQL natifs ; retour à MSW seul.
- **Dépendances externes du back** : `MAIL_*` (codes d'activation / reset), `SUPABASE_*` (documents), `JWT_SECRET` → voir D19.

## D19 — Services externes locaux : comptes de dev personnels (Mailtrap + Supabase)
- Date : 2026-10-11
- **Décision** : Manon crée ses propres comptes gratuits Mailtrap (SMTP sandbox) et Supabase (projet + bucket `adac-documents` de dev). Identifiants uniquement dans le `.env` ignoré par git de `back-readonly` ; `JWT_SECRET` généré localement (`openssl rand -base64 48`). Jamais les services de production (Supabase/Brevo d'ADAC).
- **Pourquoi** : parcours complets testables (codes d'activation dans la boîte Mailtrap, envoi de documents) sans partager de secrets avec Charlotte.
- **Alternatives écartées** : réutiliser les identifiants de Charlotte ; ignorer e-mail et stockage en local.

## Constat — aucun SUPER_ADMIN initial dans le back
- Date : 2026-10-11 (lecture seule de `back-readonly`, branche `dev`)
- Les migrations Flyway V1–V5 ne créent aucun utilisateur (seulement les catégories) ; pas de `CommandLineRunner` ; la documentation ne décrit pas d'amorçage. Il n'y a pas d'inscription publique, et la création de comptes exige déjà d'être SUPER_ADMIN.
- Conséquence : un compte SUPER_ADMIN local doit être inséré à la main (SQL dans le conteneur Postgres) — et en production c'est un point à clarifier avec Charlotte.
- → ajouté à `meeting-points-back.md` (#7) ; décision locale : voir D20.

## D20 — Premier SUPER_ADMIN local : script SQL versionné dans `docs/dev/`
- Date : 2026-10-11
- **Décision** : `docs/dev/seed-local-admin.sql` insère un SUPER_ADMIN **local uniquement** (e-mail fictif, mot de passe BCrypt connu, `is_active = true`), exécuté avec `docker compose exec db psql`. Le script porte un avertissement « jamais en production » ; il sera écrit à la mise en œuvre (la colonne `password_hash` est en BCrypt, schéma dans `V1__init_schema.sql`).
- **Pourquoi** : reproductible et sans toucher au dépôt du back.
- **Alternatives écartées** : insertion manuelle non versionnée ; attendre un seed côté back.

## D21 — Notifications : sondage 45 s, en pause onglet masqué, rechargement au focus
- Date : 2026-10-11
- **Décision** : `GET /notifications/unread` toutes les 45 s (`refetchInterval`), `refetchIntervalInBackground: false`, `refetchOnWindowFocus: true` ; invalidation après envoi/lecture d'un message et après `read` / `read-all` / suppression. La cloche affiche `count` (vrai total, liste plafonnée à 50). Navigation : `entityType MESSAGE` → fil de l'utilisateur `entityId` ; `FORMATION` → page de la formation. `content` rendu en texte (constitution §4).
- **Pourquoi** : charge faible pour < 300 utilisateurs, badge à jour sans WebSocket (inexistant côté back).
- **Alternatives écartées** : sondage 30 s permanent ; 60 s + rechargement à la navigation.

## D22 — Messagerie : boîte à deux volets, lecture à l'affichage, fil ouvert sondé
- Date : 2026-10-11
- **Décision** : volet gauche = conversations (`GET /messages` : `lastMessage`, `unreadCount`) ; volet droit = fil (`GET /messages/{userId}`, ancien → récent). Ouvrir un fil marque ses messages entrants non lus comme lus (un `PATCH /messages/{id}/read` par message, en parallèle) ; fil ouvert rechargé toutes les 45 s (D21) ; nouveau message via sélecteur de destinataire limité selon le rôle (403/404 du back gérés, D12). Envoi groupé (TICKET-032) : aperçu `GET /messages/group/preview` avant envoi, filtres FORMATION / MISSING_DOCS / MANUAL selon le rôle.
- **Pourquoi** : reflète le modèle du back (fil = paire d'utilisateurs, lecture par message, sans temps réel).
- **Alternatives écartées** : liste + page de fil séparées ; mise en page adaptative deux volets / une page.
- **Point à trancher plus tard** : affichage sur petit écran (le volet unique s'impose en dessous d'un seuil) — `[NEEDS CLARIFICATION]`. Risque : fil sans pagination (peut grossir).

## D23 — Documents : validation côté client, téléchargement en blob, progression et erreurs claires
- Date : 2026-10-11
- **Décision** : pré-contrôle du type (pdf/jpg/jpeg/png/docx) et de la taille (≤ 10 Mo) pour un retour immédiat (D13) ; zone glisser-déposer avec progression d'envoi ; envoi multipart avec exactement un de `formationId` / `inscriptionId` selon le rôle ; téléchargement via `GET /documents/{id}/download` en blob (axios + URL d'objet, nom = `fileName`), **jamais** via `fileUrl` ; 400 (type/taille) et 502 (stockage) affichés en ligne ; suppression avec confirmation, visible selon rôle et propriétaire (SA : tout ; ADMIN : ses dépôts ; STAGIAIRE : jamais).
- **Pourquoi** : l'endpoint de téléchargement dépend du cookie et la vérification réelle est côté back (octets magiques).
- **Alternatives écartées** : champ fichier natif minimal ; ouverture dans un nouvel onglet via l'URL.

## D24 — Rôles d'équipe : Manon = Product Owner + facilitatrice ; Charlotte = référente technique
- Date : 2026-10-11
- **Décision** : Manon est Product Owner et facilite les points d'équipe ; Charlotte est référente technique (back, BD, déploiement). ADAC (Nathalie Bouvier, Laurie Balp) reste cliente et valide les flux et contenus. Pas de Scrum Master distinct.
- **Pourquoi** : équipe de deux bénévoles ; le plan de projet doit refléter qui décide réellement.
- **Alternatives écartées** : PO = Nathalie Bouvier sans Scrum Master ; rôles et dates fournis plus tard.
- **À confirmer avec Charlotte** (`meeting-points-back.md` #8) : elle n'a pas validé ce partage.

## D25 — Pas de date cible : on travaille par priorité
- Date : 2026-10-11
- **Décision** : aucune date fixe pour l'instant ; l'ordre de travail suit la ligne de coupe MoSCoW (D6). Les jalons et le cronograma restent `[NEEDS CLARIFICATION]` tant que la disponibilité hebdomadaire de Manon et la cible de mise en ligne d'ADAC ne sont pas connues.
- **Pourquoi** : projet bénévole, disponibilité non connue.
- **Alternatives écartées** : Must en 3 semaines ; front complet en 6 semaines.
- **À faire** : demander à ADAC une cible de mise en production (`meeting-points-back.md` #9).

## D26 — Pas de GitHub Actions côté front : script local `npm run check`
- **SUPERSÉE le 2026-10-31** par la révision de D5 : `.github/workflows/ci.yml` existe (lint + build [+ tests] + image ghcr). `npm run check` reste le garde-fou local avant commit.
- Date : 2026-10-11
- **Décision** : un script `npm run check` enchaîne lint + tests + build ; à lancer avant chaque commit. Aucun workflow `.github/` créé dans le front pour l'instant.
- **Pourquoi** : zéro impact sur l'organisation ; Charlotte porte déjà le CI/CD (D5).
- **Alternatives écartées** : `ci.yml` local prêt à pousser ; laisser le CI à Charlotte.
- **Risque accepté** : pas de barrière automatique à la fusion ; le bug de casse `Layout/layout` ne serait attrapé que sous Linux (corriger à la main, une vérification de casse peut s'ajouter au script).

## D27 — Flux Git du front : miroir du back (`feature/*` depuis `dev`, PR vers `dev`)
- **MODIFIÉE le 2026-10-31 (D43)** : une branche **par thème** comme le back (`feature/auth`…), une seule PR vers `dev` au dernier ticket de la branche — et non plus une branche par ticket.
- Date : 2026-10-11
- **Décision** : `main` ← `dev` ← `feature/ticket-NNN-<slug>` (ex. `feature/ticket-016-login`), une branche par ticket, PR vers `dev` quand Manon décide de pousser ; Conventional Commits en anglais (`feat(auth): …`).
- **Articulation avec D3** : `dev` est un ancêtre de `categorie` (avance rapide possible). Au démarrage, **localement uniquement**, avancer `dev` jusqu'à `categorie` (`git branch -f` / fast-forward, sans push), puis créer les branches `feature/*` depuis ce `dev` local. Rien n'est poussé sans demande explicite.
- **Pourquoi** : même flux que Charlotte, relecture et retour arrière faciles.
- **Alternatives écartées** : tronc simple vers `main` ; une longue branche unique.

## D28 — Responsive : desktop d'abord, utilisable sur tablette
- **MODIFIÉE le 2026-10-31 (D42)** : desktop d'abord, mais **responsive** avec une bonne UX tablette **et mobile** (plus de « téléphone = empilement de base »).
- Date : 2026-10-11
- **Décision** : conception pour le poste de travail (chargée de formation) ; utilisable sur tablette (≥ 768 px) ; téléphone = empilement de base sans optimisation poussée. La messagerie passe à un seul volet sous un seuil (liste → fil) pour rester lisible. Pas de test visuel multi-tailles obligatoire.
- **Pourquoi** : usage principal supposé = bureau ; choix de Manon. Les besoins mobiles réels des stagiaires ne sont pas confirmés.
- **Alternatives écartées** : mobile d'abord (≥ 360 px) ; attendre la réponse d'ADAC.
- **À vérifier avec ADAC** : comment les stagiaires se connectent (`meeting-points-back.md` #10) ; si majoritairement mobile, D28 est à revoir (risque d'écart avec WCAG 1.4.10 « reflow »).

## D29 — Projet secondaire : plus de jalons ni de cronograma ; tableau GitHub Project créé
- Date : 2026-10-11
- **Décision** : le front est un projet secondaire — **jalons, cronograma et horaire type du plan sont supprimés** (D25 clos). Go explicite de Manon donné : le tableau **« ADAC Portail — Front »** a été créé dans l'organisation (privé) : https://github.com/orgs/ADAC-Formation/projects/1.
- **Contenu** : colonnes Status Backlog / Ready / In progress / In review / Done (WIP conseillé : 2 en cours) ; champs `Priorité` (Must/Should/Could), `Ticket`, `Estimation (h)` ; 17 cartes **brouillons** (aucune issue créée dans les dépôts), TICKET-008 en Ready, les autres en Backlog.
- **Effets de bord limités** : projet privé de l'organisation seulement ; aucun lien vers un dépôt, aucune issue/PR, aucun changement dans `back`. Charlotte (membre de l'organisation) peut le voir selon les droits de l'organisation.
- **Alternatives écartées** : tableau local dans `docs/`.

## D30 — Definition of Done d'un ticket front
- Date : 2026-10-11
- **Décision** : une carte passe à Done quand : (1) `npm run check` est vert (lint + tests + build) ; (2) les tests du ticket existent, avec au moins un contrôle `jest-axe` par page ; (3) le parcours a été essayé à la main contre le vrai back local (D16) ; (4) toute décision ou écart de contrat est écrit dans `docs/` ; (5) le code est relu (auto-relecture ou `/code-review`) avant fusion dans `dev` ; (6) la carte du tableau est déplacée.
- **Pourquoi** : reflète D4, D15, D26 ; le passage manuel contre le vrai back attrape les écarts de contrat que MSW ne voit pas.
- **Alternatives écartées** : check + tests seulement ; check seulement.

## D31 — Vie privée côté front : empreinte minimale + page de confidentialité
- Date : 2026-10-11
- **Décision** : aucune donnée personnelle dans `localStorage` / `sessionStorage` (uniquement les préférences d'affichage : thème, taille de texte, contraste) ; aucun outil d'analyse ni traceur ; polices **auto-hébergées** (Syne, Plus Jakarta Sans) à la place de Google Fonts, qui expose l'adresse IP des visiteurs à un tiers (aujourd'hui `index.html` charge Syne depuis Google) ; aucune donnée personnelle dans la console ; une page statique « Confidentialité » dont le texte doit être fourni par ADAC `[NEEDS CLARIFICATION: texte de la page, durée de conservation confirmée]`.
- **Pourquoi** : public associatif, données de stagiaires ; limite le risque RGPD côté navigateur sans dépendre du back.
- **Alternatives écartées** : garder Google Fonts ; tout laisser au back et à ADAC.
- Conséquence : `UserProvider` ne doit plus écrire `userData` en localStorage (cohérent avec D1).

## D32 — Organisation du code : dossiers par fonctionnalité + composants partagés conservés
- Date : 2026-10-11
- **Décision** : `src/features/{auth,formations,categories,accounts,documents,messages,notifications,profile}/` contenant chacun hooks d'API (TanStack Query), composants, pages et tests ; les composants partagés restent dans `src/components/{atoms,molecules,organisms}` ; le dossier `Pages/Stagiaire/` et ses coques de 120–135 octets sont supprimés. Migration progressive, au fil des tickets (pas de refonte globale préalable).
- **Pourquoi** : un hook par ressource (D8) et des pages indépendantes du rôle (D9) s'accommodent mal d'un dossier `Pages/Stagiaire/`.
- **Alternatives écartées** : Atomic Design seul avec `Pages/` aplati ; décider au fil des tickets sans structure.
- Cohérence : `CLAUDE.md` à mettre à jour quand le premier dossier `features/` existe.

## D33 — Libellés de rôles : « Chargée de formation » / « Formateur » / « Stagiaire »
- Date : 2026-10-11
- **Décision** : `SUPER_ADMIN` s'affiche « Chargée de formation » (vocabulaire d'ADAC), `ADMIN` « Formateur », `STAGIAIRE` « Stagiaire » ; « Administrateur » disparaît de l'interface. Une table unique `roleLabels` (dans `utils/roles.js`) porte libellés, icônes et page d'accueil ; les identifiants restent ceux de l'API (D1).
- **Pourquoi** : ADMIN (formateur) et « Administrateur » prêtent à confusion ; le PRD du back nomme le SUPER_ADMIN « Chargée de Formation ».
- **Alternatives écartées** : garder « Administrateur » ; attendre ADAC.
- Variante inclusive « Chargé(e) de formation » possible si ADAC la préfère (même table).

## D34 — Changements de contrat du back : veille côté front + message de Charlotte
- Date : 2026-10-11
- **Décision** : avant chaque session de travail, mettre à jour `back-readonly` (`git fetch`/`pull`, lecture seule) et comparer `docs/tech.md` (et les DTO) avec la version précédente ; Charlotte prévient aussi Manon par message pour tout changement cassant. Un instantané daté du contrat est conservé dans `docs/api-contract-snapshot.md` (à créer) pour comparer.
- **Pourquoi** : aucun outil à installer dans l'organisation, et ça fonctionne même si elle oublie de prévenir.
- **Alternatives écartées** : issue GitHub étiquetée « contract » dans `front` ; discussion en réunion uniquement.

## D35 — Protection de branches : pas pour l'instant (risque accepté)
- Date : 2026-10-11
- **Décision** : aucune protection de branche sur `ADAC-Formation/front` ; on s'appuie sur la discipline (D27 : travail en `feature/*`, PR vers `dev`, jamais de commit direct sur `main`/`dev`). Aucun changement dans l'organisation.
- **Pourquoi** : projet secondaire à deux personnes, travail local tant que Manon ne pousse pas.
- **Alternatives écartées** : protéger `main` seule ; protéger `main` et `dev` comme le back.
- **À revoir** si un mauvais push se produit, ou quand Charlotte déploie depuis `main`.

## D36 — Plan §1.2 : « Objectif de livraison » (MoSCoW) à la place du « niveau cible »
- Date : 2026-10-11
- **Décision** : la section remplace le niveau d'enseignement (inexistant ici) par l'objectif réel : **Must** = portail utilisable (connexion, activation, mot de passe oublié, tableau de bord, formations) ; **Should** = les échanges au cœur du besoin d'ADAC (comptes, création/import, documents, messagerie, notifications) ; **Could** = finitions (messagerie groupée, profil, bascule e-mail, catégories). Règle de séquencement : authentification d'abord, puis par dépendance (D6).
- **Pourquoi** : le plan reflète un vrai projet, sans reste de la plantille scolaire.
- **Alternatives écartées** : supprimer la section ; la garder « sans objet ».

## D37 — Plan §1.3 et §8 : besoins exprimés par ADAC → tickets, livrables réels
- Date : 2026-10-11
- **Décision** : §1.3 devient le tableau « Besoin exprimé par ADAC (compte rendu du 06/07/2026) → ticket(s) → statut » ; §8 liste les vrais livrables (front fonctionnel contre l'API `dev`, `docs/`, et ce que Charlotte déploie).
- **Pourquoi** : traçabilité besoin → ticket, sans vocabulaire scolaire.
- **Alternatives écartées** : garder la plantille avec ses espaces réservés ; supprimer les deux sections.

## D38 — Plan §5.5–5.6 et §12 allégés ; rétrospective via `/retro`
- Date : 2026-10-11
- **Décision** : §5.5–5.6 réduits à l'essentiel (Manon tient le tableau, Charlotte le back/l'infra, pas de tableaux d'activités par personne) ; §12 renvoie à la compétence `/retro` et au dossier `~/Desktop/Retro/` après chaque bloc de travail, au lieu d'un modèle de rétro de sprint.
- **Pourquoi** : équipe de deux, projet secondaire ; moins de documents à maintenir, lien conservé avec la pratique de rétro de Manon.
- **Alternatives écartées** : garder les sections complètes ; supprimer §5.5–5.6 et §12.

## D39 — Critères d'acceptation : rédigés au démarrage de chaque ticket
- Date : 2026-10-11
- **Décision** : au début d'un ticket, lire l'histoire correspondante (`STORIES.md`) et `tech.md`, puis écrire ses critères (cas nominal + codes d'erreur) dans `docs/spec.md` ; Manon les valide ; les tests en découlent (D4). Les critères des 4 tickets déjà détaillés dans le plan (016, 017, 018, 024) restent tels quels.
- **Pourquoi** : évite des critères périmés pour des tickets lointains, le back pouvant encore évoluer.
- **Alternatives écartées** : tout rédiger maintenant ; renvoyer vers `STORIES.md` sans copie.

## D40 — En cas de conflit entre documents du back, `tech.md` l'emporte
- Date : 2026-10-31
- **Décision** : `tech.md` est le contrat (« source de vérité entre le front et le back »). Quand `TICKETS`, `STORIES`, `USERFLOW`, `PRD` ou les fiches de tickets le contredisent, le front suit `tech.md`. Les conflits sont listés dans `points-pour-charlotte.md` §4, avec une colonne « Décision » que Manon tranche.
- **Pourquoi** : Charlotte indique que `tech.md` est le seul fichier que Manon doit lire ; les autres documents ont des écarts (14 relevés).
- **Alternatives écartées** : suivre les tickets ; trancher au cas par cas sans règle.

## D41 — Le design est une décision du front, documentée dans `design-front.md`
- Date : 2026-10-31
- **Décision** : on garde tout le design existant. `docs/design-front.md` (structure de `DESIGN.md`) décrit le design réellement implémenté et est partagé avec Charlotte. Précise D2.
- **Pourquoi** : le front possède les décisions de design ; le document évite que `DESIGN.md` du back soit pris pour la référence.
- **Alternatives écartées** : adopter `DESIGN.md` (Manrope, rayons 24/12/6).
- **Conséquence** : corriger les écarts listés dans `design-front.md` (CSS de `text-large` / `high-contrast`, variable `--color-accent`, polices auto-hébergées).

## D42 — Responsive : desktop d'abord, bonne UX tablette et mobile
- Date : 2026-10-31
- **Décision** : conception desktop d'abord, mais l'application est responsive avec une bonne UI/UX sur tablette (640–1023 px) et mobile (≤ 639 px) : cibles tactiles ≥ 44 px, messagerie à un volet sur petit écran, contenu sans défilement horizontal (WCAG 1.4.10).
- **Pourquoi** : le PRD demande « responsive » ; les appareils réels des stagiaires ne sont pas confirmés (`meeting-points-back.md` #10).
- **Alternatives écartées** : desktop seul + empilement de base (D28 d'origine).

## D43 — Git : une branche par thème, une seule PR au dernier ticket
- Date : 2026-10-31
- **Décision** : branches comme le back : `feature/setup`, `feature/auth`, `feature/users`, `feature/categories`, `feature/formations`, `feature/documents`, `feature/messagerie`, `feature/notifications`, `feature/dashboard` ; un commit par ticket ; une PR vers `dev` au dernier ticket de la branche. Toujours en local tant que Manon ne demande pas de push (D3). Modifie D27.
- **Pourquoi** : même flux que Charlotte (tickets du back).
- **Alternatives écartées** : `feature/ticket-NNN-slug` (D27 d'origine).

## D44 — Documentation du front entièrement en français
- Date : 2026-10-31
- **Décision** : tous les documents du front sont en français (`AGENTS.md` du back) ; commits, code et identifiants en anglais. `plan-de-proyecto.md` est traduit (le nom du fichier est conservé).
- **Pourquoi** : cohérence avec le back et avec ADAC.

## D45 — Image Docker : tags sémantiques et `curl`
- Date : 2026-10-31
- **Décision** : le CI pousse `X.Y.Z`, `X.Y` et `latest` sur un tag git `vX.Y.Z`, et `main` / `dev` + SHA sur push de branche (jamais uniquement `latest`, `INFRASTRUCTURE.md` §16). L'image installe `curl` pour le healthcheck du compose (§7). À confirmer avec Charlotte : `points-pour-charlotte.md` §2.2.

## D46 — Formateur : toutes les formations en lecture seule, « Mes formations » par défaut
- Date : 2026-10-31
- **Décision** : le front implémente ce comportement (PRD, USERFLOW, TICKET-024). `tech.md` prévoit « ADMIN = ses formations seulement » : **D46 l'emporte sur `tech.md` sur ce point** (exception à D40, décidée par Manon le 2026-10-31). Le front n'applique pas la restriction de `tech.md` ; la demande de changement correspondante reste adressée à Charlotte (`points-pour-charlotte.md` Q3) pour aligner le back.
- **Conséquence** : tant que le back n'est pas aligné, un ADMIN peut recevoir 404 sur une formation qui n'est pas la sienne ; le front doit gérer ce cas proprement (message clair, pas de plantage).

## D47 — Tableau de bord : Gestion / Messages / Notifications / Profil, puis Formations / Formateurs / Stagiaires
- Date : 2026-10-31
- **Décision** : niveau 1 commun à tous les rôles (le stagiaire voit « Mes formations » à la place de « Gestion ») ; sous « Gestion » : Formations, Formateurs, Stagiaires (+ Catégories pour la chargée de formation). Proposition à Charlotte pour corriger TICKET-043 (`points-pour-charlotte.md` Q4). Précise D9.

## D48 — Pré-contrôle des fichiers côté client : valeurs de TICKET-027
- Date : 2026-10-31
- **Décision** : types pdf, jpg/jpeg, png, docx ; taille ≤ 10 Mo ; le back reste l'autorité (erreurs 400 affichées). Liste exacte à confirmer avec Charlotte (Q5).

## D49 — SDD et tickets propres au front, comparés ensuite aux tickets de Charlotte
- Date : 2026-10-31
- **Décision** : le front écrit sa propre spec et ses propres tickets (y compris ce que les tickets du back n'ont pas : inscrire un stagiaire, modifier un utilisateur, document ciblé), puis les compare aux tickets 008–049 pour documenter les écarts.

## D50 — Documents partagés avec Charlotte
- Date : 2026-10-31
- **Décision** : `design-front.md` et `points-pour-charlotte.md` sont les deux documents à lui transmettre. `meeting-points-back.md` reste la liste vivante des points hors de ces documents.


## D51 — Fondations : erreurs API, 401 injecté et pile de tests
- Date : 2026-10-31
- **Décision** : (1) le client axios normalise toute erreur en `ApiError {status, message, details, isNetworkError}` (D12) ; (2) le 401 n'est pas géré par navigation dans le client : un handler est injecté via `setUnauthorizedHandler`, enregistré plus tard par le `UserProvider`/routeur (navigation SPA sans rechargement) ; `POST /auth/login` et `GET /auth/me` en sont exemptés ; (3) la lecture de `localStorage` dans l'ancien `UserProvider` est supprimée (contraire à D31, composant non monté) ; (4) en test, jsdom tourne sur l'origine `http://localhost:8080` (même origine que l'API de test) car jsdom applique CORS aux requêtes avec cookies ; (5) pas de retry TanStack Query sur 401/403/404, un seul sinon.
- **Pourquoi** : le client reste testable sans routeur ni dépendance circulaire ; les tests MSW restent fidèles au contrat de `tech.md`.
- **Alternatives écartées** : `window.location.href = '/login'` (rechargement dur, interdit par D12) ; erreurs axios brutes normalisées dans chaque hook.
- Change OpenSpec : `setup-front-foundations`.

## D52 — Authentification : session = requête `GET /auth/me`, gardes et bandeaux sans stockage
- Date : 2026-10-31
- **Décision** : (1) l'utilisateur courant est la requête TanStack Query `['auth','me']` (un 401 vaut « visiteur », pas une erreur) ; il n'y a **pas** de contexte React parallèle, `UserProvider` ne fait qu'enregistrer le handler 401 de D51 (session terminée → `/login` avec la notice « session expirée ») et doit vivre sous le routeur (`router/Root.jsx`) ; (2) à la déconnexion ou sur 401, le cache est vidé sauf la requête de session (`endSession`), pour qu'un utilisateur ne voie jamais les données du précédent ; (3) gardes `RequireAuth` / `RequireRole` / `PublicOnly` en routes de mise en page ; un rôle insuffisant affiche « Accès refusé » (pas de redirection) ; sur une erreur de `/auth/me` autre que 401 on affiche « Réessayer » plutôt que de rediriger (évite une boucle) ; (4) les bandeaux « Compte activé », « Mot de passe mis à jour » et « session expirée » passent par `location.state` : rien dans le stockage du navigateur (D31) ; (5) routes : `/admin`, `/formateur`, `/stagiaire` supprimées au profit de `/` ; `/admin/*` pour SUPER_ADMIN + ADMIN, création de formation et catégories pour SUPER_ADMIN seul (hypothèse : la liste des formations reste ouverte à tout rôle connecté, D46) ; le renommage en `/gestion/*` reste pour TICKET-043 ; (6) le champ de connexion est l'**e-mail** (`tech.md` l'emporte sur le plan qui disait « identifiant », D40) et le bouton de la coque reste « SE CONNECTER » (US-001 AC-01 dit « Commencer la session ») ; (7) `LoginPage` n'a plus de `<main>` propre (le Layout en fournit un) et un `<h1>` « Connexion » ; (8) `RoleSwitcher`, `dev-role`, le faux `isAuthenticated`/`toggleAuth`, `ProtectedRoute`, `routeManager` et l'ancien `UserProvider` sont supprimés ; `main.jsx` efface l'ancienne clé `dev-role`.
- **Pourquoi** : une seule source de vérité pour le rôle (D1, D9, D10), aucun état d'authentification côté navigateur (D31), parcours testables avec MSW (D4).
- **Alternatives écartées** : contexte React dupliquant la requête ; `sessionStorage` pour les bandeaux ; redirection vers `/login` sur un 403.
- Change OpenSpec : `auth-real-backend`. Critères des tickets : `docs/spec.md`.

## D53 — Surcharge de dev du back versionnée dans le front (précise D18)
- Date : 2026-10-31
- **Décision** : `docs/dev/` contient `docker-compose.dev.yml` (profil `dev`, port 8080 publié, service `frontend` désactivé), `seed-local-admin.sql` (4 comptes fictifs, mot de passe de dev) et `README.md` (commandes). Seul le `.env` (secrets) reste hors des deux dépôts, dans `ADAC/dev-compose/.env`. Les comptes de test : `chargee.dev@adac.test` (SUPER_ADMIN), `formateur.dev@adac.test` (ADMIN), `stagiaire.dev@adac.test`, `inactif.dev@adac.test` (non activé), mot de passe `DevAdmin2026` — local uniquement.
- **Pourquoi** : la surcharge est reproductible et ne se perd pas ; `back-readonly` n'est jamais modifié (`git status` propre) et son compose, orienté production, n'a pas de parcours « développeuse front ».
- **Alternatives écartées** : tout hors dépôt (fragile) ; modifier le compose de Charlotte.

## D54 — Comptes : le formateur consulte en lecture seule, périmètre de `feature/users`
- Date : 2026-10-31
- **Décision** : (1) SUPER_ADMIN crée, modifie (`PUT`), suspend et réactive ; ADMIN consulte listes (comptes actifs renvoyés par le back) et détails sans aucune action — `tech.md` l'autorise en lecture, le ticket 021 ne le prévoyait pas ; (2) suspendre / réactiver suivent `tech.md` (`PATCH /users/{id}/deactivate|reactivate`), pas le ticket 021 (`PATCH /users/{id}` avec `isActive`), D40 ; (3) chemins conservés : `/admin/formateurs[/nouveau|/:id]`, `/admin/stagiaires[/nouveau|/:id]` (le renommage `/gestion/*` reste à TICKET-043) ; (4) le filtre « Suspendus » est côté client (l'API n'a que `?active=true`) ; (5) la création de stagiaire envoie `formationIds: []` ; (6) reportés : colonne formations et choix de formations (`feature/formations`), « Envoyer un message » (`feature/messagerie`), profil / `PATCH /users/me`, import Excel (D14).
- **Pourquoi** : livrer les comptes sans dépendre de fonctionnalités pas encore construites, en gardant `tech.md` comme contrat.
- **Alternatives écartées** : comptes réservés au SUPER_ADMIN (écart avec `tech.md`) ; pages dupliquées par rôle (une page paramétrée suffit).
- Change OpenSpec : `users-account-management`.
