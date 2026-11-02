# Spec Delta

## Purpose
Permet de consulter, télécharger, déposer et supprimer les documents d'une formation depuis son détail, selon le rôle de l'utilisateur et l'état de la formation (`GET` / `POST /documents`, `GET /documents/{id}/download`, `DELETE /documents/{id}`, `tech.md` §6).

## ADDED Requirements

### Requirement: Liste des documents d'une formation
Le système SHALL afficher, dans le détail de chaque formation, une section « Documents » listant les documents de la formation renvoyés par `GET /documents?formationId=`, dans l'ordre du back. Chaque document SHALL montrer son type (icône et texte), son nom de fichier, sa taille lisible, sa date d'envoi et le nom de son expéditeur, sans jamais montrer l'adresse e-mail de l'expéditeur ni utiliser `fileUrl`. Le nom du fichier SHALL être rendu en texte, jamais en HTML.

#### Scenario: Documents présents
- **WHEN** un utilisateur ouvre le détail d'une formation qui a des documents
- **THEN** la section « Documents » liste chaque document avec nom, taille, date et expéditeur

#### Scenario: Aucun document
- **WHEN** la formation n'a aucun document
- **THEN** la section affiche « Aucun document disponible pour le moment »

#### Scenario: Chargement et erreur
- **WHEN** la liste est en cours de chargement ou que le back répond par une erreur
- **THEN** un état de chargement annoncé est affiché, ou le message d'erreur avec un bouton « Réessayer » qui relance la demande

#### Scenario: Nom de fichier contenant du balisage
- **WHEN** un nom de fichier contient du HTML
- **THEN** il est affiché tel quel, en texte

### Requirement: Téléchargement d'un document
Le système SHALL proposer, pour chaque document, un bouton « Télécharger » dont le nom accessible contient le nom du fichier. Le téléchargement SHALL passer par `GET /documents/{id}/download` avec la session de l'utilisateur et enregistrer le fichier sous son nom d'origine. Une erreur du back SHALL être affichée dans l'interface.

#### Scenario: Téléchargement réussi
- **WHEN** un utilisateur active « Télécharger » sur un document
- **THEN** le fichier reçu du back est enregistré sous son nom d'origine

#### Scenario: Accès refusé ou document introuvable
- **WHEN** le back répond `403` ou `404` au téléchargement
- **THEN** un message d'erreur annoncé est affiché et aucun fichier n'est enregistré

#### Scenario: Tous les rôles
- **WHEN** la chargée de formation, un formateur ou un stagiaire inscrit consulte la liste
- **THEN** chacun peut télécharger les documents listés

### Requirement: Dépôt de documents selon le rôle
Le système SHALL afficher la zone de dépôt uniquement à la chargée de formation (`SUPER_ADMIN`), sur toute formation active, et au formateur (`ADMIN`) sur les formations dont il est le formateur et qui sont actives. Un formateur sur la formation d'un autre, un stagiaire, et tout utilisateur sur une formation archivée ne SHALL voir aucune zone de dépôt.

#### Scenario: Chargée de formation
- **WHEN** la chargée de formation ouvre le détail d'une formation active
- **THEN** la zone de dépôt est affichée

#### Scenario: Formateur sur sa formation
- **WHEN** un formateur ouvre le détail d'une formation active dont il est le formateur
- **THEN** la zone de dépôt est affichée

#### Scenario: Formateur sur la formation d'un autre
- **WHEN** un formateur ouvre le détail d'une formation active assignée à un autre formateur
- **THEN** aucune zone de dépôt n'est affichée et la liste reste consultable

#### Scenario: Stagiaire
- **WHEN** un stagiaire ouvre le détail d'une formation
- **THEN** aucune zone de dépôt n'est affichée

#### Scenario: Formation archivée
- **WHEN** un utilisateur ouvre le détail d'une formation archivée
- **THEN** aucune zone de dépôt ni aucun bouton « Supprimer » n'est affiché, et les documents restent listés et téléchargeables

