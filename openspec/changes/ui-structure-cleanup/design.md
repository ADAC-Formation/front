# Design

## Context

- `Layout` rend `<Logo/>` (positionné en `absolute`, largeur `clamp(220px, 60vw, 580px)`), `<SiteHeader/>` puis `<main><Outlet/></main>`. Le logo ne prend pas de place dans le flux : chaque page compense en poussant son contenu vers le bas, et chacune l'a fait à sa façon (voir proposal.md, « Why »).
- `templates/PageShell` rend un `<main>` avec `padding: 6rem 2.5rem 3rem` (5rem / 1rem sur mobile). Formations et Catégories l'utilisent puis ajoutent un conteneur `width: min(80rem, 100%)` avec `padding-top: 180px`. Les pages de comptes (`.page` dans `AccountPages.module.css`) ont recopié ces valeurs sans imbriquer de `<main>`.
- Les thèmes sont des classes sur `<html>` posées par `hooks/use-theme.js` : `dark`, `text-large`, `high-contrast`. Les jetons vivent dans `src/index.css` (`:root`, `.dark`). Aucune règle ne correspond à `text-large` ni `high-contrast`.
- Il y a 12 déclarations `font-size` en `px` dans 9 feuilles de style ; le reste est déjà en `rem`.
- Conflits avec les specs existantes : aucun (`user-session` ne parle pas de mise en page).

## Goals / Non-Goals

**Goals:**
- Un seul gabarit, un seul `<main>`, un seul dégagement sous le logo, un seul « Retour », un focus visible partout.
- Rendre `text-large` et `high-contrast` effectifs et les protéger par des tests.
- Empêcher le retour de ces défauts par des tests de garde-fou.

**Non-Goals:**
- Changer l'apparence des pages (couleurs, rayons, typographie) au-delà de l'alignement du dégagement.
- Factoriser carte, barre de recherche, bouton d'action : seul le gabarit et le « Retour » sont communs.
- Corriger le contraste du blanc sur orange doux en mode normal (décision de design de Manon) ; seul le mode « Contraste élevé » le traite (décision 6).

## Decisions

1. **`PageShell` reste le gabarit unique, mais rend un `<div>`.** Il porte le dégagement (`padding-top` lu dans un jeton `--page-top` de `index.css` : `calc(6rem + 180px)`, `calc(5rem + 180px)` sous 640 px), les marges latérales (2.5 / 1.5 / 1 rem) et la largeur de contenu `80rem`. Le `<main>` reste celui de `Layout`. *Alternative écartée* : retirer le `<main>` de `Layout` et laisser chaque page le fournir — oublis garantis, et les pages d'auth n'ont pas de `PageShell`.
2. **Variante `center`** : même dégagement, mais contenu centré dans l'espace restant (`min-height: 100vh`, flex). Utilisée par l'accueil, le menu Gestion et les pages d'auth, qui ont aujourd'hui leur propre `min-height: 100vh` et leur propre `padding-top`.
3. **Les pages perdent leur conteneur maison** : suppression de `.container`/`padding-top` dans les feuilles de Formations, Catégories, Création, Détail, Accueil, Menu, Auth et comptes ; elles enveloppent leur contenu dans `<PageShell>`. Les pages de comptes ne gardent que ce qui leur est propre. Une page migrée à la fois, chacune avec un test de non-régression (un `main`, présence du « Retour »).
4. **`BackButton` remplace tous les « Retour »**, avec une destination explicite : liste des formations → `/admin/gestion` ; Catégories, Création, Détail de formation → `/formations`. Les deux règles `navigate(-1)` (Catégories, Création) disparaissent ; le bouton « Annuler » de la création garde `navigate(-1)` (ce n'est pas un lien « Retour »).
5. **Focus** : règle globale `:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }` dans `index.css`. Les `outline: none` sur `:focus` de `FormInput`, des listes de sélection et des champs de création sont supprimés ; pour les champs enveloppés (recherche), le conteneur reçoit l'anneau via `:focus-within`. `IconButton` et `LoginButton` gardent leur anneau en `box-shadow` (remplacement déjà correct). Le test de garde accepte un `outline: none` seulement si la même feuille contient une règle `:focus-visible` ou `:focus-within` avec `outline` ou `box-shadow`.
6. **Contraste élevé par jetons, en hexadécimal** (pour pouvoir calculer les rapports en test sans analyser de `oklch`) : `html.high-contrast` (clair : fond `#fff`, texte `#000`, texte atténué `#3a3a3a`, bordure `#595959`, anneau `#000`) et `html.dark.high-contrast` (fond `#000`, texte `#fff`, atténué `#d6d6d6`, bordure `#a6a6a6`, anneau `#ffe600`), avec une spécificité supérieure à `.dark`. Les boutons d'action orange doux utilisent un nouveau couple `--color-action` / `--color-on-action` (orange doux + fond de page aujourd'hui, noir sur jaune en contraste élevé) : le visuel normal ne change pas. Le texte du bouton jaune utilise `--color-on-yellow`.
7. **Grand texte** : `html.text-large { font-size: 125%; }` ; les 12 `font-size` en `px` deviennent des `rem` (px ÷ 16). Un test de garde interdit `font-size: …px`.
8. **Garde-fous = tests Vitest lisant les feuilles de style** (`import.meta.glob('../**/*.css', { query: '?raw', eager: true })`) : variables non définies, `outline: none` sans remplacement, `font-size` en `px`, couleurs hexadécimales en dur hors `index.css`, rapports de contraste de `high-contrast`. Un test de routes vérifie un seul `main` par route.

## Risks / Trade-offs

- [Le dégagement commun (276 px) décale accueil, détail, création, menu et auth] → valeur déjà utilisée par la page que Manon prend pour référence ; passage visuel manuel sur chaque page à 3 largeurs (≥ 1280, 768, 390 px) et en grand texte.
- [Le logo atteint 580 px de large : sa hauteur peut dépasser 276 px sur très grand écran et recouvrir le contenu] → vérifier à ≥ 1920 px lors du passage manuel ; si besoin, `--page-top` suit la largeur du logo (changement d'un seul jeton).
- [Grand texte : des largeurs fixes en `px` (ex. 295 px des formulaires d'auth, 230 px des boutons) peuvent déborder à 125 %] → relevés pendant le passage manuel ; passer ces largeurs en `rem` dans les mêmes tâches.
- [Les couleurs de catégories (texte coloré) ne passent pas toutes 7:1 en contraste élevé] → hors des jetons ; en contraste élevé le texte des étiquettes de catégorie prend `--foreground` et la couleur reste portée par la barre et le point.
- [Les tests de garde lisent du CSS brut : analyse par expressions régulières, pas un vrai parseur] → règles volontairement simples (blocs `{…}` sans imbrication, ce que le projet n'utilise pas) ; un cas non reconnu fait échouer le test plutôt que passer.
- [Le « Retour » de Création et Catégories ne suit plus l'historique] → destinations fixes documentées ; aucune de ces pages n'est atteinte depuis une autre que Formations.

## Open Questions

- Aucune qui change les specs ou les tâches : l'ajustement éventuel de `--page-top` sur très grand écran se tranche au passage manuel.
