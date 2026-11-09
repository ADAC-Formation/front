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
- **Contrat vérifié sur le back local** (compte `chargee.dev@adac.test`, vrai bucket Supabase) : `GET /documents?formationId=` `200` ; dépôt multipart d'un PDF `201` (`DocumentResponse` conforme à `tech.md`) ; liste mise à jour ; téléchargement `200` en `application/pdf`, contenu identique octet pour octet ; `DELETE` `204`, puis `404` « Document introuvable » au second appel et au téléchargement ; un `.exe` refusé en `400` « Format non autorisé » (message affiché tel quel pour le fichier concerné). Piège d'environnement : `SUPABASE_URL` doit être l'URL du projet seule (`https://<projet>.supabase.co`), sans `/rest/v1/` (le back répond `502` « Service de stockage indisponible » sinon, `PGRST125`) ; un `/` final est toléré (le `fileUrl` contient alors `//`).
- **Tests** : `request.formData()` échoue en test (classes `File` de jsdom et d'undici différentes) ; `src/test/documents.js` lit le multipart brut.

# Ticket 028 — documents du stagiaire (profil)

Suite du thème : mêmes composants et règles de fichier que 027 (G4), dépôt ciblé par inscription (`inscriptionId`).

## G8 — Le stagiaire ne peut pas connaître son `inscriptionId` : demande à Charlotte, front construit sur la proposition
- Date : 2026-11-02
- **Résolu le 2026-11-09 (G15)** : le back envoie `inscriptionId` dans `FormationResponse` (option 1 ci-dessous).
- **Constat (lu dans `tech.md` et dans le code du back, lecture seule)** : `POST /documents` et `GET /documents?inscriptionId=` exigent l'id d'inscription. Or `GET /formations/{id}/inscriptions` répond `403` à un stagiaire (pas d'e-mail des co-inscrits), `FormationResponse` n'a aucun champ d'inscription, et `DocumentResponse.inscriptionId` n'apparaît qu'une fois un document déposé. Le contrat actuel ne permet donc pas au stagiaire de déposer le premier document.
- **Décision** : demander à Charlotte un changement minimal (Q13 de `points-pour-charlotte.md`) : ajouter `inscriptionId` à `FormationResponse` quand l'appelant est le stagiaire inscrit (ou un `GET /inscriptions/me`). Le front est écrit et testé (MSW) sur cette proposition ; le passage manuel sur le vrai back attend sa réponse. `tech.md` n'est pas modifié (lecture seule) ; le champ est isolé dans un seul point du code pour s'adapter à la réponse.
- **Pourquoi** : aucun contournement côté front sans fuite de données ou devinette d'id ; attendre bloquerait un ticket d'une heure alors que le reste (composants, règles de fichier, droits) est connu.
- **Alternatives écartées** : suspendre 028 jusqu'à la réponse ; déduire l'id par un moyen détourné.

## G9 — Page `/profile` minimale : titre + « Mes documents » (stagiaire)
- Date : 2026-11-02
- **Modifié le 2026-11-09 (G16)** : « Mes documents » du profil devient un résumé en lecture seule ; le dépôt est sur la page de chaque formation.
- **Décision** : 028 remplace le bouchon `ProfilePage.jsx` (route existante `/profile`, liée depuis la tuile du tableau de bord ; écrite « `/profil` » par erreur dans la première version de cette décision) par une page enveloppée dans `templates/PageShell` : titre « Mon profil » et, pour le seul stagiaire, la section « Mes documents ». ADMIN et SUPER_ADMIN ne voient que le titre pour l'instant (aucune section vide ni promesse). Le ticket 044 (informations, mot de passe, bascule e-mail) ajoutera ses sections autour, sans toucher à celle-ci. Code dans `features/documents/` (`StagiaireDocSection`) ; la page est importée avec `lazyPage` (D59).
- **Pourquoi** : livre 028 de bout en bout sans anticiper 044, bloqué par l'absence d'endpoint de mot de passe.
- **Alternatives écartées** : ajouter « Mes informations » en lecture seule (hors périmètre) ; composant sans page ni route (non utilisable).

## G10 — Une sous-section par formation inscrite ; archivées en lecture seule
- Date : 2026-11-02
- **Modifié le 2026-11-09 (G16)** : les sous-sections par formation (liste, dépôt, suppression) sont maintenant la section « Mes documents » du détail de la formation ; les règles (formation active pour déposer, archivée en lecture seule) sont inchangées.
- **Décision** : « Mes documents » liste les formations de `GET /formations` (périmètre du stagiaire : ses inscriptions), les actives d'abord, puis les archivées. Chaque sous-section (titre = intitulé de la formation) a sa liste de documents (`GET /documents?inscriptionId=`, clé `['documents', 'inscription', inscriptionId]`) et, si la formation est active, sa zone de dépôt. Une formation archivée reste visible en lecture seule : liste et téléchargement, pas de zone de dépôt (même règle d'interface que G3, à confirmer avec Charlotte avec le point déjà noté).
- **Pourquoi** : cohérence avec G3 ; le stagiaire garde accès à ce qu'il a déposé.
- **Alternatives écartées** : masquer les formations archivées ; les traiter comme les actives.

## G11 — Sans `inscriptionId` : avis « Dépôt indisponible », aucun appel
- Date : 2026-11-02
- **Décision** : si la formation reçue n'a pas de `inscriptionId` (stagiaire non inscrit : le back ne renseigne `inscriptionId` que pour l'inscrit, G15), la sous-section affiche « Dépôt indisponible pour le moment » : ni liste, ni zone de dépôt, aucun appel `/documents`. Le champ est lu en un seul point du code (`inscriptionIdOf(formation)`) ; pour un stagiaire inscrit, la section est active. Cas testé avec MSW (formation sans le champ).
- **Pourquoi** : pas d'erreur évitable (G2) ; pas de fonctionnalité qui disparaît sans signe.
- **Alternatives écartées** : masquer toute la section ; laisser l'envoi échouer.

