# Design

## Context

Mesures du 2026-11-01 (Chrome piloté, vrai back local, `dev` au commit `307ca9e`) ; voir proposal.md pour les constats.

- **Menu Gestion** (`ManagementMenu` + `ManagementTiles`) : grille fixe `repeat(3, 1fr)` dans `width: min(1200px, 90%)`, tuiles de 420 px de haut, padding 32 px, libellé en `2rem` (le plus long, « Formateurs », mesure 205 px). Une tuile exige donc environ 270 px : trois colonnes ne tiennent qu'à partir d'environ 1100 px de fenêtre. Les actions sont dans `.actions` (`opacity: 0`, superposées) et ne se révèlent qu'avec `.tile:hover`.
- **Accueil** (`HomePage` → `TileGroup` → `Tile`) : grille `2fr 1fr` × 3 lignes, `width: 60%; height: 50%` ; à 390 px les petites tuiles font 64 px, « Notifications » (112–125 px de texte) ne rentre qu'à partir d'environ 1100 px.
- **En-tête** (`Header`, `fixed`, en haut à droite) et **logo** (`Logo`, `absolute`, centré, `width: clamp(220px, 60vw, 580px)`, avec de grandes marges transparentes : la partie visible ne fait que 53 % de la largeur de l'image). `LoginButton` affiche son libellé à partir de 800 px (`min-width: 800px`) ; en dessous le libellé est en `display: none`, sans `aria-label`.
- Chevauchement visible mesuré : largeur d'écran ≤ environ 530 px, et 800 → environ 910 px (en-tête avec libellé : 286 px ; sans : 168 px). Pas de chevauchement de 600 à 780 px, ni à 920 px et plus.
- `--page-top` (D57) fait 276 px (260 px sous 640 px) ; la zone visible du logo descend jusqu'à environ 250 px à grande largeur : toute solution qui décale le logo vers le bas doit rester au-dessus de cette valeur.
- Les paliers de taille de texte vont maintenant jusqu'à 150 % (`text-step-3`, D60). Les requêtes `@media` expriment `rem` par rapport à la taille **initiale** du navigateur, pas à la base modifiée par `html { font-size: … }` ; les requêtes de **conteneur** (`@container`) résolvent `rem` sur la taille réelle de la racine, donc suivent « Grand texte ».
- Pas de conflit avec une spec existante : `page-layout` ne parle ni de tuiles ni d'en-tête (une exigence y est ajoutée, sans en modifier aucune).

## Goals / Non-Goals

**Goals:**
- Aucun libellé de tuile coupé, de 320 à 1920 px, à chaque palier de texte (jusqu'à 150 %).
- Actions des tuiles utilisables au doigt et au clavier.
- En-tête sans chevauchement du logo, à chaque largeur et palier de texte.
- Bouton de session nommé pour les technologies d'assistance partout.

**Non-Goals:**
- Changer l'apparence sur grand écran (≥ 1280 px, texte normal) : mêmes tuiles, mêmes couleurs, même animation de survol.
- Toucher à `--page-top` ou à `PageShell`.
- Introduire une bibliothèque de test navigateur (Playwright, etc.) : la vérification géométrique reste un passage scripté documenté, voir décision 6.

## Decisions

1. **Requêtes de conteneur avec seuils en `rem`, une par grille.** Le conteneur est un petit élément enveloppant (`container-type: inline-size`) autour de la grille du menu Gestion et autour du groupe de tuiles de l'accueil. Seuils : Gestion → 3 colonnes à partir de `56rem` de conteneur (3 × 17,5 rem de tuile + 2 gaps), sinon une colonne ; accueil → grille `2fr 1fr` à partir de `40rem`, sinon une colonne (grande tuile puis les trois petites). *Pourquoi* : le besoin dépend de la place **dans le conteneur** et de la taille du texte, pas de la fenêtre ; `rem` dans `@container` suit « Grand texte ». *Alternatives écartées* : `@media (max-width: …)` (ne suit pas la base de police modifiée : à 150 % le texte déborderait encore) ; `repeat(auto-fit, minmax(17.5rem, 1fr))` (suit le texte sans requête, mais donne 2 + 1 tuiles orphelines sur tablette, ce que Manon n'a pas demandé) ; mesure JavaScript (inutile, CSS suffit).
2. **Mode statique par défaut, mode « survol » en option.** Le CSS de base des tuiles de Gestion est le mode statique : hauteur selon le contenu, icône et titre sur une ligne, actions visibles dessous, pas de recouvrement animé. Le comportement actuel (hauteur 420 px, actions révélées par `.tile:hover` et recouvrement `::after`) n'est appliqué que sous `@media (hover: hover)` **et** `@container (min-width: 56rem)`, avec en plus `:focus-within` pour que le focus clavier révèle aussi les actions. *Pourquoi* : mobile d'abord ; un appareil tactile large (iPad en paysage, ≥ 1100 px) reste en mode statique parce qu'il n'a pas de survol. *Alternative écartée* : conserver le survol partout et ajouter un bouton « ouvrir » (ajoute un comportement et du DOM).
3. **Dernier recours contre la coupure : le retour à la ligne.** En mode statique le titre a `overflow-wrap: anywhere` (et `hyphens: auto`) : même à 320 px et 150 % de texte, un mot long passe à la ligne au lieu d'être coupé. Le padding des tuiles empilées passe en `rem` pour suivre le texte.
4. **Logo sous la rangée d'icônes sous 640 px ; libellé « Se déconnecter » à partir de 1150 px.** Sous 640 px le logo prend `top: var(--header-row)` (jeton `4.5rem` dans `index.css`, soit la rangée d'en-tête de 66 px mesurée plus une marge) : sa zone visible descend jusqu'à environ 240 px, sous les 260 px de `--page-top`. Le seuil du libellé passe de `800px` à `1150px` : au-delà, même à 150 % de texte (en-tête d'environ 345 px), l'en-tête commence à droite de la zone visible du logo (chevauchement calculé jusqu’à environ 1140 px à 150 %, mesuré). Entre 640 et 1099 px l'en-tête est réduit aux trois icônes. *Alternatives écartées* : décaler le logo vers le bas à toutes les largeurs sous 910 px (sa zone visible dépasserait `--page-top` : 297 px contre 276 px à 900 px, il recouvrirait le contenu) ; réduire le logo entre 800 et 910 px (saut de taille brutal à 800 px) ; relever `--page-top` (touche D57 et toutes les pages).
5. **Libellé du bouton de session masqué sans le supprimer.** `display: none` est remplacé par un masquage « lecteur d'écran seulement » (position absolue, 1 px, `clip-path`), annulé à partir de 1150 px. *Alternative écartée* : `aria-label` fixe sur le bouton (duplique le texte et ne suit pas les changements d'état sans code supplémentaire).
6. **Garde-fous et preuve.** (a) Tests de feuilles de style (même technique que `css-hygiene.test.js`) : le libellé de `LoginButton` n'a pas de `display: none` ; les grilles de Gestion et d'accueil ont une requête `@container` en `rem` ; le survol de Gestion est sous `@media (hover: hover)`. (b) Tests de composant : actions de Gestion présentes dans le DOM pour chaque rôle, bouton de session nommé ; jest-axe sur Gestion et accueil. (c) jsdom n'applique pas le CSS : la **preuve géométrique** est un passage scripté (Chrome sans interface, vrai back local) à 320, 360, 390, 430, 600, 768, 850, 1024, 1100, 1280 et 1920 px, texte à 100 % et 150 % : libellés non coupés (largeur du texte contre largeur disponible), pas de défilement horizontal, rectangles de l'en-tête contre zone visible du logo. Le protocole et les résultats sont consignés dans D61 ; le script reste hors dépôt (pas de nouvelle dépendance).

