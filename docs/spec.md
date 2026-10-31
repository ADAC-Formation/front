# Spécification front — points ouverts

Le « quoi/pourquoi » détaillé (17 user stories, flux) vit dans `../../back-readonly/docs/STORIES.md` et `src/assets/docs/USERFLOW.md`. Ce fichier ne garde que les écarts et questions à trancher (à résoudre avec `/grill-me-with-docs`).

## Questions ouvertes
- ~~modèle d'auth~~ → résolu par D1 (`decisions-front-foundations.md`) : aligné sur le back (cookie + `/auth/me`).
- ~~rôles~~ → résolu par D1 : SUPER_ADMIN/ADMIN/STAGIAIRE.
- ~~design~~ → D2 : thème actuel conservé ; point à rediscuter avec le dev back (`meeting-points-back.md`).
- ~~branche de base~~ → D3 : `categorie`, local ; `API` = `dev`, rien à récupérer.
- ~~tests~~ → D4 : Vitest + Testing Library + MSW.
- ~~Dockerfile/CI front~~ → D5 (révisée 2026-10-31) : Dockerfile + CI dans ce repo, selon la spec de Charlotte (`INFRASTRUCTURE.md` §4) ; compose/nginx/déploiement = Charlotte.
- ~~variable d'env~~ → D1 : `VITE_API_URL` + `.env.example`.
- ~~priorités~~ → D6 ; ~~PO/SM~~ → D24 ; dates → D25 (pas de date cible). Plus de dates (D29).
- ~~outil de suivi~~ → D7/D29 : GitHub Project créé (https://github.com/orgs/ADAC-Formation/projects/1).

## Décisions techniques de mise en œuvre (voir `decisions-front-foundations.md`)
TanStack Query (D8) · routes sans préfixe de rôle + `RequireAuth`/`RequireRole` (D9) · `RoleSwitcher` supprimé (D10) · coques UI conservées, recâblées (D11) · erreurs centralisées (D12) · React Hook Form + validateurs maison (D13) · import Excel provisoire (D14) · WCAG 2.1 AA, `lang="fr"` (D15) · back local via Docker + comptes de dev (D16–D20) · sondage notifications 45 s (D21) · messagerie à deux volets (D22) · documents en blob (D23).

## Questions encore ouvertes
- ~~CI front~~ → D26 : `npm run check` local.
- ~~petits écrans~~ → D28 : desktop d'abord, tablette OK.
- ~~flux Git~~ → D27.
- ~~jalons/cronograma~~ → D29 : projet secondaire, supprimés.

## Reste ouvert (dépend d'ADAC / Charlotte uniquement)
- [NEEDS CLARIFICATION: texte de la page Confidentialité + durée de conservation] → `meeting-points-back.md` #11.
- [NEEDS CLARIFICATION: premier SUPER_ADMIN en production] → #7. Fichier Excel réel → #6. Appareils des stagiaires → #10.

## Écarts connus code ↔ contrat
Voir `CLAUDE.md` § « Known state / traps » et `plan-de-proyecto.md` § 10.
