# Spec Delta

## ADDED Requirements

### Requirement: Fournisseur d'un type de document
Le formulaire d'un type de document SHALL proposer « Fourni par » (« Le stagiaire », par défaut, ou « L'ADAC ») et envoyer `providedBy` ; la liste du catalogue SHALL afficher « Fourni par le stagiaire » ou « Fourni par l'ADAC ». Un type sans `providedBy` SHALL être lu comme fourni par le stagiaire.

#### Scenario: Créer une pièce de l'ADAC
- **WHEN** la chargée crée « Feuille d'émargement » en choisissant « L'ADAC »
- **THEN** `POST /document-types` part avec `providedBy: "ADAC"` et la liste affiche « Fourni par l'ADAC »

### Requirement: Pièces à fournir par l'ADAC
Pour `SUPER_ADMIN` et `ADMIN`, l'onglet « Documents ADAC » SHALL afficher d'abord « Pièces à fournir par l'ADAC » avec « X/Y pièces déposées » et un créneau par type `ADAC` de la formation : rouge et « À envoyer » sans fichier, vert et « Envoyé » avec ses fichiers. Les autres documents SHALL suivre sous « Autres documents ». Sans type `ADAC`, la section reste la liste simple.

#### Scenario: Une pièce déposée sur deux
- **WHEN** la formation a deux types `ADAC` et un fichier « Programme - v2.pdf »
- **THEN** « Programme » est vert avec ce fichier, « Feuille d'émargement » est rouge, et « 1/2 pièces déposées » s'affiche

#### Scenario: Déposer depuis un créneau
- **WHEN** la chargée choisit « signée.pdf » dans le créneau « Feuille d'émargement » d'une formation active
- **THEN** le fichier part sur la formation sous « Feuille d'émargement - signée.pdf » et le créneau passe au vert

#### Scenario: Formation archivée
- **WHEN** la formation est archivée
- **THEN** les créneaux restent affichés sans bouton de dépôt

#### Scenario: Stagiaire
- **WHEN** un `STAGIAIRE` ouvre « Documents ADAC »
- **THEN** il voit la liste simple des documents, sans créneau, et les types ne sont pas demandés
