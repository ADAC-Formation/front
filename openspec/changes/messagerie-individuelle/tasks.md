# Tasks

## 1. Préparation

- [x] 1.1 Vérifier que l'on est sur `feature/messagerie` (créée depuis `dev`), que `npm run check` est vert au départ et que `git -C ../../back-readonly status` est propre ; rafraîchir le back (`git -C ../../back-readonly pull`) et relire `tech.md` §7
- [x] 1.2 Écrire dans `docs/spec.md` les critères de la messagerie individuelle (spec `individual-messaging`, décisions H1–H9) pour validation de Manon ; vérifier que le fichier les contient

## 2. Logique pure (TDD)

- [x] 2.1 RED : `recipients.test.js` (chargée de formation → tout le monde actif ; formateur → stagiaires + chargée connue ; stagiaire → formateurs distincts + chargée connue ; sans soi-même, sans compte inactif, sans doublon ; `canWriteTo`), `messageForm.test.js` (vide, espaces, 5000 accepté, 5001 refusé, texte conservé tel quel), `unread.test.js` (somme des `unreadCount`, liste vide, valeurs absentes)
- [x] 2.2 Créer `recipients.js`, `messageForm.js` et `unread.js` ; GREEN
- [x] 2.3 Commit `feat: add the messaging rules`

## 3. Appels et hooks (TDD)

- [x] 3.1 Ajouter `src/test/messages.js` (`mockConversations`, `mockThread`, `mockSendMessage` avec capture du corps, `mockMarkRead`, `mockRecipients`) ; RED : `hooks.test.jsx` — `useConversations` (ordre reçu, sondage 45 s en pause onglet masqué), `useThread`, `useSendMessage` (corps `{ recipientIds: [id], content }`, invalidation de `['messages']`, 403 / 404 / réseau en `ApiError`, double clic = un seul appel), `markThreadRead` (un `PATCH` par message entrant non lu, aucun si tout est lu ou envoyé par soi, un échec n'empêche pas les autres), `useRecipients` par rôle (aucun appel tant que non demandé)
- [x] 3.2 Créer `api.js`, `hooks.js` et `useRecipients.js` ; GREEN
- [x] 3.3 Commit `feat: add the messaging requests`

## 4. Liste des conversations (TDD)

- [ ] 4.1 RED : `ConversationList.test.jsx` — ordre, extrait, date, non lus en évidence avec texte accessible (« 2 messages non lus »), état vide, chargement annoncé, erreur avec « Réessayer », lien de chaque ligne vers `/messages/:id`
- [ ] 4.2 Créer `ConversationList` (CSS Module, jetons, rem, anneau de focus global) ; GREEN
- [ ] 4.3 Commit `feat: add the conversation list`

## 5. Fil et saisie (TDD)

- [ ] 5.1 RED : `Thread.test.jsx` (ordre ancien → récent, auteur, date, contenu en texte avec `<script>` littéral, sauts de ligne, erreur avec « Réessayer », lecture automatique des non lus une seule fois par fil) et `MessageComposer.test.jsx` (libellé visible, vide / espaces / 5001 refusés sans appel, Entrée = saut de ligne, envoi réussi → champ vidé + succès annoncé, 403 / 404 → erreur et texte conservé, bouton désactivé pendant l'envoi)
- [ ] 5.2 Créer `Thread` et `MessageComposer` ; GREEN
- [ ] 5.3 Commit `feat: add the message thread and composer`

## 6. Page, routes et nouvelle conversation (TDD)

- [ ] 6.1 RED : `MessagesPage.test.jsx` — `/messages` (liste, état vide avec « Nouvelle conversation »), `/messages/:userId` (fil), fil d'un interlocuteur hors destinataires (lecture seule avec avis) et fil absent hors droit (« Conversation introuvable » + `BackButton` vers `/messages`), `NewConversation` (destinataires par rôle, choix → navigation vers `/messages/:id`), check jest-axe (liste et fil), redirection vers la connexion sans session
- [ ] 6.2 Créer `pages/MessagesPage.jsx` (`PageShell`, deux volets / deux écrans par requêtes de conteneur en `rem`, D61), `NewConversation`, brancher `messages` et `messages/:userId` dans `router/router.jsx` avec `lazyPage`, supprimer `components/Pages/Stagiaire/Messages/` ; GREEN ; `npm run check` (budget du bundle : la page reste hors de l'entrée)
- [ ] 6.3 Mettre à jour `src/test/mobile-layout.test.js` (garde-fous de la page) et `SiteMapPage` si le lien « Messages » change
- [ ] 6.4 Commit `feat: add the messaging page`

## 7. Pastille et bouton sur les comptes (TDD)

- [ ] 7.1 RED : tuile « Messages » — pastille avec total, libellé accessible « 3 messages non lus », rien à zéro ou en erreur ; `AccountDetailPage.test.jsx` — « Envoyer un message » vers `/messages/:id` seulement si autorisé (chargée de formation partout, formateur seulement ses stagiaires, pas de bouton pour un formateur vu par un autre formateur) ; mettre à jour tous les tests qui rendent la tuile avec `mockConversations()`
- [ ] 7.2 Ajouter la pastille à la tuile (`TileGroup` / tableau de bord) via `useUnreadCount`, et le bouton à `AccountDetailPage` ; GREEN
- [ ] 7.3 Commit `feat: add the unread badge and the send message button`

## 8. Documentation et vérification

- [ ] 8.1 Mettre à jour `CLAUDE.md` (bullet « Messagerie individuelle », piège `mockConversations()` pour les tests qui rendent la tuile, Q14 / Q15 comme points ouverts), `docs/spec.md`, `docs/decisions-messagerie.md` ; recocher les points reportés des comptes (« Envoyer un message »)
- [ ] 8.2 `npm run check` vert (lint + tests + build + budget) et `git -C ../../back-readonly status` propre
- [ ] 8.3 Passage manuel sur le vrai back local : écrire dans les deux sens entre la chargée de formation, un formateur et un stagiaire, non lus qui disparaissent à l'ouverture, pastille de la tuile, fil sans droit d'écrire, mobile et « Grand texte ». Si un point dépend de Q14 ou Q15, le consigner comme **bloqué** dans `docs/decisions-messagerie.md` et laisser la tâche ouverte
- [ ] 8.4 Relecture (`/code-review`) puis `/opsx:archive` ; la PR vers `dev` n'est ouverte qu'au dernier ticket de la branche (change « messagerie groupée », D3, D43) et sans push sans demande de Manon
