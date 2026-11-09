# individual-messaging Specification

## Purpose
Permet à tout utilisateur connecté de lire ses conversations et d'écrire à une autre personne de la plateforme, dans le respect des destinataires autorisés par rôle, avec indication des messages non lus.

## Requirements

### Requirement: Liste des conversations
Le système SHALL afficher sur `/messages` les conversations de l'utilisateur (`GET /messages`), la plus récente en premier, avec le nom de l'interlocuteur, un extrait du dernier message et sa date. Les conversations avec des messages non lus SHALL être mises en évidence par un repère visuel **et** un texte accessible (« 2 messages non lus »). La liste SHALL être rechargée toutes les 45 s (en pause quand l'onglet est masqué) et au retour sur l'onglet.

#### Scenario: Liste triée et non lus en évidence
- **WHEN** l'utilisateur ouvre `/messages` et le back renvoie deux conversations dont une avec `unreadCount` 2
- **THEN** elles apparaissent dans l'ordre reçu et la seconde est signalée « 2 messages non lus »

#### Scenario: Aucune conversation
- **WHEN** le back renvoie une liste vide
- **THEN** le message « Aucune conversation pour le moment » est affiché avec l'action « Nouvelle conversation »

#### Scenario: Chargement et erreur
- **WHEN** la liste charge puis échoue
- **THEN** un état de chargement annoncé s'affiche d'abord, puis une erreur avec un bouton « Réessayer »

#### Scenario: Rechargement périodique
- **WHEN** 45 s s'écoulent sur un onglet visible
- **THEN** la liste est redemandée au back ; onglet masqué, aucune requête n'est faite

### Requirement: Fil d'une conversation
Le système SHALL afficher sur `/messages/:userId` les messages échangés avec cet utilisateur (`GET /messages/{userId}`), du plus ancien au plus récent, chacun avec son auteur, son contenu rendu **en texte** (jamais en HTML, sauts de ligne conservés) et sa date. Sur un bureau large la liste et le fil sont côte à côte ; sur un écran étroit ce sont deux écrans, le fil ayant un bouton « Retour » vers `/messages`. Le fil ouvert SHALL être rechargé toutes les 45 s.

#### Scenario: Contenu rendu en texte
- **WHEN** un message contient `<script>alert(1)</script>`
- **THEN** ce texte littéral est affiché et rien n'est exécuté

#### Scenario: Écran étroit
- **WHEN** l'utilisateur ouvre `/messages/7` sur un écran étroit
- **THEN** seul le fil est affiché avec un bouton « Retour » menant à `/messages`

#### Scenario: Erreur de chargement
- **WHEN** le chargement du fil échoue
- **THEN** une erreur avec « Réessayer » est affichée et le champ de saisie n'est pas proposé

### Requirement: Envoi d'un message individuel
Le système SHALL permettre d'envoyer un message dans un fil via `POST /messages/send` avec un seul destinataire. Le contenu SHALL être refusé avant tout appel s'il est vide, composé d'espaces seulement, ou de plus de 5000 caractères, avec une erreur associée au champ. Après un envoi réussi le message apparaît dans le fil, le champ est vidé et le succès est annoncé ; la liste des conversations est mise à jour. La touche Entrée insère un saut de ligne ; seul le bouton « Envoyer » envoie.

#### Scenario: Envoi réussi
- **WHEN** l'utilisateur saisit « Bonjour » dans le fil avec l'utilisateur 7 et clique « Envoyer »
- **THEN** `POST /messages/send` reçoit `{ "recipientIds": [7], "content": "Bonjour" }`, le message apparaît dans le fil et le champ est vidé

#### Scenario: Message vide ou trop long
- **WHEN** le contenu est vide, fait uniquement d'espaces, ou dépasse 5000 caractères
- **THEN** aucun appel n'est fait et une erreur liée au champ est annoncée

#### Scenario: Refus du back
- **WHEN** le back répond 403 ou 404 à l'envoi
- **THEN** une erreur explicite est affichée et le texte saisi est conservé

#### Scenario: Double envoi
- **WHEN** l'utilisateur clique deux fois sur « Envoyer » pendant l'appel
- **THEN** un seul message est envoyé

### Requirement: Destinataires autorisés
Le système SHALL proposer, dans « Nouvelle conversation », uniquement ces destinataires (comptes actifs) : la chargée de formation (`SUPER_ADMIN`) → tout le monde ; le formateur (`ADMIN`) → la chargée de formation et les stagiaires de ses formations ; le stagiaire → la chargée de formation et les formateurs des formations où il est inscrit. L'utilisateur ne SHALL pas pouvoir s'écrire à lui-même. Le bouton « Envoyer un message » d'un détail de compte formateur ou stagiaire SHALL mener à `/messages/:userId` de ce compte, et n'est affiché que si l'utilisateur peut lui écrire.

#### Scenario: Chargée de formation
- **WHEN** la chargée de formation ouvre « Nouvelle conversation »
- **THEN** tous les formateurs et stagiaires actifs sont proposés

#### Scenario: Formateur
- **WHEN** un formateur ouvre « Nouvelle conversation »
- **THEN** seuls les stagiaires de ses formations et la chargée de formation (si connue) sont proposés

#### Scenario: Stagiaire
- **WHEN** un stagiaire inscrit à deux formations de deux formateurs ouvre « Nouvelle conversation »
- **THEN** ces deux formateurs et la chargée de formation (si connue) sont proposés, sans doublon, aucun autre stagiaire

#### Scenario: Chargée de formation inconnue
- **WHEN** le formateur ou le stagiaire n'a aucun moyen de connaître la chargée de formation (aucune conversation, pas formateur d'une formation)
- **THEN** elle n'est pas proposée et le reste de la liste fonctionne (en attente de Q14)

