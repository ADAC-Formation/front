# Portail de Formation ADAC · Plan de projet (Frontend)

**Version 1 (brouillon)** · mise à jour le 31/10/2026 · **Projet** : portail web de gestion de formations (front-end) · **Client** : ADAC (association de formation en travail social et santé mentale)

> Brouillon établi à partir de la lecture de `ADAC-Formation/front`, de `ADAC-Formation/back` (branche `dev`, lecture seule) et du compte rendu de la réunion du 06/07/2026. Tout ce qui ne figure pas dans les sources est marqué `[NEEDS CLARIFICATION]` : rien n'est inventé. Document rédigé en français (D44) ; le plan est tenu à jour par Manon (front). Le nom du fichier est conservé (`plan-de-proyecto.md`).

| Champ | Valeur |
|---|---|
| Commande | ADAC demande un portail qui remplace les échanges individuels par e-mail (documents, messages, convocations) et garantit la traçabilité Qualiopi. Projet bénévole, sans contrat de maintenance. |
| Produit | SPA React (ce repo) qui consomme l'API REST Spring Boot du repo `back`. |
| Phase actuelle | Projet secondaire sans sprints ni dates (D25/D29) ; travail par priorité MoSCoW. |
| Jalons | Aucun fixé (D29) |
| Phase suivante | Non définie |
| Équipe | Manon Godfroy (front, `ManonChab`) · Marie-Charlotte Doulcet (back, BD, déploiement ; `Charlottedoulcet`) · Nathalie Bouvier (ADAC, cliente) · Laurie Balp (ADAC, besoins des formateurs) |
| Scrum Master | Pas de SM (D24) |
| Product Owner | Manon Godfroy (D24) |
| Équipe de développement | Manon (front) · Charlotte (back/infra). Back-end pratiquement terminé ; front-end presque entièrement à faire. |
| Dépôts | Back : https://github.com/ADAC-Formation/back (lecture seule pour Manon) · Front : https://github.com/ADAC-Formation/front |
| Organisation GitHub | ADAC-Formation (personnelle/bénévole ; 2 membres, plan gratuit) |
| Tableau Kanban | ADAC Portail — Front · https://github.com/orgs/ADAC-Formation/projects/1 (créé le 11/10/2026, privé, 17 cartes brouillon ; D29) |
| Méthodologie | Kanban léger (projet secondaire) dans un GitHub Project ; tickets hérités de `back/docs/TICKETS.md`, complétés par un SDD et des tickets propres au front (D49) ; WIP 2 (D29, D7). |

## 0. Changements par rapport à la version précédente

Version 1 (11/10/2026) puis révision du 31/10/2026 :
- Traduction intégrale en français (D44).
- D5 révisée : Dockerfile, `.dockerignore`, CI et `.env.example` vivent dans le repo front, selon la spec de Charlotte (`INFRASTRUCTURE.md` §4) ; tags d'image sémantiques (D45).
- Flux Git : une branche par thème, une seule PR au dernier ticket (D43).
- Responsive : bureau d'abord, bonne UX tablette et mobile (D42).
- Design : décision du front, documentée dans `design-front.md` (D41).
- Règle : en cas de conflit, `tech.md` l'emporte (D40).

## 1. Périmètre du projet

### 1.1 Contexte et description du système

ADAC propose des formations en travail social et santé mentale (≈130 stagiaires/an, < 100 utilisateurs au lancement, < 300 à 6–12 mois). Elle travaille aujourd'hui avec un NAS pour le stockage, un serveur OVH (messagerie et web), des agendas partagés, du publipostage Word/Excel et des outils Qualiopi. Elle demande : publier des formations avec des documents, une messagerie individuelle ou par critères, des notifications, une UX simple, une connexion avec des comptes créés par l'administrateur, et la traçabilité Qualiopi.

Le portail remplace les échanges individuels par e-mail par un système centralisé qui couvre :

