# Points pour Charlotte — nouveautés

Extrait de `points-pour-charlotte.md` : uniquement les entrées ajoutées **depuis la dernière version envoyée** (envoi du 2026-11-02, matin). À remettre à Charlotte quand Manon le décide ; une fois envoyé, vider ce fichier et y noter la nouvelle date d'envoi. Chaque nouvelle entrée ajoutée à `points-pour-charlotte.md` est aussi recopiée ici.

Dernier envoi : 2026-11-02 (matin).

## Documents d'une formation (ticket 027) — ajouté le 2026-11-02, après l'envoi du matin

Contrat vérifié sur le back local (dépôt, liste, téléchargement, suppression, avec un vrai bucket Supabase) : tout fonctionne comme dans `tech.md` §6. Points à confirmer ou à améliorer :

- **URL signée ou proxy ?** Le ticket 027 parle d'« URL signée » ; `tech.md` §6 et le back décrivent un proxy binaire (`GET /documents/{id}/download`). Le front suit `tech.md` (décision G1) et n'utilise jamais `fileUrl`. Rien à changer si le proxy est bien le choix voulu.
- **Formation archivée** : le front rend les documents en lecture seule (G3), mais le back accepte encore le dépôt et la suppression sur une formation archivée. Souhaites-tu les refuser côté back (`409` / `403`) ?
- **`uploadedBy` expose trop au stagiaire** : chaque `DocumentResponse` contient l'utilisateur complet (`email`, `createdAt`, `emailNotificationsEnabled`, `isActive`…). Un stagiaire reçoit donc l'e-mail du formateur et de la chargée de formation qui ont déposé le document, alors que le front n'affiche que « Envoyé par Prénom Nom ». Pour la vie privée (D31, même sujet que l'e-mail des co-inscrits, `tech.md` §5), pourrait-on renvoyer seulement `id`, `prenom` et `nom` ? Le front n'a besoin que de ces trois champs (et de l'`id`, pour savoir si le formateur est l'auteur du dépôt).
- **`fileUrl`** : c'est l'adresse brute du stockage (bucket privé, inutilisable par un navigateur). Elle fuit le nom du bucket et le chemin ; la retirer de `DocumentResponse` serait plus propre si rien ne l'utilise.
- **Double barre dans `fileUrl`** : si `SUPABASE_URL` se termine par `/`, l'adresse contient `//storage/...`. Une normalisation dans `SupabaseConfig` (retirer la barre finale) évite le piège.
- **Erreur de configuration du stockage** : une `SUPABASE_URL` mal formée ou pointant sur `/rest/v1/` donne `502 « Service de stockage indisponible »` ; la vraie cause (`PGRST125`, hôte inconnu…) n'est que dans les logs. À mentionner dans ta documentation de développement local : `SUPABASE_URL` = URL du projet seule (`https://<projet>.supabase.co`), clé `service_role`, bucket privé `adac-documents`.

