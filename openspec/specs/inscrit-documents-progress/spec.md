# inscrit-documents-progress Specification

## Purpose
Permet à la chargée de formation et au formateur de suivre, sur la page d'une formation, quels documents chaque stagiaire inscrit a envoyés : un compte par inscrit et le détail par type de document.

## Requirements

### Requirement: Documents pris en compte
Pour un inscrit, seuls les documents de son inscription (`GET /documents?inscriptionId=`) qu'il a déposés lui-même (`uploadedBy.id` égal à son identifiant) SHALL compter. Un document est rattaché à un type de `GET /formations/{id}/document-types` selon la règle du nom de fichier de G33 ; les autres sont des « autres documents ». Le stagiaire ne SHALL jamais voir ce suivi.

#### Scenario: Document ciblé par la chargée
- **WHEN** la chargée de formation a déposé un fichier sur l'inscription de Léa
- **THEN** ce fichier ne compte ni comme reçu ni dans les autres documents de Léa

### Requirement: Compte par inscrit dans « Liste stagiaires »
Pour `SUPER_ADMIN` et `ADMIN`, chaque ligne de « Liste stagiaires » SHALL afficher « X/Y documents reçus », où Y est le nombre de types à envoyer pour la formation et X le nombre de ces types qui ont au moins un fichier de l'inscrit. Sans aucun type : « N document(s) envoyé(s) », N comptant tous ses fichiers. L'état SHALL être écrit, la couleur ou l'icône ne le portant jamais seule.

#### Scenario: Huit types sur dix
- **WHEN** la formation a 10 types et Léa a déposé des fichiers pour 8 d'entre eux (deux fichiers pour l'un)
- **THEN** sa ligne affiche « 8/10 documents reçus »

#### Scenario: Tout reçu
- **WHEN** Léa a un fichier pour chacun des 10 types
- **THEN** sa ligne affiche « 10/10 documents reçus » avec une icône de réussite

#### Scenario: Formation sans type
- **WHEN** aucun type ne s'applique à la formation et Léa a déposé 2 fichiers
- **THEN** sa ligne affiche « 2 documents envoyés »

#### Scenario: Chargement ou erreur
- **WHEN** les documents de Léa sont en cours de chargement, ou leur appel échoue
- **THEN** sa ligne affiche « Chargement… », ou un message d'erreur avec « Réessayer », sans masquer les autres lignes

### Requirement: Détail par inscrit dans « Documents stagiaires »
Pour `SUPER_ADMIN` et `ADMIN`, l'onglet « Documents stagiaires » SHALL afficher un bloc par inscrit, dans l'ordre de « Liste stagiaires », replié à l'arrivée : sa ligne montre le nom et « X/Y documents reçus ». Déplié, il montre chaque type avec son état écrit (« Reçu » ou « Manquant ») et ses liens de téléchargement, puis « Autres documents ». Sans inscrit : « Aucun stagiaire inscrit ».

#### Scenario: Type manquant
- **WHEN** Léa n'a rien déposé pour le type « Pièce d'identité »
- **THEN** son bloc affiche « Pièce d'identité » avec « Manquant » et aucun lien

#### Scenario: Télécharger un fichier reçu
- **WHEN** la chargée clique le lien d'un fichier reçu
- **THEN** le fichier est téléchargé par le client authentifié (blob), jamais par `fileUrl`

#### Scenario: Nom de fichier contenant du balisage
- **WHEN** un nom de fichier contient `<img src=x>`
- **THEN** il est affiché en texte et aucun élément `img` n'est créé

### Requirement: Erreur sur les types de la formation
Si `GET /formations/{id}/document-types` échoue, les deux onglets SHALL afficher un message d'erreur avec « Réessayer » et SHALL compter les fichiers envoyés (« N documents envoyés ») au lieu de « X/Y ».

#### Scenario: Types indisponibles
- **WHEN** l'appel aux types répond `500`
- **THEN** un message avec « Réessayer » s'affiche une fois dans l'onglet, et chaque inscrit affiche le nombre de fichiers envoyés

### Requirement: Mise à jour après une action
Après une désinscription ou une inscription, les deux onglets SHALL refléter la nouvelle liste d'inscrits sans recharger la page.

#### Scenario: Désinscription
- **WHEN** la chargée désinscrit Léa depuis « Liste stagiaires » puis ouvre « Documents stagiaires »
- **THEN** le bloc de Léa n'y figure plus

### Requirement: Bloc replié et marqué
Chaque bloc de « Documents stagiaires » SHALL être un élément dépliable natif, replié à l'arrivée. Sa ligne SHALL porter une marque verte quand tous les types sont reçus et rouge sinon, le compte écrit portant toujours l'état. Un clic ou Entrée sur la ligne SHALL déplier ou replier le bloc.

#### Scenario: Déplier un bloc
- **WHEN** la chargée clique sur la ligne de Léa
- **THEN** les types de Léa et leurs fichiers deviennent visibles, et un second clic les masque

#### Scenario: Inscrit complet
- **WHEN** Léa a un fichier pour chaque type
- **THEN** sa ligne affiche « 2/2 documents reçus » avec la marque verte

### Requirement: Types fournis par l'ADAC exclus
Seuls les types fournis par le stagiaire (`providedBy` absent ou `STAGIAIRE`) SHALL compter dans « X/Y documents reçus » et apparaître dans le détail d'un inscrit ou dans « Mes documents ».

#### Scenario: Une pièce de l'ADAC dans la formation
- **WHEN** la formation a un type du stagiaire et un type de l'ADAC, et Léa a envoyé le premier
- **THEN** sa ligne affiche « 1/1 documents reçus » et « Mes documents » ne propose pas de créneau pour la pièce de l'ADAC
