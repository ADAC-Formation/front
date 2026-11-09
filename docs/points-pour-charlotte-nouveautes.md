# Points pour Charlotte — nouveautés

Extrait de `points-pour-charlotte.md` : uniquement les entrées ajoutées **depuis la dernière version envoyée** (envoi du 2026-11-02, matin). À remettre à Charlotte quand Manon le décide ; une fois envoyé, vider ce fichier et y noter la nouvelle date d'envoi. Chaque nouvelle entrée ajoutée à `points-pour-charlotte.md` est aussi recopiée ici.

Dernier envoi : 2026-11-02 (matin).

À joindre : le §0 de `points-pour-charlotte.md` (accord de Manon sur Q8.3, Q14, Q15 ; Q3, Q8.2, Q9 en attente de l'avis de l'ADAC ; PCB = Point Conseil Budget), et la relance de Q16, restée sans réponse.

## Documents d'une formation (ticket 027) — ajouté le 2026-11-02, après l'envoi du matin

Contrat vérifié sur le back local (dépôt, liste, téléchargement, suppression, avec un vrai bucket Supabase) : tout fonctionne comme dans `tech.md` §6. Points à confirmer ou à améliorer :

- **URL signée ou proxy ?** Le ticket 027 parle d'« URL signée » ; `tech.md` §6 et le back décrivent un proxy binaire (`GET /documents/{id}/download`). Le front suit `tech.md` (décision G1) et n'utilise jamais `fileUrl`. Rien à changer si le proxy est bien le choix voulu.
- **Formation archivée** : le front rend les documents en lecture seule (G3), mais le back accepte encore le dépôt et la suppression sur une formation archivée. Souhaites-tu les refuser côté back (`409` / `403`) ?
- **`uploadedBy` expose trop au stagiaire** : chaque `DocumentResponse` contient l'utilisateur complet (`email`, `createdAt`, `emailNotificationsEnabled`, `isActive`…). Un stagiaire reçoit donc l'e-mail du formateur et de la chargée de formation qui ont déposé le document, alors que le front n'affiche que « Envoyé par Prénom Nom ». Pour la vie privée (D31, même sujet que l'e-mail des co-inscrits, `tech.md` §5), pourrait-on renvoyer seulement `id`, `prenom` et `nom` ? Le front n'a besoin que de ces trois champs (et de l'`id`, pour savoir si le formateur est l'auteur du dépôt).
- **`fileUrl`** : c'est l'adresse brute du stockage (bucket privé, inutilisable par un navigateur). Elle fuit le nom du bucket et le chemin ; la retirer de `DocumentResponse` serait plus propre si rien ne l'utilise.
- **Double barre dans `fileUrl`** : si `SUPABASE_URL` se termine par `/`, l'adresse contient `//storage/...`. Une normalisation dans `SupabaseConfig` (retirer la barre finale) évite le piège.
- **Erreur de configuration du stockage** : une `SUPABASE_URL` mal formée ou pointant sur `/rest/v1/` donne `502 « Service de stockage indisponible »` ; la vraie cause (`PGRST125`, hôte inconnu…) n'est que dans les logs. À mentionner dans ta documentation de développement local : `SUPABASE_URL` = URL du projet seule (`https://<projet>.supabase.co`), clé `service_role`, bucket privé `adac-documents`.

## Messagerie (ticket 031) — ajouté le 2026-11-03

- **Q14** — Messagerie : l'interface ne peut pas trouver la chargée de formation (ticket 031)
Règle du front : la chargée de formation écrit à tout le monde ; le formateur écrit à la chargée de formation et aux stagiaires de ses formations ; le stagiaire à la chargée de formation et aux formateurs de ses formations (`decisions-messagerie.md` H1). Aucun endpoint n'expose l'`id` d'un `SUPER_ADMIN` à un formateur ou à un stagiaire (`GET /users/{id}` est interdit pour un tiers, `GET /users/formateurs` ne renvoie pas les `SUPER_ADMIN`) : ils ne pourraient donc jamais lui écrire en premier.
Proposition : `GET /api/messages/recipients` → `UserResponse[]` des destinataires autorisés pour l'appelant (chargée de formation incluse, comptes actifs seulement). Le back reste maître des règles (403/404 de `POST /messages/send`). En attendant, le front dérive formateurs et stagiaires des endpoints existants et n'offre la chargée de formation que si elle est déjà connue (formateur d'une formation, conversation existante).

- **Q15** — Messagerie : marquer tout un fil comme lu en un appel (ticket 031)
`PATCH /messages/{id}/read` ne marque qu'un message. Ouvrir un fil de N messages non lus coûte N appels. Proposition : `PATCH /api/messages/{conversationId}/read` (marque tous les messages entrants non lus de ce fil, `200` sinon rien à faire). Le front fonctionne déjà avec un appel par message (`decisions-messagerie.md` H5) et passera à l'appel unique dès qu'il existe.

- **Limite du message** : le code du back impose `content` non vide et 5000 caractères au plus (`SendMessageRequest`), mais `tech.md` §7 ne le dit pas. Peux-tu l'ajouter au contrat ?

- **Messagerie : deux écarts avec `tech.md` relevés sur le back local (2026-11-03)**
- Un destinataire **inconnu** à `POST /messages/send` répond `403` « Vous ne pouvez pas écrire à ce destinataire », alors que `tech.md` §7 annonce `404`. Le front traite les deux de la même façon ; peux-tu aligner le contrat ou le code ?
- `createdAt` / `readAt` des messages sont renvoyés en UTC avec `Z` et microsecondes (`2026-11-03T09:45:10.02948Z`), alors que `tech.md` les décrit comme `LocalDateTime`. Sans conséquence pour le front (il convertit à l'heure locale) ; à confirmer que c'est voulu.

## Documents envoyés par les stagiaires, vus par la chargée de formation et le formateur — ajouté le 2026-11-09

### Q16 — Inscriptions d'un stagiaire (profil vu par la chargée de formation / le formateur)
Pour afficher, sur le profil d'un stagiaire, ce qu'il a envoyé dans chacune de ses formations, le front doit connaître ses inscriptions. Aucun endpoint ne les donne (`GET /users/{id}` ne les contient pas) : le front lit la liste d'inscrits de chaque formation que l'appelant peut consulter et retient celles du stagiaire (une requête par formation, `404` ignoré pour le formateur hors de ses formations).

Proposition : `GET /api/users/{id}/inscriptions` → `{ id, formation }[]` (SUPER_ADMIN : toutes ; ADMIN : celles de ses formations ; la même règle que `GET /api/documents?inscriptionId=`). Le front passera à cet appel unique dès qu'il existe.
