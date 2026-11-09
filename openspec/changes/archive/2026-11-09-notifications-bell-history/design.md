# Design

## Context

Voir `proposal.md` (pourquoi) et `specs/in-app-notifications/spec.md` (exigences). Décisions produit N1–N9 : `docs/decisions-notifications.md`.

État du code (branche `dev`) :
- `SiteHeader` (`components/organisms/Header`) est rendu par `Layout` sur toutes les pages, y compris `/login` ; il contient déjà `LoginButton`, `ThemeToggle`, `AccessibilityMenu`. L'utilisateur vient de `useCurrentUser()` (`['auth','me']`).
- `NotifPage` et `MessagesPage` sont des coques vides sous `components/Pages/Stagiaire/`, enregistrées dans `router/router.jsx` avec `lazyPage`. Il n'existe pas de route `messages/:id`.
- Le client axios unique (`api/Axiosclient.js`) gère `withCredentials` et le `401` (D12) ; `endSession` (`features/auth/hooks.js`) retire du cache toute requête autre que la session.
- Le modèle à suivre : `features/accounts` (api.js, hooks.js, components, pages) et les helpers de test MSW (`test/session.js`, `test/accounts.js`).
- `bundle-budget.json` fait échouer `npm run check` si l'entrée dépasse son budget ou contient une page.

Contrat (`tech.md` §8) : `GET /notifications[?read=][&sort=date]` (200 max), `GET /notifications/unread` → `{count, notifications}` (50 max, `count` total réel), `PATCH /{id}/read`, `PATCH /read-all`, `DELETE /{id}` (204, retire de la cloche seulement). `NotificationResponse` : `id, type, content, entityType, entityId, isRead, createdAt`.

## Goals / Non-Goals

**Goals :**
- Tout le code de notifications dans `src/features/notifications/`, avec une seule porte d'entrée vers l'en-tête (`NotificationBell`).
- Un seul chemin de « ouvrir une notification » partagé par la cloche et l'historique.
- Cache TanStack Query cohérent : une action dans la cloche se reflète dans l'historique et inversement.

**Non-Goals :**
- Bascule e-mail (036), page profil, contenu de la messagerie.
- Pagination, recherche, suppression d'historique (non permises par le back).
- Notifications poussées (WebSocket/SSE).

## Decisions

### D-N1 — Structure `features/notifications/`
`api.js` (appels axios), `hooks.js` (requêtes et mutations), `notificationTargets.js` (cible de navigation et présentation par `entityType`, seul endroit qui connaît `MESSAGE` / `FORMATION`), `components/` (`NotificationBell`, `NotificationPanel`, `NotificationItem`), `pages/NotificationsPage.jsx`, plus un helper de test `src/test/notifications.js` (`mockNotificationApi()`) sur le modèle de `test/accounts.js`.
*Alternative écartée* : l'arborescence du ticket (`src/components/notifications`, `src/pages`, `services/`) — contredit D32 (nouveau code par domaine).

### D-N2 — Clés de requête et invalidation
`['notifications','unread']` (cloche) et `['notifications','all', statut]` (historique, `statut` ∈ `all|unread|read`). Toute mutation (lire, tout lire, retirer) met à jour `unread` de façon optimiste puis invalide le préfixe `['notifications']` à la fin (`onSettled`), ce qui rafraîchit l'historique ouvert. `endSession` supprime déjà ces clés à la déconnexion (le prédicat garde seulement `['auth', …]`), donc aucune notification ne survit à un changement d'utilisateur.
*Alternative écartée* : un état local dans la cloche — dupliquerait la source de vérité.

### D-N3 — Mise à jour optimiste (N4)
`onMutate` annule les requêtes `unread` en cours, mémorise l'instantané, retire la notification (ou toutes) et ajuste `count` (`max(0, count − 1)` ; pour « tout lire », `0`) ; `onError` restaure l'instantané et déclenche un message annoncé ; `onSettled` invalide. Si `count` dépasse la liste (plus de 50 non lues), le `count` n'est décrémenté que de la notification retirée — la liste se complète au rafraîchissement suivant.
*Alternative écartée* : attendre le serveur avant d'afficher le changement (navigation retardée).

