# page-layout Specification

## Purpose

Garantit que toutes les pages partagent la même structure : une seule zone principale, le même dégagement sous le logo ADAC, un lien « Retour » identique et un focus clavier visible.

## Requirements

### Requirement: Une seule zone principale par page
Chaque page de l'application SHALL contenir exactement un élément `main` (celui du gabarit global). Une page SHALL NOT rendre un second `main`, que ce soit pour les pages publiques (connexion, activation), le tableau de bord, le menu Gestion, les formations, les catégories, la création de formation ou les comptes.

#### Scenario: Page de formations
- **WHEN** un utilisateur connecté ouvre `/formations`
- **THEN** le document contient un seul élément de rôle `main`

#### Scenario: Page publique
- **WHEN** un visiteur ouvre `/login`
- **THEN** le document contient un seul élément de rôle `main`

### Requirement: Dégagement identique sous le logo
Le contenu de chaque page SHALL commencer sous le logo ADAC avec le même dégagement vertical, fourni par le gabarit commun : 276 px sur grand écran (6 rem + 180 px) et 5 rem + 180 px sur mobile. Les pages ne SHALL pas redéfinir ce dégagement. Les pages centrées (accueil, menu Gestion, authentification) SHALL conserver leur centrage dans l'espace restant.

#### Scenario: Même départ de contenu
- **WHEN** on compare la liste des formations, les catégories, la création de formation, le détail d'une formation et la liste des formateurs
- **THEN** leur premier élément commence à la même distance du haut de la page

#### Scenario: Aucune page ne recouvre le logo
- **WHEN** n'importe quelle page est affichée sur grand écran ou sur mobile
- **THEN** son contenu n'est pas superposé au logo

### Requirement: Lien « Retour » commun
Toute page secondaire (liste, détail, création, modification, catégories) SHALL afficher en haut un lien « Retour » (ou « Retour aux … ») fourni par un composant commun, avec une destination explicite et la même présentation. Il SHALL être un lien et non un bouton, et rester correct sur un accès direct ou après rechargement.

#### Scenario: Retour depuis les catégories
- **WHEN** l'utilisateur ouvre `/formations/categories` directement
- **THEN** un lien « Retour » mène à `/formations`

#### Scenario: Retour depuis le détail d'une formation
- **WHEN** l'utilisateur ouvre le détail d'une formation
- **THEN** un lien « Retour aux formations » mène à `/formations`

### Requirement: Focus clavier visible
Tout élément interactif (liens, boutons, champs, listes de sélection, conteneurs de recherche) SHALL afficher un indicateur de focus d'au moins 2 px, de couleur `--ring`, lorsqu'il est atteint au clavier. Un indicateur SHALL NOT reposer uniquement sur un changement de couleur de bordure d'un pixel.

#### Scenario: Champ de recherche
- **WHEN** l'utilisateur atteint le champ de recherche des formations au clavier
- **THEN** un contour visible de 2 px entoure le champ

#### Scenario: Aucun contour supprimé sans remplacement
- **WHEN** on analyse les feuilles de style du projet
- **THEN** aucune règle `outline: none` n'existe sans indicateur de focus de remplacement sur le même élément

### Requirement: Variables CSS toutes définies
Toute variable CSS utilisée par une feuille de style SHALL être définie, soit dans les jetons globaux, soit localement par le composant qui l'utilise. Aucune couleur SHALL être écrite en dur dans une feuille de style de page ou de composant lorsqu'un jeton existe.

#### Scenario: Bouton jaune
- **WHEN** le bouton principal jaune est affiché
- **THEN** son texte utilise un jeton défini et reste lisible en mode clair comme en mode sombre

#### Scenario: Variable non définie
- **WHEN** une feuille de style référence `var(--x)` sans définition
- **THEN** le test de garde-fou échoue en nommant la variable
