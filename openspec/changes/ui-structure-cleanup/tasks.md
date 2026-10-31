## 1. Préparation

- [x] 1.1 Partir de `dev` à jour (branche `feature/ui-cleanup` déjà créée) ; vérifier `npm run check` au départ. Noter que le test d'auth « vide la session et redirige vers /login » est instable sur `dev` (3 échecs sur 5) : hors périmètre, à relancer avant de conclure à une régression
- [x] 1.2 Relever dans `docs/design-front.md` les écarts à lever (`text-large`, `high-contrast`, `--color-accent`) et inscrire D57 (gabarit de page unique, un seul `<main>`, dégagement 276 px) et D58 (options d'affichage effectives, garde-fous CSS) dans `docs/decisions-front-foundations.md` ; vérifier qu'elles suivent D56

## 2. Garde-fous CSS et jetons (TDD)

- [x] 2.1 RED : `src/test/css-hygiene.test.js` (lecture de toutes les feuilles via `import.meta.glob('../**/*.css', { query: '?raw', eager: true })`) — aucune `var(--x)` sans définition (jetons globaux, ou variable posée localement dans une feuille ou en `style` JSX), aucune couleur hexadécimale en dur hors `index.css`, aucun `outline: none` sans règle `:focus-visible` / `:focus-within` de remplacement dans la même feuille ; confirmer RED (au moins `--color-accent`, `#333` et les `outline: none` actuels)
- [x] 2.2 Ajouter `--color-on-yellow` et le couple `--color-action` / `--color-on-action` dans `index.css` ; `FormButton` utilise `--color-on-yellow` ; l'info-bulle de `CreateFormationPage.module.css` passe de `#333` / `white` à `--foreground` / `--background` ; les boutons orange doux de Formations, Catégories et comptes utilisent `--color-action` / `--color-on-action` ; les tests « variables » et « couleurs en dur » passent, vérifier que l'apparence normale est inchangée
- [x] 2.3 Commit `test: add CSS hygiene guards and define missing color tokens`

## 3. Options d'affichage effectives (TDD)

- [x] 3.1 RED : `src/test/display-preferences.test.js` — `index.css` contient `html.text-large` avec `font-size: 125%` ; aucune déclaration `font-size` en `px` dans les feuilles ; `html.high-contrast` et `html.dark.high-contrast` définissent `--background`, `--foreground`, `--muted-foreground`, `--border`, `--ring` en hexadécimal et le test calcule les rapports (texte et texte atténué ≥ 7:1, bordure ≥ 3:1) ; confirmer RED
- [x] 3.2 Ajouter les règles `text-large` et `high-contrast` (clair et sombre) à `index.css` ; convertir les 12 `font-size` en `px` des 9 feuilles en `rem` ; GREEN ; `npm run test -- display-preferences` vert
- [x] 3.3 Test de bascule (`Accessibility` / `use-theme`) : activer « Grand texte » et « Contraste élevé » pose les classes sur `<html>` et le stockage ne contient que les préférences d'affichage ; vérifier qu'il passe
- [x] 3.4 Commit `feat: make large text and high contrast preferences effective`

## 4. Gabarit de page unique (TDD)

- [x] 4.1 RED : `src/templates/PageShell/PageShell.test.jsx` (rend un `div`, pas un `main` ; variante `center` ; jest-axe) et `src/router/single-main.test.jsx` (chaque route — connexion, activation, tableau de bord, menu Gestion, formations, détail, catégories, création, listes / détail / formulaires de comptes — contient exactement un `main`, pour le rôle autorisé) ; confirmer RED
- [x] 4.2 Ajouter `--page-top` (276 px, 5rem + 180px sous 640 px) à `index.css` ; réécrire `PageShell` (div, dégagement, marges 2.5 / 1.5 / 1 rem, largeur 80rem, variante `center`) ; vérifier le test `PageShell`
- [x] 4.3 Migrer Formations et Catégories (retirer `.container` et `padding-top`, garder le contenu) ; tests de ces deux pages (un `main`, contenu inchangé) verts
- [x] 4.4 Migrer création de formation (remplacer son `<main>`) et détail de formation (retirer `padding-top: 250px`) ; tests verts
- [x] 4.5 Migrer accueil, menu Gestion (remplacer son `<main>`, retirer le `padding-top: 160px` du `h1`) et les trois pages d'auth + connexion en variante `center` ; tests existants de `HomePage` et `LoginPage` toujours verts
- [x] 4.6 Migrer les pages de comptes (`.page` → `PageShell`, retirer les valeurs recopiées) ; les 59 tests de comptes restent verts ; `single-main.test.jsx` GREEN
- [x] 4.7 Commit `refactor: use one PageShell for every page and a single main landmark`

## 5. Lien « Retour » commun (TDD)

- [x] 5.1 RED : tests de présence — Formations (`/admin/gestion`), Catégories, Création et Détail de formation (`/formations`, « Retour aux formations » pour le détail) ; aucun `<button>` « Retour » ; aucune règle `.back` dans les feuilles de page ; confirmer RED
- [x] 5.2 Remplacer les liens écrits à la main par `BackButton` dans les quatre pages, supprimer les règles `.back` dupliquées et les `navigate(-1)` « Retour » (garder celui du bouton « Annuler » de la création) ; GREEN
- [x] 5.3 Commit `refactor: use BackButton on every secondary page`

## 6. Focus visible (TDD)

- [ ] 6.1 RED : la garde `outline: none` de 2.1 doit échouer sur les champs ; ajouter un test d'équivalent (règle globale `:focus-visible` à 2 px avec `--ring` dans `index.css`, anneau `:focus-within` sur les conteneurs de recherche) ; confirmer RED
- [ ] 6.2 Ajouter la règle globale, retirer les `outline: none` de `FormInput`, des sélecteurs et champs de création de formation, de Formations (`searchContainer`, tri) et des comptes ; ajouter `:focus-within` aux conteneurs de recherche ; GREEN ; vérifier au clavier (Tab) sur Formations
- [ ] 6.3 Commit `fix: restore a visible keyboard focus ring everywhere`

## 7. Documentation et passage manuel

- [ ] 7.1 Mettre à jour `docs/design-front.md` (écarts levés), `CLAUDE.md` (section « État actuel » : gabarit, options d'affichage, garde-fous) et noter dans `docs/decisions-front-foundations.md` le changement de destination du « Retour » (Catégories, Création) ; vérifier que `design-front.md` ne liste plus ces écarts
- [ ] 7.2 `npm run check` vert (lancer deux fois si le test d'auth instable échoue seul) ; commit `docs: record layout and display preferences cleanup`
- [ ] 7.3 Passage manuel sur le vrai back local, à ≥ 1280, 768 et 390 px puis à ≥ 1920 px : dégagement sous le logo identique sur toutes les pages (y compris comptes), aucune superposition avec le logo, « Retour » partout, Tab visible sur chaque champ, « Grand texte » sans débordement (formulaires d'auth, boutons), « Contraste élevé » en clair et en sombre — ne pas cocher sans l'avoir fait
- [ ] 7.4 Relecture de Manon ; merge dans `dev` uniquement à sa demande

## Workflow follow-up

- Archiver le change après relecture (`/opsx:archive`).
- Ouvrir à part le correctif du test d'auth instable.
