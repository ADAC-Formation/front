# Décisions — Inscriptions des stagiaires aux formations (NOTES-10)

Préfixe **J**. Back existant : `POST /api/formations/{id}/inscriptions` (`{ stagiaireId }`, SUPER_ADMIN ; `201`, `400` formation archivée, `404` formation inconnue ou stagiaire inconnu / inactif, `409` déjà inscrit) et `DELETE /api/formations/{id}/inscriptions/{stagiaireId}` (SUPER_ADMIN, idempotent, `204`). Lecture : `GET /api/formations/{id}/inscriptions`, `GET /api/users/{id}/inscriptions`. Reporté jusqu'ici par F3 et `spec.md` (« inscrire / désinscrire »).

## J1 — Inscrire dès la création du profil du stagiaire, sans attendre l'ADAC
- Date : 2026-11-23
- **Décision** (Manon) : quelle que soit l'issue de la discussion avec Fatma (`notes-adac.md` §4.1), la chargée de formation doit pouvoir affecter un stagiaire à une ou plusieurs formations **au moment où elle crée son profil**. Le formulaire de création (`AccountFormPage`) n'a aujourd'hui aucun champ formation : c'est à ajouter.
- **Pourquoi** : c'est le parcours réel de la chargée de formation (point 10 des notes ADAC) ; le besoin de base ne dépend pas du concept que Fatma pourrait revoir (rôle « chargée de formation côté client », etc.).
- **Alternatives écartées** : attendre la discussion avec Fatma avant de construire quoi que ce soit.

## J2 — Le back accepte d'inscrire un stagiaire jamais activé
- Date : 2026-11-23
- **Décision** (Manon) : un compte créé reste `isActive = false` jusqu'à son activation (`UserServiceImpl`), et `POST /formations/{id}/inscriptions` répond `404` à tout stagiaire inactif (`InscriptionServiceImpl.findStagiaireOrThrow`). Changement du back (D66, branche de travail, journal `changements-back.md`, `tech.md` à jour) : accepter un stagiaire **jamais activé** (en attente d'activation, `activationService.hasEverActivated` faux) ; un stagiaire **suspendu** reste refusé (`404`). Le front crée le compte (`POST /users`), puis envoie un `POST …/inscriptions` par formation choisie.
- **Pourquoi** : sans ce changement, J1 est impossible (le compte qui vient d'être créé n'est jamais actif) ; le changement est petit et ne touche ni `POST /users` ni le schéma. Manon a donné son accord au changement de règle (D66, cas 1).
- **Alternatives écartées** : `formationIds` dans `POST /users` (création et inscriptions dans la même transaction, mais contrat de `POST /users` plus large) ; supprimer la vérification `isActive` (un stagiaire suspendu pourrait être inscrit) ; attendre la réponse de Charlotte.

## J3 — Choix des formations à la création : liste de cases avec recherche, facultative
- Date : 2026-11-23
- **Décision** (Manon) : dans le formulaire de création d'un **stagiaire** seulement, une section « Formations (facultatif) » liste les formations **actives** (`GET /formations?status=ACTIVE` ; une formation archivée est refusée par le back, `400`), chacune avec son intitulé et ses dates, en cases à cocher natives, avec un champ « Rechercher une formation… » et le nombre sélectionné (« 2 formations sélectionnées »). Aucune case cochée est permis : le compte est créé sans inscription. Même principe que `StagiairePicker` du message groupé (H12–H17).
- **Pourquoi** : cases natives = accessibles sans widget à construire ; la recherche suffit pour une liste de formations actives de taille modeste.
- **Alternatives écartées** : combobox à choix multiples avec pastilles (plus compacte, widget accessible plus lourd) ; au moins une formation obligatoire (empêcherait de créer un stagiaire avant que sa formation existe).

