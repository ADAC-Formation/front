# group-messaging Specification

## Purpose
Permet à la chargée de formation et aux formateurs d'envoyer un même message à plusieurs stagiaires, après aperçu des destinataires et confirmation.

## Requirements

### Requirement: Accès et point d'entrée
Le système SHALL afficher un bouton « Message groupé » sur `/messages` pour la chargée de formation et le formateur, et pas pour le stagiaire. Il SHALL mener à `/messages/groupe`, qui a un « Retour » vers `/messages` ; un stagiaire qui ouvre cette adresse SHALL être redirigé comme sur les autres pages réservées.

#### Scenario: Bouton selon le rôle
- **WHEN** la chargée de formation, un formateur puis un stagiaire ouvrent `/messages`
- **THEN** les deux premiers voient « Message groupé », le stagiaire non

### Requirement: Filtres selon le rôle
La chargée de formation SHALL pouvoir choisir « Formation », « Documents manquants » ou « Sélection libre ». Le formateur SHALL avoir « Formation » seulement, limité aux formations dont il est le formateur. « Documents manquants » SHALL être accompagné d'un texte d'aide : stagiaires sans aucun document, toutes formations confondues.

#### Scenario: Chargée de formation
- **WHEN** la chargée ouvre la page
- **THEN** les trois filtres sont proposés

#### Scenario: Formateur
- **WHEN** un formateur ouvre la page et que `GET /formations` renvoie deux formations dont une seule est la sienne
- **THEN** seul « Formation » est proposé et la liste ne contient que sa formation

### Requirement: Aperçu automatique des destinataires
Le système SHALL appeler `GET /messages/group/preview` dès que le filtre est complet (formation choisie, ou au moins une personne cochée, ou « Documents manquants ») et afficher les destinataires par leur nom seulement, sans e-mail, avec leur nombre annoncé aux lecteurs d'écran. Une liste vide (`200 []`) SHALL afficher « Aucun destinataire correspondant » et désactiver l'envoi ; une erreur, `400` compris, SHALL afficher une alerte avec « Réessayer » et désactiver l'envoi.

#### Scenario: Aperçu après le choix d'une formation
- **WHEN** la chargée choisit une formation et le back renvoie 3 stagiaires
- **THEN** 3 noms sont listés, sans e-mail, et le bouton indique « Envoyer à 3 destinataires »

#### Scenario: Aucun destinataire
- **WHEN** le back répond `200 []`
- **THEN** « Aucun destinataire correspondant » s'affiche et l'envoi est désactivé

### Requirement: Sélection libre
La chargée SHALL pouvoir cocher des stagiaires actifs dans une liste avec recherche par nom (sans casse ni accents) et « Tout sélectionner » (résultats affichés). La sélection SHALL survivre à un changement de recherche et le nombre de personnes cochées SHALL être annoncé.

#### Scenario: Sélection conservée
- **WHEN** elle coche Léa, cherche « Marc » puis efface la recherche
- **THEN** Léa est toujours cochée et le compteur indique 1 sélectionné

### Requirement: Saisie, confirmation et envoi
Le texte SHALL suivre les règles de H9 (texte seul, 1 à 5000 caractères, refusé vide). Le bouton « Envoyer à X destinataires » SHALL ouvrir une confirmation (« Envoyer ce message à X personnes ? ») ; `POST /messages/send` avec `{ content, filter }` n'est appelé qu'après confirmation, une seule fois même en cas de double clic. En succès (`201`) l'utilisateur SHALL revenir sur `/messages` avec « Message envoyé à X destinataires ». Un `403` / `404` / erreur réseau SHALL afficher l'erreur en gardant le texte.

#### Scenario: Envoi confirmé
- **WHEN** elle écrit un texte valide, clique « Envoyer à 3 destinataires » puis « Envoyer »
- **THEN** le corps `{ content, filter }` est envoyé une fois et `/messages` affiche « Message envoyé à 3 destinataires »

#### Scenario: Annulation
- **WHEN** elle clique « Annuler » dans la confirmation
- **THEN** aucun appel n'est fait et le texte est conservé

#### Scenario: Refus du back
- **WHEN** le back répond `403`
- **THEN** un message d'erreur s'affiche et le texte saisi reste

### Requirement: Message groupé dans un fil
Un message avec `isGroup: true` SHALL porter la mention texte « Message groupé » dans le fil. La liste `recipients` SHALL ne jamais être affichée.

#### Scenario: Mention sans destinataires
- **WHEN** un fil contient un message `isGroup: true` dont `recipients` a trois personnes
- **THEN** « Message groupé » est affiché et aucun nom ni e-mail de destinataire ne l'est
