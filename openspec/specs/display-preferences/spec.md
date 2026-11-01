# display-preferences Specification

## Purpose

Rend effectives les options d'affichage « Grand texte » et « Contraste élevé » du menu d'accessibilité, sur toutes les pages, en mode clair comme en mode sombre.

## Requirements

### Requirement: Grand texte agrandit tout le texte
Quand l'option « Grand texte » est active (classe `text-large` sur `<html>`), la taille de base du texte SHALL passer à 125 % et toutes les tailles de police du site SHALL suivre, car elles sont exprimées en unités relatives (`rem`) et non en pixels. Désactiver l'option SHALL rétablir la taille normale.

#### Scenario: Activation
- **WHEN** l'utilisateur active « Grand texte »
- **THEN** la taille de police de base passe à 125 % et le texte des boutons, formulaires et listes s'agrandit

#### Scenario: Aucune taille de police en pixels
- **WHEN** on analyse les feuilles de style du projet
- **THEN** aucune déclaration `font-size` n'utilise l'unité `px`

#### Scenario: Désactivation
- **WHEN** l'utilisateur désactive « Grand texte »
- **THEN** la taille de police de base revient à 100 %

### Requirement: Contraste élevé
Quand l'option « Contraste élevé » est active (classe `high-contrast` sur `<html>`), les jetons de couleur SHALL être remplacés pour atteindre un rapport de contraste d'au moins 7:1 entre le texte et son fond, et d'au moins 3:1 pour les bordures et indicateurs de focus, en mode clair comme en mode sombre.

#### Scenario: Texte courant
- **WHEN** « Contraste élevé » est actif en mode clair
- **THEN** le rapport entre `--foreground` et `--background` est d'au moins 7:1, ainsi qu'entre `--muted-foreground` et `--background`

#### Scenario: Mode sombre combiné
- **WHEN** « Contraste élevé » est actif en mode sombre
- **THEN** les mêmes rapports de 7:1 sont respectés avec les couleurs du mode sombre

#### Scenario: Bordures visibles
- **WHEN** « Contraste élevé » est actif
- **THEN** `--border` a un rapport d'au moins 3:1 avec `--background`

### Requirement: Préférences sans donnée personnelle
Les options d'affichage SHALL continuer à être mémorisées uniquement comme préférences d'affichage (mode sombre, taille du texte, contraste), sans donnée personnelle ni jeton, conformément à D31.

#### Scenario: Contenu du stockage
- **WHEN** l'utilisateur active « Grand texte » et « Contraste élevé »
- **THEN** le stockage du navigateur ne contient que ces préférences d'affichage
