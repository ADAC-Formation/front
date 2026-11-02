# Tasks

Branche `feature/notifications` (worktree `..\front-notifications`, depuis `dev`). TDD obligatoire : chaque groupe écrit ses tests, confirme RED, puis implémente jusqu'à GREEN. Un commit par groupe (Conventional Commits). Pas de `git push` sans demande de Manon.

## 1. Préparation et contrat de test

- [x] 1.1 Lancer `npm run check` dans le worktree avant toute modification et noter le résultat de départ (le test d'auth « vide la session et redirige vers /login » peut être instable : le relancer avant de conclure à une régression)
- [x] 1.2 Relire `tech.md` §8 et le `NotificationResponse` sur le back local (`GET /notifications`, `/unread`, `PATCH`, `DELETE`) et noter tout écart avec la spec ; si le back est joignable, vérifier la forme réelle de `entityType` pour une notification de message et de document
- [x] 1.3 Créer `src/test/notifications.js` : `NOTIFICATIONS` fictives (`MESSAGE`, `FORMATION`, lue / non lue, un `entityType` inconnu) et `mockNotificationApi()` (MSW : `unread`, liste filtrée par `?read=`, `PATCH read`, `read-all`, `DELETE`, avec compteurs d'appels, sur le modèle de `test/accounts.js`) ; vérifier qu'un test minimal l'utilise et qu'un appel non déclaré fait échouer le test
- [x] 1.4 Commit `test: add notification API mocks`

## 2. Couche données (TDD)

- [x] 2.1 RED : `features/notifications/hooks.test.jsx` — `unread` interrogé toutes les 45 s avec horloge simulée, aucune requête quand `user` est nul, rafraîchi au focus ; marquer comme lue retire l'élément et décrémente `count` avant la réponse ; restauration et message en cas d'échec ; `read-all` vide ; `DELETE` retire de la cloche sans toucher l'historique ; filtre de statut → `?read=false|true` ; confirmer RED
- [x] 2.2 Écrire `features/notifications/api.js` et `hooks.js` (clés `['notifications','unread']` / `['notifications','all',statut]`, optimisme D-N3, invalidation D-N2) ; GREEN ; vérifier que `endSession` vide ces clés (test : après déconnexion le cache ne contient plus de notifications)
- [x] 2.3 Écrire `notificationTargets.js` (cible par `entityType`, présentation neutre par défaut) avec son test unitaire (`MESSAGE` → `/messages/7`, `FORMATION` → `/formations/12`, inconnu → pas de navigation) ; GREEN
- [x] 2.4 Écrire `useOpenNotification()` (D-N6) avec test : marque comme lue puis navigue ; pas de `PATCH` si déjà lue ; type inconnu = marquée sans navigation ; GREEN
- [x] 2.5 Commit `feat(notifications): add notification queries, mutations and navigation targets`

## 3. Cloche et panneau (TDD)

- [x] 3.1 RED : tests de `NotificationBell` — absente sans session et sans appel réseau ; badge 3, masqué à 0, « 99+ » à 120 ; nom accessible « Notifications, 3 non lues » ; ouverture (`aria-expanded`), panneau vide « Aucune nouvelle notification » ; clic sur une notification (PATCH, retrait, badge −1, navigation) ; échec (retour de l'élément, erreur annoncée) ; « ✕ » (DELETE) ; « Tout marquer comme lu » ; lien « Voir toutes les notifications » ; Échap / clic extérieur / navigation ferment et rendent le focus ; `content` HTML rendu en texte ; annonce `role="status"` seulement quand le compteur augmente ; jest-axe panneau ouvert ; confirmer RED
- [x] 3.2 Écrire `NotificationItem`, `NotificationPanel`, `NotificationBell` et leurs feuilles CSS Modules (jetons, `rem`, anneau de focus conservé, largeur `min(22rem, 100vw − 2rem)`, défilement interne) ; GREEN ; `css-hygiene`, `focus-ring`, `display-preferences` verts
- [x] 3.3 Intégrer `NotificationBell` dans `SiteHeader` (rendu seulement si `useCurrentUser().user`) ; test du header : connecté → cloche présente ; `/login` visiteur → absente et aucun appel `/notifications` ; les tests du header, de `Layout` et de `LoginButton` restent verts
- [x] 3.4 Ajouter à `src/test/mobile-layout.test.js` un garde-fou : le panneau n'impose pas de largeur fixe en `px` supérieure à l'écran ; vérifier le rendu avec « Grand texte » à la main (étape 5.3)
- [x] 3.5 Commit `feat(notifications): add notification bell with unread panel`

## 4. Page d'historique et routes (TDD)

- [x] 4.1 RED : `NotificationsPage.test.jsx` — appel sans paramètre à l'ouverture et liste lues + non lues avec distinction textuelle ; « Non lues » → `?read=false`, « Lues » → `?read=true`, « Toutes » → sans paramètre ; tri récent / ancien sans nouvel appel ; clic = même effet que la cloche ; aucune action de suppression ; liste vide « Aucune notification » ; note du plafond de 200 ; chargement annoncé, erreur 500 + « Réessayer » ; un seul `<main>` (via le routeur) ; jest-axe ; confirmer RED
- [x] 4.2 Écrire `features/notifications/pages/NotificationsPage.jsx` (enveloppe `PageShell`, titre, filtre, tri, liste réutilisant `NotificationItem`) ; GREEN
- [x] 4.3 `router/router.jsx` : route `notifications` vers la nouvelle page (`lazyPage`), route `messages/:userId` vers `MessagesPage` ; supprimer `components/Pages/Stagiaire/NotifPage` ; test de routage : `/messages/7` n'affiche pas `RouteError`, `/notifications` exige une session, `single-main.test.jsx` mis à jour avec la nouvelle page ; GREEN
- [x] 4.4 Vérifier `npm run check` (lint + tests + build + budget) ; si l'entrée dépasse `bundle-budget.json`, rendre `NotificationPanel` `lazy` (D-N9) et le revérifier
- [x] 4.5 Commit `feat(notifications): add notification history page and message route`

## 5. Vérification d'ensemble et documentation

- [ ] 5.1 Passage manuel sur le vrai back local (Docker `docs/dev/`) avec les trois rôles : créer des notifications (envoi d'un message par l'API / Swagger, dépôt d'un document si disponible), voir le badge monter au sondage (≤ 45 s), ouvrir, retirer, tout lire, filtrer l'historique ; noter la forme réelle de `type` / `entityType` et tout écart avec `tech.md`
- [ ] 5.2 Passage clavier et lecteur d'écran (Tab, Entrée, Échap, annonces) et rendu avec « Grand texte », contraste élevé, mode sombre et largeur mobile
- [x] 5.3 Mettre à jour `CLAUDE.md` (bullet « Notifications branchées » : routes, clés de requête, `mockNotificationApi()`, route `messages/:userId` provisoire) et `docs/decisions-notifications.md` (écarts éventuels relevés en 5.1) ; vérifier que les liens et noms cités existent
- [x] 5.4 Relecture du diff (`/code-review`) puis `npm run check` vert ; corriger les points bloquants
- [ ] 5.5 Commit `docs: record the notifications bell and history decisions`

## Workflow follow-up

- Après la fusion avec `feature/documents` (ou après qu'elle est dans `dev`) : recopier les deux questions pour Charlotte (liste de `NotificationType`, `entityType` d'une notification de document) dans `docs/points-pour-charlotte.md` **et** `docs/points-pour-charlotte-nouveautes.md`, et les montrer à part dans la réponse.
- Une seule PR vers `dev` au dernier ticket de la branche, uniquement sur demande explicite de Manon ; la page profil reprendra le toggle e-mail (036, N8).
- Archiver le change (`/opsx:archive`) une fois la PR relue et fusionnée ; mentionner les demandes de changement au back encore ouvertes.
