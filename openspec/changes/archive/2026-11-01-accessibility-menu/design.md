# Design

## Context

Les préférences sont des classes sur `<html>` posées par `hooks/use-theme.js` ; les règles vivent dans `src/index.css` (D58). Tout est en `rem`, donc une base de police variable suffit à agrandir le texte.

## Decisions

1. **Une classe par option sur `<html>`** (`grayscale`, `high-contrast`, `negative-contrast`, `light-background`, `underline-links`, `readable-font`, `text-step-N`), pilotée par une table `TOGGLE_CLASSES`. Ajouter une option = une ligne + une règle CSS.
2. **Taille du texte en paliers** `fontStep` 0..3 (100 / 112,5 / 125 / 150 %), bornée. *Écarté* : deux niveaux seulement.
3. **Niveau de gris = `filter: grayscale(1)` ; contraste négatif = `filter: invert(1) hue-rotate(180deg)`** (les teintes restent reconnaissables) ; les deux ensemble : `grayscale(1) invert(1)`.
4. **Arrière-plan clair = jetons du mode clair forcés** par-dessus `.dark` (`html.dark.light-background`). *Écarté* : le fusionner avec le mode sombre.
5. **Police lisible = pile de polices système** (Verdana, Tahoma, Trebuchet MS) sur `--font-sans` et `--font-display` : rien à télécharger (D31). *Écarté* : Atkinson Hyperlegible / OpenDyslexic, qui demandent l'auto-hébergement.
6. **Réinitialiser conserve `isDark`** : le mode sombre n'est pas une option du menu.
7. **Plan de site interne**, dans `RequireAuth` ; entrées « Gestion », « Formateurs », « Stagiaires » pour `MANAGEMENT_ROLES` (le formateur consulte en lecture seule, D54). Lien du menu : `<Link>` interne. Retour d'expérience : `<a target="_blank" rel="noopener noreferrer">` avec mention « (nouvelle fenêtre) » pour lecteur d'écran.
8. **Boutons** : `type="button"`, `aria-pressed` pour les bascules, `disabled` aux bornes de taille ; Échap ferme le menu.

## Risks / Trade-offs

- `filter` sur `<html>` s'applique à toute la page, images comprises (voulu pour gris et négatif).
- « Haut contraste » et « Contraste négatif » peuvent se cumuler ; le résultat n'est pas testé visuellement.
- Pas de piège de focus dans le panneau (menu déroulant, pas modal).
