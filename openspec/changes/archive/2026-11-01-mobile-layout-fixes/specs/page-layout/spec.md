# Spec Delta

## Purpose

Étend les garanties de mise en page de `page-layout` aux téléphones et aux tablettes : tuiles lisibles et utilisables au doigt, en-tête qui ne recouvre pas le logo, bouton de session toujours nommé.

## ADDED Requirements

### Requirement: Libellés de tuiles jamais coupés
Les tuiles du menu Gestion et du tableau de bord SHALL afficher leur libellé en entier, à toute largeur d'écran à partir de 320 px et à chaque palier de taille de texte (100 % à 150 %). Quand la largeur manque, la mise en page SHALL s'adapter (tuiles empilées) plutôt que de couper ou masquer le texte. Aucune tuile SHALL déborder horizontalement de la page.

#### Scenario: Menu Gestion sur téléphone
- **WHEN** la chargée de formation ouvre `/admin/gestion` sur un écran de 390 px
- **THEN** « Formations », « Formateurs » et « Stagiaires » sont lisibles en entier et les tuiles sont l'une sous l'autre

#### Scenario: Menu Gestion sur tablette
- **WHEN** elle ouvre `/admin/gestion` sur un écran de 768 px
- **THEN** les trois libellés sont lisibles en entier

#### Scenario: Tableau de bord sur téléphone
- **WHEN** un utilisateur connecté ouvre `/` sur un écran de 390 px
- **THEN** « Messages », « Notifications » et « Profile » sont lisibles en entier

#### Scenario: Grand texte
- **WHEN** la taille du texte est à 150 % et l'écran fait 1024 px
- **THEN** tous les libellés de tuiles restent lisibles en entier et la page n'a pas de défilement horizontal

#### Scenario: Grand écran
- **WHEN** l'écran fait 1280 px ou plus à la taille de texte normale
- **THEN** les trois tuiles du menu Gestion sont côte à côte, comme avant

### Requirement: Actions des tuiles accessibles sans survol
Sur le menu Gestion, les actions de chaque tuile (« Créer… », « Consulter… ») SHALL être visibles et utilisables sans survol de souris : sur un appareil tactile, quand les tuiles sont empilées, et lorsqu'une action reçoit le focus clavier. Sur grand écran avec une souris, elles PEUVENT rester révélées au survol. Aucune action SHALL être masquée tout en restant atteignable au clavier.

#### Scenario: Écran tactile
- **WHEN** la chargée de formation ouvre `/admin/gestion` sur un appareil sans survol
- **THEN** les liens « Créer… » et « Consulter… » de chaque tuile sont visibles sans toucher la tuile d'abord

#### Scenario: Tuiles empilées
- **WHEN** l'écran est assez étroit pour que les tuiles soient l'une sous l'autre
- **THEN** les actions de chaque tuile sont visibles en permanence

#### Scenario: Focus clavier
- **WHEN** l'utilisateur atteint un lien d'action avec la touche Tab
- **THEN** ce lien est visible et son indicateur de focus l'est aussi

#### Scenario: Formateur en lecture seule
- **WHEN** un formateur (rôle `ADMIN`) ouvre le menu Gestion
- **THEN** seules les actions de consultation sont visibles, comme avant (D54)

### Requirement: En-tête et logo sans chevauchement
Les commandes de l'en-tête (session, mode sombre, accessibilité) SHALL ne recouvrir aucune partie visible du logo ADAC, à toute largeur d'écran de 320 à 1920 px et à chaque palier de taille de texte. Le libellé « Se connecter » / « Se déconnecter » SHALL n'apparaître que lorsque l'en-tête ainsi élargi ne rencontre pas le logo. Le dégagement sous le logo défini pour les pages (`Dégagement identique sous le logo`) SHALL rester inchangé et le contenu ne SHALL pas être recouvert par le logo.

#### Scenario: Téléphone
- **WHEN** n'importe quelle page est affichée sur un écran de 390 px
- **THEN** les trois icônes de l'en-tête n'empiètent pas sur le logo

#### Scenario: Tablette large
- **WHEN** n'importe quelle page est affichée sur un écran de 850 px
- **THEN** l'en-tête n'empiète pas sur le logo

#### Scenario: Grand texte
- **WHEN** la taille du texte est à 150 % et l'écran fait 1100 px
- **THEN** l'en-tête n'empiète pas sur le logo

#### Scenario: Contenu sous le logo
- **WHEN** n'importe quelle page est affichée sur un écran de 390 px
- **THEN** le premier élément du contenu commence sous le logo, à la même distance du haut que sur les autres pages

### Requirement: Bouton de session toujours nommé
Le bouton de connexion / déconnexion de l'en-tête SHALL avoir un nom accessible (« Se connecter » ou « Se déconnecter ») à toute largeur d'écran, y compris quand son libellé n'est pas affiché visuellement. Un libellé masqué visuellement SHALL rester présent pour les technologies d'assistance.

#### Scenario: Petit écran
- **WHEN** un lecteur d'écran lit l'en-tête sur un écran de 390 px
- **THEN** le bouton est annoncé « Se déconnecter » (utilisateur connecté) ou « Se connecter » (visiteur)

#### Scenario: Grand écran
- **WHEN** l'écran fait 1280 px
- **THEN** le libellé est affiché à côté de l'icône
