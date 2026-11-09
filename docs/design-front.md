# Design System (front) — Portail de Formation ADAC

> Document de conception du **front**, rédigé par Manon. Même structure que `DESIGN.md` du back.
> Le design est une décision du front (D2, D41) : ce document décrit ce qui est **réellement** implémenté
> dans `src/index.css` et `src/components/`, et remplace `DESIGN.md` du back comme référence visuelle.
> Les écarts avec `DESIGN.md` sont listés en dernière section.

## Identité visuelle

- **Ambiance** : chaleureuse, institutionnelle et accessible — fidèle à la charte graphique ADAC
- **Référence** : charte officielle ADAC + maquette de Manon (tableau de bord à tuiles colorées)
- **Slogan logo** : « Le social autrement » (logos clair et sombre dans `src/assets/Logo/`)
- **Modes d'affichage** : clair, sombre, taille du texte par paliers, niveau de gris, haut contraste, contraste négatif, arrière-plan clair, liens soulignés, police lisible — réglables par l'utilisateur
  (menu d'accessibilité dans l'en-tête), préférences mémorisées dans le navigateur (aucune donnée personnelle, D31)

---

## Palette de couleurs

### Couleurs de marque (`--color-*`)

| Token | Hex | Usage |
|---|---|---|
| `--color-red` | `#cc3d34` | Grande tuile Formations / Gestion, actions fortes |
| `--color-pink` | `#F35E6C` | Tuile Messages |
| `--color-orange` | `#d9812c` | Tuile Notifications |
| `--color-yellow` | `#f6d628` | Tuile Profil, bouton principal, accent |
| `--color-white` | `#fcfcfc` | Texte et icônes sur tuiles |
| `--color-grey` | `#9199a8` | Textes secondaires |
| `--color-blue` | `#12427c` | Réservé (liens / états d'information) |
| `--color-purple` | `#7a2f7c` | Réservé (catégories) |
| `--color-soft-orange` | `#F7A062` | Réservé (catégories) |
| `--color-green` | `#439224` | Succès |

Les 6 couleurs de la charte ADAC (`#cc3d34`, `#F35E6C`, `#d9812c`, `#f6d628`, quasi-noir, gris) sont toutes utilisées ;
les couleurs supplémentaires (bleu, violet, orange doux, vert) servent aux catégories, aux états et aux badges.

### Couleurs sémantiques (thème clair, `oklch`)

| Token | Valeur | Usage |
|---|---|---|
| `--background` | `oklch(0.988 0.004 91.62)` | Fond de page (blanc cassé chaud) |
| `--foreground` | `oklch(0.263 0.0115 225.65)` | Texte principal (quasi-noir ADAC) |
| `--card` / `--card-foreground` | `oklch(1 0 0)` / `--foreground` | Cartes, panneaux, champs |
| `--muted` / `--muted-foreground` | `oklch(0.968 0.007 247.9)` / `oklch(0.67 0.005 271)` | Fonds et textes secondaires |
| `--border` | `oklch(0.929 0.013 255.5)` | Bordures, séparateurs |
| `--accent` | `--color-yellow` | Accent |
| `--ring` | `--foreground` | Anneau de focus |

### Mode sombre (`.dark` sur `<html>`)

| Token | Valeur |
|---|---|
| `--background` | `oklch(0.263 0.0115 225.65)` |
| `--foreground` | `oklch(0.984 0.003 247.9)` |
| `--card`, `--popover`, `--secondary`, `--muted` | `oklch(0.35 0.01 225)` |
| `--primary` / `--ring` | `oklch(0.8772 0.1731 97.56)` (jaune) |
| `--accent` | `oklch(0.5691 0.1813 27.94)` (rouge) |
| `--border` | `oklch(1 0 0 / 10%)` |
| `--input` | `oklch(1 0 0 / 15%)` |
| `--destructive` | `oklch(0.704 0.191 22.2)` |

Teintes de tuiles en sombre : `--rouge`, `--rose`, `--orange`, `--jaune`, `--noir`, `--gris` (équivalents `oklch` des couleurs de marque).

> Toutes les couleurs passent par des variables CSS : le thème peut être ajusté sans toucher aux composants,
> et les contrastes restent vérifiables dans les trois thèmes (D15).

---

## Typographie

- **Titres, boutons, tuiles (`--font-display`)** : **Syne**
- **Texte courant (`--font-sans`)** : **Plus Jakarta Sans**, repli `system-ui, sans-serif`
- **Chargement** : polices **auto-hébergées** (D31) — pas de Google Fonts, qui transmet l'adresse IP des visiteurs à un tiers
  (paquets `@fontsource-variable/syne` et `@fontsource-variable/plus-jakarta-sans`, importés dans `src/fonts.css` ; migré le 2026-11-09, `index.html` ne contacte plus aucun tiers)

| Niveau | Taille | Graisse | Police |
|---|---|---|---|
| Libellé de tuile « hero » | 1,5 → 2,25 rem (selon la largeur) | 700 | Syne |
| Libellé de tuile standard | 1,125 → 1,875 rem | 700 | Syne |
| Titre de page / section | 1,5 rem | 600–700 | Syne |
| Corps, champs, boutons | 14 px | 400 / 600 | Plus Jakarta Sans / Syne |
| Petits libellés, liens | 11–12 px | 400 | Plus Jakarta Sans |

> Taille du texte : classes `text-step-1..3` sur `<html>` ; la base passe à 112,5 / 125 / 150 % (D60) et toutes les tailles de police sont en `rem` (aucune en `px`, vérifié par test). Option « Contraste élevé » : classe `high-contrast` (clair) ou `high-contrast` + `dark` (sombre) ; jetons en hexadécimal, texte 7:1, bordures et anneau de focus 3:1 (D58).

---

## Espacement

Base : `rem` / multiples de 4 px. Valeurs courantes observées :

| Usage | Valeur |
|---|---|
| Écart entre icônes d'en-tête | 0,375 rem (< 640 px) · 0,5 rem (≥ 640 px) |
| Marge de l'en-tête | 1 rem (< 640 px) · 1,5 rem (≥ 640 px) |
| Dégagement sous le logo (`--page-top`, `PageShell`) | `calc(6rem + 180px)` = 276 px (≥ 640 px) · `calc(5rem + 180px)` (≤ 639 px) — le logo est en position absolue, aucune page ne redéfinit ce dégagement (D57) |
| Mise en page mobile (D61) | Tuiles Gestion : 3 colonnes à partir de 56 rem de conteneur, sinon une colonne statique (actions visibles) ; le survol n'existe qu'avec une souris. Accueil : grille `2fr 1fr` à partir de 40 rem de conteneur. Libellé « Se déconnecter » visible à partir de 1150 px (masqué visuellement mais nommé en dessous). Sous 768 px le logo (largeur `min(96vw, 420px)`, 66 vw plafonné à 580 px au-delà) passe sous la rangée d'icônes (`--header-row`, 4,5 rem) |
| Marges latérales de page (`PageShell`) | 2,5 rem (≥ 1024 px) · 1,5 rem (≤ 1023 px) · 1 rem (≤ 639 px) ; contenu 80 rem au plus ; 3 rem en bas |
| Padding interne d'une tuile | 32 px |
| Hauteur d'un champ | 43 px |

---

## Border Radius

| Usage | Valeur |
|---|---|
| Tuiles du tableau de bord | 28 px |
| Bouton principal | 24 px (en pilule) |
| Champs de formulaire | 14 px |
| Avatars, pastilles | 9999 px |

---

## Ombres

| Usage | Valeur |
|---|---|
| Tuile au repos | `0 10px 20px rgba(0,0,0,0.15)` + reflet interne haut et ombre interne bas (relief) |
| Tuile au survol | `0 14px 25px rgba(0,0,0,0.18)` + relief renforcé, translation de −4 px |

---

## Composants clés

### Tuiles du tableau de bord (`atoms/Tile`)

| Tuile | Couleur | Icône (lucide) | Taille |
|---|---|---|---|
| Formations / Gestion | `--color-red` | BookOpen | Grande (500 px de haut min.) |
| Messages | `--color-pink` | MessageSquare | Petite (150 px min.) |
| Notifications | `--color-orange` | Bell | Petite |
| Profil | `--color-yellow` | User | Petite |

- Texte et icône : `--color-white`
- Dégradé léger + relief interne ; survol : élévation et voile clair
- Un seul tableau de bord pour tous les rôles ; seule la grande tuile change (voir « Écrans principaux »)

### Bouton principal (`atoms/FormButton`)
- Fond jaune `--color-yellow`, 230 × 45 px, rayon 24 px, Syne 14 px / 600
- Survol : opacité 0,85 · Désactivé : opacité 0,5 + curseur interdit

### Champ de formulaire (`atoms/FormInput`, `molecules/FormField`)
- Hauteur 43 px, bordure `--border`, rayon 14 px, fond `--card`
- Focus : bordure `--ring` · Placeholder : `--muted-foreground`

### En-tête (`organisms/Header`)
- Barre fixe en haut à droite : cloche (notifications), bascule mode sombre, menu d'accessibilité, déconnexion
- Logo ADAC à gauche (réserve d'espace `--logo-space`)

### Menu d'accessibilité (`molecules/Accessibility`)
- Panneau déroulant aligné sur celui du site ADAC (D60) : Augmenter / Diminuer le texte (paliers 100, 112,5, 125, 150 %), Niveau de gris, Haut contraste, Contraste négatif, Arrière-plan clair, Liens soulignés, Police lisible, Réinitialiser ; puis Plan de site (`/plan-du-site`) et Retour d'expérience (lien externe ADAC)
- Bascules en `aria-pressed`, boutons de taille désactivés aux bornes ; le mode sombre garde son bouton dans la barre
- Fermeture au clic extérieur ou Échap ; `aria-label` et `aria-expanded` sur le déclencheur

### Pages applicatives
- `templates/PageShell` : gabarit commun (marges, centrage, hauteur minimale)
- Liste de formations, détail, création, gestion des catégories : en-têtes de page, cartes, filtres et pastilles de catégorie
  (la couleur de la catégorie vient de l'API : `couleur` `#RRGGBB`)

---

## Écrans principaux

### Page de connexion
Logo, champs Email et Mot de passe, bouton « Commencer la session », lien « Mot de passe oublié / Activer mon compte »,
texte « Pas de compte ? Contactez votre administrateur ».

### Tableau de bord (décision D47 — voir `points-pour-charlotte.md`)
Niveau 1, identique pour tous les rôles : **Gestion** (grande tuile rouge) · **Messages** · **Notifications** · **Profil**.
Le stagiaire voit **Mes formations** à la place de **Gestion**.
Dans **Gestion** : **Formations** · **Formateurs** · **Stagiaires** (et **Catégories** pour la chargée de formation).

```
┌─────────────────────────────────────────────────────┐
│ [Logo ADAC]                       🔔  🌙  ⚙  ⎋      │
├─────────────────────────────────────────────────────┤
│  ┌──────────────────────┐  ┌───────────────────┐    │
│  │ 📚                   │  │ 💬  Messages       │    │
│  │                      │  └───────────────────┘    │
│  │   Gestion            │  ┌───────────────────┐    │
│  │                      │  │ 🔔  Notifications  │    │
│  └──────────────────────┘  └───────────────────┘    │
│     [rouge]                ┌───────────────────┐    │
│                            │ 👤  Profil         │    │
│                            └───────────────────┘    │
│                             [rose] [orange] [jaune] │
└─────────────────────────────────────────────────────┘
```

### Liste / détail de formation
Cartes (titre, dates, modalité, pastille de catégorie colorée + nom, formateur, nombre d'inscrits), filtres
(statut, catégorie, « Mes formations » par défaut pour un formateur), badge « Archivée » en lecture seule.

### Messagerie
Deux volets sur grand écran (conversations à gauche, fil à droite) ; un seul volet à la fois sur petit écran
(liste → fil).

---

## Responsive (D42)

Conception **desktop d'abord** (la chargée de formation travaille sur poste), mais l'application doit être **responsive**
et offrir une bonne expérience sur tablette et mobile.

| Palier | Largeur | Comportement |
|---|---|---|
| Mobile | ≤ 639 px | Une colonne ; tuiles empilées ; marges réduites ; messagerie à un volet ; cibles tactiles ≥ 44 px |
| Tablette | 640–1023 px | Grille de tuiles ; marges moyennes ; messagerie à deux volets possible en paysage |
| Poste | ≥ 1024 px | Mise en page complète (grande tuile + 3 petites) |

Points de rupture déjà présents dans le code : 639, 640, 700, 800, 1023, 1024 px (à homogénéiser).

---

## Accessibilité (D15)

- Cible **WCAG 2.1 AA**, `lang="fr"`, parcours complet au clavier, focus visible, champs étiquetés
- Contraste vérifié dans les trois thèmes (clair, sombre, contraste élevé)
- `aria-live` pour les erreurs et les notifications ; contrôle `jest-axe` par page (D4, D30)
- Bascules : mode sombre et options du menu d'accessibilité (D60)

---

## Écarts connus (à corriger dans le code)

| Sujet | Constat |
|---|---|
| Polices | Syne chargée depuis Google Fonts (`index.html`) — à auto-héberger (D31) ; Plus Jakarta Sans à déclarer |
| Points de rupture | Plusieurs valeurs proches (639/640, 700, 800) |

---

## Écarts avec `DESIGN.md` du back

| Sujet | `DESIGN.md` (back) | Front (ce document) |
|---|---|---|
| Police | Manrope | Syne (titres) + Plus Jakarta Sans (texte) |
| Couleur primaire | `#cc3d34` (boutons) | Jaune `#f6d628` pour le bouton principal ; rouge pour la grande tuile |
| Fond / texte | `#faf8f5` / `#1f2629` | `oklch(0.988 …)` / `oklch(0.263 …)` — équivalents visuels |
| Rayons | tuiles 24 px, boutons 12 px, champs 6 px | tuiles 28 px, boutons 24 px, champs 14 px |
| Mode sombre | bascule prévue | bascule + options du menu d'accessibilité (D60) |
| Navigation | topbar fixe blanche | en-tête flottant (icônes) sur le fond de page |
| Tableau de bord | 4 tuiles Formations / Messages / Notifications / Profil | 4 tuiles Gestion (ou Mes formations) / Messages / Notifications / Profil |

_Document créé le 2026-10-31 d'après l'état du code (`src/index.css`, composants atomiques)._
