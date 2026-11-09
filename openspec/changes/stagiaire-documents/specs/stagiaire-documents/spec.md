# stagiaire-documents Specification

## Purpose

Permet au stagiaire de consulter, télécharger et déposer ses propres documents, par formation, depuis sa page de profil (`GET` / `POST /documents` avec `inscriptionId`, `tech.md` §6). Ces documents sont ceux de son inscription, distincts des supports de la formation (`formation-documents`).

## ADDED Requirements

### Requirement: Section « Mes documents » réservée au stagiaire
Le système SHALL afficher sur la page de profil (`/profile`) un titre « Mon profil » pour tout utilisateur connecté et, pour le seul rôle `STAGIAIRE`, une section « Mes documents ». Pour `ADMIN` et `SUPER_ADMIN`, la section SHALL être absente et aucun appel à `/documents` ne SHALL être émis.

#### Scenario: Stagiaire
- **WHEN** un stagiaire ouvre son profil
- **THEN** la section « Mes documents » est affichée

#### Scenario: Formateur ou chargée de formation
- **WHEN** un formateur ou la chargée de formation ouvre son profil
- **THEN** la section « Mes documents » est absente et aucun appel à `/documents` n'est émis

### Requirement: Une sous-section par formation inscrite
Le système SHALL afficher, dans « Mes documents », une sous-section par formation renvoyée par `GET /formations` (périmètre du stagiaire : ses inscriptions), titrée de l'intitulé de la formation, les formations actives d'abord puis les archivées. Sans formation, la section SHALL afficher « Vous n'êtes inscrit à aucune formation pour le moment ».

#### Scenario: Plusieurs formations
- **WHEN** le stagiaire est inscrit à une formation archivée puis à une formation active
- **THEN** la formation active apparaît avant l'archivée, chacune avec sa propre sous-section

#### Scenario: Aucune formation
- **WHEN** `GET /formations` renvoie une liste vide
- **THEN** le message « Vous n'êtes inscrit à aucune formation pour le moment » est affiché

### Requirement: Liste et téléchargement des documents de l'inscription
Le système SHALL lister, dans chaque sous-section, les documents renvoyés par `GET /documents?inscriptionId=` avec type (icône et texte), nom de fichier (rendu en texte, jamais en HTML), taille lisible et date d'envoi, sans `fileUrl` ni nom d'expéditeur. Chaque document SHALL avoir un bouton « Télécharger » nommé avec le fichier, qui passe par `GET /documents/{id}/download`. Sans document, la sous-section SHALL afficher « Aucun document déposé pour cette formation ». Une erreur de chargement SHALL afficher le message du back et un bouton « Réessayer ».

#### Scenario: Documents présents
- **WHEN** l'inscription a des documents
- **THEN** chacun est listé avec son type, son nom, sa taille et sa date, et peut être téléchargé

#### Scenario: Aucun document
- **WHEN** l'inscription n'a aucun document
- **THEN** « Aucun document déposé pour cette formation » est affiché

#### Scenario: Erreur de chargement
- **WHEN** le back répond par une erreur à la liste
- **THEN** le message d'erreur et « Réessayer » sont affichés pour cette formation seulement

### Requirement: Dépôt de documents sur son inscription
Le système SHALL proposer, pour chaque formation active, la zone de dépôt (glisser-déposer plusieurs fichiers ou « Choisir des fichiers », accessible au clavier). Chaque fichier SHALL être contrôlé avant envoi (pdf, jpg, jpeg, png, docx ; 10 Mo au plus) puis envoyé par un `POST /documents` multipart (`file` et `inscriptionId`, jamais `formationId`), l'un après l'autre. Un dépôt réussi SHALL être annoncé et le document SHALL apparaître dans la liste rechargée. Les refus (contrôle du front, `400` ou `403` du back) SHALL être listés avec le nom du fichier et annoncés, sans empêcher l'envoi des autres. Aucune sous-section ne SHALL proposer de zone de dépôt pour une formation archivée.

#### Scenario: Dépôt valide
- **WHEN** le stagiaire dépose un PDF de moins de 10 Mo sur une formation active
- **THEN** un `POST /documents` avec `inscriptionId` est émis, un message de succès est annoncé et le document figure dans la liste

#### Scenario: Fichier de type non autorisé
- **WHEN** le stagiaire dépose un `.exe`
- **THEN** aucun appel n'est émis pour ce fichier et son refus est annoncé avec son nom

#### Scenario: Refus du back sur un fichier
- **WHEN** le back répond `400` ou `403` pour l'un de plusieurs fichiers
- **THEN** ce fichier est listé comme refusé et les autres sont tout de même envoyés

#### Scenario: Formation archivée
- **WHEN** la formation est archivée
- **THEN** sa sous-section montre la liste et le téléchargement, sans zone de dépôt

### Requirement: Suppression de ses propres dépôts
Le système SHALL proposer « Supprimer » au stagiaire uniquement sur les documents dont `uploadedBy` est lui et dont la formation n'est pas archivée ; la suppression demande une confirmation, appelle `DELETE /documents/{id}`, annonce « Document supprimé » et recharge la liste (le back répond `403` pour le dépôt d'un autre).

#### Scenario: Document déposé par le stagiaire
- **WHEN** le stagiaire consulte un document qu'il a déposé sur une formation active
- **THEN** « Télécharger » et « Supprimer » sont proposés

#### Scenario: Document d'un autre ou formation archivée
- **WHEN** le document a été déposé par quelqu'un d'autre, ou la formation est archivée
- **THEN** seul « Télécharger » est proposé

#### Scenario: Refus du back
- **WHEN** le back refuse la suppression
- **THEN** son message est affiché et le document reste dans la liste

### Requirement: Identifiant d'inscription indisponible
Le système SHALL lire l'identifiant d'inscription du stagiaire sur la formation (`inscriptionId`) en un seul point du code. Quand une formation n'en a pas, sa sous-section SHALL afficher « Dépôt indisponible pour le moment » sans liste, sans zone de dépôt et sans appel à `/documents`.

#### Scenario: Stagiaire non inscrit
- **WHEN** une formation reçue n'a pas de `inscriptionId`
- **THEN** « Dépôt indisponible pour le moment » est affiché pour cette formation et aucun appel à `/documents` n'est émis

#### Scenario: Back adapté
- **WHEN** la formation porte un `inscriptionId`
- **THEN** la sous-section affiche la liste et, si la formation est active, la zone de dépôt
