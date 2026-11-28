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
- **Décision** : toute fonctionnalité de messagerie qui manque au back est consignée comme **à faire côté back** dans `points-pour-charlotte.md` (et dans sa section « À envoyer à Charlotte »). Le front écrit quand même les fonctions et hooks correspondants, isolés dans un seul point de code, qui ne reçoivent rien du back pour l'instant (état « indisponible » sans appel).
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

## H10 — Constats sur le back local (vérifiés le 2026-11-03, comptes de dev)
- Date : 2026-11-03
- **Constat** : `POST /messages/send` répond `201` avec le message ; contenu blanc → `400` `content: must not be blank` ; 5001 caractères → `400` `content: size must be between 0 and 5000` ; 5000 → `201`. Écrire à soi-même, à un compte désactivé ou à un id inconnu → `403` « Vous ne pouvez pas écrire à ce destinataire » (`tech.md` annonce `404` pour un destinataire inconnu). `GET /messages/{id}` d'un id inconnu → `200 []`. `PATCH /messages/{id}/read` : `200`, idempotent ; sur son propre message ou un id inconnu → `404`. `createdAt` et `readAt` sont des dates UTC avec `Z` et microsecondes (`2026-11-03T09:45:10.02948Z`) : `new Date(...)` les convertit à l'heure locale. Le formateur de dev reçoit `[3]` de `GET /users/stagiaires?active=true` et le stagiaire ses formations avec leur formateur : `useRecipients` fonctionne sur ces sources.
- **Conséquences** : le front ne marque jamais ses propres messages (aucun `404` possible) ; un fil absent est traité comme vide (H8) et le `404` de secours aussi ; le `403` à l'envoi est traduit par « Vous ne pouvez pas écrire à cette personne. » (le `404` par « Ce destinataire est introuvable. »). Écarts relevés pour Charlotte dans `points-pour-charlotte.md`.
- **Non vérifié** : passage visuel dans un navigateur (deux volets, mobile, « Grand texte »), voir la tâche 8.3 du change.

