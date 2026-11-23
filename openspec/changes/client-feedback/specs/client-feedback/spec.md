# Spec Delta

## Purpose

Permettre à la chargée de formation et aux formateurs de signaler un bug ou une suggestion depuis n'importe quelle page connectée, avec le contexte utile joint automatiquement, et de le faire parvenir par email au développeur sans rien stocker.

## ADDED Requirements

### Requirement: Bouton de retour réservé à la chargée de formation et aux formateurs
Le front SHALL afficher dans l'en-tête un bouton icône au nom accessible « Envoyer un retour », placé avant la cloche de notifications, quand l'utilisateur de session (`GET /auth/me`) a le rôle `SUPER_ADMIN` ou `ADMIN`. Pour un `STAGIAIRE`, un visiteur non connecté ou tant que la session n'est pas connue, le bouton SHALL NOT être affiché.

#### Scenario: Chargée de formation
- **WHEN** une utilisatrice `SUPER_ADMIN` affiche n'importe quelle page
- **THEN** le bouton « Envoyer un retour » est affiché dans l'en-tête, avant la cloche

#### Scenario: Formateur
- **WHEN** un utilisateur `ADMIN` affiche n'importe quelle page
- **THEN** le bouton « Envoyer un retour » est affiché dans l'en-tête

#### Scenario: Stagiaire
- **WHEN** un utilisateur `STAGIAIRE` affiche n'importe quelle page
- **THEN** aucun bouton « Envoyer un retour » n'est affiché

#### Scenario: Visiteur non connecté
- **WHEN** la page de connexion est affichée sans session
- **THEN** aucun bouton « Envoyer un retour » n'est affiché

### Requirement: Formulaire de retour
Le bouton SHALL ouvrir une boîte de dialogue modale contenant : un choix obligatoire du type (« Bug » ou « Suggestion »), un message obligatoire de 10 à 2000 caractères, un champ image facultatif, et les boutons « Envoyer » et « Annuler ». La boîte SHALL se fermer avec « Annuler » ou la touche Échap et rendre le focus au bouton d'ouverture.

#### Scenario: Ouverture
- **WHEN** l'utilisateur clique sur « Envoyer un retour »
- **THEN** une boîte de dialogue s'ouvre avec le focus à l'intérieur, et le type, le message et l'image sont proposés

#### Scenario: Champs obligatoires manquants
- **WHEN** l'utilisateur clique sur « Envoyer » sans choisir de type ou avec un message de moins de 10 caractères
- **THEN** aucune requête n'est envoyée et une erreur lisible est associée au champ concerné

#### Scenario: Message trop long
- **WHEN** le message dépasse 2000 caractères
- **THEN** aucune requête n'est envoyée et l'erreur indique la limite de 2000 caractères

#### Scenario: Annulation
- **WHEN** l'utilisateur appuie sur Échap ou clique sur « Annuler »
- **THEN** la boîte se ferme sans requête et le focus revient sur le bouton « Envoyer un retour »

### Requirement: Image jointe limitée
L'image facultative SHALL être au format png, jpeg ou webp et peser au plus 3 Mo. Le front SHALL refuser un fichier hors limites avant tout envoi, avec un message lisible. La boîte SHALL afficher près du champ image l'avertissement « Évitez d'inclure des données personnelles de stagiaires dans la capture. »

#### Scenario: Image trop lourde
- **WHEN** l'utilisateur choisit une image de plus de 3 Mo
- **THEN** le message « Image trop lourde (3 Mo maximum) » est affiché et l'envoi est bloqué tant que l'image n'est pas retirée ou remplacée

#### Scenario: Type de fichier refusé
- **WHEN** l'utilisateur choisit un fichier qui n'est ni png, ni jpeg, ni webp
- **THEN** un message indique les formats acceptés et l'envoi est bloqué

#### Scenario: Avertissement visible
- **WHEN** la boîte de dialogue est ouverte
- **THEN** l'avertissement sur les données personnelles de stagiaires est affiché près du champ image

### Requirement: Contexte joint et affiché
Chaque envoi SHALL joindre automatiquement : le chemin de la page courante sans paramètres de requête ni fragment, l'identification du navigateur, la taille de la fenêtre et la version de l'application. La boîte SHALL indiquer à l'utilisateur la liste de ces informations avant l'envoi. Aucun autre élément de contexte SHALL être joint par le front.

#### Scenario: Chemin sans paramètres
- **WHEN** l'utilisateur envoie un retour depuis `/formations/12?onglet=documents`
- **THEN** la page jointe est `/formations/12`

#### Scenario: Transparence
- **WHEN** l'utilisateur ouvre la boîte de dialogue
- **THEN** il peut lire « Envoyé avec votre retour : page, navigateur, taille d'écran, version »

### Requirement: Confirmation et conservation de la saisie en cas d'erreur
Après un envoi accepté (201), la boîte SHALL se fermer et le message « Merci, votre retour a bien été envoyé. » SHALL être annoncé dans une région `role="status"`. Si l'envoi échoue (400, 429, 503 ou erreur réseau), la boîte SHALL rester ouverte avec le type, le message et l'image saisis, et afficher un message d'erreur lisible permettant de réessayer.

#### Scenario: Envoi réussi
- **WHEN** le back répond 201
- **THEN** la boîte se ferme et « Merci, votre retour a bien été envoyé. » est annoncé

#### Scenario: Limite d'envoi atteinte
- **WHEN** le back répond 429
- **THEN** la boîte reste ouverte avec la saisie et un message indique de réessayer plus tard

