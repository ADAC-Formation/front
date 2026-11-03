# Design

## Context

- Contrat : `tech.md` §7 (lecture seule). Un fil est identifié par l'`id` de l'autre participant (`conversationId` = `userId`), sans entité dédiée. Le back impose `content` non vide, 5000 caractères au plus (hors `tech.md`, signalé à Charlotte).
- Le front suit `src/features/<nom>/` (`api.js`, `hooks.js`, `pages/`, `components/`), TanStack Query, axios `withCredentials`, erreurs `ApiError` (D12), pages chargées avec `lazyPage` (D59), gabarit `PageShell` (D57), `BackButton` à destination explicite, tests Vitest + Testing Library + MSW + jest-axe avec `renderWithProviders`.
- La route `messages` pointe vers une coquille vide (`components/Pages/Stagiaire/Messages/MessagesPage.jsx`). Le détail d'un compte (`AccountDetailPage`) ne propose pas encore le message.
- Décisions de référence : `docs/decisions-messagerie.md` H1–H9, D21 (sondage 45 s), D22 (deux volets), D42 (responsive), D12 (erreurs).

## Goals / Non-Goals

**Goals:**
- Messagerie individuelle complète et testée contre un back qui ne change pas.
- Les trois manques du back (Q14 destinataires, Q15 lecture d'un fil, limite 5000 dans `tech.md`) isolés chacun en un seul point de code, remplaçables sans toucher aux écrans.

**Non-Goals:**
- Envoi groupé, aperçu des destinataires, filtres (change suivant, H2).
- Pièces jointes, suppression ou édition de message, indicateur de saisie, temps réel (WebSocket).
- Pagination des fils : `GET /messages/{id}` renvoie tout ; acceptable pour les volumes de l'ADAC, à revoir si un fil grossit.

## Decisions

1. **Dossier `src/features/messagerie/`** : `api.js` (4 appels), `hooks.js` (`useConversations`, `useThread`, `useSendMessage`, `useMarkThreadRead`, `useUnreadCount`), `recipients.js` (règles pures H1 : `allowedRecipients`, `canWriteTo`), `useRecipients.js` (le seul point qui lit les endpoints de destinataires), `messageForm.js` (validation 1–5000), `pages/MessagesPage.jsx`, `components/` (`ConversationList`, `Thread`, `MessageComposer`, `NewConversation`). L'ancienne coque est supprimée. *Alternative écartée* : garder le dossier `components/Pages/Stagiaire/` (D32 veut le nouveau code par domaine).

2. **Une seule page, deux routes** : `messages` et `messages/:userId` rendent la même `MessagesPage` ; `:userId` choisit le volet droit. Largeur large → deux volets en grille avec requête de conteneur en `rem` (D61) ; étroit → un seul volet visible, `BackButton to="/messages"` dans le fil. Jamais de `display: none` sur un libellé (D61). *Alternative écartée* : deux pages distinctes (duplique la liste et son sondage).

3. **Clés de requête** : `['messages','conversations']` et `['messages','thread', String(userId)]`. Envoi et lecture invalident `['messages']` (le fil et la liste partagent le préfixe). Sondage : `refetchInterval: 45000`, `refetchIntervalInBackground: false`, `refetchOnWindowFocus: true` (D21, D22), comme le sondage décrit pour les notifications.

4. **Pastille de la tuile** : `useUnreadCount()` lit `useConversations()` (même requête, aucun appel de plus) et additionne `unreadCount` ; en erreur ou à zéro, rien n'est affiché. Le libellé accessible est dans le nom de la tuile, pas seulement la pastille visuelle.

5. **Destinataires autorisés, deux couches** : `recipients.js` est pur et testé (rôle + données → liste, sans doublon, sans soi-même, actifs seulement) ; `useRecipients()` fournit les données selon le rôle : chargée de formation → `GET /users/formateurs?active=true` + `GET /users/stagiaires?active=true` ; formateur → `GET /users/stagiaires?active=true` (périmètre fixé par le back, voir Q3/Q8) ; stagiaire → formateurs distincts de `GET /formations` ; pour formateur et stagiaire, la chargée de formation vient seulement des données déjà là (`formation.formateur` de rôle `SUPER_ADMIN`, interlocuteurs `SUPER_ADMIN` de `GET /messages`) jusqu'à Q14, puis un unique `GET /messages/recipients` remplacera tout le corps de `useRecipients`. Les requêtes ne partent que quand « Nouvelle conversation » ou le bouton de compte en a besoin (`enabled`). *Alternative écartée* : valider la permission uniquement par le 403 du back (message tardif, H8).

6. **Lecture d'un fil** : `markThreadRead(messages, currentUserId)` (pur + appels) choisit les messages entrants dont `readAt` est nul et envoie un `PATCH` chacun avec `Promise.allSettled` (un échec n'empêche rien), puis invalide `['messages']`. Déclenché une fois par fil affiché (effet qui dépend des ids non lus, pas du tableau), jamais pendant le chargement. Remplaçable par `PATCH /messages/{conversationId}/read` (Q15).

7. **Fil d'une personne hors destinataires** : `canWriteTo(user, other, recipients)` décide entre composeur, avis « Vous ne pouvez pas écrire à cette personne » et « Conversation introuvable » (fil vide et pas de droit). Pendant le chargement des destinataires, la saisie est désactivée avec un état annoncé plutôt que de clignoter.

8. **Saisie** : React Hook Form avec validateur à la main (`messageForm.js`, D13) ; `textarea` avec libellé visible, compteur annoncé poliment à l'approche de 5000 ; bouton désactivé pendant l'envoi (anti double clic) ; le texte est conservé en cas d'erreur ; le contenu des messages est rendu par React comme texte, `white-space: pre-wrap`.

9. **Bouton sur les comptes** : `AccountDetailPage` affiche « Envoyer un message » (lien vers `/messages/:id`) quand `canWriteTo` l'autorise ; il s'appuie sur `useRecipients` (donc sur les mêmes règles H1).

10. **Tests** : `src/test/messages.js` (`mockConversations`, `mockThread`, `mockSendMessage`, `mockMarkRead`, `mockRecipients` déclarant les routes MSW) ; tout test qui rend la tuile « Messages » doit déclarer `mockConversations()` (comme `mockCategories()` pour la liste de formations). Un check jest-axe par page.

## Risks / Trade-offs

- **Chargée de formation introuvable (Q14)** : un stagiaire sans conversation existante ni formation dont elle est formateur ne peut pas lui écrire en premier. Assumé et documenté, levé par l'endpoint demandé.
- **N appels `PATCH`** à l'ouverture d'un long fil non lu : acceptable, parallèles, remplacés par Q15.
- **Écart avec `STORIES.md`** (le back accepte plus de destinataires que H1) : le front restreint seulement l'interface ; un lien direct reste géré par H8.
- **Sondage de la liste sur tous les écrans qui montrent la tuile** : une seule requête partagée, coût faible ; en pause onglet masqué.
- **Périmètre du formateur** : `GET /users/stagiaires` suit le back (Q3/Q8) ; si D46 est appliqué au back, le formateur verra plus de stagiaires que « les siens ». À recontrôler quand Charlotte répond.

## Open Questions

(aucune qui change ce qui est construit ; les trois points de Charlotte — Q14, Q15, limite de 5000 — ont un repli dans le code.)
