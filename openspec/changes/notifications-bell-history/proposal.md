# Proposal

## Why

Le portail remplace les échanges par e-mail ; sans notifications dans l'application, un stagiaire ne sait pas qu'un message, un document ou une mise à jour de formation l'attend. Le back fournit déjà `/notifications` (TICKET-033, Done) et les pages `NotifPage` / la tuile « Notifications » ne sont que des coques vides. C'est la fonctionnalité du front la plus indépendante des branches en cours (`feature/documents`), d'où son démarrage maintenant.

## What Changes

- **Cloche** dans `SiteHeader`, visible seulement avec une session : badge du nombre de non lues, panneau déroulant des non lues (50 plus récentes), interrogation toutes les 45 s (en pause onglet masqué), actions « ✕ » (retirer de la cloche), « Tout marquer comme lu » et lien vers l'historique (N2–N5).
- **Clic sur une notification** : marque comme lue (optimiste, retour arrière en cas d'échec) puis navigue — `MESSAGE` → `/messages/:entityId`, `FORMATION` → `/formations/:entityId` (N1, N4).
- **Page d'historique** `/notifications` : toutes les notifications (200 plus récentes), filtre de statut Toutes / Non lues / Lues envoyé au back, tri par date côté client, même clic que la cloche, aucune suppression (N6).
- **Présentation par `entityType`** avec repli neutre pour toute valeur inconnue ; `content` affiché en texte (N7).
- **Route `messages/:userId`** vers la coque `MessagesPage` actuelle, pour que le lien d'une notification `MESSAGE` ne tombe pas sur « adresse inconnue » ; `feature/messagerie` la remplacera (N1).
- Côté back : **aucun changement**. Deux questions à Charlotte (liste complète de `NotificationType`, `entityType` d'une notification de document) sont consignées dans `docs/decisions-notifications.md` et seront recopiées dans les documents pour Charlotte à la fusion avec `feature/documents`.

Hors périmètre : bascule e-mail (TICKET-036, reportée à la page profil, N8) ; page profil (044) ; la messagerie elle-même ; suppression depuis l'historique (interdite par le back) ; WebSocket / SSE (polling imposé par `tech.md`) ; pagination au-delà du plafond de 200.

## Capabilities

### New Capabilities
- `in-app-notifications`: cloche d'en-tête (compteur, panneau, interrogation périodique, retrait de la cloche, tout marquer comme lu), page d'historique filtrable, navigation vers l'élément concerné et marquage comme lue, présentation par type, accessibilité.

### Modified Capabilities
<!-- Aucune : les capacités existantes (`user-session`, `page-layout`, …) ne changent pas d'exigence ; la cloche s'appuie sur la session telle quelle. -->

## Impact

- **Front uniquement** (`ADAC-Formation/front`, branche `feature/notifications` depuis `dev`). Tickets du back : TICKET-035 (front, ce change), TICKET-033 (back, Done, endpoints) ; TICKET-036 reportée.
- Nouveau code dans `src/features/notifications/` (api, hooks TanStack Query, composants, page, tests, mock MSW) ; `SiteHeader` reçoit la cloche ; `router.jsx` : route `messages/:userId` et page `/notifications` rebranchée sur `features/notifications` (la coque `components/Pages/Stagiaire/NotifPage` est supprimée, D11/D32).
- Pas de nouvelle dépendance. L'entrée du bundle doit rester sous `bundle-budget.json` : la cloche est dans l'entrée (header), la page d'historique reste chargée à la demande avec `lazyPage`.
- Docs : `docs/decisions-notifications.md` (N1–N9), `docs/future-implementation-ideas.md`, `CLAUDE.md` (état actuel) à la fin.
