# formation-management Specification

## Purpose

Permet à la chargée de formation de créer et de corriger une formation depuis un formulaire unique, en s'appuyant sur `POST /formations`, `PUT /formations/{id}`, `GET /categories` et `GET /users/formateurs` du back (`tech.md` §2–4).

## Requirements

### Requirement: Accès réservé à la chargée de formation
Les routes `/formations/creer` et `/formations/:formationId/modifier` SHALL être réservées à `SUPER_ADMIN`. Un autre rôle connecté SHALL voir « Accès refusé » sans appel de données ; un visiteur SHALL être redirigé vers `/login`. Le back reste l'autorité (`403`).

#### Scenario: Formateur sur la création
- **WHEN** un `ADMIN` ouvre `/formations/creer`
- **THEN** la page « Accès refusé » s'affiche et aucun appel `/categories` ni `/users` n'est émis

#### Scenario: Stagiaire sur la modification
- **WHEN** un `STAGIAIRE` ouvre `/formations/101/modifier`
- **THEN** la page « Accès refusé » s'affiche

#### Scenario: Visiteur
- **WHEN** un visiteur ouvre `/formations/creer`
- **THEN** il est redirigé vers `/login`

### Requirement: Champs du formulaire
Le formulaire SHALL proposer : intitulé (texte, obligatoire), description (zone de texte, facultative), « Du » et « Au » (dates, obligatoires), modalité (Visio, Présentiel, Mixte ; obligatoire), catégorie (obligatoire) et formateur (facultatif). Il ne SHALL proposer ni référence, ni public, ni lieu, ni dépôt de documents, que le contrat ne porte pas.

#### Scenario: Formulaire de création vide
- **WHEN** la chargée de formation ouvre `/formations/creer`
- **THEN** les champs ci-dessus sont vides et aucun champ « Référence », « Public », « Lieu » ni zone de dépôt n'est présent

#### Scenario: Libellés accessibles
- **WHEN** le formulaire s'affiche
- **THEN** chaque champ a une étiquette associée et les champs obligatoires sont indiqués

### Requirement: Dates du / au
Saisir « Du » SHALL préremplir « Au » avec la même date tant que « Au » est vide ou égale à l'ancienne valeur de « Du ». Une formation d'un jour a la même date dans les deux champs. « Au » SHALL ne pas précéder « Du » : sinon un message en ligne s'affiche et aucun appel n'est émis.

#### Scenario: Préremplissage de « Au »
- **WHEN** la chargée de formation choisit « Du » = 2026-03-10 avec « Au » vide
- **THEN** « Au » vaut 2026-03-10

#### Scenario: Plage inversée
- **WHEN** « Du » = 2026-03-12 et « Au » = 2026-03-10 puis elle valide
- **THEN** un message indique que la date de fin ne peut pas précéder la date de début et aucun appel `POST /formations` n'est émis

#### Scenario: Formation d'un jour
- **WHEN** « Du » et « Au » valent 2026-03-10
- **THEN** la validation passe et la requête envoie `dateDebut` et `dateFin` identiques

### Requirement: Catégories actives de l'API
Le sélecteur de catégorie SHALL lister les catégories de `GET /categories?active=true` par leur nom. En modification, la catégorie actuelle de la formation SHALL rester sélectionnée et affichée même si elle est désactivée ; une catégorie désactivée ne SHALL pas être proposée pour une nouvelle sélection. Pendant le chargement et en cas d'erreur, le sélecteur SHALL l'indiquer, avec « Réessayer ».

#### Scenario: Liste des catégories
- **WHEN** le back renvoie deux catégories actives
- **THEN** le sélecteur propose « Sélectionner une catégorie » et ces deux catégories

#### Scenario: Catégorie désactivée en modification
- **WHEN** la formation modifiée a une catégorie désactivée
- **THEN** cette catégorie est sélectionnée et affichée, sans être proposée aux autres formations

#### Scenario: Erreur de chargement des catégories
- **WHEN** `GET /categories?active=true` répond `500`
- **THEN** un message d'erreur annoncé et un bouton « Réessayer » s'affichent à la place du sélecteur et la création est impossible

### Requirement: Formateur facultatif
Le sélecteur de formateur SHALL lister les comptes de `GET /users/formateurs?active=true` (prénom nom) et proposer en première option « Assigné à la chargée de formation » pour laisser le back auto-assigner. La création sans choix SHALL envoyer `formateurId: null`.

#### Scenario: Sans formateur
- **WHEN** la chargée de formation crée une formation sans choisir de formateur
- **THEN** la requête envoie `formateurId: null`

#### Scenario: Avec un formateur
- **WHEN** elle choisit un formateur actif
- **THEN** la requête envoie son `id` comme `formateurId`

### Requirement: Création d'une formation
La validation du formulaire de création SHALL émettre `POST /formations` avec `intitule`, `description` (ou `null`), `dateDebut`, `dateFin`, `modalite`, `categoryId` et `formateurId`. Aucun appel ne SHALL être émis tant que la validation côté client échoue. Le bouton SHALL être désactivé pendant l'envoi.

#### Scenario: Champs obligatoires vides
- **WHEN** elle valide un formulaire vide
- **THEN** un message en ligne s'affiche pour chaque champ obligatoire manquant et aucun appel n'est émis

