## 1. Préparation et mesure de départ

- [x] 1.1 Partir de `dev` à jour (branche `feature/mobile-layout` déjà créée) ; `npm run check` vert au départ (relancer si seul un test lent échoue sous charge). Vérifier : sortie de `npm run check`
- [x] 1.2 Relever la mesure « Avant » avec le passage scripté (Chrome sans interface, vrai back local, `npm run dev`) à 320, 360, 390, 430, 600, 768, 850, 1024, 1100, 1280 et 1920 px, texte à 100 % puis 150 % : libellés coupés (largeur du texte contre largeur disponible, menu Gestion et accueil), chevauchement en-tête / zone visible du logo, défilement horizontal. L'inscrire dans `docs/decisions-front-foundations.md` sous D61 (section « Avant ») ; vérifier qu'elle retrouve les constats du proposal (libellés coupés sous 1100 px, chevauchement ≤ 530 px et 800–910 px)

## 2. Bouton de session toujours nommé (TDD)

- [x] 2.1 RED : test de feuille de style (`src/test/`) — dans `LoginButton.module.css`, aucune règle de `.label` ne contient `display: none` et le masquage visuel du libellé est de type « lecteur d'écran seulement » (position absolue, 1 px, `clip-path`), annulé à partir de `1100px` ; test de composant `LoginButton` — nom accessible « Se déconnecter » (session) et « Se connecter » (visiteur, hors `/login`) ; confirmer RED sur le test de feuille de style (le test de composant passe déjà en jsdom : il documente le contrat)
- [x] 2.2 Remplacer `display: none` par le masquage visuel, déplacer le seuil du libellé de `800px` à `1100px` ; GREEN ; vérifier que jest-axe du `Header` reste vert
- [x] 2.3 Commit `fix: keep the session button accessible name when its label is hidden`

## 3. En-tête et logo sans chevauchement (TDD)

- [x] 3.1 RED : test de feuille de style — `index.css` définit `--header-row` ; `Logo.module.css` contient, sous `max-width: 639px`, `top: var(--header-row)` ; confirmer RED
- [x] 3.2 Ajouter `--header-row` (4.5rem) dans `index.css` et la règle de décalage dans `Logo.module.css` ; GREEN
- [ ] 3.3 Vérification navigateur : à 320, 360, 390, 430, 600, 639 px puis 640, 768, 850, 1024, 1100, 1920 px (texte 100 % et 150 %), aucun rectangle d'icône d'en-tête ne recoupe la zone visible du logo, et la zone visible du logo reste au-dessus de `--page-top` (≤ 260 px sous 640 px) ; consigner les chiffres pour D61. Ajuster `--header-row` si besoin
- [x] 3.4 Commit `fix: stop the header from covering the logo on phones and small tablets`

## 4. Menu Gestion : tuiles empilées, actions sans survol (TDD)

- [x] 4.1 RED : tests — composant `ManagementMenu` : chaque tuile contient ses liens d'action dans le DOM pour `SUPER_ADMIN` (créer + consulter) et `ADMIN` (consulter seulement) ; jest-axe sur la page ; feuille de style : la grille à trois colonnes n'existe que dans une requête `@container (min-width: …rem)`, le recouvrement au survol (`.tile:hover`, `::after`, `.actions` à `opacity: 0`) n'existe que sous `@media (hover: hover)`, une règle `:focus-within` révèle les actions ; confirmer RED
- [x] 4.2 Ajouter l'élément conteneur autour de la grille (`ManagementMenu`) ; écrire le CSS statique par défaut (une colonne, hauteur selon le contenu, icône et titre sur une ligne, actions visibles dessous, `overflow-wrap: anywhere` sur le titre, padding en `rem`) ; déplacer le comportement actuel (3 colonnes, 420 px, survol) sous `@media (hover: hover)` et `@container (min-width: 56rem)`, avec `:focus-within` ; GREEN
- [ ] 4.3 Vérification navigateur : `/admin/gestion` à 320, 390, 600, 768, 1024, 1100, 1280 et 1920 px, texte 100 % et 150 % : libellés entiers, pas de défilement horizontal ; en émulation tactile (sans survol) à 1280 px, actions visibles ; à 1280 px avec souris, comportement de survol inchangé ; Tab affiche chaque action. Joindre les chiffres à D61
- [x] 4.4 Commit `fix: stack the management tiles and show their actions without hover`

## 5. Accueil : tuiles qui tiennent (TDD)

- [ ] 5.1 RED : tests — feuille de style : `TileGroup.module.css` n'a plus `width: 60%` en dehors d'un contexte `@container` et contient une requête `@container (min-width: …rem)` pour la grille `2fr 1fr` ; test de composant `HomePage` : les quatre tuiles (grande tuile selon le rôle, Messages, Notifications, Profile) sont présentes ; jest-axe ; confirmer RED
- [ ] 5.2 Ajouter l'élément conteneur dans `TileGroup`, une colonne par défaut (grande tuile puis les trois petites, hauteurs réduites), grille `2fr 1fr` à partir du seuil, largeur `min(100%, 45rem)` (identique à 60 % à 1280 px) ; retirer `height: 50%` si sans effet ; GREEN
- [ ] 5.3 Vérification navigateur : `/` à 320, 390, 600, 768, 1024, 1100, 1280, 1920 px, texte 100 % et 150 % : « Messages », « Notifications », « Profile » entiers ; à 1280 px aspect identique à la mesure « Avant » (largeur du groupe 720 px) ; rôle `STAGIAIRE` aussi. Joindre les chiffres à D61
- [ ] 5.4 Commit `fix: let the dashboard tiles fit narrow screens and large text`

## 6. Garde-fou d'ensemble et documentation

- [ ] 6.1 Rejouer la matrice complète du passage scripté (1.2) et compléter D61 (« Après », protocole, tableau de chiffres, constat sur l'étiquette de tablette) ; mettre à jour `docs/design-front.md` (seuils : tuiles à 56 rem / 40 rem de conteneur, libellé d'en-tête à 1100 px, logo sous la rangée d'icônes sous 640 px, bouton de session nommé) et `CLAUDE.md` (« État actuel » : tuiles par requêtes de conteneur en `rem`, ne pas écrire de libellé en `display: none`) ; vérifier que les chiffres de D61 viennent des mesures
- [ ] 6.2 `npm run check` vert (lint, tests, build, budget du bundle) ; commit `docs: record the responsive layout rules and measurements`

## 7. Passage manuel et relecture

- [ ] 7.1 Passage manuel contre le vrai back local, sur écran réel ou émulation tactile : menu Gestion et accueil à 390 et 768 px (au doigt : toutes les actions atteignables), en-tête sans chevauchement à 390 et 850 px, « Grand texte » 150 %, mode sombre, contraste élevé, Tab sur toutes les actions — ne pas cocher sans l'avoir fait
- [ ] 7.2 Relecture de Manon : présentation d'une tuile de Gestion en colonne unique, disparition du libellé « Se déconnecter » entre 800 et 1099 px ; merge dans `dev` uniquement à sa demande

## Workflow follow-up

- Archiver le change après relecture (`/opsx:archive`) ; synchroniser les exigences ajoutées dans la spec principale `page-layout`.
- Ouvrir à part : poids de `Logo-Dark.png` (230 kB).