## H11 — La page Messages reprend le gabarit des autres pages
- Date : 2026-11-03
- **Décision** : « Retour » vers le tableau de bord en haut (`BackButton to="/"`) ; titre à gauche et bouton « Nouvelle conversation » en haut à droite (style `--color-action` des pages de comptes), qui ouvre ou ferme le panneau des destinataires (« Fermer » dans le panneau, fermé aussi quand on choisit quelqu'un) ; pastilles de filtre sous le titre, « Toutes » et « Non lues » (filtre côté client, comme « Inactifs » des comptes) ; liste des conversations dans une carte arrondie (30 px, bordure, ombre) avec l'en-tête « Conversations » et le nombre. Le « Retour » du fil, visible sur écran étroit seulement, devient « Retour aux conversations ». Pastille « non lus » de la tuile : police de texte (`--font-sans`, qui suit « Police lisible », D60), gras 700 et chiffres tabulaires, au lieu de la police de titre (Syne) dont les chiffres étaient peu lisibles.
- **Pourquoi** : retour de Manon sur la première version (cohérence avec Formations et Comptes).
- **Alternatives écartées** : carte autour du fil aussi (seule la liste était demandée).
- **Complément (même jour)** : barre d'outils sous le titre comme les pages de comptes, avec une recherche par nom (« Rechercher une personne ») et un menu « Rôle » (Tous les rôles, Chargée de formation, Formateur, Stagiaire), au-dessus des pastilles « Toutes » / « Non lues ». Les trois filtres se combinent (ET) et sont calculés côté navigateur (`conversationFilters.js`) : le back n'en propose aucun. La recherche porte sur « prénom nom » de l'interlocuteur, sans casse ni accents ; pas sur le contenu des messages (non demandé, à reprendre si besoin). Sans résultat : « Aucune conversation trouvée. Essayez un autre terme ou un autre filtre. »

## H12 — Messagerie groupée (ticket 032) : filtres, point d'entrée, branche
- Date : 2026-11-19
- **Décision** :
  - Les trois filtres du back sont proposés à la chargée de formation, `MISSING_DOCS` compris, avec **la définition du back** (stagiaire sans aucun document, toutes formations confondues) expliquée par un court texte d'aide. Le formateur n'a que `FORMATION`.
  - Point d'entrée : bouton « Message groupé » sur `/messages` (chargée de formation et formateur seulement), à côté de « Nouvelle conversation », vers une page `/messages/groupe` (`PageShell` + `BackButton to="/messages"`).
  - Branche `feature/messagerie-groupee` créée depuis `dev` (D3) ; la branche `feature/messagerie` est déjà mergée.
- **Pourquoi** : le back définit déjà `MISSING_DOCS` (STORIES US-014, `tech.md` §7) ; la liste des « documents obligatoires » que l'ADAC pourrait définir (`questions-pour-adac.md` §A) changera peut-être le sens du filtre, d'où le texte d'aide. Une page entière, plutôt qu'une boîte de dialogue, tient mieux sur mobile (aperçu + filtres + saisie).
- **Alternatives écartées** : masquer `MISSING_DOCS` jusqu'à la réponse de l'ADAC ; boîte de dialogue ouverte depuis `/messages` ; réutiliser `feature/messagerie`.

## H13 — Confirmation avant l'envoi d'un message groupé
- Date : 2026-11-19
- **Décision** : « Envoyer à X destinataires » ouvre le `ConfirmDialog` existant (« Envoyer ce message à X personnes ? », Annuler / Envoyer) ; l'envoi n'a lieu qu'après confirmation. Le bouton reste désactivé sans destinataire ou sans texte valide (H9).
- **Pourquoi** : un message groupé touche beaucoup de monde et ne se rappelle pas ; le ticket 032 parle de « confirmation avant envoi ».
- **Alternatives écartées** : un seul clic, le libellé du bouton donnant le nombre.

## H14 — Sélection libre : liste de cases à cocher avec recherche
- Date : 2026-11-19
- **Décision** : le filtre `MANUAL` (chargée de formation) affiche les stagiaires actifs (`GET /users/stagiaires?active=true`) en cases à cocher natives, avec une recherche par nom (sans casse ni accents, comme `conversationFilters.js`), « Tout sélectionner » (sur les résultats affichés) et un compteur « X sélectionnés » annoncé aux lecteurs d'écran. La sélection survit à un changement de recherche. Envoi : `filter.userIds`.
- **Pourquoi** : le back n'a pas de recherche côté serveur ; des cases natives sont accessibles au clavier et au lecteur d'écran (D15) et tiennent pour 20 personnes ou plus.
- **Alternatives écartées** : pastilles ajoutées une à une (lent pour de grands groupes, accessibilité plus fragile).

## H15 — Un message groupé dans un fil : pastille « Message groupé », jamais la liste des destinataires
- Date : 2026-11-19
- **Décision** : dans un fil (côté destinataire comme côté expéditeur), un message avec `isGroup: true` porte la mention texte « Message groupé » (pas seulement une couleur). La liste `recipients` n'est **jamais** affichée : le back y met un `UserResponse` complet par destinataire (e-mail compris), mais le back ne le renvoie en entier qu'à l'expéditeur, dans la réponse de l'envoi (vérifié, H18) ; par prudence le front ne le lit jamais (le nombre de destinataires suffit). Correction du 2026-11-19 : la version initiale de cette décision et de l'ancienne À7 croyait à une fuite d'e-mails entre stagiaires ; il n'y en a pas.
- **Pourquoi** : vie privée (D31, même sujet que `uploadedBy` et l'e-mail des co-inscrits) ; la mention évite qu'un stagiaire croie être le seul destinataire.
- **Alternatives écartées** : afficher aussi le nombre de destinataires (révèle la taille du groupe) ; aucune distinction.

## H16 — Comportements dérivés du ticket 032 et du back (pas de question à Manon)
- Date : 2026-11-19
- **Décision** :
  - Chargée de formation : trois filtres (Formation, Documents manquants, Sélection libre) ; formateur : `FORMATION` seulement, limité à **ses** formations (`formation.formateur.id` = lui), car le back répond `404` sur celles des autres (D46 ne s'applique pas ici).
  - L'aperçu (`GET /messages/group/preview`) se charge dès que le filtre est complet (formation choisie, ou ≥ 1 personne pour `MANUAL`, ou `MISSING_DOCS`). Une liste vide (le back répond `200 []`, voir H18 ; un `400` est une erreur à relancer) affiche « Aucun destinataire correspondant » et désactive l'envoi.
  - Envoi réussi (`201`) : retour à `/messages` avec le message de confirmation « Message envoyé à X destinataires » (X = longueur de `recipients`) ; `['messages']` est invalidé.
  - Texte : mêmes règles que H9 (texte seul, 1–5000 caractères).
- **Pourquoi** : critères d'acceptation du ticket 032 et `tech.md` §7 ; aucun choix de produit en jeu.
- **Alternatives écartées** : aperçu déclenché par un bouton (le ticket veut « automatiquement »).

## H17 — Le filtre « Formation » ne propose que les formations actives
- Date : 2026-11-19
- **Décision** : la liste des formations du filtre `FORMATION` vient de `GET /formations?status=ACTIVE` (valeur de `tech.md` §5) ; pour le formateur, puis restreinte aux siennes (H16). Les formations archivées ne sont pas proposées.
- **Pourquoi** : on écrit aux stagiaires d'une formation en cours ; une formation archivée est en lecture seule dans le reste de l'interface (G3).
- **Alternatives écartées** : proposer aussi les archivées (bruit dans la liste, cas d'usage non demandé) ; à reprendre si l'ADAC veut relancer d'anciens stagiaires.

## H18 — Constats sur le back local pour la messagerie groupée (vérifiés le 2026-11-19, comptes de dev)
- Date : 2026-11-19
- **Constat** :
  - Aperçu : `200` avec la liste de `UserResponse` ; **un groupe vide répond `200 []`** (et non `400` comme `tech.md` le laisse croire) ; `userIds=3&userIds=13` (répétés) → `200`, `userIds[]=3&userIds[]=13` → `400` avec une page HTML de Tomcat. Formateur : sa formation → `200`, la formation d'un autre → `404 « Formation introuvable »`, `MANUAL` → `403 « Ce filtre est réservé au Super Admin »` ; stagiaire → `403 « L'envoi groupé est réservé au Super Admin et aux formateurs »`.
  - Envoi : groupe vide → `400 « Aucun destinataire trouvé pour ce filtre »` ; sinon `201`, avec `recipients` = tous les destinataires (e-mail compris) **dans cette réponse seulement**.
  - Fils et liste des conversations : `recipients` d'un message groupé est **limité au lecteur** (un stagiaire ne voit que lui ; l'expéditeur ne voit que l'interlocuteur du fil). Il n'y a pas de fuite d'e-mails (corrige H15 et l'ancienne À7).
  - `GET /formations` ne renvoie au formateur que ses formations (11 actives, toutes de lui) : `formationsOfTrainer` est redondant aujourd'hui et protège le jour où D46 / Q3 ouvriraient la liste.
  - Chargée de formation : l'aperçu `FORMATION` et `MISSING_DOCS` inclut des comptes `isActive: false` (jamais activés) ; le formateur ne les reçoit pas (`canMessage` selon le rôle de l'appelant). Le comportement de la chargée est le bon (un stagiaire qui active son compte en retard retrouve le message dans son fil) ; reste à aligner le formateur et à trancher pour les comptes suspendus (À7 c).
  - **Bug du back** : aucune notification `NEW_MESSAGE` n'est enregistrée, ni en individuel ni en groupé (`notify` est `@Transactional` et appelé depuis `afterCommit`). À7 a. Corrigé et mergé dans `dev` (PR #22, `42dbdcb`).
- **Conséquences côté front** : un `400` de l'aperçu est une **erreur** (alerte + « Réessayer »), pas « aucun destinataire » ; seul un `200 []` donne « Aucun destinataire correspondant » (corrige H16). Un `400` à l'envoi affiche le message du back et garde le texte. Le bouton « Envoyer » ne dépend que d'un aperçu réussi, et « Réessayer » appelle `refetch()` sans argument (revue de code). Avec le correctif des notifications (mergé dans `dev`, PR #22), la cloche compte les messages ; vérifié de bout en bout : une notification `NEW_MESSAGE` par destinataire, `entityType` `MESSAGE` et `entityId` = l'expéditeur, ce que `notificationTargets.js` attend (fil `/messages/:entityId`).
- **Limite connue** : l'aperçu est un `GET` avec chaque `userIds` répété dans l'adresse (le contrat l'impose) ; une sélection de plusieurs centaines de stagiaires pourrait dépasser la longueur d'adresse acceptée par nginx (environ 8 Ko, soit autour de 600 personnes). Sans objet aux volumes de l'ADAC ; à revoir si un groupe dépasse la centaine.
- **Non vérifié** : le passage visuel dans un navigateur (deux volets, mobile, « Grand texte ») : la page n'a été éprouvée que par ses tests et par des appels directs au back.

## H19 — Adoption des endpoints mergés par Charlotte (Q8.3, Q14, Q15, Q16, .xlsx, Q1)
- Date : 2026-11-20
- **Contexte** : le 2026-11-19, Charlotte a mergé dans `dev` les PR #14 à #20 : `uploadedBy` réduit à `id` / `prenom` / `nom` et `fileUrl` retiré (#14), `404` pour une route inconnue (#15, Q11b), `.xlsx` accepté et dépôt / suppression refusés (`409`) sur une formation archivée (#16), champ `activated` (#17, Q8.3), `PATCH /users/me/password` (#18, Q1), `GET /messages/recipients` et `PATCH /messages/conversations/{id}/read` (#19, Q14 / Q15), `GET /users/{id}/inscriptions` (#20, Q16).
- **Décision (Manon, 2026-11-20)** : tout est adopté côté front, avec une réserve sur Q14 : **le back autorise plus de monde que H1** (`canMessage` : un formateur peut écrire à tout formateur ou stagiaire actif, un stagiaire à tout formateur actif). Le front **garde H1** et n'utilise `GET /messages/recipients` que pour trouver la chargée de formation (le manque que Q14 devait combler) ; les autres personnes de la réponse sont ignorées.
- **Ce qui change dans le front** : (1) `activated` : « Actif », « Suspendu » (déjà activé) ou « Jamais activé » ; pour un compte jamais activé, « Renvoyer le code » (`POST /auth/resend-activation`) remplace « Réactiver », que le back refuserait en `409` ; (2) un seul `PATCH …/conversations/{id}/read` par fil au lieu d'un par message ; (3) Q16 : la chargée de formation lit les inscriptions d'un stagiaire en un appel, le formateur (qui reçoit `403`) garde le parcours de ses formations ; (4) `.xlsx` accepté, libellé « Excel » (`.xls` et `.xlsm` restent refusés) ; (5) formulaire du mot de passe : `403` = ancien mot de passe faux, `429` = verrou, message du back affiché.
- **Pourquoi** : D1 (le front s'aligne sur le back) ; chaque endpoint remplace un contournement.
- **Vérifié à la main sur le vrai back (2026-11-20, comptes de dev)** : `activated` (jamais activé : `false` ; `reactivate` répond `409`, `resend-activation` `200`) ; `GET /messages/recipients` (chargée : 8 comptes dont inactifs ; formateur : la chargée et ses stagiaires ; stagiaire : la chargée et les formateurs) ; `PATCH …/read` `204`, idempotent, `404` pour un utilisateur inconnu ; `GET /users/{id}/inscriptions` `200` pour la chargée, `403` pour le formateur et le stagiaire ; mot de passe : `403` « Ancien mot de passe incorrect », `400` règle du mot de passe, changement réel `204` (remis tel quel ensuite) ; `.xlsx` passe la validation (le stockage local factice répond `502`), `.xlsm` répond `400 « Format non autorisé »`. **Non vérifié** : le `429` du verrou du mot de passe (il bloquerait le compte de dev 15 minutes) et le passage visuel dans un navigateur.
- **Alternatives écartées** : suivre la liste du back pour tous les rôles (élargit ce que voient formateurs et stagiaires, décision de Manon : non) ; attendre la réponse de Charlotte sur l'ouverture de Q16 au formateur (non bloquant, voir À2).

## H20 — Message groupé : décocher des destinataires de l'aperçu

- **Date** : 2026-11-20 · demande de Manon après essai dans le navigateur ; mise à jour le même jour (formateur inclus).
- **Décision** : pour la chargée de formation **et le formateur**, avec les filtres « Formation » et « Documents manquants » (celui-ci seulement pour la chargée), chaque personne de l'aperçu a une case, **cochée par défaut**. Décocher retire la personne de l'envoi : décompte « X sur Y destinataires », bouton et confirmation suivent. Tout recocher ou changer de filtre remet tout le monde. L'envoi garde son filtre et ajoute `filter.excludedUserIds` (les personnes décochées) ; sans exclusion, le champ est absent. Tout décocher désactive l'envoi. L'aperçu ne reçoit jamais `excludedUserIds`.
- **Pourquoi** : écarter quelqu'un d'un groupe sans passer par la sélection libre. Première version (chargée seulement) : envoi en `MANUAL` avec les cochés, car le back n'avait pas d'exclusion et réserve `MANUAL` à la chargée.
- **Changement du back** (Manon, D66, décision du 2026-11-20 : pas de discussion préalable avec Charlotte) : champ optionnel `excludedUserIds` sur `filter`, voir `docs/charlotte/changements-back.md`. Il évite d'ouvrir `MANUAL` au formateur (nouveau droit) et fonctionne pour tout rôle autorisé à utiliser le filtre.
- **Écarté** : un message individuel par personne cochée (perd le badge « Message groupé », autant de messages que de personnes, pas d'atomicité) ; ouvrir `MANUAL` au formateur (élargit ses droits).


## H21 — « Documents manquants » retiré du message groupé
- **Date** : 2026-11-20 · demande de Manon pendant le grill de la checklist des documents (voir G26 de `decisions-documents.md`).
- **Décision** : la chargée de formation n'a plus que les filtres « Formation » et « Sélection libre ». Le filtre `MISSING_DOCS` n'est plus proposé (H12), et sa mention dans l'aperçu décochable (H20) disparaît. Le suivi des pièces manquantes passera par un tableau de bord, hors messagerie.
- **Pourquoi** : voir G26.
- **Implémenté côté front le 2026-11-27** (NOTES-17, #88) : `MISSING_DOCS` retiré de `groupFilters.js` et de `GroupFilters`. Le back accepte encore ce type (Q19 de `points-pour-charlotte.md`).

## H22 — Liste des conversations : défilement propre en deux volets
- **Date** : 2026-11-27 · réunion du 27/11 (NOTES-19, #90).
- **Décision** : dès que les deux volets sont côte à côte (conteneur ≥ 48rem), la liste des conversations défile seule, avec la même hauteur maximale que le fil (`60vh`). Sur écran étroit, la liste est seule à l'écran : la page défile, sans zone de défilement imbriquée.
- **Pourquoi** : avec beaucoup de conversations, la liste allongeait la page et éloignait le fil ouvert ; le fil défilait déjà seul.
- **Alternatives écartées** : limiter aussi la hauteur sur mobile (deux défilements imbriqués, gênant au doigt).

## H23 — Nouvelle conversation : la liste des destinataires défile
- **Date** : 2026-11-28 · réunion du 27/11 (NOTES-18, #89).
- **Décision** : la liste des destinataires du panneau « Nouvelle conversation » défile dans le panneau, à toutes les largeurs, avec la même hauteur maximale que le fil (`60vh`). Les destinataires restent des liens : la tabulation les parcourt et le navigateur fait défiler la liste jusqu’à celui qui a le focus.
- **Pourquoi** : le panneau s’ouvre au-dessus de la liste des conversations ; sans limite, une recherche large repoussait les conversations loin vers le bas, surtout sur téléphone (vérifié à 390 px : 14 destinataires, la liste défile, les conversations restent juste en dessous).
- **Alternatives écartées** : limiter seulement en deux volets comme H22 (sur téléphone, la liste repoussait tout le reste) ; une hauteur fixe de `20rem` (ne suit pas la hauteur de l’écran).