| Module | Ce qu'il résout |
|---|---|
| Authentification | Connexion, activation de compte par code (6 chiffres, 30 min), réinitialisation du mot de passe |
| Comptes | Création, édition et suspension des formateurs et stagiaires (SUPER_ADMIN) |
| Catégories | Classement des formations (CRUD, activation/désactivation) |
| Formations | CRUD, archivage, import Excel, inscriptions |
| Documents | Dépôt/téléchargement par formation ou par inscription (PDF, JPG, PNG, DOCX, ≤ 10 Mo) |
| Messagerie | Individuelle et groupée (filtres FORMATION, MISSING_DOCS, MANUAL) |
| Notifications | Cloche, page d'historique, bascule e-mail |
| Tableau de bord / profil | 4 tuiles communes à tous les rôles, mot de passe, documents du stagiaire |

**Hors périmètre (V1)** : SSO, auto-inscription, paiement en ligne, signature électronique, calendrier, formulaires intégrés (V2), intégration NAS, WebSocket/SSE (sondage 30–60 s), pagination.

### 1.2 Objectif de livraison

(D36) Projet réel, sans niveaux d'énoncé : l'objectif s'exprime en MoSCoW (§1.5).

| Niveau | Ce qui est livré | Tickets |
|---|---|---|
| Must | Portail utilisable : connexion, activation, mot de passe oublié, tableau de bord, formations | 008, 016, 017, 018, 043, 024 |
| Should | Échanges centraux pour ADAC : comptes, création/import, documents, messagerie, notifications | 021, 025, 027, 028, 031, 035 |
| Could | Finitions : messagerie groupée, profil, bascule e-mail, catégories | 032, 036, 044, 048, 049 |

Règle de séquencement : authentification d'abord ; le reste par dépendance (D6).

### 1.3 Besoins d'ADAC → tickets

Source : compte rendu de la 1ʳᵉ réunion (06/07/2026) et PRD du back (D37). État : tous les tickets front sont « À faire ».

| Besoin exprimé par ADAC | Tickets front | Priorité |
|---|---|---|
| Publier des formations avec détail, les supprimer/archiver | 024, 025, 048, 049 | Must / Should / Could |
| Ajouter des documents à chaque formation | 027 | Should |
| Messages aux stagiaires, individuels ou par critère (formation, documents manquants) | 031, 032 | Should / Could |
| Les stagiaires lisent leurs formations et écrivent à l'admin | 024, 031 | Must / Should |
| Système de notifications (+ alertes par e-mail) | 035, 036 | Should / Could |
| Connexion avec un identifiant donné par ADAC, mot de passe choisi ; comptes créés par l'admin | 016, 017, 018, 021 | Must / Should |
| UX/UI simple et accessible | 043 et transversal (D15) | Must |
| Traçabilité Qualiopi : rien par e-mail individuel | Tout le flux (documents + messagerie) | Should |

