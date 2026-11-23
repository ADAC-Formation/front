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
- **Checklist nommée : reportée.** Le back n'a pas de « document requis » par formation et un `Document` n'a ni type ni libellé : on ne peut pas cocher « pièce d'identité », « diplôme »… Une seule coche par stagiaire pour l'instant, avec la définition du back pour les « documents manquants » (`tech.md` §7 : aucun document ciblé). La liste (et même l'existence) des documents obligatoires est une question pour l'**ADAC**, pas pour Charlotte pour l'instant : `docs/adac/questions-pour-adac.md` §A. Selon la réponse, on demandera ensuite à Charlotte des documents requis par formation liés aux dépôts ; la colonne par document viendra à ce moment.
- **Pourquoi** : répond au besoin de suivi (qui a envoyé quoi) avec le contrat actuel, sans rien inventer côté front ; le coût en requêtes (une liste par inscrit, une liste d'inscrits par formation) est acceptable pour quelques dizaines de stagiaires (Q16 de `points-pour-charlotte.md` demande le raccourci côté back).
- **Alternatives écartées** : déduire une checklist des noms de fichiers ; stocker les documents requis dans le navigateur (non partagé entre utilisateurs, D31) ; attendre le back avant tout affichage.

## G18 — Le formateur a aussi « Mes documents » dans son profil (NOTES-08)
- Date : 2026-11-20
- **Constat** : le formateur (`ADMIN`) dépose des documents seulement sur ses formations (`formationId`, jamais `inscriptionId`, `tech.md` § 6) et `GET /formations` ne lui renvoie que ses formations. `GET /documents?formationId=` renvoie aussi les dépôts des autres (chargée de formation). Précision de Manon : ce sont les documents du formateur lui-même.
- **Décision** : (1) `/profile` affiche « Mes documents » (`DocumentsSummary`) pour le stagiaire **et** le formateur ; la chargée de formation ne l'a toujours pas ; (2) `DocumentsSummary` reçoit `user` de la page ; `useMyDocuments(formations, user)` choisit la source selon le rôle : stagiaire = une liste `?inscriptionId=` par inscription (G16, inchangé), formateur = une liste `?formationId=` par formation, filtrée sur `uploadedBy.id` = lui ; le hook renvoie `formationOf(document)` à la place de `formationByInscriptionId` ; (3) même clé de cache que la section « Documents » de la formation : un dépôt ou une suppression y met le résumé à jour ; (4) textes du formateur : « Aucune formation ne vous est attribuée pour le moment » et « … dans la section « Documents » » ; le reste (lecture seule, « Déposé dans », erreurs par liste) est celui de G16.
- **Pourquoi** : aucun changement du back ; même rendu que pour le stagiaire.
- **Alternatives écartées** : un endpoint « mes dépôts » côté back (inutile pour quelques formations par formateur).


## G19 — Checklist des documents : le catalogue des types est tenu par la chargée de formation, dans une page de réglages
- Date : 2026-11-20
- **Contexte** : G17 avait reporté la checklist nommée faute de liste de l'ADAC. Le back peut maintenant être modifié par Manon (D66) et une liste fictive sert de base (`docs/adac/documents-obligatoires-factices.md`). Série de décisions G19+ issue du grill du même jour.
- **Décision** : il existe un **catalogue de types de document** (ex. « Pièce d'identité », « Certificat médical ») que la **chargée de formation** crée, modifie et désactive elle-même dans une page de réglages du portail, rangée dans « Gestion » (voir G32). La liste fictive sert de données de départ (seed), pas de liste figée.
- **Pourquoi** : la vraie liste de l'ADAC n'est pas connue et changera ; la laisser modifiable sans passer par un développeur évite de refaire une migration à chaque réponse de l'ADAC.
- **Alternatives écartées** : catalogue en seed seul, sans écran (plus petit, mais chaque changement passe par le back) ; liste propre à chaque formation, saisie à la création (même type ressaisi à chaque formation, pas de vue d'ensemble).
- **Conséquence** : un CRUD de types (back + front) est à prévoir ; son périmètre exact (champs d'un type) est tranché dans les décisions suivantes.


## G20 — Un type s'applique à toutes les formations ou à un ensemble de catégories
- Date : 2026-11-20
- **Décision** : un type de document est soit « toutes les formations », soit lié à **une ou plusieurs catégories**. La liste des documents requis d'une formation = les types « toutes » + les types liés à sa catégorie. Pas d'exception par formation.
- **Pourquoi** : la liste fictive distingue des pièces communes et des pièces propres à une catégorie (Secourisme, Numérique, Intra) ; un type utile à deux catégories ne doit pas être dupliqué ; la liste d'une formation reste prévisible.
- **Alternatives écartées** : une seule catégorie par type (obligerait à dupliquer) ; exceptions par formation (deuxième écran et règle de priorité à expliquer ; à ajouter plus tard si l'ADAC le demande, à noter dans `future-implementation-ideas.md`).


## G21 — Obligatoire ou facultatif, et « non applicable » par stagiaire
- Date : 2026-11-20
- **Décision** : un type est **obligatoire** ou **facultatif**. Le cas « selon la situation » (liste fictive : justificatif de prise en charge, attestation de handicap) n'est pas un troisième état du type : la chargée de formation peut marquer un type obligatoire comme **« non applicable »** pour **un stagiaire dans une formation**, et il ne compte alors plus comme manquant. Seul un type obligatoire peut manquer.
- **Pourquoi** : le besoin réel est « ce stagiaire n'a pas à fournir cette pièce » ; un état sur le type ne distingue pas les stagiaires. Une exemption par stagiaire garde « manquant » exact et le filtre de messagerie juste.
- **Alternatives écartées** : trois états sur le type (« selon la situation » n'est jamais relancé, donc jamais fourni) ; obligatoire/facultatif seulement (un stagiaire sans financeur resterait incomplet).
- **Conséquence** : une donnée de plus à stocker (exemption : stagiaire + formation + type, avec qui l'a posée) et un geste dans l'interface de la chargée ; son périmètre de droits est à trancher.


## G22 — Le stagiaire dépose dans une ligne de checklist ; la zone libre reste pour les autres documents
- Date : 2026-11-20
- **Décision** : sur la page de la formation (G16), le stagiaire voit la liste des documents requis de sa formation (G20), une ligne par type : nom, obligatoire ou facultatif, état (manquant / reçu) et un bouton **« Déposer »** propre à la ligne. Le fichier déposé est rattaché au type de la ligne. La zone de dépôt libre actuelle reste, pour les « autres documents » **sans type**.
- **Pourquoi** : le stagiaire voit d'un coup ce qui manque et dépose au bon endroit ; aucun choix de type à faire (donc pas d'erreur de type).
- **Alternatives écartées** : un menu « Type de document » dans la zone de dépôt unique (oubli ou mauvais choix, on ne voit pas ce qui manque) ; la chargée rattache le type après coup (étape manuelle par fichier, « manquant » faux en attendant).
- **Conséquence** : `POST /documents` reçoit un `documentTypeId` optionnel (back à modifier) ; un document garde un type nul s'il est déposé hors checklist.


## G23 — Plusieurs fichiers par type ; « reçu » = au moins un fichier
- Date : 2026-11-20
- **Décision** : un stagiaire peut déposer plusieurs fichiers pour un même type (recto et verso d'une pièce d'identité) et supprimer les siens (règles G15 inchangées). Un type est **« reçu »** dès qu'il a au moins un fichier du stagiaire pour cette inscription ; supprimer le dernier le remet à « manquant ». Pas d'état « validé » ni « à refaire » dans cette version.
- **Pourquoi** : même fonctionnement que les dépôts actuels, aucun flux de remplacement à construire.
- **Alternatives écartées** : un fichier par type avec remplacement (action de plus, recto-verso à fusionner par le stagiaire) ; validation par la chargée (question A6 à l'ADAC : à ajouter si elle est voulue, noter dans `future-implementation-ideas.md`).


## G24 — Types sensibles : le formateur voit l'état, jamais les fichiers
- Date : 2026-11-20
- **Décision** : un type peut être marqué **sensible**. Pour un type sensible, le formateur de la formation voit seulement l'état (« reçu » ou « manquant ») dans la checklist, mais **ne peut ni lister ni télécharger les fichiers** ; le back l'impose (liste filtrée, téléchargement refusé). La chargée de formation voit et télécharge tout. Le stagiaire voit les siens. Dans la liste fictive : pièce d'identité, justificatif de prise en charge, attestation de handicap.
- **Pourquoi** : le formateur a besoin de savoir qui est prêt, pas de lire des pièces personnelles (ADAC question A8) ; l'interdit doit venir du back, pas de l'interface.
- **Alternatives écartées** : cacher aussi l'état au formateur (il ne saurait plus qui est incomplet) ; aucune restriction (pièces d'identité et de santé exposées sans besoin).
- **Conséquence** : le back filtre `GET /documents` et `GET /documents/{id}/download` selon le rôle et le type ; à vérifier : l'état « reçu » doit venir d'une réponse qui n'expose pas les noms de fichiers sensibles.


## G25 — Délai relatif sur le type, « en retard » affiché ; pas de relance automatique
- Date : 2026-11-20
- **Décision** : un type peut porter un **délai optionnel** : N jours **avant le début** ou N jours **après la fin** de la formation. La checklist affiche la date calculée et marque **« en retard »** un type obligatoire encore manquant après cette date (et non marqué « non applicable », G21). Aucun type sans délai n'est jamais en retard. **Pas de relance automatique** : la chargée relance à la main (message groupé, G26).
- **Pourquoi** : la liste fictive distingue les pièces d'inscription (J-7) de l'évaluation (J+15) ; un délai relatif suit les dates de chaque formation sans les ressaisir. Une relance automatique demanderait un ordonnanceur côté back et une politique de relance que l'ADAC n'a pas définie (question A7).
- **Alternatives écartées** : aucun délai (rien ne signale un retard) ; délais plus relances automatiques (ordonnanceur et politique non définis ; à noter dans `future-implementation-ideas.md`).


## G26 — Le filtre « Documents manquants » du message groupé disparaît ; le suivi passera par un tableau de bord (reporté)
- Date : 2026-11-20
- **Décision** : le concept de filtre **« Documents manquants »** du message groupé est **supprimé** (front : le filtre `MISSING_DOCS` n'est plus proposé ; back : le type de filtre est retiré, voir `changements-back.md` à l'implémentation). Le suivi des pièces manquantes par la chargée de formation se fera par un **tableau de bord** dont la forme reste à définir (Manon y réfléchira ; idée parquée dans `docs/future-implementation-ideas.md`). D'ici là, la page de la formation et le profil d'un stagiaire donnent l'état de la checklist (G17, G22) ; la chargée relance par message groupé « Formation » ou « Sélection libre ».
- **Pourquoi** : « aucun document déposé » ne correspond plus au besoin une fois les types connus ; relancer « tous ceux à qui il manque quelque chose » est trop large ; un outil de suivi dédié répond mieux que d'enrichir un filtre de message.
- **Alternatives écartées** : redéfinir `MISSING_DOCS` en « un type obligatoire manque », avec formation et type en option (écarté par Manon) ; conserver l'ancienne définition à côté d'un nouveau filtre (deux filtres proches, l'ancien presque inutile).
- **Conséquence** : modifie H12, H17 et H20 de `decisions-messagerie.md` (liste des filtres : Formation et Sélection libre pour la chargée ; Formation pour le formateur) ; un changement de contrat à journaliser pour le back.


## G27 — Le catalogue s'applique en direct aux formations non archivées
- Date : 2026-11-20
- **Décision** : la checklist d'une formation est **calculée à chaque lecture** depuis le catalogue courant (G20) : ajouter un type, le rendre obligatoire ou changer son délai atteint immédiatement toutes les formations **non archivées**. Rien n'est copié par formation. Une formation **archivée** n'est plus suivie : pas de « manquant » ni de « en retard », ses documents restent consultables comme avant (G3). Désactiver un type le retire des checklists ; ses fichiers déjà déposés restent, rattachés à leur type, visibles dans « Autres documents ».
- **Pourquoi** : aucune copie ni migration à maintenir ; la chargée voit tout de suite l'effet d'un réglage.
- **Alternatives écartées** : instantané à la création de la formation (un nouveau type n'atteint jamais les formations en cours, table de copie) ; changement limité aux formations pas encore commencées (règle de gel à la date de début à définir).
- **Conséquence** : un type activé, désactivé ou modifié change le résultat d'une checklist sans toucher aux documents ; à décrire dans l'écran de réglages (« s'applique aux formations en cours »).


## G28 — « Non applicable » : le stagiaire, le formateur et la chargée peuvent le poser et le lever
- Date : 2026-11-20
- **Décision** (choix de Manon, contre la recommandation « chargée seule ») : pour un type obligatoire (G21), **le stagiaire concerné, le formateur de la formation et la chargée de formation** peuvent le marquer « non applicable » pour une inscription, et le **lever**. Le stagiaire ne le fait que pour **ses** inscriptions, le formateur que pour **ses** formations. Le back enregistre **qui** l'a posé et **quand**, et la checklist l'affiche (« Non applicable, par Léa Petit, le 20/11 ») : la chargée voit toujours qui a écarté une pièce et peut la remettre.
- **Pourquoi** : le besoin est « je n'ai pas à fournir cette pièce » ; celui qui le sait le dit lui-même, sans attendre la chargée.
- **Alternatives écartées** : la chargée seule (un point de contrôle unique, mais chaque exemption passe par elle) ; la chargée et le formateur (le stagiaire dépend encore d'un tiers).
- **Risque accepté** : un stagiaire peut écarter une pièce qu'il devrait fournir. Garde-fous retenus : l'auteur et la date sont visibles, la chargée peut lever l'exemption, et une exemption écarte seulement le « manquant » (le filtre de messagerie n'existe plus, G26). À revoir si l'ADAC veut que la chargée valide.
- **Conséquence** : droits à tester côté back (403 sur l'inscription d'un autre, ou sur une formation qui n'est pas la sienne).


## G29 — Vue de la chargée et du formateur : résumé par stagiaire, détail dépliable
- Date : 2026-11-20
- **Décision** : dans « Stagiaires inscrits » (page de la formation) et dans la section « Documents » du profil d'un stagiaire (G17), chaque stagiaire a un **résumé** (« 3 sur 5 pièces obligatoires », et un repère « en retard » le cas échéant). Le déplier liste chaque type avec son état (**Reçu**, **Manquant**, **En retard**, **Non applicable** avec son auteur, G28) et les liens de téléchargement ; pour un type sensible, le formateur voit l'état sans les fichiers (G24). Cela **remplace** la coche unique « Documents envoyés » de G17. Les documents sans type restent listés sous « Autres documents ».
- **Pourquoi** : une ligne par stagiaire reste lisible sur mobile et le détail est à un clic ; le tableau croisé et le tableau de bord relèvent de l'idée reportée (G26).
- **Alternatives écartées** : tableau stagiaires × types (large sur mobile, proche du tableau de bord à penser à part) ; liste toujours ouverte (longue dès qu'il y a beaucoup de stagiaires et de types).
- **Modifié par G34** (page de la formation seulement) : le résumé est sur la ligne de « Liste stagiaires », le détail dans l'onglet « Documents stagiaires » au lieu d'un dépliant. Le profil d'un stagiaire suit toujours G29.


## G30 — Champs d'un type de document
- Date : 2026-11-20
- **Décision** : un type a : **nom** (unique sans tenir compte de la casse, 255 au plus), **texte d'aide** optionnel (une ligne affichée sous la ligne de la checklist), **obligatoire ou facultatif** (G21), **sensible** (G24), **portée** : toutes les formations ou une ou plusieurs catégories (G20), **délai** optionnel (N jours avant le début ou après la fin, G25), **formats acceptés** optionnels (sous-ensemble de PDF, JPG, JPEG, PNG, DOCX, XLSX ; sans réglage, la règle générale s'applique, 10 Mo au plus), **actif** (désactiver au lieu de supprimer, G27). La checklist est triée par **ordre alphabétique** : pas d'ordre d'affichage réglable.
- **Pourquoi** : le texte d'aide limite les mauvais dépôts ; les formats par type évitent d'envoyer une photo là où un PDF est attendu ; l'ordre réglable ajouterait un geste de plus pour peu de gain.
- **Alternatives écartées** : ordre d'affichage choisi par la chargée (repoussé, à ajouter si l'ADAC le demande) ; suppression d'un type (on désactive, les fichiers déjà déposés gardent leur type).


## G31 — Découpage en quatre tranches
- Date : 2026-11-20
- **Décision** : quatre tranches, chacune un changement du back (PR) plus le travail du front, développées en TDD et utilisables seules : **(1)** catalogue : CRUD des types (G19, G20, G21, G25, G27, G30), page de réglages de la chargée, liste fictive en données de départ ; **(2)** checklist du stagiaire : dépôt typé (G22, G23), « non applicable » (G28), délais et « en retard » (G25) sur la page de la formation ; **(3)** vue de la chargée et du formateur : résumé et détail dépliable (G29), règles des types sensibles (G24) ; **(4)** suppression du filtre « Documents manquants » du message groupé (G26, H21).
- **Pourquoi** : chaque tranche se relit seule ; la première donne déjà une page de réglages visible ; la suppression du filtre est petite et indépendante.
- **Alternatives écartées** : trois tranches avec la suppression du filtre dans la première ; un seul changement (revue énorme, rien d'utilisable avant la fin).
- **Ordre** : 1 avant 2 et 3 (elles lisent le catalogue) ; 2 avant 3 ; 4 est indépendante.
- **Questions techniques laissées au plan de chaque tranche** (non tranchées ici) : forme des endpoints de checklist (un appel par formation évitera une requête par stagiaire, comme Q16) ; modèle de l'exemption ; type nul des documents existants.


## G32 — « Gestion » : Formations, Documents et Profils ; le catalogue est dans « Documents »
- Date : 2026-11-20 · précision de Manon après G19.
- **Décision** : la page « Gestion » (`/admin/gestion`) passe de trois tuiles (Formations, Formateurs, Stagiaires) à **trois tuiles : Formations, Documents, Profils**. **Documents** mène à la gestion du catalogue des types (G19, G30) : créer un type, consulter et modifier les types existants. **Profils** est une seule tuile qui regroupe deux sections, **Formateurs** et **Stagiaires**, chacune avec « Créer un nouveau profil » et « Consulter profils existants » (liens actuels regroupés ; les routes `/admin/formateurs` et `/admin/stagiaires` ne changent pas). **Formations** garde « Gérer les catégories ».
- **Visibilité** : la tuile **Documents** n'est visible que pour la **chargée de formation** ; le formateur ne la voit pas (aucun lien vers « Accès refusé », même règle que la gestion des catégories, D46/D54). Il voit la checklist sur ses formations (G29).
- **Pourquoi** : trois entrées lisibles au lieu de quatre, et le catalogue des pièces trouve sa place à côté des formations et des profils.
- **Alternatives écartées** : une page intermédiaire entre « Profils » et les deux listes (un clic de plus, nouvelle route) ; deux tuiles Formateurs et Stagiaires conservées avec « Documents » ajouté (quatre tuiles, pas de regroupement) ; catalogue en lecture seule pour le formateur.
- **Conséquence** : `ManagementMenu` et `ManagementTiles` changent (une tuile à deux sections) ; le plan du site (`SiteMapPage`) et les tests de la page Gestion suivent ; nouvelle route pour le catalogue (chemin fixé au plan de la tranche 1, G31).

## G33 — Pas d'« obligatoire / facultatif » ; « Mes documents » du stagiaire en créneaux rouges et verts
- Date : 2026-11-21 · décision de Manon, en cours de la tranche « catalogue ».
- **Décision** : un type de document n'est ni obligatoire ni facultatif (le champ `isRequired` est retiré du back et du front). Tout type actif qui s'applique à une formation (toutes les formations, ou sa catégorie) est une pièce **à envoyer** ; le stagiaire peut en plus envoyer d'autres fichiers. « Sensible » reste (il règle qui lit les fichiers).
- **« Mes documents » du stagiaire** (détail d'une formation) : une section « Documents à envoyer » avec un créneau par type (nom, aide, délai, formats, bouton « Envoyer un fichier »), **rouge** (fine bordure, fond clair) tant que rien n'est déposé, **vert** ensuite, l'état étant aussi écrit (« À envoyer » / « Envoyé ») ; puis « Autres documents » : zone de dépôt libre et fichiers hors créneau, en neutre. La section de la formation s'appelle maintenant « Documents de la formation ».
- **Lecture des types** : nouveau `GET /api/formations/{id}/document-types` (types actifs applicables, mêmes droits que la lecture de la formation). Le reste de `/api/document-types` reste réservé à la chargée.
- **Rattacher un fichier à son créneau (provisoire, front seul)** : le back ne relie pas un dépôt à un type. Un dépôt depuis un créneau part sous « <nom du type> - <nom d'origine> » (raccourci à 200 caractères, extension gardée) ; un document appartient au créneau dont le nom suivi de « - » commence le sien (`documentSlots.js`). **Limites** : le préfixe est visible dans le nom du fichier ; renommer ou supprimer le fichier change l'état du créneau ; renommer un type du catalogue détache ses anciens dépôts. À remplacer par un `documentTypeId` sur le dépôt (demande à Charlotte, `points-pour-charlotte.md`).
- **Alternatives écartées** : stocker le lien type-fichier dans le navigateur (D31 : aucune donnée personnelle en local, et perdu d'un appareil à l'autre) ; ajouter dès maintenant `documentTypeId` au dépôt (changement de schéma plus large, laissé à la tranche suivante).

## G34 — Détail d'une formation en onglets ; suivi des documents par inscrit
- Date : 2026-11-23 · proposition de Manon (croquis), change `formation-detail-tabs`.
- **Décision** : le détail d'une formation garde en tête les informations (et « Modifier » / « Archiver » pour la chargée), puis une barre d'onglets. **Chargée de formation et formateur** : « Liste stagiaires » (ouvert par défaut ; nom, e-mail, « X/Y documents reçus », « Inscrire des stagiaires » et « Désinscrire »), « Documents stagiaires » (un bloc par inscrit : chaque type « Reçu » ou « Manquant » avec ses fichiers, puis « Autres documents »), « Documents ADAC » (l'ancienne section « Documents de la formation »). **Stagiaire** : « Documents ADAC » (ouvert par défaut) et « Mes documents ».
- **Compte** : Y = types à envoyer pour la formation (G33), X = types avec au moins un fichier déposé par le stagiaire lui-même (G17), rattachés par le nom de fichier (G33). Sans type, ou si les types ne se chargent pas : « N documents envoyés ».
- **Pourquoi** : la page empilait tout dans une seule carte et devenait longue dès quelques inscrits ; la chargée voit d'un coup d'œil qui a envoyé quoi.
- **Modifie G29** pour la page de la formation seulement : le détail est dans un onglet plutôt que dans un dépliant. Le profil d'un stagiaire ne change pas (G17/G29).
- **Alternatives écartées** : dépliant par inscrit dans la liste (G29) ; tableau stagiaires × types (déjà écarté en G29) ; détail groupé par type ; nombre brut de fichiers sans total ; pour le stagiaire, garder les sections empilées.
- **Hors périmètre** : « En retard » et « Non applicable » (tranche 2, G25/G28), types sensibles (G24), onglet dans l'URL.
