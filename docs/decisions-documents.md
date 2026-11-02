# Décisions — documents d'une formation (ticket 027)

Décisions prises avec Manon (`/grill-me-with-docs`). Complète F3 et F13 de `decisions-formations.md` (section « Documents » réservée, dépôt retiré du formulaire). Numérotation propre à ce thème : G1, G2…

## G1 — Téléchargement : requête axios en blob, pas d'URL signée
- Date : 2026-11-02
- **Décision** : le bouton « Télécharger » appelle `GET /documents/{id}/download` par le client axios (cookie `jwt`, intercepteur `ApiError`, D12) en `responseType: 'blob'`, puis déclenche l'enregistrement sous le nom d'origine (`fileName`). `fileUrl` (adresse Supabase) n'est jamais utilisée par le front. Une erreur 403 / 404 s'affiche dans l'interface.
- **Pourquoi** : `tech.md` §6 et TICKET-026 prévoient un proxy binaire, sans redirection ni URL signée ; le ticket 027 parle d'« URL signée » mais `tech.md` l'emporte (D40). Le lien direct poserait un problème de cookie entre origines en local et afficherait du JSON brut en cas d'erreur.
- **Alternatives écartées** : lien `<a href>` direct vers l'endpoint.

## G2 — Droits affichés : exactement ceux du back
- Date : 2026-11-02
- **Décision** : chargée de formation (`SUPER_ADMIN`) : zone de dépôt et « Supprimer » sur tous les documents. Formateur (`ADMIN`) : zone de dépôt seulement sur ses formations (`formation.formateur.id` = lui), « Supprimer » seulement sur les documents qu'il a envoyés (`uploadedBy.id` = lui) ; il voit et télécharge les autres. Stagiaire : liste et téléchargement seulement. Aucune action ne mène à un `403` (comme les comptes, D54).
- **Pourquoi** : `tech.md` §6 (dépôt : ses formations ; suppression : ses propres envois, quelle que soit la formation) ; D46 donne au formateur la lecture de toutes les formations.
- **Alternatives écartées** : dépôt et suppression offerts au formateur partout (boutons qui échouent en `403`).

## G3 — Formation archivée : documents en lecture seule
- Date : 2026-11-02
- **Décision** : sur une formation archivée, ni zone de dépôt ni « Supprimer » pour personne ; la liste et le téléchargement restent disponibles. Règle d'interface seulement : le back ne l'impose pas (à signaler à Charlotte dans `points-pour-charlotte.md`).
- **Pourquoi** : une formation archivée n'est plus modifiable (formulaire) ; les documents restent consultables pour la traçabilité Qualiopi.
- **Alternatives écartées** : aucune différence avec une formation active.

## G4 — Dépôt : plusieurs fichiers, envoyés un par un, erreurs par fichier
- Date : 2026-11-02
- **Décision** : zone de dépôt (glisser-déposer) et bouton « Choisir des fichiers » (accessible au clavier, `<input type="file" multiple>`). Chaque fichier est contrôlé avant envoi : extension pdf, jpg / jpeg, png, docx et taille 10 Mo au plus (le back revérifie, y compris la signature). Les fichiers valides partent l'un après l'autre (un `POST /documents` multipart par fichier, `formationId`) ; les refus (client ou `400` / `403` du back) sont listés avec le nom du fichier et la raison, annoncés (`role="alert"`), sans bloquer les autres. La liste est rechargée (`['documents']`) à la fin.
- **Pourquoi** : le back accepte un fichier par requête ; plusieurs supports par formation sont courants ; un refus ne doit pas faire perdre les autres envois.
- **Alternatives écartées** : un seul fichier à la fois.

## G5 — Suppression : confirmation puis rechargement
- Date : 2026-11-02
- **Décision** : « Supprimer » (nom accessible avec le nom du fichier) ouvre `ConfirmDialog` : nom du fichier, suppression définitive (le back supprime aussi le fichier du stockage). Aucune mise à jour optimiste : la liste est rechargée depuis le back et un message annoncé (`role="status"`) confirme « Document supprimé ». `404` (déjà supprimé) : liste rechargée avec un message ; `403` : message d'erreur dans la boîte.
- **Pourquoi** : action irréversible côté back ; même patron que la désactivation d'une catégorie (C4) et l'archivage.
- **Alternatives écartées** : suppression immédiate avec annulation (le fichier est vraiment supprimé du stockage).

## G6 — Hypothèses retenues pour le change `formation-documents` (à corriger si besoin)
- Date : 2026-11-02
- **Décision** : (1) la liste vient de `GET /documents?formationId=` (clé `['documents', formationId]`) et n'affiche que les documents de la formation ; les documents ciblés par stagiaire (`inscriptionId`) relèvent de 028 ; (2) chaque ligne : icône par type, nom, taille lisible (Ko / Mo), date d'envoi, nom de l'expéditeur (jamais son e-mail), bouton « Télécharger » (nom accessible avec le nom du fichier) ; ordre du back ; (3) liste vide : « Aucun document disponible pour le moment » ; (4) le nom du fichier est affiché en texte, jamais en HTML ; (5) la section remplace l'emplacement réservé de `FormationDetailPage` (`features/documents/`, composants `DocumentSection`, `DocumentDropzone`, `DocumentList`) ; (6) pas de barre de progression (10 Mo max) : état « Envoi en cours… » annoncé.
- **Pourquoi** : suit `tech.md` §6, US-009 / US-011 et les patrons des comptes, formations et catégories ; choix sans enjeu de périmètre.
- **Alternatives écartées** : barre de progression ; aperçu en ligne des PDF / images (hors tickets).

## G7 — Constats d'implémentation de `formation-documents`
- Date : 2026-11-02
- **Erreurs de téléchargement** : avec `responseType: 'blob'`, le corps d'erreur du back arrive en `Blob` et l'intercepteur ne lit pas son `message` (le `status` est gardé). `downloadDocument` relance une `ApiError` au même statut avec un message français choisi d'après ce statut (`403` : pas d'accès ; `404` : introuvable). Relire le blob à la main aurait contourné l'intercepteur, donc la gestion du `401`.
- **Suppression** : un `404` recharge aussi la liste (le document n'existe plus) ; un `403` n'y touche pas.
- **Contrat vérifié sur le back local** (compte `chargee.dev@adac.test`) : `GET /documents?formationId=` répond `200` ; un `.exe` est refusé en `400` « Format non autorisé » (le message du back est affiché tel quel pour le fichier concerné). Un PDF valide répond `502` « Service de stockage indisponible » tant que `dev-compose/.env` n'a pas un vrai bucket Supabase : dépôt, téléchargement et suppression réels restent à vérifier avec un bucket de développement.
- **Tests** : `request.formData()` échoue en test (classes `File` de jsdom et d'undici différentes) ; `src/test/documents.js` lit le multipart brut.