## Risks / Trade-offs

- [Requêtes de conteneur : navigateurs anciens] → tous les navigateurs actuels les prennent en charge ; sans elles la colonne unique statique s'applique (mode par défaut), lisible mais sans la grille à 3 colonnes.
- [Le libellé « Se déconnecter » disparaît sur tablette 800–1099 px] → le bouton garde son nom pour les lecteurs d'écran et son icône ; changement visible à valider par Manon au passage manuel (sinon seuil à revoir en lien avec la taille du logo).
- [Hauteur de la rangée d'en-tête variable selon le texte (boutons en `rem`)] → jeton unique `--header-row` à vérifier à 150 % ; si l'écart grandit, la valeur se règle en un seul endroit.
- [Colonne unique : le menu Gestion devient plus haut] → tuiles statiques d'environ 200 px au lieu de 420 px, donc moins haut qu'un simple empilement des tuiles actuelles.
- [Les tests de feuilles de style lisent du texte CSS (analyse simple, pas un parseur)] → règles volontairement peu nombreuses et nommées ; un cas non reconnu fait échouer le test plutôt que passer.
- [Conflit de fusion] → aucun change ouvert ; `index.css` est partagé avec les autres branches : l'ajout d'un jeton est un petit bloc distinct.

## Open Questions

- Aucune qui change les specs ou les tâches. La présentation exacte d'une tuile de Gestion en colonne unique (icône et titre côte à côte, actions dessous) est proposée et se juge sur capture avec Manon au passage manuel.