Non couvert en V1 (hors périmètre, d'après le PRD du back) : analyse des devis, portail de satisfaction/impact, IA, intégration NAS.

Le front ajoute des tickets que le back ne prévoit pas (inscrire un stagiaire, modifier un utilisateur, dépôt de document ciblé) dans son propre SDD (D49).

### 1.4 Calendrier des jalons

Supprimé (D29) : projet secondaire, sans jalons ni dates fixes. Le travail suit la priorité MoSCoW (§1.5). Jalons passés, à titre de contexte : réunion ADAC 06/07/2026 ; organisation et dépôts 24/08/2026 ; back-end presque complet dans `dev` au 08/09/2026.

### 1.5 Priorisation et ligne de coupe

Proposition (à valider avec `/grill-me-with-docs` ; voir `docs/decisions-*.md`) :

| Priorité | Signification | Tickets front |
|---|---|---|
| Must | Cœur : sans lui, pas de portail | 008 setup, 016 connexion, 017 activation, 018 réinitialisation, 043 tableau de bord, 024 liste/détail des formations |
| Should | Valeur principale pour ADAC | 021 comptes, 025 création + import Excel, 027/028 documents, 031 messagerie, 035 notifications |
| Could | Coupé en premier | 032 messagerie groupée, 036 bascule e-mail, 044 profil, 048 sélecteur de catégorie, 049 gestion des catégories |

**Ordre de coupe** (décide Manon, D24 ; D6) : 1. messagerie groupée → individuelle seulement ; 2. import Excel → création manuelle seulement (les colonnes du fichier Excel sont provisoires, le client n'a pas envoyé le vrai fichier).

## 2. Architecture de déploiement

### 2.1 Schéma

```
 GitHub (front, back) ──CI──► ghcr.io/adac-formation/{front,backend}
                                         │  (CD manuel : SSH + docker compose pull/up, TICKET-041)
 Utilisateurs ─► portail.adac.asso.fr ─► VPS (Hetzner CX22 / Scaleway DEV1-S, ~5-6 €/mois)
                                     ├─ nginx + front (80/443)  ──/api/──► backend:8080
                                     └─ postgres:16 (réseau interne)
 Externes : Supabase Storage (docs) · Brevo (e-mail prod) / Mailtrap (dev) · sauvegardes pg_dump → bucket adac-backups (14 j)
```

État : **rien n'est encore déployé** (TICKET-002 VPS/DNS, 038 TLS, 041 CD en attente — Charlotte).

**Contrat entre les dépôts** : `back/docs/tech.md` (branche `dev`). Le front le consomme en lecture seule ; en cas de conflit avec un autre document du back, `tech.md` l'emporte (D40). Charlotte signale tout changement cassant par message ; Manon surveille `dev` avant chaque session (D34).

### 2.2 Variables d'environnement et secrets

| Variable | Dépôt | Local (`.env`) | CI | Hébergement |
|---|---|---|---|---|
| `VITE_API_URL` | front | `http://localhost:8080/api` | argument de build (`/api`) | argument de build (même origine : `/api`) |

Règles : `.env` dans `.gitignore` ; seul `.env.example`, sans valeurs réelles, est versionné (créé le 31/10/2026 ; le code utilise désormais `VITE_API_URL`). Les variables du back (DB, JWT, SMTP, Supabase, CORS) sont gérées par Charlotte.

### 2.3 Étapes de déploiement

Responsabilité de Charlotte, sauf le front :

#### Hébergement du front

| Champ | Valeur |
|---|---|
| Dépôt | ADAC-Formation/front |
| Image | `ghcr.io/adac-formation/front:${FRONT_IMAGE_TAG:-latest}` ; tags `X.Y.Z`, `X.Y`, `latest` sur tag git `vX.Y.Z`, `main`/`dev` + SHA sur push (D45) |
| Build | `node:20-alpine` → `npm ci && npm run build` → `nginx:alpine` + `curl` (port 80) |
| Variable | `VITE_API_URL` au build |
| nginx | `/api/` → `backend:8080`, repli SPA `try_files $uri /index.html` (config montée depuis le back) |

CORS local : front 5173 ↔ API 8080 (`CORS_ALLOWED_ORIGINS`).

## 3. Modèle de base de données

Propriété du repo **back** (`docs/DB_MODEL.md`, PostgreSQL 16, Flyway V1–V5). Le front ne le modifie pas. 9 tables : `users`, `categories`, `formations`, `inscriptions`, `documents`, `messages`, `message_recipients`, `notifications`, `activation_tokens`. Relations et schéma ER : voir `back-readonly/docs/DB_MODEL.md`/`.mmd`. Point ouvert côté back : politique `ON DELETE` « à trancher ».

## 4. Récits utilisateur (front)

### 4.1 Phase actuelle (sans dates, D29)

Estimations (h) tirées de `TICKETS.md` du back ; points non définis. Tous **À faire**.

| ID | Récit | Priorité | Est. | Resp. | Dépôt |
|---|---|---|---|---|---|
| TICKET-008 | Setup React + Vite + Axios (cookie, `.env.example`, Dockerfile) | Must | 2h | Manon | front |
| TICKET-016 | En tant qu'utilisateur, je veux me connecter | Must | 2h | Manon | front |
| TICKET-017 | En tant que nouvel utilisateur, je veux activer mon compte avec un code | Must | 2h | Manon | front |
| TICKET-018 | En tant qu'utilisateur, je veux récupérer mon mot de passe | Must | 1h | Manon | front |
| TICKET-043 | Tableau de bord à 4 tuiles (tous les rôles) | Must | 2h | Manon | front |
| TICKET-024 | Liste et détail des formations | Must | 2h | Manon | front |
| TICKET-021 | Gestion des comptes (SUPER_ADMIN) | Should | 3h | Manon | front |
| TICKET-025 | Formulaire de création + import Excel | Should | 3h | Manon | front |
| TICKET-027 | Dépôt/téléchargement des documents de formation | Should | 2h | Manon | front |
| TICKET-028 | Dépôt de documents du stagiaire (profil) | Should | 1h | Manon | front |
| TICKET-031 | Interface de messagerie | Should | 3h | Manon | front |
| TICKET-035 | Cloche + page de notifications | Should | 2h | Manon | front |
| TICKET-032 | Messagerie groupée | Could | 2h | Manon | front |
| TICKET-036 | Bascule de notification par e-mail | Could | 1h | Manon | front |
| TICKET-044 | Page de profil (mot de passe + données) — bloqué : pas d'endpoint de changement de mot de passe | Could | 1h | Manon | front |
| TICKET-048 | Sélecteur de catégorie + création à la volée | Could | 2h | Manon | front |
| TICKET-049 | Gestion des catégories | Could | 2h | Manon | front |

**Total** : 17 tickets · ≈ 33 h estimées. Remarque : des maquettes partielles existent déjà (catégories locales, création de formation, liste de formations avec données simulées) → à réconcilier avec TICKET-024/025/048/049. Tickets que le back ne prévoit pas (inscrire un stagiaire, modifier un utilisateur, document ciblé) : à ajouter dans le SDD du front (D49).

### 4.2 Phase suivante

À définir. Entrées prévues : tickets coupés, V2 (formulaires intégrés), dette technique (JWT par e-mail, XSS sur les noms, limitation de débit des dépôts), conservation RGPD (1 an, non confirmée par ADAC).

### 4.3 Répartition

Tout le front est porté par Manon (17 tickets, ≈ 33 h). Back/infra : Charlotte. Client : ADAC.

### 4.4 Critères d'acceptation clés

| Ticket | Critères |
|---|---|
| 016 | OK → 200 + cookie, redirection vers le tableau de bord ; 401 « Identifiants invalides » ; 403 compte non activé ; 429 « Trop de tentatives » (15 min) |
| 017 | Code à 6 chiffres + mot de passe (8–72, 1 majuscule, 1 chiffre) ; 400 « Code invalide ou expiré » ; « Renvoyer un code » (429 après 3/15 min) ; retour à la connexion avec bandeau |
| 018 | `forgot-password` renvoie toujours 200 avec le même message ; réinitialisation = même flux code + nouveau mot de passe |
| 024 | Visibilité par rôle (SA : toutes ; ADMIN : toutes en lecture seule, D46 l'emporte sur `tech.md` ; STAGIAIRE : celles où il est inscrit) ; archivées en lecture seule |

Critères des autres tickets : `back/docs/STORIES.md` + `docs/spec.md`, rédigés au démarrage de chaque ticket (D39).

## 5. Équipe et répartition du travail

### 5.0 Rôles SCRUM

| Rôle | Qui | Responsabilités |
|---|---|---|
| Product Owner | Manon Godfroy (D24) | Priorités du backlog front, validation avec ADAC |
| Scrum Master | Pas de SM distinct (D24) ; Manon facilite | — |
| Équipe de développement | Manon (front), Charlotte (back/infra) | — |
| Client | ADAC (Nathalie Bouvier, Laurie Balp) | Valider les flux et contenus ; envoyer le vrai fichier Excel des formations |

Cérémonies : aucune fixe (D29). Point de synchronisation Manon–Charlotte selon le besoin.

### 5.1 Rôles techniques

| Personne | Rôle | Responsabilités | Livrables |
|---|---|---|---|
| Manon | Front-end | UI, intégration API, tests front, Dockerfile et CI du front | Ce repo |
| Charlotte | Back-end + BD + déploiement | API, migrations, compose/nginx, CD, VPS, TLS, sauvegardes | Repo `back`, infra |

### 5.2 Interfaces entre modules

| Contrat | Défini par | Consommé par | Tant que ce n'est pas prêt… |
|---|---|---|---|
| `docs/tech.md` (API) | Charlotte | Manon | La branche `dev` du back implémente déjà tout ; en local, API via Docker/`mvn spring-boot:run`, ou MSW pour les tests |
| Dockerfile front + image ghcr | Manon, selon la spec de Charlotte (D5 révisée) | Charlotte (compose, nginx, CD) | Dockerfile et CI dans ce repo ; à confirmer avec Charlotte (TICKET-010) |
| Rôles (`SUPER_ADMIN`/`ADMIN`/`STAGIAIRE`) | Charlotte | Manon | Aligner `utils/roles.js` (aujourd'hui ADMIN/FORMATEUR/STAGIAIRE) |
| Design | Manon (D41) | Charlotte (information) | `docs/design-front.md` |

### 5.3 Endpoints par module (résumé ; détail dans `tech.md`)

| Préfixe | Endpoints principaux |
|---|---|
| `/auth` | POST login, logout, activate, resend-activation, forgot-password, reset-password ; GET me |
| `/users` | GET/POST formateurs, stagiaires ; GET/PUT `{id}` ; PATCH me, `{id}/deactivate`, `{id}/reactivate` |
| `/categories` | GET, POST, PUT `{id}`, PATCH activate/deactivate |
| `/formations` | GET, POST, POST import, GET/PUT `{id}`, PATCH archive ; `/{id}/inscriptions` GET/POST/DELETE |
| `/documents` | GET, POST (multipart), GET `{id}/download`, DELETE |
| `/messages` | GET, GET `{conversationId}`, POST send, GET group/preview, PATCH `{id}/read` |
| `/notifications` | GET, GET unread, PATCH `{id}/read`, PATCH read-all, DELETE `{id}` |

### 5.4 Matrice des permissions

| Ressource | SUPER_ADMIN | ADMIN (formateur) | STAGIAIRE |
|---|---|---|---|
| Comptes | CRUD + suspendre | — | — (seulement `PATCH /users/me`) |
| Catégories | CRUD | Lire | Lire |
| Formations | CRUD + archiver + import | Lire toutes en lecture seule (D46, l'emporte sur `tech.md`) | Lire celles où il est inscrit |
| Inscriptions | Gérer | Lire les siennes | — |
| Documents | Tout | Déposer sur ses formations ; supprimer les siens | Déposer sur ses inscriptions |
| Messagerie | Individuelle + groupée (3 filtres) | Individuelle + groupée FORMATION (les siennes) | Individuelle (SA et formateurs) |
| Notifications | Les siennes | Les siennes | Les siennes |

Le front masque ce qui n'est pas permis, mais l'autorité reste le back (403/404).

### 5.5–5.6 Tâches et activités

Allégé (D38) : Manon tient le tableau (https://github.com/orgs/ADAC-Formation/projects/1) et déplace ses cartes au fil de l'eau ; Charlotte porte le back, la BD et l'infrastructure. Pas de tableaux d'activités par personne. Remplacements : aucun prévu (équipe de deux).

## 6. Calendrier jour par jour

Supprimé (D29) : projet secondaire, sans calendrier ni horaire type.

## 7. Configuration GitHub

### 7.1 Structure du repo front (actuelle)

```
ADAC-Formation/front
├── .github/workflows/ci.yml        (lint + build [+ tests] + image ghcr)
├── src/ (api, components/{atoms,molecules,organisms,Pages}, context, router, utils…)
│   └── features/<domaine>/         (nouveau code, D32)
├── docs/                           (plan, spec, décisions, design-front, points-pour-charlotte)
├── Dockerfile · .dockerignore · .env.example
├── CLAUDE.md · README.md
```

### 7.2–7.4 Tableau, labels, jalons

Tableau : https://github.com/orgs/ADAC-Formation/projects/1 (D29). Colonnes Backlog / Ready / In progress / In review / Done ; champs Priorité (Must/Should/Could), Ticket, Estimation (h). Cartes brouillon (aucune issue dans les dépôts). Pas de jalons (projet secondaire). Labels : seulement ceux de GitHub par défaut.

### 7.5 Flux de branches

Flux décidé (D3, D43) : `main` ← `dev` ← `feature/<thème>`, comme le back : `feature/setup`, `feature/auth`, `feature/users`, `feature/categories`, `feature/formations`, `feature/documents`, `feature/messagerie`, `feature/notifications`, `feature/dashboard`. Un commit par ticket ; **une seule PR vers `dev` au dernier ticket de la branche** ; tout reste en local tant que Manon n'autorise pas un push. État distant aujourd'hui : `main` (2 commits), `formation`, `dev`, `categorie` (la plus avancée, base de départ), sans PR.

### 7.6 Conventions de commits et de PR

Conventional Commits en anglais (comme le back) : `feat(scope):`, `fix(scope):`, `docs:`, `test:`, `chore:`, `ci:`. PR vers `dev`, CI au vert.

### 7.7 Protection des branches

Non configurée sur le front (D35, risque accepté) : on s'appuie sur la discipline de branches (D43). À revoir en cas de mauvais push ou quand Charlotte déploiera depuis `main`. Back : CI uniquement sur les PR vers `main`.

## 8. Livrables

| # | Livrable | Responsable | Emplacement |
|---|---|---|---|
| 1 | Front fonctionnel contre l'API `dev` (SPA, `npm run build` → `dist/`) | Manon | repo front |
| 2 | Documentation (`CLAUDE.md`, `docs/` : plan, spec, décisions, design, points pour Charlotte) | Manon | repo front |
| 3 | Dockerfile, CI et image `ghcr.io/adac-formation/front` (D5 révisée) | Manon | repo front |
| 4 | Déploiement sur `portail.adac.asso.fr` (compose, nginx, TLS, CD) | Charlotte | repo back / VPS |

Sans dates (D29).

## 9. Pile technologique

| Couche | Technologie | Pourquoi |
|---|---|---|
| Frontend | React 19 + Vite 8 (JS) | Déjà choisi et utilisé |
| Routage | react-router 8 | Utilisé |
| Styles | CSS Modules + variables globales (oklch), Atomic Design | Utilisé ; design propre au front (D2, D41), décrit dans `design-front.md` |
| Icônes | lucide-react | Utilisé |
| HTTP / données | axios (`withCredentials`) + TanStack Query (D8) | Contrat cookie ; cache et sondage |
| Formulaires | React Hook Form + validateurs écrits à la main (D13) | Aligné sur `STACK.md` |
| Tests | Vitest + Testing Library + MSW + jest-axe | Pas encore installé |
| Lint | ESLint 10 (flat config) | Utilisé |
| Back | Spring Boot, PostgreSQL 16, Flyway, JWT en cookie, Swagger | Charlotte |
| Hébergement | VPS + Docker Compose + nginx + Let's Encrypt | Charlotte |
| Externes | Supabase Storage, Brevo/Mailtrap | Charlotte |
| CI/CD | GitHub Actions : CI du front dans ce repo (lint + build + image) ; CI du back et CD manuel (à faire) : Charlotte | Voir D5, D45 |

## 10. Risques et mitigation

| # | Risque | Prob. | Impact | Mitigation | Resp. |
|---|---|---|---|---|---|
| R1 | `Axiosclient.js` utilisait Bearer/localStorage (contraire au cookie HttpOnly) — **corrigé le 31/10/2026** ; reste l'intercepteur d'erreurs (D12) | Moyenne | Moyen | Intercepteur `ApiError` ; aucun jeton côté JS | Manon |
| R2 | Authentification et routes avec imports cassés et sans garde (`UserProvider`, `ProtectedRoute`) | Haute | Haut | Refaire le contexte + les gardes par rôle | Manon |
| R3 | Rôles du front ≠ rôles du back | Haute | Moyen | Aligner sur `SUPER_ADMIN/ADMIN/STAGIAIRE` | Manon |
| R4 | Import sensible à la casse (`Layout/layout`) casse la CI/Docker Linux — **corrigé le 31/10/2026** | Faible | Moyen | CI sous Linux | Manon |
| R5 | XSS via noms/contenu des notifications | Moyenne | Haut | Rendu en texte, jamais en HTML | Manon |
| R6 | `main` du back obsolète ; contrat réel dans `dev` | Moyenne | Moyen | Toujours lire `dev` ; signaler les changements | Manon/Charlotte |
| R7 | Pas encore de déploiement ni de domaine | Haute | Haut | TICKET-002/038/041 | Charlotte |
| R8 | JWT lié à l'e-mail : changer l'e-mail ferme la session | Moyenne | Faible | Message clair dans l'UI | Manon |
| R9 | Bénévolat sans contrat de maintenance ; peu d'expérience de déploiement en production | Moyenne | Haut | Limiter le périmètre ; un collègue peut déployer (compte rendu) | Manon |
| R10 | Excel d'import avec colonnes provisoires | Moyenne | Moyen | Demander le vrai fichier à ADAC | Manon |
| R11 | Pas de tests dans le front ; le CI échouera tant que `npm run lint` signale 12 erreurs dans l'ancien code | Haute | Moyen | Vitest + MSW ; corriger le lint en rebranchant les pages | Manon |
| R12 | Conservation RGPD (1 an) non confirmée | Moyenne | Moyen | Confirmer avec ADAC | Charlotte/ADAC |
| R13 | Incohérences entre documents du back (14 relevées) | Moyenne | Moyen | `tech.md` l'emporte (D40) ; liste dans `points-pour-charlotte.md` | Manon/Charlotte |
| R14 | Pas d'endpoint de changement de mot de passe (TICKET-044) | Haute | Faible | Question Q1 à Charlotte | Charlotte |

## 11. Definition of Done (DoD)

Définition adoptée (D30) :

**Code**
- [ ] Respecte le contrat `tech.md` (`dev`), authentification par cookie, erreurs 400/401/403/404/409/429 gérées
- [ ] Code en anglais, textes de l'UI en français ; pas de `console.log`

**Qualité**
- [ ] `npm run check` au vert (lint + tests + build)
- [ ] Tests du ticket, avec un contrôle `jest-axe` par page (quand le lanceur sera installé)
- [ ] Accessible (clavier, `aria-*`, mode sombre / contraste élevé) et responsive (bureau, tablette, mobile)

**Documentation**
- [ ] Décision consignée dans `docs/decisions-*.md` si nécessaire ; plan/spec à jour

**Processus**
- [ ] Commit Conventional ; PR vers `dev` au dernier ticket de la branche ; CI au vert ; relecture

**Production**
- [ ] Testé contre l'API réelle en local ; l'image Docker se construit

## 12. Rétrospective

Allégé (D38) : à la clôture de chaque bloc de travail, on exécute `/retro` (compétence personnelle) et le résultat est rangé dans `~/Desktop/Retro/` (hors git). Les actions d'amélioration récurrentes sont proposées pour `CLAUDE.md` uniquement avec la confirmation de Manon.