#### Scenario: Corps de la requête
- **WHEN** elle valide un formulaire complet
- **THEN** `POST /formations` reçoit les champs du contrat avec les valeurs saisies, l'intitulé et la description sans espaces superflus

### Requirement: Redirection vers la formation créée
Après un `201`, la chargée de formation SHALL être redirigée vers `/formations/<id renvoyé>` avec le bandeau « Formation créée » annoncé, transmis par `location.state` (aucun stockage navigateur).

#### Scenario: Création réussie
- **WHEN** `POST /formations` répond `201` avec l'id 55
- **THEN** la page `/formations/55` s'affiche avec « Formation créée »

#### Scenario: Pas de bandeau après un rechargement
- **WHEN** la page de détail est rechargée
- **THEN** le bandeau « Formation créée » ne réapparaît pas

### Requirement: Erreurs du back sur le formulaire
Une erreur `400` du back SHALL s'afficher dans un bandeau annoncé avec son message, sans effacer la saisie ; un `409` (modification concurrente) SHALL inviter à recharger la formation ; une erreur réseau SHALL afficher le message d'ApiError. Le formulaire SHALL rester utilisable.

#### Scenario: Erreur 400
- **WHEN** le back répond `400` avec « formateurId invalide : doit être un formateur actif »
- **THEN** ce message s'affiche dans un bandeau d'erreur et les champs gardent leurs valeurs

#### Scenario: Conflit en modification
- **WHEN** `PUT /formations/{id}` répond `409`
- **THEN** un message invite à recharger la formation avant de réessayer et la saisie est conservée

### Requirement: Modification d'une formation
La route `/formations/:formationId/modifier` SHALL afficher le même formulaire, prérempli depuis `GET /formations/{id}`, et envoyer `PUT /formations/{id}` avec les seuls champs modifiés. Une formation archivée SHALL ne pas être modifiable : la page SHALL l'indiquer et ne pas proposer d'envoi. Après succès, la chargée de formation SHALL revenir au détail avec « Formation mise à jour ».

#### Scenario: Préremplissage
- **WHEN** elle ouvre la modification de la formation 101
- **THEN** intitulé, description, dates, modalité, catégorie et formateur sont préremplis

#### Scenario: Seuls les champs modifiés
- **WHEN** elle ne change que l'intitulé puis valide
- **THEN** `PUT /formations/101` reçoit uniquement `intitule`

#### Scenario: Retour à la chargée de formation
- **WHEN** elle choisit « Assigné à la chargée de formation » pour une formation qui avait un formateur
- **THEN** `PUT /formations/101` reçoit `formateurId` égal à l'identifiant de la chargée connectée (le back ignore `formateurId: null` en `PUT`, `points-pour-charlotte.md` Q11)

#### Scenario: Aucune modification
- **WHEN** elle valide sans rien changer
- **THEN** aucun appel n'est émis et elle revient au détail

#### Scenario: Formation archivée
- **WHEN** elle ouvre la modification d'une formation archivée
- **THEN** un message indique qu'elle ne peut plus être modifiée et aucun bouton d'enregistrement n'est présent

#### Scenario: Formation introuvable
- **WHEN** `GET /formations/{id}` répond `404`
- **THEN** « Formation introuvable ou non accessible » s'affiche avec un lien vers la liste

### Requirement: Accès au formulaire depuis les pages de formations
Le détail d'une formation active SHALL proposer « Modifier » à `SUPER_ADMIN` seulement, menant à `/formations/:formationId/modifier`. Le détail SHALL afficher le bandeau annoncé « Formation créée » ou « Formation mise à jour » reçu par navigation. Le lien « Créer une nouvelle formation » de la liste mène à `/formations/creer`.

#### Scenario: Bouton « Modifier »
- **WHEN** un `SUPER_ADMIN` ouvre le détail d'une formation active
- **THEN** un lien « Modifier » vers `/formations/<id>/modifier` est présent

#### Scenario: Sans « Modifier »
- **WHEN** un `ADMIN` ouvre ce détail, ou quand la formation est archivée
- **THEN** aucun lien « Modifier » n'est présent

### Requirement: Annulation
« Annuler » SHALL abandonner la saisie sans appel et revenir à la page d'origine : la liste pour la création, le détail pour la modification.

#### Scenario: Annulation de la création
- **WHEN** elle clique « Annuler » sur le formulaire de création
- **THEN** elle arrive sur `/formations` et aucun appel `POST` n'est émis

### Requirement: Accessibilité du formulaire
La page SHALL respecter le gabarit commun (`PageShell`, un seul `<main>`), exposer un seul `<h1>`, associer chaque message d'erreur à son champ (`aria-describedby`, `aria-invalid`), annoncer les bandeaux d'erreur et ne produire aucune violation jest-axe.

#### Scenario: Erreur liée au champ
- **WHEN** l'intitulé est vide à la validation
- **THEN** le champ est `aria-invalid` et son message est relié par `aria-describedby`

#### Scenario: Contrôle jest-axe
- **WHEN** le formulaire de création et celui de modification sont rendus
- **THEN** jest-axe ne rapporte aucune violation