## J4 — Échec d'une inscription après la création : le compte reste, les échecs sont listés
- Date : 2026-11-23
- **Décision** (Manon) : le compte créé n'est jamais annulé. Après la création, la chargée de formation arrive sur la page du stagiaire avec un récapitulatif en texte : « Compte créé. » puis « Inscrit à : A, B. » et, s'il y en a, « Inscription impossible : C (raison) » (message du back : formation archivée, introuvable… ; erreur réseau : message générique). Elle réessaie depuis la page du stagiaire, qui doit donc aussi permettre d'inscrire (voir la décision suivante). Un `409` (déjà inscrit) compte comme une réussite.
- **Pourquoi** : pas de suppression de compte dans le back ; un échec d'inscription est rare et se corrige en un clic depuis le profil.
- **Alternatives écartées** : rester sur le formulaire avec « Réessayer » (formulaire à moitié validé, champs d'identité figés) ; tout ou rien avec suppression du compte (pas de `DELETE /users`, autre changement du back).

## J5 — Périmètre : création du stagiaire, page du stagiaire, page de la formation
- Date : 2026-11-23
- **Décision** (Manon) : ce change couvre trois endroits, tous réservés à la chargée de formation (SUPER_ADMIN, seul rôle autorisé par le back) : (1) le formulaire de création du stagiaire (J1–J4) ; (2) la page du stagiaire (`AccountDetailPage`, `kind === 'stagiaires'`) : ses formations, « Inscrire à une formation » (même liste de cases que J3) et « Désinscrire » par formation ; (3) la page de la formation, section « Stagiaires inscrits » : « Inscrire des stagiaires » et « Désinscrire » par ligne. Le formateur et le stagiaire ne voient aucune de ces actions.
- **Pourquoi** : (2) sert aussi à réessayer après un échec (J4) ; (3) est l'autre moitié du point 10 des notes ADAC, le geste naturel quand on part de la formation.
- **Alternatives écartées (reportées, `future-implementation-ideas.md`)** : choisir les stagiaires dans le formulaire de création d'une formation ; cases de formations dans le formulaire de modification d'un stagiaire (cocher / décocher = inscrire / désinscrire à l'enregistrement).

## J6 — Désinscrire supprime aussi les documents de l'inscription
- Date : 2026-11-23
- **Constat** : `documents.inscription_id` référence `inscriptions(id)` sans cascade (`V1__init_schema.sql`) et `deleteInscription` supprime la ligne sans vérification : désinscrire un stagiaire qui a des documents sur la formation (les siens ou ceux qu'on lui a envoyés) finirait en violation de clé étrangère, que `GlobalExceptionHandler` rend en `500 « Erreur interne »` (déduit du code, pas encore reproduit).
- **Décision** (Manon) : changement du back (D66) : `DELETE /formations/{id}/inscriptions/{stagiaireId}` supprime d'abord les documents de l'inscription, puis l'inscription, dans la même transaction ; les fichiers du stockage sont supprimés ensuite, comme `DocumentServiceImpl.deleteDocument` (échec du stockage journalisé, sans faire échouer la désinscription). Côté front, la confirmation de « Désinscrire » dit clairement la perte : nombre de documents concernés quand il est connu, et « Cette action est définitive ».
- **Pourquoi** : la chargée de formation doit pouvoir corriger une inscription faite par erreur, y compris après un premier dépôt.
- **Alternatives écartées** : refuser la désinscription (`409`) tant qu'il y a des documents (aucune perte de preuve Qualiopi, mais l'erreur ne se corrige qu'en supprimant chaque document à la main) ; garde du front seulement (le back répondrait toujours `500`) ; attendre Charlotte.
- **Risque à signaler à Charlotte** : les documents sont des preuves Qualiopi ; la suppression est définitive (`changements-back.md`).

## J7 — Formation archivée : ni inscription, ni désinscription
- Date : 2026-11-23
- **Décision** (Manon) : changement du back (D66) : `DELETE /formations/{id}/inscriptions/{stagiaireId}` répond `409 « Formation archivée »` sur une formation archivée (comme la suppression d'un document, `DocumentServiceImpl.assertNotArchived`) ; l'inscription y est déjà refusée (`400`). Le front n'affiche ni « Inscrire » ni « Désinscrire » sur une formation archivée (page de la formation et ligne de la formation sur la page du stagiaire) ; les formations archivées ne sont jamais proposées dans la liste de cases (J3).
- **Pourquoi** : une formation archivée est une archive Qualiopi ; avec J6, la désinscrire effacerait ses documents.
- **Alternatives écartées** : autoriser la désinscription d'une formation archivée, avec la même confirmation.

## J8 — Inscrire depuis la formation : `StagiairePicker` réutilisé
- Date : 2026-11-23
- **Décision** (Manon) : sur la page d'une formation active, « Inscrire des stagiaires » ouvre le `StagiairePicker` du message groupé (cases natives + recherche). Il propose les stagiaires actifs et jamais activés (J2) ; les suspendus et les déjà inscrits n'apparaissent pas. Un `POST …/inscriptions` par stagiaire coché, puis la liste « Stagiaires inscrits » est rechargée ; les échecs sont listés par nom, en texte, comme J4 (`409` = réussite).
- **Pourquoi** : composant déjà accessible et testé ; inscrire un groupe entier en une fois.
- **Alternatives écartées** : un stagiaire à la fois (lent pour un groupe) ; afficher les suspendus grisés avec « Compte suspendu ».

## J9 — Aucune notification à l'inscription ni à la désinscription
- Date : 2026-11-23
- **Décision** (Manon) : ce change n'ajoute ni notification ni e-mail. La formation apparaît simplement dans « Mes formations » du stagiaire ; un stagiaire jamais activé reçoit de toute façon son e-mail d'activation.
- **Pourquoi** : garder le change petit ; un nouveau type de notification touche le back et peut-être le schéma (D66, cas 3).
- **Alternatives écartées (reportées, `future-implementation-ideas.md`)** : notification dans la cloche (`FORMATION_ENROLLED`) ; notification et e-mail.
