# Spec Delta

## MODIFIED Requirements

### Requirement: En-tête et logo sans chevauchement
Les commandes de l'en-tête (retour, notifications, session, mode sombre, accessibilité) SHALL ne recouvrir aucune partie visible du logo ADAC, à toute largeur d'écran de 320 à 1920 px et à chaque palier de taille de texte, y compris quand toutes sont affichées (utilisateur `SUPER_ADMIN` ou `ADMIN`). Le libellé « Se connecter » / « Se déconnecter » SHALL n'apparaître que lorsque l'en-tête ainsi élargi ne rencontre pas le logo. Le dégagement sous le logo défini pour les pages (`Dégagement identique sous le logo`) SHALL rester inchangé et le contenu ne SHALL pas être recouvert par le logo.

#### Scenario: Téléphone
- **WHEN** n'importe quelle page est affichée sur un écran de 390 px
- **THEN** les icônes de l'en-tête n'empiètent pas sur le logo

#### Scenario: Téléphone étroit, toutes les icônes
- **WHEN** une utilisatrice `SUPER_ADMIN` affiche n'importe quelle page sur un écran de 320 px
- **THEN** le bouton de retour, la cloche, le mode sombre, l'accessibilité et la session n'empiètent pas sur le logo et ne débordent pas horizontalement de la page

#### Scenario: Tablette large
- **WHEN** n'importe quelle page est affichée sur un écran de 850 px
- **THEN** l'en-tête n'empiète pas sur le logo

#### Scenario: Grand texte
- **WHEN** la taille du texte est à 150 % et l'écran fait 1100 px
- **THEN** l'en-tête n'empiète pas sur le logo

#### Scenario: Contenu sous le logo
- **WHEN** n'importe quelle page est affichée sur un écran de 390 px
- **THEN** le premier élément du contenu commence sous le logo, à la même distance du haut que sur les autres pages
