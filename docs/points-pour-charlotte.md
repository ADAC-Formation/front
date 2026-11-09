# Points pour Charlotte — décisions du front, impacts sur le back, questions

> Document à partager avec `design-front.md`. Rédigé par Manon le 2026-10-31 après lecture complète du repo `back` (branche `dev`).
> Principe : le front s'aligne sur le back (D1), sauf le design, qui est une décision du front (D41).
> Quand `docs/tech.md` entre en conflit avec un autre document du back, **`tech.md` l'emporte** (D40).

## 1. Décisions prises côté front (pour information)

| # | Décision | Détail |
|---|---|---|
| 1 | **Design propre au front** | Thème conservé (Syne + Plus Jakarta Sans, tokens `oklch`, mode sombre / grand texte / contraste élevé). Décrit dans `design-front.md`, même structure que `DESIGN.md`. Merci de ne pas considérer `DESIGN.md` comme la référence visuelle du front. |
| 2 | **Polices auto-hébergées** | Google Fonts transmet l'adresse IP des visiteurs à un tiers : on s'en passe (RGPD). TICKET-043 (« Manrope via Google Fonts ») n'est donc pas suivi sur ce point. |
| 3 | **Responsive** | Desktop d'abord, mais responsive avec une bonne UX tablette et mobile (le PRD demande « responsive »). |
| 4 | **Git** | Même flux que le back : une branche par thème (`feature/setup`, `feature/auth`, `feature/users`…), une seule PR vers `dev` au dernier ticket de la branche, Conventional Commits en anglais. Aucun push sans décision de Manon. |
| 5 | **Structure du code** | `src/features/<domaine>/` + composants partagés en Atomic Design (`ARCHI.md` : « structure gérée par elle »). Les chemins des tickets (`pages/`, `services/`, `context/`) ne sont donc pas suivis à la lettre. |
| 6 | **Dockerfile + CI dans le repo front** | Suivant `INFRASTRUCTURE.md` §4 : `Dockerfile` (node:20-alpine → nginx:alpine), `.dockerignore`, `.github/workflows/ci.yml`, `.env.example`. Charlotte garde compose, nginx, TLS, CD. |
| 7 | **Documentation en français** | Conformément à `AGENTS.md` ; commits en anglais. |
| 8 | **Tickets et SDD propres au front** | Le front écrit sa propre spec et ses propres tickets (SDD), puis les compare aux tickets 008–049 de Charlotte pour signaler les écarts. |
| 9 | **Pré-contrôle des fichiers côté client** | pdf, jpg, png, docx, 10 Mo max (valeurs de TICKET-027) ; le back reste l'autorité. |

## 2. Impacts sur les documents de Charlotte

### 2.1 `STACK.md` — versions et ajouts réellement utilisés par le front

| Ligne | Aujourd'hui | Réel / prévu |
|---|---|---|
| Framework | React + Vite 5 | React 19 + Vite 8 |
| Routing | React Router v6 | react-router 8 (`createBrowserRouter`) |
| UI | non définie | CSS Modules + tokens CSS, lucide-react (Atomic Design) |
| Formulaires | React Hook Form (probable) | React Hook Form confirmé |
| Données | — | **TanStack Query** + axios (cache, sondage des notifications) |
| Tests | Vitest + Testing Library + MSW | idem + **jest-axe** (accessibilité) |

→ Mettre à jour `STACK.md` si tu le souhaites (pas urgent).

### 2.2 `INFRASTRUCTURE.md`

