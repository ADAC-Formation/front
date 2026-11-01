# Spec Delta

## Purpose

La taille du texte passe d'une bascule « Grand texte » à des paliers (D60).

## REMOVED Requirements

### Requirement: Grand texte agrandit tout le texte
**Reason**: remplacé par des paliers de taille de texte (classe `text-large` supprimée).
**Migration**: l'ancienne préférence `fontSize: "large"` est lue comme le palier 2 (125 %).

## ADDED Requirements

### Requirement: La taille du texte se règle par paliers
Quand l'utilisateur règle la taille du texte (classes `text-step-1`, `text-step-2` ou `text-step-3` sur `<html>`), la taille de base du texte SHALL passer à 112,5 %, 125 % ou 150 % et toutes les tailles de police du site SHALL suivre, car elles sont exprimées en unités relatives (`rem`) et non en pixels. Sans palier, la taille de base SHALL être 100 %.

#### Scenario: Activation
- **WHEN** l'utilisateur choisit un palier de taille de texte
- **THEN** la taille de police de base passe à la valeur du palier et le texte des boutons, formulaires et listes s'agrandit

#### Scenario: Aucune taille de police en pixels
- **WHEN** on analyse les feuilles de style du projet
- **THEN** aucune déclaration `font-size` n'utilise l'unité `px`

#### Scenario: Retour à la taille normale
- **WHEN** l'utilisateur revient au palier 0 ou réinitialise
- **THEN** la taille de police de base revient à 100 %