### Requirement: Dépôt de plusieurs fichiers, contrôlés et envoyés un par un
Le système SHALL permettre de déposer des fichiers par glisser-déposer ou par un bouton « Choisir des fichiers » utilisable au clavier, plusieurs à la fois. Avant l'envoi, chaque fichier SHALL être contrôlé : extension pdf, jpg, jpeg, png ou docx, et taille de 10 Mo au plus. Chaque fichier valide SHALL être envoyé par un `POST /documents` multipart (`file`, `formationId`), l'un après l'autre. Les fichiers refusés (par le contrôle ou par le back) SHALL être listés avec leur nom et la raison, annoncés, sans empêcher l'envoi des autres. À la fin, la liste des documents SHALL être rechargée depuis le back.

#### Scenario: Plusieurs fichiers valides
- **WHEN** l'utilisateur dépose trois fichiers valides
- **THEN** trois envois sont faits l'un après l'autre, un état « Envoi en cours… » est annoncé, puis les trois documents apparaissent dans la liste rechargée

#### Scenario: Type de fichier non autorisé
- **WHEN** l'utilisateur dépose un fichier `.exe`
- **THEN** il est refusé avant tout envoi avec son nom et la raison, et aucun appel n'est fait pour lui

#### Scenario: Fichier trop volumineux
- **WHEN** l'utilisateur dépose un fichier de plus de 10 Mo
- **THEN** il est refusé avant tout envoi avec son nom et la raison

#### Scenario: Un refus n'arrête pas les autres
- **WHEN** l'utilisateur dépose un fichier refusé et un fichier valide
- **THEN** le fichier valide est envoyé et le refus reste affiché

#### Scenario: Refus du back
- **WHEN** le back répond `400` ou `403` à un envoi
- **THEN** son message est affiché pour ce fichier et les envois suivants continuent

### Requirement: Suppression d'un document avec confirmation
Le système SHALL afficher « Supprimer » (nom accessible contenant le nom du fichier) à la chargée de formation sur tous les documents d'une formation active, et au formateur uniquement sur les documents qu'il a lui-même envoyés. Le stagiaire ne SHALL jamais le voir. L'action SHALL ouvrir une confirmation qui nomme le fichier et précise que la suppression est définitive ; après confirmation, le système SHALL appeler `DELETE /documents/{id}`, recharger la liste depuis le back et annoncer « Document supprimé ». Aucune mise à jour optimiste.

#### Scenario: Chargée de formation
- **WHEN** la chargée de formation consulte une formation active avec des documents
- **THEN** chaque document a un bouton « Supprimer »

#### Scenario: Formateur
- **WHEN** un formateur consulte une formation active dont il est le formateur
- **THEN** « Supprimer » n'apparaît que sur les documents qu'il a envoyés

#### Scenario: Confirmation et suppression
- **WHEN** l'utilisateur active « Supprimer » puis confirme
- **THEN** le document est supprimé côté back, la liste est rechargée et « Document supprimé » est annoncé

#### Scenario: Annulation
- **WHEN** l'utilisateur annule la confirmation
- **THEN** aucun appel n'est fait, le document reste, et le focus revient au bouton « Supprimer »

#### Scenario: Document déjà supprimé ou droit refusé
- **WHEN** le back répond `404` ou `403` à la suppression
- **THEN** un message est affiché ; en cas de `404`, la liste est rechargée

### Requirement: Accessibilité de la section
La section « Documents » SHALL être utilisable au clavier et au lecteur d'écran : zone de dépôt doublée d'un bouton, résultats d'envoi et de suppression annoncés (`role="status"` ou `role="alert"`), boutons nommés avec le nom du fichier, et aucune information portée par la couleur seule.

#### Scenario: Contrôle d'accessibilité
- **WHEN** la page de détail est rendue avec des documents et la zone de dépôt
- **THEN** elle ne présente aucune violation détectée par jest-axe
