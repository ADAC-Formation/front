# accessibility-menu Specification

## Purpose

Menu d'accessibilité du portail, aligné sur celui du site `adac.asso.fr`.

## Requirements

### Requirement: Options du menu
Le menu « Accessibilité » SHALL proposer, dans cet ordre : Augmenter le texte, Diminuer le texte, Niveau de gris, Haut contraste, Contraste négatif, Arrière-plan clair, Liens soulignés, Police lisible, Réinitialiser, puis Plan de site et Retour d'expérience. Chaque bascule SHALL exposer son état par `aria-pressed`.

#### Scenario: Ouverture
- **WHEN** l'utilisateur ouvre le menu
- **THEN** toutes les options sont présentes et jest-axe ne relève aucune violation

#### Scenario: Fermeture
- **WHEN** le menu est ouvert et l'utilisateur appuie sur Échap ou clique à l'extérieur
- **THEN** le menu se ferme

### Requirement: Taille du texte par paliers
Augmenter / Diminuer le texte SHALL faire varier la base de police entre 100 %, 112,5 %, 125 % et 150 % (classes `text-step-1..3` sur `<html>`). Le bouton SHALL être désactivé à la borne correspondante.

#### Scenario: Augmenter
- **WHEN** l'utilisateur clique trois fois sur « Augmenter le texte »
- **THEN** `<html>` porte `text-step-3` et le bouton est désactivé

#### Scenario: Migration
- **WHEN** le stockage contient l'ancien `fontSize: "large"`
- **THEN** le palier 125 % (`text-step-2`) est appliqué

### Requirement: Options d'affichage
Chaque bascule SHALL poser puis retirer sa classe sur `<html>` : `grayscale`, `high-contrast`, `negative-contrast`, `light-background`, `underline-links`, `readable-font`. Chaque classe SHALL avoir une règle CSS effective dans `index.css`.

#### Scenario: Bascule
- **WHEN** l'utilisateur active puis désactive « Niveau de gris »
- **THEN** la classe `grayscale` apparaît puis disparaît

#### Scenario: Haut contraste en mode sombre
- **WHEN** le mode sombre est actif et l'utilisateur active « Haut contraste »
- **THEN** `high-contrast` est posée (règles `html.dark.high-contrast`)

### Requirement: Réinitialisation
« Réinitialiser » SHALL ramener toutes les options du menu à leur valeur par défaut sans modifier le mode sombre.

#### Scenario: Réinitialiser
- **WHEN** plusieurs options sont actives puis l'utilisateur clique « Réinitialiser »
- **THEN** aucune classe d'option ne reste sur `<html>` et le stockage reflète les valeurs par défaut

### Requirement: Stockage limité aux préférences d'affichage
Le navigateur SHALL ne conserver que la clé `app-theme-preferences`, contenant uniquement des préférences d'affichage (D31).

#### Scenario: Contenu du stockage
- **WHEN** l'utilisateur modifie des options
- **THEN** `localStorage` ne contient que cette clé, avec les champs `isDark`, `fontStep`, `highContrast`, `grayscale`, `negativeContrast`, `lightBackground`, `underlineLinks`, `readableFont`

### Requirement: Plan de site
La route `/plan-du-site` SHALL lister les pages accessibles à l'utilisateur connecté ; les liens de gestion (Gestion, Formateurs, Stagiaires) SHALL n'apparaître que pour la chargée de formation et le formateur.

#### Scenario: Stagiaire
- **WHEN** un stagiaire ouvre le plan de site
- **THEN** il voit Formations, Messages, Notifications, Profil, et aucun lien de gestion

#### Scenario: Chargée de formation
- **WHEN** la chargée de formation ouvre le plan de site
- **THEN** elle voit en plus Gestion, Formateurs et Stagiaires

### Requirement: Retour d'expérience
Le lien « Retour d'expérience » SHALL pointer vers `https://www.adac.asso.fr/contact-nouvelle-version/` et s'ouvrir dans un nouvel onglet avec `rel="noopener noreferrer"`.

#### Scenario: Lien
- **WHEN** le menu est ouvert
- **THEN** le lien porte cette adresse