## G12 — Hypothèses retenues pour le change `stagiaire-documents` (à corriger si besoin)
- Date : 2026-11-02
- **Décision** : (1) réutilisation de `DocumentDropzone` et `DocumentList` de 027 et des règles de `documentFiles.js` (pdf / jpg / jpeg / png / docx, 10 Mo, un `POST` par fichier, refus listés par fichier, G4) ; la cible du dépôt devient `{formationId}` ou `{inscriptionId}` (exactement un des deux) ; (2) ~~le stagiaire ne peut pas supprimer~~ : levé par G15 (le back l'autorise sur ses propres dépôts) ; (3) téléchargement par blob comme G1 ; (4) la colonne « expéditeur » est omise (ce sont ses propres envois) ; (5) message de succès annoncé (`role="status"`) après un dépôt réussi, document ajouté à la liste rechargée (`['documents']`) ; (6) liste vide : « Aucun document déposé pour cette formation » ; (7) section visible uniquement pour `STAGIAIRE` (`RequireAuth` + test du rôle) ; (8) un check jest-axe sur `/profil` ; les tests qui rendent la page déclarent `mockDocumentApi()` et la liste des formations ; (9) la visibilité de ces documents par la chargée de formation (US-010) reste hors périmètre (Q6).
- **Pourquoi** : suit le ticket 028, G1–G7 et le contrat `tech.md` §6 ; choix sans enjeu de périmètre.
- **Alternatives écartées** : suppression par le stagiaire (impossible côté back) ; colonne expéditeur.

## G13 — Constats d'implémentation de `stagiaire-documents`
- Date : 2026-11-02
- **Cible de dépôt** : `uploadDocument(file, target)`, `useDocuments(target, { enabled })` et `useUploadDocuments(target)` prennent `{ formationId }` ou `{ inscriptionId }` ; une cible avec les deux ou aucun lève une `TypeError` sans appel. Clé de liste d'inscription : `['documents', 'inscription', id]` ; celle de la formation est inchangée (les tests de 027 n'ont pas bougé de comportement).
- **Un seul point de lecture** : `inscriptionIdOf(formation)` (`documentFiles.js`) ; `canUploadOwnDocument(formation)` = formation active **et** `inscriptionId` connu.
- **Réutilisation** : `DocumentList` gagne `showSender` (vrai par défaut) et `canDelete` facultatif ; les avis de dépôt sont extraits dans `UploadNotices`, partagé par `DocumentSection` et `StagiaireDocSection`.
- **Route** : la page de profil est `/profile` (route existante), déplacée dans `features/profile/pages/`, l'ancien dossier `components/Pages/Stagiaire/ProfilePage/` est supprimé.
- **Passage manuel sur le vrai back : NON FAIT.** Débloqué le 2026-11-09 (G15) : à faire sur le back local reconstruit depuis `dev`.

