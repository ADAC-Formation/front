# Spec Delta

## ADDED Requirements

### Requirement: Créneaux des documents à envoyer (G33)
Dans « Mes documents » d'une formation, le système SHALL afficher « Documents à envoyer » avec un créneau par type à envoyer (nom, aide, délai et formats s'ils existent, bouton d'envoi). Un créneau SHALL être rouge et marqué « À envoyer » tant qu'aucun fichier du stagiaire ne lui est rattaché, vert et marqué « Envoyé » ensuite ; l'état SHALL être écrit, pas seulement porté par la couleur. Les autres fichiers SHALL apparaître sous « Autres documents ».

#### Scenario: Créneau vide puis rempli
- **WHEN** le stagiaire dépose « recto.pdf » depuis le créneau « Pièce d'identité »
- **THEN** le créneau passe de « À envoyer » (rouge, bouton « Envoyer un fichier ») à « Envoyé » (vert, bouton « Ajouter un fichier »)

### Requirement: Rattachement d'un fichier à son créneau (provisoire, G33)
Un dépôt depuis un créneau SHALL partir sous « <nom du type> - <nom d'origine> » (200 caractères au plus, extension gardée), et un fichier SHALL appartenir au créneau dont le nom suivi de « - » commence le sien, jusqu'à ce que le back relie un dépôt à son type (`documentTypeId`).

#### Scenario: Nom de fichier préfixé
- **WHEN** le stagiaire dépose « recto.pdf » depuis le créneau « Pièce d'identité »
- **THEN** le fichier part sous « Pièce d'identité - recto.pdf »

#### Scenario: Fichier hors créneau
- **WHEN** le stagiaire dépose un fichier dans la zone libre
- **THEN** il apparaît sous « Autres documents » et aucun créneau ne change d'état

#### Scenario: Types indisponibles
- **WHEN** les types de la formation ne se chargent pas
- **THEN** le message d'erreur s'affiche et les fichiers restent listés et téléchargeables
