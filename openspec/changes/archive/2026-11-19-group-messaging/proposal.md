# Proposal

## Why

La chargée de formation et les formateurs doivent pouvoir écrire à plusieurs stagiaires d'un coup (US-014, TICKET-032) au lieu de répéter le même message en individuel. Le back est prêt (TICKET-030 « Done », `tech.md` §7 : `POST /messages/send` avec `filter`, `GET /messages/group/preview`). Les règles d'interface sont décidées (`docs/decisions/decisions-messagerie.md` H12–H16).

## What Changes

- Bouton « Message groupé » sur `/messages` (chargée de formation et formateur seulement) vers une nouvelle page `/messages/groupe`.
- Page de composition : choix du filtre (chargée : Formation, Documents manquants, Sélection libre ; formateur : Formation seulement, limité à ses formations), aperçu automatique des destinataires, zone de texte (texte seul, 1–5000, H9), bouton « Envoyer à X destinataires » avec confirmation (`ConfirmDialog`, H13).
- Sélection libre : liste de cases à cocher avec recherche et « Tout sélectionner » (H14).
- Envoi réussi : retour sur `/messages` avec « Message envoyé à X destinataires ».
- Dans un fil, les messages `isGroup` portent la mention « Message groupé » ; la liste `recipients` n'est jamais affichée (H15).
- **Front seulement.** Constats et demandes au back : À7 de `docs/charlotte/points-pour-charlotte.md` (notifications de message jamais enregistrées, `tech.md`, comptes jamais activés), non bloquantes pour le front.

Hors périmètre : pièces jointes, programmation d'envoi, liste de diffusion enregistrée, définition par l'ADAC des « documents obligatoires » (`questions-pour-adac.md` §A : `MISSING_DOCS` garde la définition du back).

## Capabilities

### New Capabilities
- `group-messaging`: composition, aperçu, confirmation et envoi d'un message groupé ; mention « Message groupé » dans les fils.

### Modified Capabilities
- `individual-messaging`: la page `/messages` gagne le bouton « Message groupé » et le fil la mention « Message groupé » (aucune règle existante ne change).

## Impact

- Code : `src/features/messagerie/` (`api.js`, `hooks.js`, nouveau `groupFilters.js`, `pages/GroupMessagePage.jsx`, `components/GroupFilters.jsx`, `StagiairePicker.jsx`, `RecipientPreview.jsx`, `MessagesPage.jsx`, `Thread.jsx`) ; `router/router.jsx` (route `messages/groupe` avec `lazyPage`).
- API (lecture seule, `tech.md` §7) : `GET /messages/group/preview`, `POST /messages/send` (branche `filter`) ; lectures : `GET /formations`, `GET /users/stagiaires?active=true`.
- Docs : `decisions-messagerie.md` (H12–H18, fait), `points-pour-charlotte.md` (À7, fait), `etat-front.md`, `CLAUDE.md`.
- Aucun changement dans `back-readonly`. Dépendance Charlotte : aucune.
