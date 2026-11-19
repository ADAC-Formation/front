# Design

## Context

- Contrat `tech.md` §7. Envoi : `{ content, filter: { type, formationId?, userIds? } }` (`FORMATION` | `MISSING_DOCS` | `MANUAL`). Aperçu : `GET /messages/group/preview?filterType=…&formationId=…&userIds=4&userIds=7` → `UserResponse[]`. Le back répond `400` quand le filtre ne résout personne, `403` / `404` selon le rôle et la formation. Un message groupé est **un seul** message avec N destinataires ; chaque destinataire reçoit une notification individuelle.
- Code existant à réutiliser : `features/messagerie/` (`api.js`, `hooks.js`, `messageForm.js`, `Thread`, `MessageComposer`), `ConfirmDialog` (`components/molecules`), `useFormations`, `useAccounts('stagiaires', { active: true })`, `conversationFilters.js` (normalisation sans casse ni accents), `PageShell`, `BackButton`, `lazyPage`.
- Décisions de référence : H9, H12–H16, D12 (erreurs), D15 (accessibilité), D31 (vie privée), D59 (lazyPage).

## Goals / Non-Goals

**Goals :** composer, prévisualiser, confirmer, envoyer ; règles de filtre isolées en fonctions pures testées ; rien d'affiché qui expose les e-mails des autres destinataires.

**Non-Goals :** voir proposal (hors périmètre).

## Decisions

1. **Logique pure dans `groupFilters.js`** : `filterTypesFor(role)` (chargée : 3 types, formateur : `FORMATION`), `formationsOfTrainer(formations, userId)` (`formation.formateur.id === userId`), `isFilterComplete(filter)` (formation choisie / ≥ 1 `userId` / `MISSING_DOCS`), `toSendBody(filter, content)`, `toPreviewParams(filter)`. Testable sans React.
2. **Appels dans `api.js`** : `previewGroupRecipients(filter)` et `sendGroupMessage({ filter, content })`. Le tableau `userIds` est sérialisé en `userIds=4&userIds=7` (`paramsSerializer: { indexes: null }` ; l'écriture `userIds[]=` par défaut d'axios n'est pas celle que Spring lit) : **à vérifier sur le vrai back** (tâche 8.3).
3. **Hooks** : `useGroupPreview(filter)` (clé `['messages','group-preview', filter]`, `enabled` seulement si le filtre est complet, pas de sondage, `retry: false` pour qu'un `400` « personne » s'affiche sans délai) et `useSendGroupMessage()` (invalide `['messages']`). Les deux dans `hooks.js`.
4. **Une page, quatre blocs** : `GroupMessagePage` = `GroupFilters` (type, puis formation ou `StagiairePicker` ou texte d'aide `MISSING_DOCS`) → `RecipientPreview` (nom seul, jamais l'e-mail, compte en `aria-live="polite"`) → champ de texte (réutilise `messageForm.js`) → bouton « Envoyer à X destinataires » → `ConfirmDialog`. Changer de type de filtre vide la formation et la sélection.
5. **Aperçu sans e-mail** : `RecipientPreview` affiche « Prénom Nom » seulement (D31). La liste peut être longue : défilement dans la carte, compte annoncé en tête.
6. **Retour après envoi** : `navigate('/messages', { state: { groupSent: n } })` ; `MessagesPage` lit `location.state` et affiche une ligne `role="status"` ; rien n'est stocké dans le navigateur (D31). Un rechargement de la page l'efface, c'est voulu.
7. **Route** : `messages/groupe` déclarée avant `messages/:userId` avec `lazyPage` (la page reste hors de l'entrée du bundle, `check-bundle`). Un stagiaire est renvoyé comme sur les autres pages réservées (`RequireRole`).
8. **Fil** : `Thread` ajoute la mention texte « Message groupé » quand `message.isGroup` ; `recipients` n'est jamais lu.

## Risks / Trade-offs

- `recipients` du back contient les e-mails de tous (À7) : le front n'y touche pas, mais la donnée arrive dans le navigateur ; tant que le back ne change pas, le risque est côté réseau, pas côté écran.
- Pas d'annulation d'un message groupé : d'où la confirmation (H13).
- L'aperçu de `MANUAL` vient de l'appel d'aperçu comme les autres (source unique du compte affiché) ; la sélection cochée n'est pas rendue comme liste de destinataires.

## Open Questions

Aucune. Formations archivées : écartées du filtre `FORMATION`, voir H17 (`useFormations({ status: 'ACTIVE' })`).
