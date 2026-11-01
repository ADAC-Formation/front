# Proposal

> Rédigé après coup (2026-11-01) : le code et les tests existaient déjà quand ce change a été écrit. Les décisions ont été prises avec Manon dans la conversation et consignées en D60.

## Why

Le site de l'association (`adac.asso.fr`) propose une barre d'accessibilité étendue. Le portail n'offrait que deux options (« Taille du texte » en bascule, « Contraste élevé »). Les stagiaires retrouvent des repères différents d'un site à l'autre, et deux options couvrent mal WCAG 1.4.4 / 1.4.3 / 1.4.12.

## What Changes

**Côté affecté : front uniquement** (aucune demande au back). Décision : D60 ; prolonge D58 (options d'affichage effectives).

- **Menu « Accessibilité »** : Augmenter / Diminuer le texte (paliers 100, 112,5, 125 et 150 %), Niveau de gris, Haut contraste, Contraste négatif, Arrière-plan clair, Liens soulignés, Police lisible, Réinitialiser, puis Plan de site et Retour d'expérience.
- **Plan de site** : page interne `/plan-du-site` (session requise), entrées selon le rôle.
- **Retour d'expérience** : lien externe `https://www.adac.asso.fr/contact-nouvelle-version/`.
- **Mode sombre** : inchangé, bouton dédié hors menu ; la réinitialisation le conserve.
- **Stockage** : `app-theme-preferences` passe de `{isDark, fontSize, highContrast}` à `{isDark, fontStep, highContrast, grayscale, negativeContrast, lightBackground, underlineLinks, readableFont}` ; l'ancien `fontSize: "large"` est migré vers le palier 2.
- **BREAKING (interne)** : la classe `text-large` disparaît au profit de `text-step-1..3` ; `toggleFontSize` / `toggleHighContrast` / `setTheme` disparaissent du contexte.

**Hors périmètre** : police dyslexique auto-hébergée (D31), formulaire de retour interne, mode sombre dans le menu, lecture à voix haute.

## Capabilities

### New Capabilities
- `accessibility-menu`: options, état et persistance du menu d'accessibilité, plan de site.

### Modified Capabilities
- `display-preferences` : l'exigence « Grand texte » est remplacée par les paliers de taille de texte (delta dans ce change, spec principal déjà aligné).

## Impact

- **Code** : `src/hooks/use-theme.js`, `src/components/molecules/Accessibility/`, `src/components/Pages/SiteMapPage/`, `src/index.css`, `src/router/router.jsx`.
- **Tests** : `Accessibility.test.jsx`, `SiteMapPage.test.jsx`, `src/test/display-preferences.test.js` ; jest-axe sur le menu ouvert et sur la page.
