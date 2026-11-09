# Proposal

## Why

La messagerie est le cœur du remplacement des échanges par e-mail (US-013, TICKET-031) : la page `/messages` n'est aujourd'hui qu'une coquille vide (`MessagesPage`) et les fiches formateur / stagiaire n'ont pas de bouton « Envoyer un message » (reporté par le change `users-account-management`). Le contrat du back (`tech.md` §7) est prêt et les règles d'interface sont décidées (`docs/decisions-messagerie.md` H1–H9).

## What Changes

- Page `/messages` : liste des conversations (plus récente d'abord, non lus en évidence, sondée toutes les 45 s) et page `/messages/:userId` : fil d'une conversation avec saisie et envoi. Bureau : deux volets (D22) ; mobile / tablette étroite : deux écrans.
- Envoi d'un message individuel (`POST /messages/send` avec `recipientIds` d'un seul destinataire), texte seul, 1 à 5000 caractères.
- Sélecteur de destinataire (« Nouvelle conversation ») limité selon le rôle : chargée de formation → tout le monde ; formateur → chargée de formation + stagiaires de ses formations ; stagiaire → chargée de formation + formateurs de ses formations (H1). Lecture des destinataires isolée dans un seul point de code, en attendant l'endpoint demandé à Charlotte (Q14, H4).
- Lecture automatique à l'ouverture d'un fil : un `PATCH /messages/{id}/read` par message entrant non lu, isolé dans `markThreadRead` (H5, Q15).
- Pastille « non lus » (somme des `unreadCount`) sur la tuile « Messages » (H7).
- Bouton « Envoyer un message » sur le détail d'un formateur et d'un stagiaire → `/messages/:userId` (US-013 AC-05).
- Fil d'une personne à qui l'on ne peut pas écrire : lecture seule ou « Conversation introuvable » (H8).
- Envoi groupé (TICKET-032) **hors de ce change** (H2). La notification du destinataire est créée par le back (US-013 AC-07) : rien à faire côté front.

## Capabilities

### New Capabilities
- `individual-messaging`: conversations, fil, envoi, destinataires autorisés, lecture et pastille « non lus » de la messagerie individuelle.

### Modified Capabilities

(aucune : le bouton « Envoyer un message » des fiches de comptes est décrit dans `individual-messaging` ; le comportement des fiches de comptes reste inchangé sans lui.)

## Impact

- Code : nouveau `src/features/messagerie/` (api, hooks, destinataires, pages, composants) ; `router/router.jsx` (routes `messages` et `messages/:userId` vers le nouveau dossier, ancienne coque `components/Pages/Stagiaire/Messages/` supprimée) ; `features/accounts/pages/AccountDetailPage.jsx` (bouton) ; tuile « Messages » (`TileGroup` / tableau de bord) pour la pastille.
- API (lecture seule, `tech.md` §7) : `GET /messages`, `GET /messages/{conversationId}`, `POST /messages/send`, `PATCH /messages/{id}/read` ; lectures de destinataires : `GET /formations`, `GET /users/formateurs`, `GET /users/stagiaires`.
- Docs : `docs/spec.md`, `docs/decisions-messagerie.md`, `docs/points-pour-charlotte*.md` (Q14, Q15 déjà ajoutées).
- Aucun changement dans `back-readonly`.
- Dépendance non bloquante : Q14 (la chargée de formation n'est atteignable en premier par un formateur ou un stagiaire qu'une fois l'endpoint de destinataires disponible).
