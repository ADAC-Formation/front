# Design alternatif : couleurs et polices du site de l'ADAC

Proposition à montrer à l'ADAC : « voici notre design ; si vous préférez rester proche de votre site, voici ce que cela donnerait ». Les deux designs fonctionnent sur les mêmes écrans : seuls les jetons changent (`src/design/design-site.css`).

## Montrer la proposition en réunion

1. Lancer le portail (`npm run dev`, back local en route) et se connecter.
2. Ajouter **`?design=site`** à n'importe quelle adresse (par exemple `http://localhost:5173/?design=site`). Le choix reste tant que l'onglet est ouvert.
3. **`?design=default`** revient au design du portail. Le mode sombre, la taille du texte et le menu Accessibilité fonctionnent dans les deux.

Rien n'est enregistré au-delà de l'onglet (D31) et le design du portail reste celui par défaut.

## Ce qui a été relevé sur le site (2026-11-09)

Site WordPress, thème BeTheme + Elementor, lu dans son HTML et ses feuilles de style.

| Élément | Site de l'ADAC | Design du portail (par défaut) |
|---|---|---|
| Titres | **Lato**, très fins (200 à 300), **rouge `#cc3d34`** | Syne, gras |
| Texte | **Manrope**, gris `#656b6f` (corps `#626262`) | Plus Jakarta Sans, presque noir |
| Fond | blanc `#ffffff` | crème très clair |
| Couleur d'accent | rouge `#cc3d34` / `#e62f43` | **jaune `#f6d628`** (absent du site) |
| Liens | rouge `#cc3d34`, survol orange `#d9812c` | selon les composants |
| Autres couleurs | rose `#f35e6c`, orange `#d9812c`, bleu nuit `#161922`, bleu `#0089f7` | rose, orange, bleu `#12427c`, violet, vert |
| Logo | `Logo-Blanc.png` (fond sombre), logo de facture | `Logo-Blanc.webp` / `Logo-Dark.webp` |

**À retenir** : la charte du portail reprend déjà le rouge, le rose et l'orange du site. Les vraies différences sont les **polices**, le **fond blanc** et le **jaune**, qui n'existe pas sur le site.

## Ce que fait le design alternatif

- Polices du site : Lato pour les titres (h1 fins et rouges), Manrope pour le texte. Elles sont **auto-hébergées** (paquets `@fontsource`, aucun Google Fonts, D31) et ne sont téléchargées qu'avec ce design.
- Fond blanc, texte `#656b6f`, bordures `#ebebeb`.
- Le rôle « accent » (bouton principal, survol, sélection) passe du jaune au **rouge `#cc3d34`**, texte blanc (contraste 4,8:1).
- La tuile « Profil », jaune par défaut, devient bleu `#12427c`.
- Mode sombre : bleu nuit du site `#161922`, accent rose `#f35e6c`.
- Contraste élevé et police lisible gardent la priorité sur ce design.

## Limites à dire à l'ADAC

- C'est une **maquette sur les vrais écrans**, pas un design finalisé : le survol des tuiles, les ombres et les rayons n'ont pas été retravaillés.
- Les ombres et les rayons du site (BeTheme) n'ont pas été repris ; seule la couleur et la typographie le sont.
- Contrastes vérifiés par test pour le texte (5,4:1) et le bouton (4,8:1) ; le reste est à vérifier si le design est retenu.
- Titres rouges et fins : jolis en grand, plus fragiles en petit texte ; avec « Grand texte » le rendu reste lisible.

## Si l'ADAC retient ce design

Le basculer en défaut : déplacer les jetons de `design-site.css` dans `index.css` (`:root`) et retirer `designVariant.js`. Il faudra alors décider du logo et du jaune de la tuile « Profil ».

## Constats au passage (design par défaut), corrigés le 2026-11-09

- `index.html` chargeait **Syne depuis Google Fonts** et **ne chargeait pas Plus Jakarta Sans** (repli sur la police du système) alors que D2/D31 annoncent des polices auto-hébergées. Les deux sont maintenant auto-hébergées (`src/fonts.css`) et un test interdit toute ressource tierce dans `index.html`.
- `index.html` déclarait `lang="en"` alors que D15 demande `lang="fr"` (WCAG 3.1.1) : corrigé, avec un test.