- **Contradiction interne** : §4 (L57–58) dit que le compose « pull l'image construite par le CI **de ce repo** », alors que §4 (L66), §28 et §30 disent que **le CI du repo front** build et pousse `ghcr.io/adac-formation/front`. Le front applique la 2ᵉ lecture. **À confirmer** (TICKET-010).
- **Tags** (§16) : le CI front pousse `X.Y.Z`, `X.Y` et `latest` sur un tag git `vX.Y.Z`, et `main` / `dev` + SHA sur push de branche. Valeur par défaut du compose : `FRONT_IMAGE_TAG` (aujourd'hui `latest`) → en prod, utiliser un tag versionné.
- **Healthcheck front** (§7 : `curl -f http://localhost/`) : `curl` est installé dans l'image front (absent de `nginx:alpine`).
- **Droits ghcr** : le push d'image demande que les Actions du repo front aient le droit `packages: write` (réglage d'organisation).
- **Cache après déploiement** (change `route-code-splitting`, D59) : le front est désormais découpé en une trentaine de fichiers `assets/*-<hash>.js`. Recommandation (information, rien à faire côté front) : servir `index.html` **sans cache long** (`Cache-Control: no-cache`) et `assets/*` (noms hachés) avec un cache long (`max-age=31536000, immutable`). Sinon, un onglet resté ouvert pendant un déploiement demande des fichiers qui n'existent plus : le front affiche alors « Cette page n'a pas pu être chargée » avec « Réessayer » (recharge l'application), mais il vaut mieux éviter le cas.
- **CI** : la CI du back ne se déclenche que sur PR vers `main` ; §14 prévoit `dev` et `main`. Le CI front se déclenche sur PR et push vers `dev` et `main`.

### 2.3 `DESIGN.md`
Voir `design-front.md`, dernière section (tableau d'écarts). Rien à modifier côté back ; à titre indicatif, `DESIGN.md` pourrait renvoyer vers `design-front.md` pour le front.

## 3. Questions pour Charlotte

### Q1 — Changement de mot de passe (bloquant pour TICKET-044)
TICKET-044 demande `changePassword(oldPassword, newPassword)` et « Ancien mot de passe incorrect », mais :
- `tech.md` : `PATCH /api/users/me` n'accepte que `emailNotificationsEnabled` ;
- je n'ai trouvé aucune route de changement de mot de passe dans le code.

Faut-il ajouter un endpoint (par ex. `PATCH /api/users/me/password` avec `{oldPassword, newPassword}`) ? Sinon la page Profil ne pourra pas proposer ce formulaire (le flux « mot de passe oublié » reste disponible).

### Q2 — Activation et réinitialisation : d'où vient l'e-mail ?
`POST /auth/activate` et `/auth/reset-password` exigent `{email, code, newPassword}`, mais TICKET-017/018 ne prévoient que `activate(code, password)`. Le lien reçu par e-mail (`/activation`, `/reinitialisation`) contient-il l'adresse en paramètre (par ex. `?email=…`) ? Je n'ai pas trouvé le gabarit de l'e-mail dans le code. À défaut, le front demandera à l'utilisateur de saisir son adresse.

**Solution retenue par le front (2026-10-31)** : les pages `/activation` et `/reinitialisation` affichent toujours un champ « Adresse e-mail », prérempli et modifiable si le lien contient `?email=…`. Sans effet sur le contrat : la question reste ouverte pour que le lien contienne l'adresse (meilleure UX).

### Q3 — Portée des formations pour le rôle ADMIN (formateur) — demande de changement
Décision du front : **le formateur voit toutes les formations en lecture seule, avec « Mes formations » en filtre par défaut** (PRD, USERFLOW, TICKET-024).
`tech.md` dit l'inverse (« ADMIN : uniquement les siennes », 404 sinon). Pour appliquer la décision il faudrait :
1. `GET /api/formations` et `GET /api/formations/{id}` : ADMIN voit toutes les formations ;
2. un filtre « mes formations » (par ex. `?mine=true`, retiré du contrat par TICKET-022) ;
3. confirmer ce que le formateur peut lire sur une formation qui n'est pas la sienne (inscrits ? documents ?).

Le front applique sa décision (D46), qui l'emporte sur `tech.md` sur ce point : il faut donc aligner le back, sinon un formateur recevra 404 sur les formations des autres.

### Q4 — Tableau de bord — proposition de changement
Proposition : niveau 1 identique pour tous les rôles **Gestion · Messages · Notifications · Profil** (le stagiaire voit **Mes formations** à la place de Gestion) ; dans **Gestion** : **Formations · Formateurs · Stagiaires** (+ Catégories pour la chargée de formation).
Cela revient à `USERFLOW.md` et corrige TICKET-043, dont les tuiles pour SUPER_ADMIN (Formations, Formateurs, Stagiaires, Messagerie) font disparaître Notifications et Profil.

### Q5 — Types de fichiers et taille maximale
`tech.md` indique seulement « type non autorisé ou taille dépassée ». Le front pré-contrôle avec pdf, jpg, png, docx et 10 Mo (TICKET-027). La liste exacte (jpeg ? autres ?) et la taille du back sont-elles les mêmes ?

### Q6 — Inscriptions et documents ciblés : écrans
Le contrat existe (inscrire / désinscrire, document ciblé par stagiaire), mais aucun ticket front ne couvre « Inscrire un stagiaire » (US-006), « Modifier un utilisateur » (`PUT /users/{id}`, TICKET-050) ni le dépôt de document ciblé (US-010). Le front les ajoutera à son propre plan (SDD) ; pas de demande côté back.

### Q7 — Dates
`tech.md` décrit des `LocalDateTime` sans décalage (`2026-03-10T14:30:00`) alors que `ADAC_KNOWLEDGE.md` mentionne `OffsetDateTime` dans le code. Les DTO renvoient-ils un décalage horaire (`Z` / `+01:00`) ? Cela change l'affichage des dates dans le front.

### Q8 — Comptes : deux points à confirmer (change `users-account-management`)
1. `POST /api/users/stagiaires` : le front crée pour l'instant le stagiaire avec `formationIds: []` (le choix des formations arrive avec `feature/formations`). Le DTO du back accepte un champ vide ou absent ; **confirmé le 2026-10-31 contre le vrai back local : `201`**.
   Constats du même passage : `409` sur e-mail déjà utilisé (création et `PUT`), `403` pour ADMIN sur `POST`, `404` pour ADMIN sur `GET /users/{id}` d'un compte inactif, `PUT` partiel OK.
3. **Statut d'un compte** : un compte tout juste créé a `isActive: false` (jamais activé), identique à un compte suspendu dans `UserResponse`, et `PATCH /users/{id}/reactivate` répond `409` « Ce compte n'a jamais été activé — utilisez le renvoi du code d'activation ». Le front affiche donc « Inactif » pour tout `isActive: false` (D55). **Demande** : ajouter un champ (par ex. `activated` ou `activatedAt`) à `UserResponse` pour distinguer « jamais activé » (action : renvoyer le code) de « suspendu » (action : réactiver).
2. `GET /api/users/stagiaires` pour un ADMIN : `tech.md` indique « actifs uniquement, filtre par défaut : ses formations ». Or D46 donne au formateur toutes les formations en lecture. Le front affiche ce que le back renvoie ; si le formateur doit voir tous les stagiaires actifs, il faut aligner le back (même question que Q3). Le détail `GET /users/{id}` d'un stagiaire hors de ses formations peut aussi répondre 404 : le front affiche alors « Compte introuvable ».

### Q9 — Code de référence des formations (issu du site de l'ADAC)
Le catalogue du site officiel numérote chaque formation par un code de référence (ES01, MI02, DB04, PCB1, IN03…, voir `adac-site-reference.md`). `tech.md` ne prévoit aucun champ de ce type dans le DTO formation. Faut-il ajouter un champ optionnel (par ex. `reference`) ? Sinon le front n'affiche que le titre.

### Q10 — Sens de « PCB »
Le site de l'ADAC parle d'« intervenants PCB » et d'une série « Spécial PCB » (PCB1 à PCB3) sans jamais définir le sigle. Que signifie-t-il, et faut-il en tenir compte dans le modèle (public cible, catégorie) ?

### Q11 — Changer le formateur d'une formation : `PUT` ignore `null`, `PATCH /formateur` répond 500 (change `formation-form`)
Constaté le 2026-11-01 contre le vrai back local (`dev`) :
- `PUT /api/formations/{id}` avec `{"formateurId": null}` répond `200` mais **ne change rien** : `null` est traité comme « champ absent ». Seul un identifiant de formateur actif (ou de la chargée de formation) est pris en compte.
- `PATCH /api/formations/{id}/formateur` (documenté « pas encore implémenté » dans `tech.md`) répond **`500`** au lieu d'un `404`/`501`.
- À la **création**, `formateurId: null` fonctionne : la chargée de formation est assignée.

Le front contourne : en modification, l'option « Assigné à la chargée de formation » envoie l'identifiant de la chargée connectée. Si le back préfère traiter `null` comme « auto-assigner » (comme à la création), ou implémenter le `PATCH`, le front pourra retirer ce détour. À confirmer.

### Q12 — Import Excel : erreurs dans un seul `message` (change d'import des formations)
Lu dans `ExcelImportUtil` (branche `dev`, lecture seule) : un fichier invalide répond `400` avec **une seule chaîne** `message` où les erreurs sont jointes par ` | `, chacune de la forme `ligne N, colonne X : texte` (50 erreurs au plus, puis « ... et d'autres erreurs »), et `details[]` n'est pas rempli. Limites : 2 Mo, 1000 lignes, `.xlsx` seulement.

Le front découpe ce texte pour afficher un tableau Ligne / Colonne / Problème (F20) et affiche telle quelle toute entrée non reconnue. C'est fragile : si le format du message change, le tableau se réduit à une liste de texte. Demande : remplir `details[]` avec une entrée par erreur (idéalement `{ligne, colonne, message}`). Les colonnes restent le placeholder de `tech.md` tant que le fichier réel d'ADAC n'est pas arrivé (R10).

### Q13 — Le stagiaire ne peut pas connaître son `inscriptionId` (ticket 028, documents du stagiaire) — ✅ résolu le 2026-11-09
Traité par le back (`dev`, commit `e1f7c35`) : `inscriptionId` dans `FormationResponse` pour le stagiaire inscrit (`null` sinon) et suppression de ses propres dépôts autorisée au stagiaire. Le texte d'origine est gardé ci-dessous pour mémoire.

`POST /documents` et `GET /documents?inscriptionId=` (stagiaire : « ses inscriptions ») exigent l'id de l'inscription. Mais `GET /formations/{id}/inscriptions` répond `403` à un stagiaire, `FormationResponse` n'a pas de champ d'inscription et `DocumentResponse.inscriptionId` n'existe qu'une fois un document déposé : un stagiaire ne peut donc pas déposer son premier document.

Proposition minimale : ajouter `inscriptionId` à `FormationResponse` **seulement pour le stagiaire inscrit** (aucune fuite d'e-mail), ou un `GET /api/inscriptions/me` (liste de ses inscriptions avec leur formation). Le front est écrit sur cette proposition en attendant ta réponse. Constat lié : `DELETE /documents/{id}` répond `403` à un stagiaire (`tech.md` §6), il ne pourra donc pas retirer un fichier déposé par erreur ; le front n'affiche pas « Supprimer » pour lui.

### Q14 — Messagerie : l'interface ne peut pas trouver la chargée de formation (ticket 031)
Règle du front : la chargée de formation écrit à tout le monde ; le formateur écrit à la chargée de formation et aux stagiaires de ses formations ; le stagiaire à la chargée de formation et aux formateurs de ses formations (`decisions-messagerie.md` H1). Aucun endpoint n'expose l'`id` d'un `SUPER_ADMIN` à un formateur ou à un stagiaire (`GET /users/{id}` est interdit pour un tiers, `GET /users/formateurs` ne renvoie pas les `SUPER_ADMIN`) : ils ne pourraient donc jamais lui écrire en premier.

Proposition : `GET /api/messages/recipients` → `UserResponse[]` des destinataires autorisés pour l'appelant (chargée de formation incluse, comptes actifs seulement). Le back reste maître des règles (403/404 de `POST /messages/send`). En attendant, le front dérive formateurs et stagiaires des endpoints existants et n'offre la chargée de formation que si elle est déjà connue (formateur d'une formation, conversation existante).

### Q15 — Messagerie : marquer tout un fil comme lu en un appel (ticket 031)
`PATCH /messages/{id}/read` ne marque qu'un message. Ouvrir un fil de N messages non lus coûte N appels. Proposition : `PATCH /api/messages/{conversationId}/read` (marque tous les messages entrants non lus de ce fil, `200` sinon rien à faire). Le front fonctionne déjà avec un appel par message (`decisions-messagerie.md` H5) et passera à l'appel unique dès qu'il existe.

### Limite du message** : le code du back impose `content` non vide et 5000 caractères au plus (`SendMessageRequest`), mais `tech.md` §7 ne le dit pas. Peux-tu l'ajouter au contrat ?

### Messagerie : deux écarts avec `tech.md` relevés sur le back local (2026-11-03)
- Un destinataire **inconnu** à `POST /messages/send` répond `403` « Vous ne pouvez pas écrire à ce destinataire », alors que `tech.md` §7 annonce `404`. Le front traite les deux de la même façon ; peux-tu aligner le contrat ou le code ?
- `createdAt` / `readAt` des messages sont renvoyés en UTC avec `Z` et microsecondes (`2026-11-03T09:45:10.02948Z`), alors que `tech.md` les décrit comme `LocalDateTime`. Sans conséquence pour le front (il convertit à l'heure locale) ; à confirmer que c'est voulu.

### Q16 — Inscriptions d'un stagiaire (profil vu par la chargée de formation / le formateur)
Pour afficher, sur le profil d'un stagiaire, ce qu'il a envoyé dans chacune de ses formations, le front doit connaître ses inscriptions. Aucun endpoint ne les donne (`GET /users/{id}` ne les contient pas) : le front lit la liste d'inscrits de chaque formation que l'appelant peut consulter et retient celles du stagiaire (une requête par formation, `404` ignoré pour le formateur hors de ses formations).

Proposition : `GET /api/users/{id}/inscriptions` → `{ id, formation }[]` (SUPER_ADMIN : toutes ; ADMIN : celles de ses formations ; la même règle que `GET /api/documents?inscriptionId=`). Le front passera à cet appel unique dès qu'il existe.

## 4. Conflits entre `tech.md` et les autres documents du back

Règle appliquée : **`tech.md` l'emporte** (D40). La colonne « Décision » est à trancher par Manon, puis à communiquer à Charlotte.

| # | Sujet | `tech.md` | Autre document | Suivi par défaut | Décision |
|---|---|---|---|---|---|
| 1 | Compte non activé à la connexion | 403 « Compte non activé… » | TICKET-016 : 401 « Compte non activé » | `tech.md` (403) | ☐ |
| 2 | Mot de passe oublié — e-mail inconnu | toujours 200, même message | TICKET-018 : test 200 ou 404 ; USERFLOW : « email non reconnu → erreur » | `tech.md` (toujours le même message) | ☐ |
| 3 | Activation : 429 | `/activate` ne renvoie jamais 429 ; `/resend-activation` oui | US-002 AC-05 | `tech.md` | ☐ |
| 4 | Corps d'activation / reset | `{email, code, newPassword}` | TICKET-017/018 : sans e-mail | `tech.md` (voir Q2) | ☐ |
| 5 | Suspendre un compte | `PATCH /users/{id}/deactivate` · `/reactivate` | TICKET-021 : `PATCH /users/{id}` avec `isActive` | `tech.md` | ☐ |
| 6 | Lister les comptes | `GET /users/formateurs` · `/stagiaires` | TICKET-021 : `getUsers(role, isActive)` | `tech.md` | ☐ |
| 7 | Formations visibles par ADAC/ADMIN | uniquement les siennes | PRD, USERFLOW, TICKET-024 : toutes en lecture | **décidé : toutes (Q3, D46 l'emporte sur `tech.md`)** | ✅ (demande de changement) |
| 8 | Télécharger un document | `GET /documents/{id}/download` (flux, cookie) | TICKET-027 : « URL signée » ; DTO expose aussi `fileUrl` | `tech.md` (blob) | ☐ |
| 9 | Marquer lu | `PATCH /messages/{id}/read` (un message) | TICKET-031 : `markAsRead(conversationId)` | `tech.md` (un appel par message, en parallèle) | ☐ |
| 10 | Filtre de message groupé | `MANUAL` ; `POST /messages/send` + `GET /messages/group/preview` | TICKET-032 : `FREE_SELECT`, `/messages/group` | `tech.md` | ☐ |
| 11 | Types de notification | `type` : `NEW_MESSAGE`, `DOCUMENT_UPLOADED`… ; `entityType` : `FORMATION` \| `MESSAGE` | TICKET-035 : MESSAGE / DOCUMENT / FORMATION | `tech.md` (icône selon `type`) | ☐ |
| 12 | Profil d'un utilisateur par un stagiaire | `GET /users/{id}` interdit au stagiaire ; pas de `GET /users/me` | USERFLOW : « Mon profil » | utiliser `GET /auth/me` | ☐ |
| 13 | Changement de mot de passe | aucun endpoint | TICKET-044 | bloqué — voir Q1 | ☐ |
| 14 | Tuiles du tableau de bord | — | DESIGN / USERFLOW (Gestion·Messages·Notifications·Profil) vs TICKET-043 (SA : Formations·Formateurs·Stagiaires·Messagerie) | **décidé : USERFLOW (Q4)** | ✅ (proposition) |

_Dernière mise à jour : 2026-10-31._

## 5. CI du front : `npm run check` (TICKET-010)

La CI du front (`.github/workflows/ci.yml`) exécute désormais `npm run check` (lint + tests Vitest + build avec `VITE_API_URL=/api` + contrôle du budget de taille du fichier d'entrée) à la place de lint + build seuls. Aucune action requise de ta part ; à confirmer avec toi si tu veux conserver ces étapes dans ton flux de déploiement (TICKET-010).

## 6. Écarts relevés pendant le branchement de l'authentification (change `auth-real-backend`)

- **Libellé du bouton de connexion** : US-001 AC-01 dit « Commencer la session » ; la coque du front dit « SE CONNECTER » et a été conservée (D11).
- **« Identifiant » vs e-mail** : le plan parlait d'un « identifiant donné par ADAC » ; `tech.md` n'accepte que l'e-mail à la connexion (D40).
- **Développement local** : le `docker-compose.yml` du back est orienté production (profil `prod`, aucun port publié, image front absente). Le front le complète par une surcharge versionnée dans `docs/dev/` (D53), sans rien modifier dans le repo `back`. Un court paragraphe « développer le front contre le back en local » dans ta documentation éviterait ce détour — à ta convenance.

## 7. Documents d'une formation (ticket 027) — ajouté le 2026-11-02, après l'envoi du matin

Contrat vérifié sur le back local (dépôt, liste, téléchargement, suppression, avec un vrai bucket Supabase) : tout fonctionne comme dans `tech.md` §6. Points à confirmer ou à améliorer :

- **URL signée ou proxy ?** Le ticket 027 parle d'« URL signée » ; `tech.md` §6 et le back décrivent un proxy binaire (`GET /documents/{id}/download`). Le front suit `tech.md` (décision G1) et n'utilise jamais `fileUrl`. Rien à changer si le proxy est bien le choix voulu.
- **Formation archivée** : le front rend les documents en lecture seule (G3), mais le back accepte encore le dépôt et la suppression sur une formation archivée. Souhaites-tu les refuser côté back (`409` / `403`) ?
- **`uploadedBy` expose trop au stagiaire** : chaque `DocumentResponse` contient l'utilisateur complet (`email`, `createdAt`, `emailNotificationsEnabled`, `isActive`…). Un stagiaire reçoit donc l'e-mail du formateur et de la chargée de formation qui ont déposé le document, alors que le front n'affiche que « Envoyé par Prénom Nom ». Pour la vie privée (D31, même sujet que l'e-mail des co-inscrits, `tech.md` §5), pourrait-on renvoyer seulement `id`, `prenom` et `nom` ? Le front n'a besoin que de ces trois champs (et de l'`id`, pour savoir si le formateur est l'auteur du dépôt).
- **`fileUrl`** : c'est l'adresse brute du stockage (bucket privé, inutilisable par un navigateur). Elle fuit le nom du bucket et le chemin ; la retirer de `DocumentResponse` serait plus propre si rien ne l'utilise.
- **Double barre dans `fileUrl`** : si `SUPABASE_URL` se termine par `/`, l'adresse contient `//storage/...`. Une normalisation dans `SupabaseConfig` (retirer la barre finale) évite le piège.
- **Erreur de configuration du stockage** : une `SUPABASE_URL` mal formée ou pointant sur `/rest/v1/` donne `502 « Service de stockage indisponible »` ; la vraie cause (`PGRST125`, hôte inconnu…) n'est que dans les logs. À mentionner dans ta documentation de développement local : `SUPABASE_URL` = URL du projet seule (`https://<projet>.supabase.co`), clé `service_role`, bucket privé `adac-documents`.
