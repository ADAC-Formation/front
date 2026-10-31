# Points à aborder avec le dev back (Charlotte)

Liste vivante. Rien n'est modifié côté back ; ce sont des questions/propositions.

> Depuis le 2026-10-31, les décisions du front, leurs impacts sur les documents de Charlotte, les questions et les conflits `tech.md` sont regroupés dans **`points-pour-charlotte.md`** (avec `design-front.md`).

| # | Sujet | Contexte | Statut |
|---|---|---|---|
| 1 | Design : `DESIGN.md` (Manrope, `#cc3d34`, tuiles) vs thème actuel du front (Syne + Plus Jakarta, oklch) | Décision D2 : le front garde son thème en attendant | À discuter |
| 2 | Contrat API : `main` du back est obsolète, la vérité est sur `dev` ; PR #10 `dev → main` fermée | Le front lit `dev` | À confirmer |
| 3 | Dockerfile + CI du front (image ghcr, `VITE_API_URL`, nginx, SPA fallback) | D5 révisée (2026-10-31) : Dockerfile + CI écrits dans le repo front selon la spec `INFRASTRUCTURE.md` §4. À confirmer : le CI front build et push bien l'image ghcr (doc back contradictoire L57 vs L66/L344) ; droits `packages: write` à activer | À confirmer |
| 4 | Prévenir Manon des changements de contrat cassants (D34 : message de Charlotte + veille de Manon sur `dev`) | À confirmer avec Charlotte | À confirmer |
| 5 | Tableau GitHub Project dans l'organisation (un seul pour front + back ?), milestones | D29 : créé (privé, 17 cartes brouillon front) ; un seul tableau pour front + back ? ajouter les tickets back ? | À informer Charlotte |
| 6 | Fichier Excel réel de formations (colonnes provisoires du back) | D14 : le front construit sur le contrat provisoire ; à demander à ADAC via Charlotte/Nathalie | À demander |
| 7 | Aucun SUPER_ADMIN initial (pas de seed Flyway ni de runner, pas d'inscription) : comment le premier compte est-il créé en production ? | Constat en lecture seule de `dev` (migrations V1–V5) | À demander |
| 8 | Rôles : Manon = PO + facilitatrice, Charlotte = référente technique (D24) | Proposition de Manon, à valider avec Charlotte | À confirmer |
| 9 | Cible de mise en production côté ADAC et disponibilité de chacun (D25 : pas de date) | À demander à ADAC via la prochaine rencontre | À demander |
| 10 | Appareils des stagiaires/formateurs (mobile vs poste) — D28 desktop d'abord | À demander à ADAC (Nathalie/Laurie) | À demander |
| 11 | Texte de la page « Confidentialité » et durée de conservation (1 an non confirmée) | D31 : le front prévoit la page ; ADAC fournit le texte | À demander |
