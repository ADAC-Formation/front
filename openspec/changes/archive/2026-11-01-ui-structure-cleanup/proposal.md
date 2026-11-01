# Proposal

## Why

Les pages écrites avant l'auth ont chacune leur propre mise en page copiée-collée, ce qui se voit à l'écran et pose des problèmes d'accessibilité. Constats de l'audit (lecture du code, `dev` au 2026-10-31) :

- **Deux `<main>` imbriqués** : `Layout` rend déjà un `<main>`, mais `PageShell` (Formations, Catégories), `CreateFormationPage` et `ManagementMenu` en rendent un second. Un lecteur d'écran annonce deux zones principales.
- **Dégagement sous le logo incohérent** : 276 px (Formations, Catégories = `PageShell` 6 rem + conteneur 180 px), 220 px (création de formation), 250 px (détail), 180 px (accueil), 160 px (menu Gestion), 120 px (pages d'auth), alors que le logo est le même partout. C'est l'écart que Manon a constaté sur les pages de comptes.
- **Lien « Retour » écrit cinq fois** : une règle `.back` par feuille de style (Formations, Catégories, Création, Détail) plus le nouveau `BackButton` ; certains pages sont un `<button>` avec `navigate(-1)`, d'autres un `<Link>`.
- **Focus peu visible** : `outline: none` avec pour seul remplacement un changement de couleur de bordure de 1 px (`FormInput`, recherche et tri de Formations, champs de la création de formation).
- **Options d'affichage sans effet** : `text-large` et `high-contrast` sont posées sur `<html>` sans aucune règle CSS ; de plus la plupart des tailles de police sont en `px`, donc « Grand texte » ne les agrandirait pas.
- **Valeurs fantômes** : `FormButton` utilise `var(--color-accent)`, jamais défini ; l'info-bulle de la création de formation utilise `#333` en dur.

## What Changes

**Côté affecté : front uniquement** (aucune demande au back). Pas de ticket back ; décisions concernées : D2/D41 (design), D15 (WCAG 2.1 AA), D32 (`features/` vs `components/`).

- **Gabarit de page unique** : `PageShell` devient le seul gabarit, rend un `<div>` (le `<main>` reste celui de `Layout`), porte le dégagement sous le logo (276 px, valeur de Formations) et la largeur de contenu ; toutes les pages l'utilisent (Formations, Catégories, Création, Détail, Accueil, menu Gestion, pages d'auth, pages de comptes).
- **`BackButton` partout** à la place des liens écrits à la main ; suppression des quatre règles `.back` dupliquées.
- **Focus visible** : un anneau de focus commun (2 px, `--ring`) sur champs, recherche, listes de sélection et conteneurs de recherche ; plus d'`outline: none` sans remplacement.
- **Options d'affichage** : règles CSS pour `html.text-large` (texte 125 %, les tailles de police passent en `rem`) et `html.high-contrast` (jetons de couleur à fort contraste, clair et sombre).
- **Valeurs fantômes** : un jeton `--color-on-yellow` pour le texte du bouton jaune, l'info-bulle sur `--foreground` / `--background`.
- **Garde-fous automatiques** : tests qui échouent si une page rend deux `<main>`, si une feuille de style utilise une variable CSS non définie, ou si `outline: none` revient sans remplacement.
- **BREAKING (visuel mineur)** : le dégagement sous le logo change pour la création de formation (220 → 276), le détail (250 → 276), l'accueil (180 → 276), le menu Gestion et l'authentification (centrés, + dégagement). Le « Retour » de Catégories et Création mène à `/formations` au lieu de l'historique.

**Hors périmètre** : refonte visuelle, extraction de composants communs (bouton d'action, carte, barre de recherche), polices auto-hébergées (D31), données encore mockées (`simFormations`, `categories`), correction du test d'auth instable (change séparé), pages Profil / Messages / Notifications (coques vides).

## Capabilities

### New Capabilities
- `page-layout`: structure et navigation communes des pages (une seule zone principale, dégagement sous le logo identique, lien « Retour » commun, focus visible).
- `display-preferences`: effet réel des options « Grand texte » et « Contraste élevé », sur tout le site.

### Modified Capabilities
- Aucune (les exigences de `user-session` sur la connexion et le tableau de bord ne changent pas).

## Impact

- **Code** : `src/templates/PageShell/`, `src/Layout/`, `src/index.css`, les pages de `src/components/Pages/*`, `src/features/auth/` (pages d'auth), `src/features/accounts/`, `src/components/atoms/{FormButton,FormInput}`, `src/components/molecules/BackButton`, feuilles de style des pages ; tailles de police en `px` → `rem` partout.
- **Tests** : `PageShell`, un seul `<main>` par route, variables CSS définies, règles `text-large` / `high-contrast` (contraste ≥ 7:1 calculé sur les jetons), « Retour » sur chaque page ; jest-axe conservé.
- **Docs** : `docs/design-front.md` (écarts levés), `docs/decisions-front-foundations.md` (D57+), `CLAUDE.md` (état actuel).
- **Dépendances** : aucune.
