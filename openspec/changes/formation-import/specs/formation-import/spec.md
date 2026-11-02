# Spec Delta

## Purpose

Permet à la chargée de formation de créer plusieurs formations d'un coup en envoyant un fichier Excel, avec un modèle à télécharger et un retour clair, ligne par ligne, quand le fichier est refusé par le back (`POST /formations/import`, `tech.md` §4).

## ADDED Requirements

### Requirement: Accès réservé à la chargée de formation
Le système SHALL réserver la page `/formations/importer` et le lien « Importer un fichier Excel » de la liste des formations à la chargée de formation (`SUPER_ADMIN`).

#### Scenario: Lien sur la liste
- **WHEN** la chargée de formation ouvre la liste des formations
- **THEN** un lien « Importer un fichier Excel » vers `/formations/importer` est affiché

#### Scenario: Autres rôles
- **WHEN** un formateur ou un stagiaire consulte la liste
- **THEN** aucun lien d'import n'est affiché

#### Scenario: Adresse saisie par un autre rôle
- **WHEN** un formateur ou un stagiaire ouvre `/formations/importer`
- **THEN** la page « Accès refusé » est affichée et aucun appel d'import n'est fait

#### Scenario: Visiteur non connecté
- **WHEN** un visiteur ouvre `/formations/importer`
- **THEN** il est renvoyé vers la connexion

### Requirement: Consignes et colonnes attendues
La page SHALL présenter le format attendu : une ligne d'en-tête ignorée puis une ligne par formation, avec pour chaque colonne son nom, son caractère obligatoire et son format (`intitule`, `description`, `dateDebut`, `dateFin`, `modalite`, `categorie`, `formateur`), d'après les colonnes provisoires de `tech.md`.

#### Scenario: Colonnes affichées
- **WHEN** la page est affichée
- **THEN** les sept colonnes sont listées avec leur format, les modalités acceptées (`VISIO`, `PRESENTIEL`, `MIXTE`) et la règle « formateur vide : la chargée de formation est assignée »

#### Scenario: Retour à la liste
- **WHEN** la chargée de formation active « Retour »
- **THEN** elle revient à `/formations`

### Requirement: Modèle téléchargeable
La page SHALL proposer le téléchargement d'un modèle `.xlsx` dont l'en-tête reprend exactement les colonnes attendues, suivi d'une ligne d'exemple.

#### Scenario: Téléchargement du modèle
- **WHEN** la chargée de formation active « Télécharger le modèle »
- **THEN** un fichier `.xlsx` est enregistré, avec en première ligne les sept noms de colonnes dans l'ordre A à G

### Requirement: Choix et contrôle du fichier
Le système SHALL n'accepter que les fichiers `.xlsx` de 2 Mo au plus, et SHALL refuser les autres avant tout appel, avec un message précis.

#### Scenario: Fichier valide
- **WHEN** la chargée de formation choisit un fichier `.xlsx` de 2 Mo ou moins
- **THEN** son nom est affiché et le bouton « Importer » est actif

#### Scenario: Autre format
- **WHEN** elle choisit un fichier dont le nom ne finit pas par `.xlsx`
- **THEN** un message indique que seuls les fichiers `.xlsx` sont acceptés, le bouton « Importer » reste inactif et aucun appel n'est fait

#### Scenario: Fichier trop volumineux
- **WHEN** elle choisit un fichier `.xlsx` de plus de 2 Mo
- **THEN** un message indique la limite de 2 Mo, le bouton « Importer » reste inactif et aucun appel n'est fait

#### Scenario: Aucun fichier
- **WHEN** aucun fichier n'est choisi
- **THEN** le bouton « Importer » est inactif

### Requirement: Envoi du fichier
Le système SHALL envoyer le fichier choisi à `POST /formations/import` en `multipart/form-data`, dans le champ `file`, et SHALL désactiver le bouton pendant l'envoi.

#### Scenario: Envoi
- **WHEN** la chargée de formation active « Importer » avec un fichier valide
- **THEN** une requête `POST /formations/import` part avec le fichier dans le champ `file` et le bouton est désactivé jusqu'à la réponse

### Requirement: Import réussi
Le système SHALL, après un `201`, rediriger vers `/formations` avec un bandeau annonçant le nombre de formations importées, la liste affichant les formations créées.

#### Scenario: Plusieurs formations
- **WHEN** le back répond `201` avec trois formations
- **THEN** la chargée de formation arrive sur `/formations` avec le bandeau « 3 formations importées » et la liste est rechargée

#### Scenario: Une formation
- **WHEN** le back répond `201` avec une formation
- **THEN** le bandeau indique « 1 formation importée »

### Requirement: Erreurs du fichier en tableau ligne / colonne
Quand le back répond `400`, le système SHALL découper son message sur ` | ` et afficher les entrées de la forme `ligne N, colonne X : texte` dans un tableau Ligne / Colonne / Problème, et SHALL afficher telle quelle, dans une liste, toute entrée qui n'a pas cette forme. Aucune formation n'est créée et le fichier peut être remplacé et renvoyé.

#### Scenario: Lignes invalides
- **WHEN** le back répond `400` avec le message `ligne 3, colonne categorie : "X" introuvable | ligne 5, colonne dateDebut : date invalide (attendu AAAA-MM-JJ)`
- **THEN** un tableau de deux lignes est affiché (3 / categorie / « "X" introuvable », 5 / dateDebut / « date invalide (attendu AAAA-MM-JJ) »), annoncé aux lecteurs d'écran

#### Scenario: Entrée non reconnue
- **WHEN** le message contient « Format invalide, seuls les fichiers .xlsx sont acceptés » ou « ... et d'autres erreurs (limite de 50 atteinte) »
- **THEN** ce texte est affiché tel quel dans une liste, avec le tableau des lignes reconnues le cas échéant

#### Scenario: Erreur sans message exploitable
- **WHEN** le back répond `400` sans message
- **THEN** un message générique d'échec de l'import est affiché

#### Scenario: Nouvel essai
- **WHEN** la chargée de formation choisit un autre fichier après une erreur
- **THEN** les erreurs précédentes disparaissent et le bouton « Importer » est de nouveau actif

### Requirement: Autres erreurs de l'import
Le système SHALL afficher un message dans un bandeau annoncé pour les erreurs autres que `400` (`403`, serveur injoignable, `5xx`), en gardant le fichier choisi pour un nouvel essai.

#### Scenario: Serveur injoignable
- **WHEN** l'envoi échoue faute de réponse du serveur
- **THEN** un bandeau d'erreur est annoncé et le bouton « Importer » redevient actif

### Requirement: Accessibilité de la page d'import
La page SHALL être utilisable au clavier, avec le champ fichier étiqueté, les erreurs annoncées (`role="alert"` ou `aria-live`), un tableau d'erreurs à en-têtes de colonnes, et ne présenter aucune violation détectable par jest-axe.

#### Scenario: Contrôle d'accessibilité
- **WHEN** la page est affichée, avec ou sans tableau d'erreurs
- **THEN** jest-axe ne détecte aucune violation
