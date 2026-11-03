# Décisions — messagerie (tickets 031 et 032)

Décisions prises avec Manon (`/grill-me-with-docs`). Complète D21 et D22 de `decisions-front-foundations.md` (boîte à deux volets, sondage 45 s). Numérotation propre à ce thème : H1, H2…

## H1 — Qui peut écrire à qui (sélecteur de destinataire)
- Date : 2026-11-03
- **Décision** :
  - **Chargée de formation** (`SUPER_ADMIN`) : peut écrire à tout le monde.
  - **Formateur** (`ADMIN`) : la chargée de formation + les stagiaires des formations dont il est le formateur.
  - **Stagiaire** : la chargée de formation + les formateurs des formations auxquelles il est inscrit.
- **Pourquoi** : règle de Manon. Plus étroite que `STORIES.md` US-013 AC-03/AC-04 (qui laissent le formateur écrire à tout formateur/stagiaire actif et le stagiaire à tout formateur) : le front restreint l'interface, le back reste la source de vérité (403/404 gérés, D12).
- **Alternatives écartées** : suivre US-013 à la lettre (liste de destinataires trop large, bruit pour le stagiaire).

## H2 — Découper en deux changes : individuel d'abord, groupé ensuite
- Date : 2026-11-03
- **Décision** : change 1 = messagerie individuelle (ticket 031, US-013) ; change 2 = messagerie groupée (ticket 032, US-014, aperçu + filtres), branche `feature/messagerie` commune, un commit par ticket, une PR au dernier ticket (D3, D43).
- **Pourquoi** : le groupé dépend de l'individuel (même fil, mêmes DTOs) ; chaque change reste relisable.
- **Alternatives écartées** : un seul change pour 031 + 032.

## H3 — Ce que le back ne fournit pas : à faire côté back, le front prépare les fonctions
- Date : 2026-11-03
- **Décision** : toute fonctionnalité de messagerie qui manque au back est consignée comme **à faire côté back** dans `points-pour-charlotte.md` (et `points-pour-charlotte-nouveautes.md`). Le front écrit quand même les fonctions et hooks correspondants, isolés dans un seul point de code, qui ne reçoivent rien du back pour l'instant (état « indisponible » sans appel).
- **Pourquoi** : même démarche que Q13 / G14 (documents du stagiaire) : avancer sans modifier `tech.md` ni le back (lecture seule).
- **Alternatives écartées** : attendre le back avant de coder ; simuler des données dans l'application (D11).

## H4 — Trouver la chargée de formation : demande d'un endpoint de destinataires (Q14)
- Date : 2026-11-03
- **Décision** : demander à Charlotte (Q14) un endpoint qui renvoie, pour l'appelant, ses destinataires autorisés (chargée de formation comprise), par ex. `GET /messages/recipients`. En attendant, le front lit les destinataires en **un seul point** (`useRecipients`) à partir de l'existant : formateurs via `formation.formateur` de `GET /formations` (stagiaire), stagiaires via `GET /users/stagiaires` (formateur), tous via `GET /users/formateurs` + `GET /users/stagiaires` (chargée de formation), et les interlocuteurs déjà présents dans `GET /messages`. La chargée de formation n'est proposée au formateur et au stagiaire que s'il en existe un moyen (formateur de formation, conversation existante), sinon c'est le point bloqué.
- **Pourquoi** : aucun endpoint n'expose l'id d'un `SUPER_ADMIN` à un non-`SUPER_ADMIN` (`GET /users/{id}` leur est interdit pour un tiers) ; un endpoint dédié règle aussi les cas limites (utilisateur suspendu, périmètre).
- **Alternatives écartées** : endpoint étroit `GET /users/chargee` seul ; tout dériver sans rien demander (le stagiaire ne pourrait jamais écrire le premier).

