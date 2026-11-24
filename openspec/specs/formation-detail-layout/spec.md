# formation-detail-layout Specification

## Purpose
Organise le détail d'une formation (`/formations/:id`) : les informations en haut, puis des onglets qui rangent les inscrits et les documents selon le rôle de l'utilisateur.

## Requirements

### Requirement: Bloc d'informations en tête
Le détail SHALL afficher en tête, hors des onglets : catégorie, intitulé, badge « Archivée » le cas échéant, description (si présente), dates, modalité, formateur et, pour `SUPER_ADMIN` et `ADMIN`, le nombre d'inscrits. Pour la chargée de formation sur une formation active, « Modifier » et « Archiver » SHALL suivre ce bloc, avant les onglets.

#### Scenario: Chargée de formation, formation active
- **WHEN** un `SUPER_ADMIN` ouvre le détail d'une formation active
- **THEN** les informations, puis « Modifier » et « Archiver », apparaissent avant la barre d'onglets

#### Scenario: Formation archivée
- **WHEN** un `SUPER_ADMIN` ouvre le détail d'une formation archivée
- **THEN** le badge « Archivée » s'affiche, ni « Modifier » ni « Archiver » n'apparaissent, et les onglets restent consultables

### Requirement: Onglets de la chargée de formation et du formateur
Pour `SUPER_ADMIN` et `ADMIN`, le détail SHALL proposer trois onglets, dans cet ordre : « Liste stagiaires », « Documents stagiaires », « Documents ADAC ». « Liste stagiaires » SHALL être ouvert à l'arrivée sur la page.

#### Scenario: Arrivée du formateur
- **WHEN** un `ADMIN` ouvre le détail d'une de ses formations
- **THEN** les trois onglets sont proposés et « Liste stagiaires » est sélectionné

#### Scenario: Changer d'onglet
- **WHEN** la chargée de formation clique « Documents ADAC »
- **THEN** la liste des documents de la formation s'affiche et le contenu de « Liste stagiaires » est masqué

### Requirement: Onglets du stagiaire
Pour `STAGIAIRE`, le détail SHALL proposer deux onglets, dans cet ordre : « Documents ADAC » (ouvert à l'arrivée) et « Mes documents ». Aucun appel à `GET /formations/{id}/inscriptions` ne SHALL être émis.

#### Scenario: Arrivée du stagiaire
- **WHEN** un `STAGIAIRE` inscrit ouvre le détail d'une formation
- **THEN** « Documents ADAC » est sélectionné, « Mes documents » est proposé, et ni « Liste stagiaires » ni « Documents stagiaires » n'existent

#### Scenario: Déposer depuis l'onglet
- **WHEN** le stagiaire ouvre « Mes documents » sur une formation active
- **THEN** ses créneaux et la zone de dépôt s'affichent comme dans la section « Mes documents » d'aujourd'hui

### Requirement: Onglet « Documents ADAC »
L'onglet « Documents ADAC » SHALL offrir, pour tous les rôles, le contenu de l'ancienne section « Documents de la formation » : liste, téléchargement, dépôt et suppression selon les droits existants (formation-documents).

#### Scenario: Dépôt par la chargée
- **WHEN** la chargée de formation ouvre « Documents ADAC » sur une formation active
- **THEN** la zone de dépôt et la liste des documents de la formation s'affichent

### Requirement: Onglet conservé pendant une action
Le choix d'onglet SHALL être conservé tant que l'utilisateur reste sur la page, y compris après un dépôt, une suppression, une inscription ou une désinscription. Il ne SHALL être ni mis dans l'URL ni stocké dans le navigateur ; l'onglet par défaut s'ouvre à chaque arrivée sur la page.

#### Scenario: Dépôt dans « Mes documents »
- **WHEN** le stagiaire dépose un fichier dans « Mes documents »
- **THEN** l'onglet « Mes documents » reste sélectionné après le rechargement de la liste

### Requirement: Accessibilité des onglets
La barre SHALL suivre le motif WAI-ARIA *tabs* : rôles `tablist`, `tab` et `tabpanel`, `aria-selected`, chaque panneau nommé par son onglet, un seul onglet atteignable par Tab, ←/→ pour passer d'un onglet à l'autre (en boucle), Début/Fin pour le premier et le dernier, activation immédiate. Le focus SHALL être visible. Le contrôle jest-axe de la page SHALL passer.

#### Scenario: Clavier
- **WHEN** le focus est sur « Liste stagiaires » et l'utilisateur appuie sur → puis Fin
- **THEN** « Documents stagiaires » puis « Documents ADAC » sont sélectionnés tour à tour et leur panneau s'affiche

#### Scenario: Contrôle jest-axe
- **WHEN** le détail est rendu pour chaque rôle
- **THEN** jest-axe ne relève aucune violation
