# Décisions — Page profil (tickets 044 et 036)

Branche `feature/profile` (depuis `dev`). Contrat : `tech.md` §1 (`GET /auth/me`, `UserResponse`) et `PATCH /users/me` (`emailNotificationsEnabled`).

## P1 — Contenu de la page

- **Date** : 2026-11-09
- **Décision** : `/profile` affiche, pour tous les rôles, quatre sections : « Mes informations » (prénom, nom, e-mail, rôle, en lecture seule), « Notifications par e-mail » (interrupteur), « Mot de passe » (formulaire) et, pour le stagiaire seulement, « Mes documents » (résumé, G16).
- **Pourquoi** : c'est le contenu du ticket 044, plus l'interrupteur du ticket 036 qui vit sur la même page.

## P2 — Informations en lecture seule

- **Décision** : aucune modification du nom ni de l'e-mail par l'utilisateur (le back ne l'autorise qu'à la chargée de formation, `PUT /users/{id}`, et changer l'e-mail change l'identifiant de connexion). Les valeurs viennent de la session (`useCurrentUser`), sans appel supplémentaire : le back n'a pas de `GET /users/me`.

## P3 — Interrupteur « Notifications par e-mail »

- **Décision** : `PATCH /users/me` `{ emailNotificationsEnabled }` envoyé dès le changement (pas de bouton « Enregistrer »). Mise à jour optimiste de la session (`['auth','me']`), retour arrière et message d'erreur si le back refuse ; confirmation « Préférences enregistrées » annoncée. Note : « Les e-mails de sécurité (activation, réinitialisation) sont toujours envoyés ».
- **Pourquoi** : même schéma que les notifications (N3), et le ticket 036 le demande.

## P4 — Changement de mot de passe

- **Décision** : formulaire « Mot de passe actuel / Nouveau mot de passe / Confirmation » (règles de `validation.js`, D13) qui appelle `PATCH /users/me/password` `{ oldPassword, newPassword }`, la route annoncée par Charlotte (Q1) mais **pas encore présente dans le back `dev`** (vérifié le 2026-11-09). Succès : message et champs vidés. Erreur : message du back affiché en ligne, mots de passe vidés. Un lien « Mot de passe actuel oublié ? » mène à `/mot-de-passe-oublie`.
- **Piège** : un `401` « ancien mot de passe incorrect » ne doit pas déconnecter l'utilisateur : `/users/me/password` est ajoutée aux routes exemptées de l'intercepteur (`SESSION_EXEMPT_PATHS`).
- **Limite** : tant que la route n'existe pas dans le back, le formulaire ne peut être éprouvé que sur MSW (le back répondra `404` / `405`). Suivi : Q1 de `docs/charlotte/points-pour-charlotte.md` (erreurs exactes à confirmer : `400` règle de mot de passe, `401` ou `403` ancien mot de passe).

## P5 — Libellé du rôle

- **Décision** : le rôle est affiché avec `roleLabels` (« Chargée de formation », « Formateur », « Stagiaire », D33).
