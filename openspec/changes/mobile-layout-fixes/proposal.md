# Proposal

## Why

Le passage manuel de `ui-structure-cleanup` (Chrome piloté contre le vrai back, 320 → 1440 px) a relevé des défauts de mise en page **présents avant ce change** et qui touchent aussi les tablettes (D42 : bonne UX tablette et mobile) :

- **Libellés de tuiles coupés.** Menu Gestion : « Formations », « Formateurs » (205 px de texte) et « Stagiaires » ne tiennent dans leur tuile à aucune largeur sous 1100 px (tuiles de 70 px à 390 px, 200 px à 768 px, 267 px à 1024 px). Accueil : « Messages », « Notifications » et « Profile » sont coupés sous 1100 px (le groupe de tuiles est fixé à `width: 60%`, soit des tuiles de 64 px à 390 px).
- **Actions des tuiles du menu Gestion invisibles sans survol.** « Créer… » et « Consulter… » n'apparaissent qu'au `:hover` (`opacity: 0`) : impossible à atteindre au doigt, et au clavier le lien reçoit le focus sans rien montrer.
- **Logo recouvert par l'en-tête.** Mesuré sur la zone opaque réelle du logo : chevauchement de 320 à 430 px (les trois icônes passent sur les carrés colorés) **et** de 800 à environ 910 px, là où le libellé « Se déconnecter » apparaît (`LoginButton`, `min-width: 800px`) et élargit l'en-tête de 168 à 286 px.
- **Bouton de session sans nom accessible sous 800 px.** Son libellé est masqué par `display: none` et le bouton n'a pas d'`aria-label` : un lecteur d'écran annonce « bouton » seul (WCAG 4.1.2). Les tests jest-axe ne le voient pas, jsdom n'applique pas le CSS.

Ces défauts ne sont pas dus à `ui-structure-cleanup` ; ils étaient hors de son périmètre et sont consignés dans ses tâches.

## What Changes

**Côté affecté : front uniquement.** Pas de ticket back, pas de comportement métier. Décisions concernées : D42 (tablette et mobile), D15 (accessibilité), D57 (gabarit de page).

- **Tuiles qui tiennent toujours** : le menu Gestion passe d'une grille de 3 colonnes à une seule colonne quand il n'y a pas la place, et l'accueil empile ses tuiles ; les seuils sont exprimés en `rem` dans des requêtes de conteneur, donc ils suivent « Grand texte » (jusqu'à 150 %). Aucun libellé coupé, à aucune largeur, à aucun palier de taille de texte.
- **Actions des tuiles toujours accessibles** : sur écran tactile, en colonne unique et au focus clavier, les liens « Créer… » / « Consulter… » du menu Gestion sont visibles sans survol ; la révélation au survol est conservée sur grand écran avec souris.
- **En-tête et logo ne se chevauchent plus** : sous 640 px le logo descend sous la rangée d'icônes ; le libellé « Se déconnecter » n'apparaît qu'à partir de 1150 px (au lieu de 800 px), là où il ne rencontre plus le logo, y compris en grand texte.
- **Bouton de session nommé partout** : le libellé reste dans l'arbre d'accessibilité quand il est masqué visuellement (masquage « lecteur d'écran seulement », pas `display: none`).
- **Garde-fous** : tests de feuilles de style (seuils, masquage non destructif) et mesure géométrique en navigateur consignée dans une décision (D61).

**Hors périmètre** :
- `--page-top` et le gabarit `PageShell` (D57) : inchangés ; seule la position du logo change sous 640 px.
- Refonte visuelle des tuiles (couleurs, rayons, icônes, animation de survol) : identiques.
- Pages de formations, comptes, authentification : déjà vérifiées sans débordement à 320–1920 px.
- Poids du logo (`Logo-Dark.png`, 230 kB) : change séparé.

## Capabilities

### New Capabilities
- Aucune.

### Modified Capabilities
- `page-layout`: nouvelles exigences — libellés de tuiles jamais coupés, actions de tuiles accessibles sans survol, en-tête et logo sans chevauchement, bouton de session nommé quand son libellé est masqué.

## Impact

- **Code** : `components/molecules/ManagementTiles/` et `components/Pages/ManagementMenu/` (grille, mode statique, focus), `components/molecules/TileGroup/` et `components/atoms/Tile/` (accueil), `components/atoms/Logo/Logo.module.css` (décalage sous 640 px), `components/atoms/LoginButton/` (libellé masqué visuellement, seuil 1150 px), `index.css` (jeton de hauteur de la rangée d'en-tête, classe utilitaire « lecteur d'écran seulement » si elle y est mise en commun).
- **Tests** : garde-fous sur feuilles de style (`src/test/`), tests de composants (nom accessible du bouton de session, actions du menu Gestion présentes dans le DOM), jest-axe sur le menu Gestion et l'accueil ; vérification géométrique en navigateur (hors suite, consignée dans D61).
- **Docs** : `docs/decisions-front-foundations.md` (D61), `docs/design-front.md` (seuils et comportement des tuiles), `CLAUDE.md` si une règle d'usage s'ajoute.
- **Dépendances** : aucune.
- **Risques** : requêtes de conteneur (`@container`) supportées par tous les navigateurs actuels ; un navigateur plus ancien retombe sur la colonne unique, lisible mais non optimisée (voir design.md).