#### Scenario: Envoi d'email impossible
- **WHEN** le back répond 503
- **THEN** la boîte reste ouverte avec la saisie et le message « Envoi impossible pour le moment, réessayez plus tard. » est affiché

#### Scenario: Double clic
- **WHEN** l'utilisateur clique deux fois sur « Envoyer » pendant l'envoi
- **THEN** une seule requête est envoyée

### Requirement: Endpoint d'envoi d'un retour
Le back SHALL exposer `POST /api/feedback` en `multipart/form-data` avec les parties `type` (`BUG` ou `SUGGESTION`), `message`, `page`, `userAgent`, `viewport`, `appVersion` et `screenshot` (facultative). Il SHALL répondre 201 sans corps après l'envoi de l'email, 401 sans session et 403 pour un `STAGIAIRE`.

#### Scenario: Envoi accepté
- **WHEN** une utilisatrice `SUPER_ADMIN` ou un `ADMIN` envoie un retour valide
- **THEN** le back envoie l'email puis répond 201

#### Scenario: Sans session
- **WHEN** la requête arrive sans cookie `jwt` valide
- **THEN** le back répond 401 et aucun email n'est envoyé

#### Scenario: Stagiaire
- **WHEN** un `STAGIAIRE` appelle `POST /api/feedback`
- **THEN** le back répond 403 et aucun email n'est envoyé

### Requirement: Validation côté back
Le back SHALL revalider chaque champ indépendamment du front et répondre 400 au format d'erreur commun (`{status, message, details[]}`) si : le type est absent ou inconnu, le message fait moins de 10 ou plus de 2000 caractères, ou l'image dépasse 3 Mo ou n'est pas un png, jpeg ou webp d'après le contenu réel du fichier (signature), quel que soit le type déclaré.

#### Scenario: Image déguisée
- **WHEN** un fichier PDF est envoyé comme `screenshot` avec le type déclaré `image/png`
- **THEN** le back répond 400 et aucun email n'est envoyé

#### Scenario: Image trop lourde
- **WHEN** l'image envoyée dépasse 3 Mo sans dépasser la limite globale d'upload du back (20 Mo)
- **THEN** le back répond 400 et aucun email n'est envoyé

#### Scenario: Requête au-delà de la limite globale d'upload
- **WHEN** l'image envoyée dépasse 20 Mo
- **THEN** le back répond 413 (comportement existant) et aucun email n'est envoyé

#### Scenario: Type inconnu
- **WHEN** `type` vaut `AUTRE`
- **THEN** le back répond 400

### Requirement: Contenu de l'email de retour
L'email SHALL être envoyé à l'adresse configurée côté back (jamais exposée au front), avec l'email de l'auteur en adresse de réponse. Le sujet SHALL suivre `[ADAC][Bug|Suggestion] Prénom Nom — <page>`. Le corps SHALL contenir le message, le rôle et le contexte joint ; l'image, si présente, SHALL être en pièce jointe. Identité et rôle SHALL provenir de la session, jamais de la requête.

#### Scenario: Répondre à l'auteur
- **WHEN** le développeur clique sur « Répondre » dans son client mail
- **THEN** la réponse est adressée à l'email de l'auteur du retour

#### Scenario: Identité non falsifiable
- **WHEN** la requête contient en plus une partie `email` ou `role` arbitraire
- **THEN** l'email indique l'identité et le rôle de l'utilisateur de session, pas ceux de la requête

#### Scenario: Image jointe
- **WHEN** le retour contient une image valide
- **THEN** l'email contient cette image en pièce jointe

### Requirement: Message affiché en texte dans l'email
Le message et tous les champs de contexte fournis par l'utilisateur SHALL être échappés avant insertion dans le corps HTML de l'email, afin qu'aucun balisage ni script saisi ne soit interprété par le client mail.

#### Scenario: Balisage saisi
- **WHEN** le message contient `<img src=x onerror=alert(1)>`
- **THEN** l'email affiche ce texte littéralement, sans image ni script

### Requirement: Aucun stockage des retours
Le back SHALL NOT enregistrer un retour ni son image, ni en base de données, ni dans un stockage de fichiers, ni dans les journaux applicatifs (le message, l'image et l'email de l'auteur ne SHALL pas y apparaître).

#### Scenario: Après envoi
- **WHEN** un retour avec image a été envoyé
- **THEN** aucune ligne de base de données ni aucun fichier n'a été créé pour ce retour

### Requirement: Limite d'envoi par utilisateur
Le back SHALL accepter au plus 10 retours par utilisateur sur une heure glissante et répondre 429 au-delà, sans envoyer d'email.

#### Scenario: Onzième retour dans l'heure
- **WHEN** un utilisateur envoie son onzième retour en moins d'une heure
- **THEN** le back répond 429 et aucun email n'est envoyé

#### Scenario: Utilisateurs indépendants
- **WHEN** un utilisateur a atteint la limite
- **THEN** un autre utilisateur peut toujours envoyer un retour

### Requirement: Échec d'envoi de l'email signalé
Si le serveur de mail refuse ou n'est pas joignable, le back SHALL répondre 503 avec le message « Envoi impossible pour le moment, réessayez plus tard. » au lieu d'une erreur 500.

#### Scenario: Serveur de mail indisponible
- **WHEN** l'envoi SMTP échoue
- **THEN** le back répond 503 avec ce message