### D-N4 — Interrogation (N3)
`useQuery` sur `unread` avec `refetchInterval: 45_000`, `refetchIntervalInBackground: false`, `refetchOnWindowFocus: true`, `enabled: Boolean(user)`. La requête n'est montée que par `NotificationBell`, lui-même rendu seulement si `useCurrentUser().user` existe : pas de bruit côté visiteur (spécification « Cloche visible seulement avec une session »).
*Alternative écartée* : `setInterval` manuel — réimplémente ce que la bibliothèque fournit (pause, focus, annulation).

### D-N5 — Panneau : motif « disclosure », pas de modale
Bouton `aria-expanded` / `aria-controls` ; panneau positionné sous le bouton ; fermeture par Échap, clic extérieur et changement de route ; focus rendu au bouton. Pas de piège de focus (`useModalFocus` est réservé aux vraies modales). Hauteur du panneau bornée avec défilement interne ; largeur `min(22rem, 100vw − 2rem)` pour tenir sur mobile et en « Grand texte » (D61).
*Alternative écartée* : `ConfirmDialog`/modale — piège de focus inutile pour une liste courte, contraire au besoin de consulter la page derrière.

### D-N6 — Une action « ouvrir » partagée
Hook `useOpenNotification()` : marque comme lue (D-N3), calcule la cible via `notificationTargets.js` et appelle `navigate`. La cloche et la page d'historique l'utilisent telles quelles. Sur l'historique, une notification déjà lue ne renvoie pas de `PATCH`.
*Alternative écartée* : logique dupliquée dans chaque composant (risque de divergence cloche/historique).

### D-N7 — Annonces aux lecteurs d'écran
Une région `role="status"` (toujours présente dans `NotificationBell`) reçoit un message quand le compteur **augmente** (« 1 nouvelle notification ») et en cas d'échec d'une action. Elle n'annonce pas les diminutions provoquées par l'utilisateur.
*Alternative écartée* : `aria-live="assertive"` — trop intrusif pour un événement de fond.

### D-N8 — Route `messages/:userId` et rebranchement de la page
`router.jsx` : ajout de `messages/:userId` vers `MessagesPage` ; `notifications` pointe sur `features/notifications/pages/NotificationsPage` (toujours `lazyPage`) et la coque `components/Pages/Stagiaire/NotifPage` est supprimée (D11). `PageShell`, `BackButton` sans objet ici (page de premier niveau).

### D-N9 — Budget de l'entrée
La cloche est dans l'entrée (via `SiteHeader`) ; elle n'importe que `api`, `hooks`, des icônes `lucide-react` déjà dans l'entrée et du CSS. La page d'historique reste en `lazyPage`. Si `npm run check` dépasse le budget, le panneau (`NotificationPanel`) devient `lazy` et n'est chargé qu'à la première ouverture.

## Risks / Trade-offs

- **`NotificationType` incomplet dans `tech.md`** → présentation par `entityType` avec repli neutre (N7) ; question posée à Charlotte.
- **Notification de document** : `entityType` peut ne pas être `FORMATION` → repli : marque comme lue sans naviguer ; à confirmer avec Charlotte avant la fusion.
- **Plus de 50 non lues** : le panneau n'en montre que 50 alors que le badge dit « 99+ » → « Tout marquer comme lu » règle le surplus ; l'historique les montre toutes (jusqu'à 200).
- **Collision de décompte optimiste et sondage** : un sondage en vol pourrait écraser l'état optimiste → `cancelQueries` dans `onMutate` et invalidation finale.
- **Cible `/messages/:userId` inexistante côté vraie messagerie** → route provisoire sur la coque ; `feature/messagerie` devra honorer cette URL (consigné en N1).
- **Conflit de fusion avec `feature/documents`** (`router.jsx`, `CLAUDE.md`, documents pour Charlotte) → petits changements localisés ; les documents pour Charlotte ne sont modifiés qu'après la fusion.

## Migration Plan

Aucune migration de données. Livraison : tickets en commits séparés sur `feature/notifications`, une seule PR vers `dev` au dernier ticket, sur demande de Manon uniquement. Retour arrière : revert de la PR ; la coque `NotifPage` n'avait aucun comportement.
