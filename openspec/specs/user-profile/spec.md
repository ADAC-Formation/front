# user-profile Specification

## Purpose
Donner à chaque utilisateur connecté une page de profil : ses informations, sa préférence de notification par e-mail et le changement de son mot de passe.

## Requirements

### Requirement: Informations en lecture seule
La page `/profile` SHALL afficher prénom, nom, e-mail et rôle libellé de l'utilisateur connecté, sans champ modifiable.

#### Scenario: Stagiaire
- **WHEN** un stagiaire ouvre `/profile`
- **THEN** il voit son prénom, son nom, son e-mail et « Stagiaire »

### Requirement: Préférence de notification par e-mail
La page SHALL proposer un interrupteur « Recevoir les notifications par e-mail » dont l'état initial est `emailNotificationsEnabled`. Un changement SHALL envoyer immédiatement `PATCH /users/me` et annoncer « Préférences enregistrées » ; en cas d'échec l'interrupteur SHALL revenir à son état précédent et l'erreur SHALL être annoncée.

#### Scenario: Désactivation
- **WHEN** l'utilisateur désactive l'interrupteur
- **THEN** `PATCH /users/me` est envoyé avec `{ emailNotificationsEnabled: false }` et « Préférences enregistrées » est annoncé

#### Scenario: Échec
- **WHEN** le back répond 500
- **THEN** l'interrupteur revient à son état précédent et une erreur est annoncée

### Requirement: Changement de mot de passe
La page SHALL proposer un formulaire (mot de passe actuel, nouveau mot de passe, confirmation) qui valide les règles du mot de passe avant tout appel, puis envoie `PATCH /users/me/password`. Un succès SHALL vider les champs et être annoncé ; un échec SHALL afficher le message du back et vider les champs. Un `401` SHALL NOT déconnecter l'utilisateur.

#### Scenario: Champs vides
- **WHEN** l'utilisateur envoie le formulaire vide
- **THEN** les erreurs de champ s'affichent et aucun appel n'est émis

#### Scenario: Ancien mot de passe incorrect
- **WHEN** le back répond 401 « Ancien mot de passe incorrect »
- **THEN** ce message est affiché et l'utilisateur reste connecté
