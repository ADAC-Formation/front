# Points pour Charlotte — nouveautés

Extrait de `points-pour-charlotte.md` : ce qui reste à dire à Charlotte **depuis sa réponse du 2026-11-09** (`reponses-pour-manon.md`, résumée au §0 du document principal). À remettre à Charlotte quand Manon le décide ; une fois envoyé, vider ce fichier et y noter la date d'envoi. Chaque nouvelle entrée ajoutée à `points-pour-charlotte.md` est aussi recopiée ici.

Dernier envoi : 2026-11-02 (matin). Charlotte a répondu le 2026-11-09.

## 1. Ce que nous avons fait de tes réponses

Tout est pris en compte côté front ; rien de ce qui suit n'est une question.

- **Q13** (`inscriptionId` du stagiaire) : mergé (PR #13), branché dans le front et essayé sur le vrai back le 2026-11-09. Merci.
- **Q2, Q5, Q7, limite du message, destinataire inconnu** : le front est aligné (liens d'activation et de réinitialisation, fichiers pdf / jpg / jpeg / png / docx de 10 Mo, `OffsetDateTime`, 1–5000 caractères, `403` dans les deux cas).
- **Q11a** : le contournement du front pour `formateurId` (envoyer l'identifiant de la chargée connectée) est gardé, avec son commentaire mis à jour.
- **Accords de Manon** : Q8.3 (`activated`), Q14 (`GET /messages/recipients`) et Q15 (chemin `PATCH /api/messages/conversations/{conversationId}/read`) sont validés ; le front passera à chacun dès qu'il est mergé.
- **Q3, Q8.2, Q9, Q10, Q12** : Manon a demandé l'avis de l'ADAC (document de questions prêt), rien à faire de ton côté d'ici là, **sauf à ne rien développer** pour Q3 et Q8.2 (formateur). Q10 est tranché : PCB = Point Conseil Budget.

## 2. Attendu de toi (déjà d'accord, pas encore dans le back `dev`)

Vérifié le 2026-11-09 sur `dev` (dernier merge : PR #13) : aucun de ces points n'est encore là.

| Réf. | Attendu | Ce que le front fera au merge |
|---|---|---|
| Q1 | `PATCH /api/users/me/password` `{ oldPassword, newPassword }`, annoncée dans la V1. Peux-tu confirmer l'arrivée et les erreurs : `400` règle du mot de passe, `401` ou `403` si l'ancien est faux ? | Le formulaire du profil est fait et testé sur MSW seulement ; il affiche le `message` du back et ne déconnecte pas sur un `401` de cette route. À éprouver sur le vrai back. |
| Q8.3 | Champ booléen `activated` sur `UserResponse`. | « Jamais activé » / « Suspendu » + bouton « Renvoyer le code ». |
| Q14 | `GET /api/messages/recipients` → `UserResponse[]` des destinataires autorisés. | `useRecipients` l'appelle au lieu de charger trois listes complètes. |
| Q15 | `PATCH /api/messages/conversations/{conversationId}/read`. | Un appel au lieu de N par fil ouvert. |

## 3. Relance : Q16 — pas de réponse

### Q16 — Inscriptions d'un stagiaire (profil vu par la chargée de formation / le formateur)
Pour afficher, sur le profil d'un stagiaire, ce qu'il a envoyé dans chacune de ses formations, le front doit connaître ses inscriptions. Aucun endpoint ne les donne (`GET /users/{id}` ne les contient pas) : le front lit la liste d'inscrits de chaque formation que l'appelant peut consulter et retient celles du stagiaire (une requête par formation, `404` ignoré pour le formateur hors de ses formations).

Proposition : `GET /api/users/{id}/inscriptions` → `{ id, formation }[]` (SUPER_ADMIN : toutes ; ADMIN : celles de ses formations ; la même règle que `GET /api/documents?inscriptionId=`). Le front passera à cet appel unique dès qu'il existe.

## 4. Corrections déjà demandées, à confirmer

- **Q11b** : `PATCH /api/formations/{id}/formateur` répond `500` (constaté le 2026-11-01) au lieu d'un `404` ou `405`. Tu as dit le corriger : sera-t-il dans le prochain merge ?
- **Q12** : remplir `details[]` de l'import Excel (`{ligne, colonne, message}`), d'accord sur le principe. Le front découpe le message en attendant. Le fichier réel de l'ADAC n'est pas encore arrivé (R10) : les colonnes restent celles de `tech.md`.
- **Contrat `FormationResponse`** : `role` doit toujours être présent sur le `formateur` (la messagerie du stagiaire en dépend).

## 5. Documents d'une formation (ticket 027) — pas de réponse sur ces points

Contrat vérifié sur le back local (dépôt, liste, téléchargement, suppression, avec un vrai bucket Supabase) : tout fonctionne comme dans `tech.md` §6. À confirmer ou à améliorer :

- **URL signée ou proxy ?** Le ticket 027 parle d'« URL signée » ; `tech.md` §6 et le back décrivent un proxy binaire (`GET /documents/{id}/download`). Le front suit `tech.md` (décision G1) et n'utilise jamais `fileUrl`. Rien à changer si le proxy est bien le choix voulu.
- **Formation archivée** : le front rend les documents en lecture seule (G3), mais le back accepte encore le dépôt et la suppression sur une formation archivée. Souhaites-tu les refuser côté back (`409` / `403`) ?
- **`uploadedBy` expose trop au stagiaire** : chaque `DocumentResponse` contient l'utilisateur complet (`email`, `createdAt`, `emailNotificationsEnabled`, `isActive`…). Un stagiaire reçoit donc l'e-mail du formateur et de la chargée de formation qui ont déposé le document, alors que le front n'affiche que « Envoyé par Prénom Nom ». Pour la vie privée (D31, même sujet que l'e-mail des co-inscrits, `tech.md` §5), pourrait-on renvoyer seulement `id`, `prenom` et `nom` ? Le front n'a besoin que de ces trois champs (l'`id` sert à savoir si le formateur est l'auteur du dépôt).
- **`fileUrl`** : c'est l'adresse brute du stockage (bucket privé, inutilisable par un navigateur). Elle fuit le nom du bucket et le chemin ; la retirer de `DocumentResponse` serait plus propre si rien ne l'utilise.
- **Double barre dans `fileUrl`** : si `SUPABASE_URL` se termine par `/`, l'adresse contient `//storage/...`. Retirer la barre finale dans `SupabaseConfig` évite le piège.
- **Erreur de configuration du stockage** : une `SUPABASE_URL` mal formée ou pointant sur `/rest/v1/` donne `502 « Service de stockage indisponible »` ; la vraie cause (`PGRST125`, hôte inconnu…) n'est que dans les logs. À mentionner dans ta documentation de développement local : `SUPABASE_URL` = URL du projet seule (`https://<projet>.supabase.co`), clé `service_role`, bucket privé `adac-documents`.

## 6. Nouveau : mentions légales (HU-S02, 2026-11-09)

Pour information : le portail a maintenant une page publique `/mentions-legales`. Elle a besoin de l'**hébergeur** du portail (nom et adresse), que seule toi connais : peux-tu le donner à Manon ? Le reste (SIRET, déclaration d'activité, durée de conservation) est demandé à l'ADAC. Côté back, peux-tu aussi confirmer ce qui est conservé et pendant combien de temps (comptes, documents, messages) pour que le texte de confidentialité soit exact ?
