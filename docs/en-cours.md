# Travail en cours et en attente

Point d'entrée pour reprendre le travail. Créé le 2026-11-09, après les réponses de Charlotte (`points-pour-charlotte.md` §0). Cocher une ligne quand elle est faite, puis reporter la décision dans `docs/decisions-*.md`.

## 1. Pour Manon (à envoyer ou à faire)

- [ ] Répondre à Charlotte : OK pour Q8.3 (`activated`), Q14 (`GET /messages/recipients`), Q15 (`PATCH /messages/conversations/{conversationId}/read`) ; Q3, Q8.2, Q9 : avis de l'ADAC d'abord, puis décision commune.
- [ ] Relancer Charlotte sur **Q16** (`GET /users/{id}/inscriptions`), restée sans réponse, et sur les points du §7 de `points-pour-charlotte.md` (`uploadedBy` trop détaillé, `fileUrl`, formation archivée) : voir `points-pour-charlotte-nouveautes.md`.
- [ ] Envoyer `questions-pour-adac.md` à l'ADAC : §C (ce que voit le formateur), §D (codes de référence, série « Spécial PCB »), §E (fichier Excel réel), plus §A et §B.
- [x] Test manuel de Q13 sur le vrai back (dépôt, suppression de son fichier, 403 sur celui d'un autre) : fait le 2026-11-09.
- [ ] Mettre à jour `CLAUDE.md` et `decisions-front-foundations.md` : Manon travaille seule sur le repo, push direct sur `dev`, plus de PR (D3, D43).

## 2. Front, après le merge de Charlotte (lot B, TDD)

- [ ] **Q15** : `markThreadRead` (`features/messagerie/api.js`) passe à un seul appel ; adapter les mocks MSW.
- [ ] **Q1** : formulaire « Changer mon mot de passe » dans `ProfilePage` (ticket 044) ; `PATCH /users/me/password` `{ oldPassword, newPassword }` ; erreurs à lire dans le message de Charlotte.
- [ ] **Q14** : `useRecipients` appelle `GET /messages/recipients` ; `recipients.js` ne garde que le filtrage d'affichage, ou disparaît.
- [ ] **Q8.3** : `AccountRow` et `AccountDetailPage` affichent « Jamais activé » (action : renvoyer le code, `/auth/resend-activation`, bouton à créer dans `features/accounts`) ou « Suspendu » (action : réactiver).
- [ ] **Q9** : champ facultatif `reference` (formulaire, liste, détail, import Excel), seulement si l'ADAC s'en sert.

## 3. Bloqué : ne pas développer

- **Q3 et Q8.2** (le formateur voit-il toutes les formations et tous les stagiaires ?) : Charlotte demande d'attendre la décision commune, qui attend l'avis de l'ADAC (§C). Le filtre client « Mes formations / Toutes » (D46) reste tel quel.
- **Q12** (import Excel, `details[]` `{ligne, colonne, message}`) : attend le vrai fichier de l'ADAC (§E) ; colonnes provisoires dans `features/formations/importColumns.js`.
- **Q10** : PCB = Point Conseil Budget. Reste à savoir si « Spécial PCB » est un public, une catégorie ou un type d'intervenant (§D).

## 4. Côté Charlotte (suivi)

`tech.md` à corriger (dates `OffsetDateTime`, `403` pour destinataire inconnu, limite de 5000 caractères) ; `PATCH /formations/{id}/formateur` doit répondre `404` ou `405` au lieu de `500` ; endpoints Q1, Q8.3, Q14, Q15 à merger.
