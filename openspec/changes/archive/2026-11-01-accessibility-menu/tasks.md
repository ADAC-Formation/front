## 1. Cadrage

- [x] 1.1 Relever les options du site ADAC ; trancher paliers, liens du bas, mode sombre avec Manon ; inscrire D60 dans `docs/decisions-front-foundations.md`
- [x] 1.2 Branche `feature/accessibility` depuis `dev`

## 2. Tests d'abord (RED)

- [x] 2.1 `Accessibility.test.jsx` : options, paliers et bornes, bascules + `aria-pressed`, Réinitialiser, stockage, migration, jest-axe
- [x] 2.2 `display-preferences.test.js` : règles `text-step-1..3`, `grayscale`, `negative-contrast`, `readable-font`, `underline-links`, `light-background`
- [x] 2.3 `SiteMapPage.test.jsx` : liens par rôle, jest-axe
- [x] 2.4 Confirmer RED (20 échecs)

## 3. Implémentation (GREEN)

- [x] 3.1 `use-theme.js` : `fontStep`, options, migration, `resetAccessibility`
- [x] 3.2 `index.css` : règles des options
- [x] 3.3 Menu `Accessibility.jsx` + styles ; page `SiteMapPage` + route `/plan-du-site` (`lazyPage`)
- [x] 3.4 `npm run check` vert (306 tests, budget du bundle respecté)

## 4. À faire

- [x] 4.1 Passage manuel dans le navigateur sur le vrai back local : gris, négatif, fond clair en sombre, police lisible, plan de site par rôle (D30)
- [x] 4.2 Mettre à jour `docs/design-front.md` si le menu y est décrit
- [x] 4.3 Commit `feat: align accessibility menu with the ADAC site` ; relecture