## H5 — Lecture : un `PATCH` par message maintenant, endpoint de fil demandé (Q15)
- Date : 2026-11-03
- **Décision** : ouvrir un fil marque ses messages entrants non lus comme lus par un `PATCH /messages/{id}/read` chacun, en parallèle (conforme à D22, fonctionne sur le back actuel). Le tout est isolé dans `markThreadRead(conversationId)` ; Q15 demande à Charlotte `PATCH /messages/{conversationId}/read` (un seul appel). Le total de non lus se calcule en additionnant `unreadCount` de `GET /messages` : aucun manque côté back.
- **Pourquoi** : le back n'a pas d'endpoint de fil ; N appels parallèles restent raisonnables pour des fils courts, et le remplacement est d'une ligne.
- **Alternatives écartées** : n'appeler que l'endpoint absent (les non lus ne s'effaceraient jamais) ; bouton « Marquer comme lu » manuel (AC-06 affaibli).

## H6 — Adresse d'une conversation : `/messages/:userId`
- Date : 2026-11-03
- **Décision** : `/messages` = liste des conversations ; `/messages/:userId` = fil avec cet utilisateur (`userId` = `conversationId`, `tech.md` §7), y compris un fil encore vide (premier message). Le bouton « Envoyer un message » des fiches formateur et stagiaire (US-013 AC-05) y mène directement. Bureau : deux volets (D22) ; mobile et tablette étroite : deux écrans, avec `BackButton` vers `/messages` (D42, D58).
- **Pourquoi** : lien direct, bouton « Précédent » naturel, rechargement sans perte.
- **Alternatives écartées** : `/messages?avec=ID` ; sélection en état seulement (perdue au rechargement).

## H7 — Sondage de la liste et pastille « non lus » sur la tuile Messages
- Date : 2026-11-03
- **Décision** : la liste des conversations (`['messages','conversations']`, `GET /messages`) est sondée toutes les 45 s, en pause onglet masqué, rechargée au focus (D21), en plus du fil ouvert (D22). La tuile « Messages » affiche le total de non lus (somme des `unreadCount`) avec un libellé accessible (« 3 messages non lus »). Envoi et lecture invalident la requête.
- **Pourquoi** : les nouveaux messages d'autres personnes apparaissent sans recharger ; une seule requête partagée alimente liste et pastille.
- **Alternatives écartées** : pastille reportée à la branche notifications/tableau de bord ; aucun sondage de la liste.

## H8 — Fil d'une personne à qui on ne peut pas écrire
- Date : 2026-11-03
- **Décision** : sur `/messages/:userId`, si le fil existe (messages passés) il s'affiche, et le champ de saisie est remplacé par « Vous ne pouvez pas écrire à cette personne » quand l'interlocuteur n'est pas dans les destinataires autorisés (H1) ; sans fil et hors destinataires : « Conversation introuvable » + `BackButton` vers `/messages`. Les `403`/`404` du back à l'envoi restent traités par l'intercepteur (D12).
- **Pourquoi** : message clair plutôt qu'une erreur après saisie ; un compte suspendu garde son historique lisible.
- **Alternatives écartées** : composer toujours visible ; redirection silencieuse.

## H9 — Contenu du message : texte seul, 1 à 5000 caractères
- Date : 2026-11-03
- **Décision** : `content` est affiché en **texte** (jamais en HTML, XSS) ; sauts de ligne conservés (CSS `white-space: pre-wrap`). Le champ refuse un message vide ou composé d'espaces et plus de 5000 caractères (compteur affiché à l'approche de la limite), avant tout appel. Entrée = saut de ligne, bouton « Envoyer » = envoi (accessibilité clavier simple, pas de raccourci caché).
- **Pourquoi** : `SendMessageRequest` du back impose `@NotBlank` et `@Size(max = 5000)` (relevé dans le code, absent de `tech.md`, signalé à Charlotte).
- **Alternatives écartées** : Entrée pour envoyer (envois accidentels, lecteurs d'écran) ; pas de limite côté front.
