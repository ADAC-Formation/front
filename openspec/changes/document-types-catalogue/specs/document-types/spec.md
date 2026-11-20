# Spec Delta

## Purpose

Permet à la chargée de formation de tenir le catalogue des types de document (les pièces que les stagiaires fournissent) : liste, création, modification, désactivation et réactivation, depuis la page « Gestion ».

## ADDED Requirements

### Requirement: Accès réservé à la chargée de formation
Le système SHALL réserver `/admin/documents`, `/admin/documents/nouveau` et `/admin/documents/:id/modifier` à la chargée de formation. Un formateur et un stagiaire SHALL être renvoyés comme sur les autres pages réservées. La tuile « Documents » de la page Gestion et le lien « Documents » du plan du site SHALL être visibles pour la chargée seulement.

#### Scenario: Formateur
- **WHEN** un formateur ouvre la page Gestion puis tente d'ouvrir `/admin/documents`
- **THEN** la tuile « Documents » est absente et l'adresse est refusée comme les autres pages réservées

### Requirement: Liste des types
Le système SHALL afficher les types de document triés par nom (sans tenir compte de la casse ni des accents) avec, pour chacun : « Obligatoire » ou « Facultatif », « Sensible » le cas échéant, la portée (« Toutes les formations » ou les noms des catégories), le délai (« 7 jours avant le début » ou « 15 jours après la fin ») s'il existe, et son état « Actif » ou « Désactivé ». Une liste vide SHALL afficher « Aucun type de document pour le moment » et une erreur de chargement SHALL proposer « Réessayer ».

#### Scenario: Liste
- **WHEN** le back renvoie un type obligatoire et sensible pour toutes les formations, et un type facultatif pour la catégorie « Secourisme »
- **THEN** chacun est listé avec ses libellés, sans ordre inattendu

### Requirement: Création d'un type
Le système SHALL permettre de créer un type avec : nom (obligatoire, 255 au plus), texte d'aide (500 au plus), obligatoire ou facultatif, sensible, portée (toutes les formations, ou au moins une catégorie), délai optionnel (nombre de jours de 0 à 365, avant le début ou après la fin) et formats acceptés optionnels. Aucun appel SHALL partir tant que le formulaire est invalide ; une portée « Certaines catégories » sans catégorie cochée SHALL être refusée en ligne. Un `409` (nom déjà utilisé, casse ignorée) SHALL s'afficher sous le champ « Nom ». Après succès, la liste SHALL s'afficher avec « Type de document créé ».

#### Scenario: Création complète
- **WHEN** la chargée saisit « Certificat médical », coche Obligatoire, choisit « Certaines catégories » et « Secourisme », puis « 7 jours avant le début »
- **THEN** `POST /document-types` reçoit `{ nom, isRequired: true, appliesToAllFormations: false, categoryIds: [id], deadlineDays: 7, deadlineAnchor: "BEFORE_START", … }` et la liste affiche « Type de document créé »

#### Scenario: Portée sans catégorie
- **WHEN** « Certaines catégories » est choisi sans aucune catégorie cochée
- **THEN** une erreur est affichée en ligne et aucun appel n'est fait

#### Scenario: Nom déjà utilisé
- **WHEN** le back répond `409`
- **THEN** le message s'affiche sous « Nom » et la saisie est conservée

### Requirement: Modification d'un type
Le système SHALL préremplir le formulaire avec le type et envoyer `PUT /document-types/{id}` avec tous les champs. Un type introuvable (`404`, ou absent de la liste) SHALL afficher « Type de document introuvable » avec un retour vers la liste. Le texte du formulaire SHALL préciser que les changements s'appliquent aux formations en cours (G27).

#### Scenario: Modification
- **WHEN** la chargée change le délai d'un type et enregistre
- **THEN** `PUT` reçoit le type complet et la liste affiche « Type de document mis à jour »

### Requirement: Désactivation et réactivation
Le système SHALL permettre de désactiver un type actif après confirmation (« s'applique aux formations en cours ») et de réactiver un type désactivé sans confirmation, via `PATCH …/deactivate` et `…/activate`. Aucune suppression SHALL être proposée. Une erreur du back SHALL s'afficher sans modifier la liste.

#### Scenario: Désactivation
- **WHEN** la chargée désactive un type et confirme
- **THEN** `PATCH /document-types/{id}/deactivate` est appelé, « Type de document désactivé » s'affiche et le type est marqué « Désactivé »

#### Scenario: Annulation
- **WHEN** la chargée ferme la confirmation
- **THEN** aucun appel n'est fait

### Requirement: Accessibilité
Chaque page SHALL n'avoir aucune violation jest-axe ; les champs SHALL avoir un libellé, les erreurs SHALL être liées à leur champ, la portée et le délai SHALL se commander au clavier, et les libellés SHALL rester lisibles à 320 px et à 150 % de taille de texte.

#### Scenario: Pages
- **WHEN** la liste et le formulaire sont rendus
- **THEN** jest-axe ne signale aucune violation