#### Scenario: Bouton sur un détail de compte
- **WHEN** l'utilisateur ouvre le détail d'un compte à qui il peut écrire
- **THEN** « Envoyer un message » mène à `/messages/<id du compte>`

#### Scenario: Pas de bouton sans droit
- **WHEN** l'utilisateur n'a pas le droit d'écrire à ce compte
- **THEN** le bouton n'est pas affiché

### Requirement: Lecture des messages
Le système SHALL marquer comme lus les messages entrants non lus d'un fil à son ouverture, par un `PATCH /messages/{id}/read` par message, puis mettre à jour la liste. Un message déjà lu ou envoyé par l'utilisateur ne SHALL déclencher aucun appel. Un échec de marquage ne SHALL pas empêcher l'affichage du fil.

#### Scenario: Ouverture d'un fil avec non lus
- **WHEN** l'utilisateur ouvre un fil contenant trois messages entrants dont deux avec `readAt` nul
- **THEN** deux `PATCH` sont envoyés et la pastille de la liste diminue en conséquence

#### Scenario: Rien à marquer
- **WHEN** tous les messages entrants ont déjà un `readAt`
- **THEN** aucun `PATCH` n'est envoyé

#### Scenario: Échec du marquage
- **WHEN** un `PATCH` échoue
- **THEN** le fil reste affiché et utilisable

### Requirement: Pastille « non lus » sur la tuile Messages
Le système SHALL afficher sur la tuile « Messages » le total des messages non lus (somme des `unreadCount`) quand il est supérieur à zéro, avec un libellé accessible (« 3 messages non lus »), et le tenir à jour avec la liste des conversations.

#### Scenario: Total non nul
- **WHEN** deux conversations ont 2 et 1 messages non lus
- **THEN** la tuile affiche « 3 » et son nom accessible mentionne « 3 messages non lus »

#### Scenario: Aucun non lu
- **WHEN** le total est zéro ou la requête échoue
- **THEN** aucune pastille n'est affichée

### Requirement: Fil d'une personne à qui l'on ne peut pas écrire
Le système SHALL, sur `/messages/:userId` d'une personne hors des destinataires autorisés, afficher le fil s'il existe en remplaçant la saisie par « Vous ne pouvez pas écrire à cette personne » ; sans fil, il SHALL afficher « Conversation introuvable » avec un bouton « Retour » vers `/messages`.

#### Scenario: Fil existant, plus de droit d'écrire
- **WHEN** un stagiaire ouvre le fil avec un formateur qui n'est plus l'un de ses formateurs
- **THEN** l'historique est lisible et la saisie est remplacée par l'avis

#### Scenario: Adresse inconnue
- **WHEN** l'utilisateur ouvre `/messages/999` sans fil ni droit d'écrire
- **THEN** « Conversation introuvable » est affiché avec « Retour »

### Requirement: Accessibilité et accès
Le système SHALL réserver `/messages` et `/messages/:userId` aux utilisateurs connectés, annoncer chargements, erreurs et envois (`role="status"` / `role="alert"`), rester utilisable au clavier et sans violation jest-axe.

#### Scenario: Non connecté
- **WHEN** un visiteur sans session ouvre `/messages`
- **THEN** il est redirigé vers la connexion

#### Scenario: Accessibilité
- **WHEN** la liste et le fil sont rendus
- **THEN** jest-axe ne relève aucune violation

### Requirement: Gabarit commun aux pages
Le système SHALL présenter la page Messages comme les pages de comptes et de formations : un bouton « Retour » vers le tableau de bord en haut, le titre à gauche et l'action « Nouvelle conversation » en haut à droite, une recherche par nom, un menu « Rôle » et des filtres « Toutes » et « Non lues » sous le titre, et la liste des conversations dans une carte arrondie avec son en-tête et le nombre de conversations. Le filtre « Non lues » SHALL ne garder que les conversations ayant des messages non lus.

#### Scenario: Bouton de retour
- **WHEN** l'utilisateur ouvre `/messages`
- **THEN** un lien « Retour » mène à `/`

#### Scenario: Action en haut à droite
- **WHEN** l'utilisateur clique « Nouvelle conversation » dans l'en-tête
- **THEN** le panneau des destinataires s'ouvre, et se ferme avec « Fermer » ou en choisissant un destinataire

#### Scenario: Filtre des non lues
- **WHEN** l'utilisateur choisit « Non lues »
- **THEN** seules les conversations avec des messages non lus sont listées, ou « Aucune conversation non lue » s'il n'y en a pas

#### Scenario: Recherche par nom
- **WHEN** l'utilisateur saisit « lea » dans « Rechercher une personne »
- **THEN** seules les conversations dont l'interlocuteur s'appelle Léa (sans tenir compte de la casse ni des accents) sont listées

#### Scenario: Filtre par rôle
- **WHEN** l'utilisateur choisit « Stagiaire » dans le menu « Rôle »
- **THEN** seules les conversations avec des stagiaires sont listées

#### Scenario: Filtres combinés
- **WHEN** une recherche, un rôle et « Non lues » sont choisis ensemble
- **THEN** une conversation n'est listée que si elle satisfait les trois, sinon « Aucune conversation trouvée. Essayez un autre terme ou un autre filtre. »