## G14 — Raccourci de développement pour `inscriptionId` (temporaire, jusqu'à la réponse à Q13)
- Date : 2026-11-02
- **Retiré le 2026-11-09 (G15)** : Q13 est traitée côté back.
- **Décision** : pour continuer à construire et essayer « Mes documents » sur le vrai back local, `inscriptionIdOf` complète une formation sans `inscriptionId` d'après `VITE_DEV_INSCRIPTION_IDS` (JSON `{ "<idFormation>": <idInscription> }` dans `.env`, git-ignoré). Le champ du back l'emporte toujours ; le raccourci n'est lu que si `import.meta.env.DEV` (absent du build de production, vérifié) ; JSON invalide ou valeur non numérique : ignoré. L'id réel d'inscription se lit côté chargée de formation (`GET /formations/{id}/inscriptions`) : procédure dans `docs/dev/README.md`.
- **Pourquoi** : le contrat actuel ne donne aucun moyen au stagiaire de connaître son id ; sans raccourci, le passage manuel (6.1) reste impossible alors que le reste est prêt. Un seul fichier de code et aucune donnée fictive dans l'application.
- **À retirer** : `devInscriptionId`, la section du README dev et la ligne de `.env.example` quand Charlotte aura répondu (et adapter `inscriptionIdOf` si son contrat diffère).
- **Alternatives écartées** : serveur MSW dans le navigateur (données fictives dans l'entrée de développement, D11 les veut supprimées) ; attendre sans rien essayer.

## G15 — Q13 traitée par le back : `inscriptionId` sur la formation, suppression de ses dépôts par le stagiaire
- Date : 2026-11-09
- **Constat (back `dev`, commit `e1f7c35`, `tech.md` §6 et `FormationResponse`)** : `GET /formations` et `GET /formations/{id}` renvoient `inscriptionId` (nombre ou `null`) : renseigné seulement pour le stagiaire inscrit, `null` pour ADMIN et SUPER_ADMIN. `DELETE /documents/{id}` : le stagiaire peut supprimer ses propres dépôts, `403` pour ceux d'un autre ; ADMIN et SUPER_ADMIN inchangés. Un stagiaire dépose avec `inscriptionId` seul (avec `formationId` : `403`).
- **Décision** : (1) le front lisait déjà `formation.inscriptionId` : `inscriptionIdOf` reste le seul point de lecture, sans changement de contrat ; (2) raccourci G14 retiré (`devInscriptionId`, `VITE_DEV_INSCRIPTION_IDS`, section du README dev, ligne de `.env.example`) ; (3) `canDeleteDocument` : le stagiaire supprime les documents dont `uploadedBy.id` est le sien, sur une formation non archivée (règle d'interface G3, le back ne l'impose pas) ; (4) `StagiaireDocSection` : « Supprimer » avec `ConfirmDialog`, « Document supprimé » annoncé, erreur du back (`403`, `404`) affichée, liste rechargée (`['documents']`) ; état par sous-section.
- **Pourquoi** : suit le contrat du back ; mêmes composants et même confirmation que 027 (G5).
- **Reste à faire** : passage manuel (tâche 6.1) sur le back reconstruit depuis `dev`.

## G16 — Le dépôt du stagiaire est sur la page de la formation ; le profil en donne le résumé
- Date : 2026-11-09
- **Constat** : au premier essai sur le vrai back, le stagiaire cherchait la zone de dépôt dans « Formations », pas dans son profil. Un document appartient à une formation : le déposer là où l'on voit la formation est plus naturel (demande de Manon).
- **Décision** : (1) détail d'une formation (`/formations/:id`), stagiaire seulement : section « Mes documents » (`MyDocumentsSection`) sous « Documents » : ses dépôts sur cette formation, téléchargement, zone de dépôt si la formation est active, « Supprimer » sur ses propres dépôts (G10, G15, règles inchangées) ; « Documents » (support de la formation, 027) reste en lecture seule pour lui ; (2) profil (`/profile`) : « Mes documents » (`DocumentsSummary`) est un résumé en lecture seule : tous ses dépôts, le plus récent d'abord, chacun avec « Déposé dans <formation> » (lien vers `/formations/:id`) ; sans document : « Aucun document déposé pour le moment » et l'indication de déposer depuis la page de chaque formation ; ni zone de dépôt, ni téléchargement, ni suppression dans le résumé ; (3) le résumé lit une liste `GET /documents?inscriptionId=` par formation où le stagiaire est inscrit (`useMyDocuments`, même clé de cache que la section de la formation : un dépôt ou une suppression met le résumé à jour) ; une liste en échec n'efface pas les autres ; (4) `DocumentList` gagne `locationOf` (ligne « Déposé dans ») et `onDownload` devient facultatif ; `StagiaireDocSection` est remplacé par `MyDocumentsSection` et `DocumentsSummary`.
- **Pourquoi** : le geste (déposer) et son contexte (la formation) sont au même endroit ; le profil garde une vue d'ensemble utile sans doubler les actions.
- **Alternatives écartées** : garder le dépôt dans le profil ; le mettre aux deux endroits (deux zones de dépôt à maintenir et à tester) ; télécharger depuis le résumé (le lien mène à la formation, où se trouvent toutes les actions).

## G17 — Le formateur et la chargée de formation voient ce que les stagiaires ont envoyé
- Date : 2026-11-09
- **Constat** : jusqu'ici seul le stagiaire voyait ses dépôts. Le back autorise la lecture : `GET /documents?inscriptionId=` et le téléchargement pour la chargée de formation (toute inscription) et pour le formateur (inscriptions de ses formations, `404` sinon) ; `GET /formations/{id}/inscriptions` donne l'id d'inscription de chaque stagiaire (managers seulement).
- **Décision** : (1) **Page de la formation** (chargée de formation et formateur de la formation) : dans « Stagiaires inscrits », chaque inscrit a une ligne d'état : coche verte + « Documents envoyés » s'il a déposé au moins un document, sinon « Aucun document envoyé », puis un lien par fichier (bouton lien « Télécharger <nom> », blob par axios comme G1) ; (2) **profil d'un stagiaire** (`/admin/stagiaires/:id`, mêmes deux rôles) : section « Documents » : une sous-section par formation où il est inscrit (lien vers `/formations/:id`) avec la même ligne d'état et les mêmes liens ; (3) un document compte « envoyé par le stagiaire » seulement si `uploadedBy.id` est le sien : les documents ciblés par la chargée de formation (US-010) ne comptent pas et ne sont pas listés ici ; (4) la coche est verte mais l'état est dit en texte (la couleur seule ne porte pas l'information) ; (5) le back n'a pas d'appel « inscriptions d'un compte » : `useStagiaireInscriptions` lit la liste d'inscrits de chaque formation que l'appelant peut consulter et retient celles du stagiaire ; un `403` / `404` (formation hors périmètre du formateur) est ignoré, toute autre erreur est affichée avec « Réessayer » sans masquer les autres formations ; (6) une requête de documents par inscrit sur la page de la formation (même clé de cache que « Mes documents » du stagiaire : un dépôt met l'état à jour).
- **Checklist nommée : reportée.** Le back n'a pas de « document requis » par formation et un `Document` n'a ni type ni libellé : on ne peut pas cocher « pièce d'identité », « diplôme »… Une seule coche par stagiaire pour l'instant, avec la définition du back pour les « documents manquants » (`tech.md` §7 : aucun document ciblé). La liste (et même l'existence) des documents obligatoires est une question pour l'**ADAC**, pas pour Charlotte pour l'instant : `docs/questions-pour-adac.md` §A. Selon la réponse, on demandera ensuite à Charlotte des documents requis par formation liés aux dépôts ; la colonne par document viendra à ce moment.
- **Pourquoi** : répond au besoin de suivi (qui a envoyé quoi) avec le contrat actuel, sans rien inventer côté front ; le coût en requêtes (une liste par inscrit, une liste d'inscrits par formation) est acceptable pour quelques dizaines de stagiaires (Q16 de `points-pour-charlotte.md` demande le raccourci côté back).
- **Alternatives écartées** : déduire une checklist des noms de fichiers ; stocker les documents requis dans le navigateur (non partagé entre utilisateurs, D31) ; attendre le back avant tout affichage.
