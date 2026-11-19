# Tasks

## 1. Préparation

- [x] 1.1 Vérifier la branche `feature/messagerie-groupee` (depuis `dev`), `npm run check` vert au départ, `git -C ../back-readonly status` propre ; rafraîchir le back (`git -C ../back-readonly pull`) et relire `tech.md` §7 (groupé et aperçu) ; la valeur de `status` des formations actives est `ACTIVE`
- [x] 1.2 Point ouvert du design tranché par Manon : formations actives seulement, consigné en H17 dans `decisions-messagerie.md`
- [x] 1.3 Ajouter les critères du groupé à `docs/projet/spec.md` (spec `group-messaging`, H12–H16) ; commit `docs: add the group messaging decisions and spec`

## 2. Logique pure (TDD)

- [x] 2.1 RED : `groupFilters.test.js` — `filterTypesFor` (chargée : 3, formateur : 1, stagiaire : aucun), `formationsOfTrainer` (seulement les siennes), `isFilterComplete` (formation absente / choisie, `MANUAL` vide / non vide, `MISSING_DOCS`), `toPreviewParams`, `toSendBody` (`userIds` seulement pour `MANUAL`, `formationId` seulement pour `FORMATION`)
- [x] 2.2 Créer `groupFilters.js` ; GREEN
- [x] 2.3 Commit `feat: add the group messaging filter rules`

## 3. Appels et hooks (TDD)

- [x] 3.1 Étendre `src/test/messages.js` (`mockGroupPreview` avec capture des paramètres et `errorStatus`, `mockSendGroupMessage` avec capture du corps) ; RED : `hooks.test.jsx` — `useGroupPreview` (aucun appel tant que le filtre est incomplet, `userIds` répétés dans l'adresse, `400` → erreur sans nouvel essai), `useSendGroupMessage` (corps `{ content, filter }`, invalidation de `['messages']`, 403 / 404 / réseau en `ApiError`)
- [x] 3.2 Ajouter `previewGroupRecipients` / `sendGroupMessage` à `api.js` et les deux hooks ; GREEN
- [x] 3.3 Commit `feat: add the group messaging requests`

## 4. Composants de saisie (TDD)

- [x] 4.1 RED : `StagiairePicker.test.jsx` (cases natives, recherche sans casse ni accents, « Tout sélectionner » sur les résultats, sélection conservée entre deux recherches, compteur annoncé) ; `RecipientPreview.test.jsx` (noms sans e-mail, compte annoncé, « Aucun destinataire correspondant », chargement et erreur avec « Réessayer ») ; `GroupFilters.test.jsx` (types par rôle, texte d'aide `MISSING_DOCS`, changer de type vide formation et sélection)
- [x] 4.2 Créer `StagiairePicker`, `RecipientPreview`, `GroupFilters` (CSS Modules, jetons, rem, anneau de focus global) ; GREEN
- [x] 4.3 Commit `feat: add the group messaging inputs`

## 5. Page et route (TDD)

- [x] 5.1 RED : `GroupMessagePage.test.jsx` — les 5 cas du ticket 032 (3 filtres chargée ; 1 filtre formateur ; formation choisie → aperçu ; 0 destinataire → envoi désactivé ; `201` → confirmation) + confirmation (Annuler = aucun appel, Envoyer = un seul appel même en cas de double clic) + texte vide refusé + 403 garde le texte + stagiaire redirigé + check jest-axe (page, et boîte de confirmation ouverte)
- [x] 5.2 Créer `pages/GroupMessagePage.jsx` (`PageShell`, `BackButton to="/messages"`), route `messages/groupe` avant `messages/:userId` avec `lazyPage` et `RequireRole` ; GREEN ; `npm run check` (budget : la page reste hors de l'entrée)
- [x] 5.3 Commit `feat: add the group messaging page`

## 6. Bouton, confirmation d'envoi et mention dans le fil (TDD)

- [ ] 6.1 RED : `MessagesPage.test.jsx` — « Message groupé » visible pour chargée et formateur, absent pour le stagiaire, lien vers `/messages/groupe` ; ligne `role="status"` « Message envoyé à X destinataires » quand `location.state.groupSent` existe ; `Thread.test.jsx` — mention « Message groupé » si `isGroup`, aucun nom ni e-mail de `recipients` rendu
- [ ] 6.2 Ajouter le bouton et la ligne d'état à `MessagesPage`, la mention à `Thread` ; GREEN
- [ ] 6.3 Mettre à jour `src/test/mobile-layout.test.js` si la barre de boutons de `/messages` change, et `SiteMapPage` si un lien est ajouté
- [ ] 6.4 Commit `feat: add the group message button and the thread label`

## 7. Documentation

- [ ] 7.1 Mettre à jour `docs/dev/etat-front.md` (bullet messagerie : groupé, mocks `mockGroupPreview` / `mockSendGroupMessage`), `CLAUDE.md` (mocks obligatoires si un test déjà écrit les exige), `docs/projet/spec.md`
- [ ] 7.2 Mettre à jour la section « À envoyer à Charlotte » si la vérification 8.3 relève un écart de contrat

## 8. Vérification

- [ ] 8.1 `npm run check` vert (lint + tests + build + budget) et `git -C ../back-readonly status` propre
- [ ] 8.2 Relecture (`/code-review`) ; corriger les points bloquants
- [ ] 8.3 Passage manuel sur le vrai back local : les trois filtres en chargée de formation, `FORMATION` en formateur (formation d'un autre → pas proposée), aperçu avec plusieurs `userIds` (**vérifier la sérialisation `userIds=4&userIds=7`**), envoi, notification et fil du destinataire avec « Message groupé », e-mails absents de l'écran, mobile et « Grand texte ». Consigner dans `decisions-messagerie.md` (H18) ; tout écart de contrat va dans `points-pour-charlotte.md`
- [ ] 8.4 `/opsx:archive` ; D64 : pas de PR, avance rapide dans `dev` ; rien n'est poussé sans demande de Manon
