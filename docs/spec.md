# Spécification front — points ouverts

Le « quoi/pourquoi » détaillé (17 user stories, flux) vit dans `../../back-readonly/docs/STORIES.md` et `src/assets/docs/USERFLOW.md`. Ce fichier ne garde que les écarts et questions à trancher (à résoudre avec `/grill-me-with-docs`).

## Questions ouvertes
- ~~modèle d'auth~~ → résolu par D1 (`decisions-front-foundations.md`) : aligné sur le back (cookie + `/auth/me`).
- ~~rôles~~ → résolu par D1 : SUPER_ADMIN/ADMIN/STAGIAIRE.
- ~~design~~ → D2 : thème actuel conservé ; point à rediscuter avec le dev back (`meeting-points-back.md`).
- ~~branche de base~~ → D3 : `categorie`, local ; `API` = `dev`, rien à récupérer.
- ~~tests~~ → D4 : Vitest + Testing Library + MSW.
- ~~Dockerfile/CI front~~ → D5 (révisée 2026-10-31) : Dockerfile + CI dans ce repo, selon la spec de Charlotte (`INFRASTRUCTURE.md` §4) ; compose/nginx/déploiement = Charlotte.
- ~~variable d'env~~ → D1 : `VITE_API_URL` + `.env.example`.
- ~~priorités~~ → D6 ; ~~PO/SM~~ → D24 ; dates → D25 (pas de date cible). Plus de dates (D29).
- ~~outil de suivi~~ → D7/D29 : GitHub Project créé (https://github.com/orgs/ADAC-Formation/projects/1).

## Décisions techniques de mise en œuvre (voir `decisions-front-foundations.md`)
TanStack Query (D8) · routes sans préfixe de rôle + `RequireAuth`/`RequireRole` (D9) · `RoleSwitcher` supprimé (D10) · coques UI conservées, recâblées (D11) · erreurs centralisées (D12) · React Hook Form + validateurs maison (D13) · import Excel provisoire (D14) · WCAG 2.1 AA, `lang="fr"` (D15) · back local via Docker + comptes de dev (D16–D20) · sondage notifications 45 s (D21) · messagerie à deux volets (D22) · documents en blob (D23).

## Questions encore ouvertes
- ~~CI front~~ → D26 : `npm run check` local.
- ~~petits écrans~~ → D28 : desktop d'abord, tablette OK.
- ~~flux Git~~ → D27.
- ~~jalons/cronograma~~ → D29 : projet secondaire, supprimés.

## Reste ouvert (dépend d'ADAC / Charlotte uniquement)
- [NEEDS CLARIFICATION: texte de la page Confidentialité + durée de conservation] → `meeting-points-back.md` #11.
- [NEEDS CLARIFICATION: premier SUPER_ADMIN en production] → #7. Fichier Excel réel → #6. Appareils des stagiaires → #10.

## Écarts connus code ↔ contrat
Voir `CLAUDE.md` § « Known state / traps » et `plan-de-proyecto.md` § 10.

## Critères d'acceptation des tickets d'authentification (change `auth-real-backend`)
À valider par Manon (D49). Contrat : `tech.md` § 1. Le détail testable est dans `openspec/changes/auth-real-backend/specs/`.

### TICKET-016 — Connexion
- Champs « Adresse e-mail » et « Mot de passe » (le plan disait « identifiant » : `tech.md` l'emporte, D40). Bouton de la coque conservé : « SE CONNECTER » (US-001 AC-01 parle de « Commencer la session », écart consigné).
- 200 → cookie `jwt` posé par le back, redirection vers `/`, rôle lu via `GET /auth/me`.
- 401 « Identifiants invalides » ; 403 « Compte non activé… » (+ lien vers l'activation) ; 429 « Trop de tentatives… » ; réseau → message en ligne annoncé, e-mail conservé.
- Lien « Mot de passe oublié / Activer mon compte » et texte « Pas de compte ? Contactez votre administrateur ».
- Déconnexion via `POST /auth/logout` (204 ou 401 → session vidée) ; 401 sur une requête de données → `/login` avec « session expirée ».

### TICKET-017 — Activation
- E-mail (prérempli par `?email=` s'il existe, Q2), code à 6 chiffres, mot de passe + confirmation (8–72 car., 1 majuscule, 1 chiffre).
- 200 → `/login` avec le bandeau « Compte activé avec succès » ; 400 « Code invalide ou expiré » (indifférenciable) + « Renvoyer un code » (`resend-activation`, 429 après 3 envois / 15 min).

### TICKET-018 — Mot de passe oublié / réinitialisation
- `forgot-password` : toujours le même message (« Si cet email existe… »), jamais d'indication sur l'existence du compte.
- `reset-password` : même flux code + nouveau mot de passe qu'à l'activation ; 200 → `/login` avec le bandeau « Mot de passe mis à jour ».

## Critères d'acceptation des tickets de comptes (change `users-account-management`)

Source : TICKET-021 (front), TICKET-050 (édition), `tech.md` § 2. Détail testable : `openspec/changes/users-account-management/specs/account-management/spec.md`.

### TICKET-021 — Gestion des comptes formateurs et stagiaires
- [ ] Listes `/admin/formateurs` et `/admin/stagiaires` : nom, prénom, e-mail, statut Actif / Inactif (suspendu ou jamais activé, D55) ; états chargement, vide, erreur avec « Réessayer ».
- [ ] SUPER_ADMIN : filtre Tous / Actifs (`?active=true`) / Inactifs (filtré côté client) ; ADMIN : comptes actifs renvoyés par le back, sans filtre ni bouton de gestion.
- [ ] Création (SUPER_ADMIN) : nom, prénom, e-mail obligatoires, e-mail valide ; `409` « Cet email est déjà utilisé » en ligne ; succès → « Compte créé, e-mail d'activation envoyé ».
- [ ] Suspendre (avec confirmation) / Réactiver via `PATCH /users/{id}/deactivate|reactivate` (SUPER_ADMIN).
- [ ] Détail `/admin/.../:id` (SUPER_ADMIN et ADMIN) ; `404` → « Compte introuvable ».
- [ ] Routes de création réservées à SUPER_ADMIN ; autres rôles → « Accès refusé ».
- Reporté : colonne formations (`feature/formations`), « Envoyer un message » (`feature/messagerie`).

### TICKET-050 — Modification d'un compte (front)
- [ ] SUPER_ADMIN corrige nom, prénom, e-mail via `PUT /users/{id}` (champs modifiés seulement) ; avertissement de reconnexion si l'e-mail d'un compte actif change ; `409` en ligne.

## Critères d'acceptation des tickets de formations (change `formations-list-detail`)

Source : TICKET-024 (front), `tech.md` §4–5, décisions F1–F7 (`decisions-formations.md`), D46. À valider par Manon (D49). Détail testable : `openspec/changes/formations-list-detail/specs/formation-browsing/spec.md`.

### TICKET-024 — Liste et détail des formations
- [ ] Liste `/formations` (tous rôles connectés) : intitulé, dates, modalité, formateur, nombre d'inscrits, catégorie (pastille couleur + nom, lue dans la formation) ; états chargement, vide, erreur avec « Réessayer ».
- [ ] Pastilles Actives (défaut) / Archivées (`?status=`), badge « Archivée » ; recherche (intitulé, formateur, catégorie) et tri côté client, sans nouvel appel.
- [ ] SUPER_ADMIN : toutes les formations, liens « Créer une nouvelle formation » et « Gérer les catégories », bouton « Archiver » sur le détail (confirmation, `PATCH …/archive`, retour à la liste, `409` → recharger).
- [ ] ADMIN (D46, F2) : « Mes formations » (défaut) / « Toutes » filtrés côté client, aucune action de gestion ; `404` sur le détail → « Formation introuvable ou non accessible ».
- [ ] STAGIAIRE (F6) : titre « Mes formations », aucune action ; détail avec nombre d'inscrits seulement ; `403` → « Accès refusé ».
- [ ] Détail : titre, description, dates, modalité, catégorie, formateur ; liste des inscrits (SUPER_ADMIN et ADMIN seulement, F3) ; section « Documents » réservée, sans appel (027) ; contenu rendu en texte.
- Reporté : création et import Excel (025), « Modifier », filtre et gestion des catégories (048/049), documents (027), inscrire / désinscrire, code de référence (Q9).

## Critères d'acceptation du formulaire de formation (change `formation-form`)

Source : TICKET-025 (front, hors import Excel reporté, F11), `tech.md` §2–4, décisions F9–F13. À valider par Manon (D49). Détail testable : `openspec/changes/formation-form/specs/formation-management/spec.md`.

### TICKET-025 — Créer et modifier une formation
- [ ] Routes `/formations/creer` et `/formations/:id/modifier` réservées à SUPER_ADMIN (autres rôles → « Accès refusé », visiteur → `/login`).
- [ ] Champs : intitulé, description (facultative), « Du » / « Au » (F10), modalité, catégorie, formateur facultatif ; pas de référence, public, lieu ni dépôt de documents.
- [ ] « Au » se préremplit avec « Du » ; « Au » ne précède pas « Du » ; une formation d'un jour = même date.
- [ ] Catégories = `GET /categories?active=true` (F12) ; une catégorie désactivée déjà portée reste affichée en modification.
- [ ] Formateur = `GET /users/formateurs?active=true` ; sans choix : `formateurId: null` (F13).
- [ ] Création : `POST /formations`, redirection vers le détail de la formation créée avec « Formation créée » (F9).
- [ ] Modification : préremplie, `PUT` avec les seuls champs modifiés, retour au détail avec « Formation mise à jour » ; formation archivée non modifiable.
- [ ] Erreurs : `400` en bandeau sans perdre la saisie, `409` → recharger ; erreurs liées aux champs (accessibilité).
- [ ] Détail : bouton « Modifier » pour SUPER_ADMIN sur formation active.
- Reporté : import Excel (F11), documents (027), création de catégories (049), code de référence (Q9).

## Critères d'acceptation de l'import Excel (change `formation-import`)

Source : TICKET-025 (partie import, F11), US-005, `tech.md` §4, décisions F16–F21, D14. Colonnes provisoires (R10) : le fichier réel d'ADAC n'est pas arrivé. À valider par Manon (D49). Détail testable : `openspec/changes/formation-import/specs/formation-import/spec.md`.

### TICKET-025 — Importer des formations depuis un fichier Excel
- [ ] Lien « Importer un fichier Excel » dans « Créer une nouvelle formation » (F22) et page `/formations/importer` réservés à SUPER_ADMIN (autres rôles → « Accès refusé », visiteur → `/login`).
- [ ] Le « ? » à côté de « Fichier à importer » ouvre l'aide : les sept colonnes provisoires (A `intitule` … G `formateur`), leurs formats et les modalités (F23) ; « Télécharger le modèle », sous le champ fichier, donne un `.xlsx` généré dans le navigateur (feuille « Import » : en-tête + une ligne d'exemple ; feuille « Listes ») avec des listes déroulantes pour la modalité, la catégorie et le formateur, lues dans l'API au clic (F24).
- [ ] Seuls les fichiers `.xlsx` de 2 Mo au plus sont acceptés ; sinon message précis, aucun appel, bouton « Importer » inactif.
- [ ] Envoi `POST /formations/import` (`multipart/form-data`, champ `file`), bouton désactivé pendant l'envoi.
- [ ] `201` → retour à `/formations` avec « N formation(s) importée(s) » et liste rechargée.
- [ ] `400` → tableau Ligne / Colonne / Problème tiré du `message` du back (F20), entrées non reconnues affichées telles quelles ; rien n'est créé ; autre fichier = nouvel essai.
- [ ] Autres erreurs (`403`, réseau, `5xx`) en bandeau annoncé, fichier conservé ; jest-axe sans violation avec et sans erreurs.
- Reporté : colonnes définitives (R10), aperçu du fichier, comptage des lignes côté navigateur.

## Critères d'acceptation de la gestion des catégories (change `category-management`)

Source : TICKET-049 (front), US-017, `tech.md` §3, décisions C1–C5 (`decisions-categories.md`). À valider par Manon (D49). Détail testable : `openspec/changes/category-management/specs/category-management/spec.md`.

### TICKET-049 — Gérer les catégories de formation
- [ ] `/formations/categories` réservée à SUPER_ADMIN (autres rôles → « Accès refusé », visiteur → `/login`).
- [ ] Liste de toutes les catégories (actives et désactivées) dans l'ordre du back : pastille de couleur, nom, état « Active » / « Désactivée » en texte, total annoncé ; états chargement, vide, erreur avec « Réessayer » ; aucune action « Supprimer ».
- [ ] « Créer une catégorie » et « Modifier » ouvrent une boîte de dialogue (nom + couleur) ; `POST /categories` et `PUT /categories/{id}` (nom et couleur toujours envoyés) ; rien de modifié → aucun appel.
- [ ] Nom obligatoire (255 au plus) ; couleur `#RRGGBB` par sélecteur et champ hexadécimal synchronisés ; erreurs liées aux champs, aucun appel si invalide.
- [ ] `409` (nom déjà utilisé) et autres erreurs affichés dans la boîte, qui reste ouverte avec la saisie.
- [ ] « Désactiver » : confirmation expliquant l'effet puis `PATCH …/deactivate` ; « Réactiver » immédiat (`PATCH …/activate`) ; message de succès annoncé après chaque action.
- [ ] Après chaque écriture : listes des catégories, choix de catégorie du formulaire de formation et formations rechargés (renommer / recolorer change l'affichage des formations).
- [ ] Boîtes accessibles : focus piégé (champs compris), Échap, retour du focus ; jest-axe sans violation.
- Reporté : création à la volée dans le formulaire de formation et filtre par catégorie (change `category-picker`, 048).

## Critères d'acceptation des documents de formation (change `formation-documents`)

Source : TICKET-027 (front), US-009, US-011, `tech.md` §6, décisions G1–G6 (`decisions-documents.md`). À valider par Manon (D49). Détail testable : `openspec/changes/formation-documents/specs/formation-documents/spec.md`.

### TICKET-027 — Documents d'une formation
- [ ] Le détail de chaque formation a une section « Documents » (`GET /documents?formationId=`) : type en texte, nom (rendu en texte), taille, date, expéditeur sans e-mail ; états chargement, erreur avec « Réessayer », vide « Aucun document disponible pour le moment ».
- [ ] « Télécharger » : `GET /documents/{id}/download` par le client axios, fichier enregistré sous son nom d'origine ; `403` / `404` affichés ; jamais `fileUrl`.
- [ ] Zone de dépôt : chargée de formation sur toute formation active ; formateur sur ses formations actives ; jamais le stagiaire ni sur une formation archivée.
- [ ] Dépôt par glisser-déposer et « Choisir des fichiers » (clavier), plusieurs fichiers : contrôle pdf / jpg / jpeg / png / docx et 10 Mo avant envoi, un `POST /documents` par fichier, l'un après l'autre ; refus (client ou back) listés par fichier et annoncés sans bloquer les autres ; liste rechargée à la fin.
- [ ] « Supprimer » : chargée de formation sur tous les documents d'une formation active, formateur sur ses propres envois seulement, jamais le stagiaire ; confirmation puis `DELETE /documents/{id}`, liste rechargée, « Document supprimé » annoncé ; `404` / `403` affichés.
- [ ] Formation archivée : documents listés et téléchargeables, ni dépôt ni suppression (règle d'interface, à confirmer avec Charlotte).
- [ ] Accessibilité : clavier, annonces d'état, boutons nommés avec le fichier ; jest-axe sans violation.
- Reporté : documents ciblés par stagiaire et dépôt par le stagiaire (TICKET-028).

## Critères d'acceptation de la messagerie individuelle (change `messagerie-individuelle`)

Source : TICKET-031 (front), US-013, `tech.md` §7, décisions H1–H9 (`decisions-messagerie.md`), D21, D22. À valider par Manon (D49). Détail testable : `openspec/changes/messagerie-individuelle/specs/individual-messaging/spec.md`.

### TICKET-031 — Interface de messagerie
- [ ] `/messages` : conversations (`GET /messages`) dans l'ordre reçu, extrait et date du dernier message, non lus en évidence avec un texte accessible (« 2 messages non lus »), état vide avec « Nouvelle conversation », chargement annoncé, erreur avec « Réessayer » ; rechargée toutes les 45 s (pause onglet masqué) et au focus.
- [ ] `/messages/:userId` : fil (`GET /messages/{userId}`) du plus ancien au plus récent, contenu rendu en texte (jamais en HTML, sauts de ligne conservés), rechargé toutes les 45 s ; deux volets sur bureau, deux écrans sur mobile avec « Retour ».
- [ ] Envoi `POST /messages/send` (`recipientIds` d'un seul id) : contenu vide, espaces ou plus de 5000 caractères refusé avant tout appel ; Entrée = saut de ligne ; bouton désactivé pendant l'envoi ; texte conservé sur `403` / `404`.
- [ ] « Nouvelle conversation » : chargée de formation → tout le monde ; formateur → chargée de formation + stagiaires de ses formations ; stagiaire → chargée de formation + formateurs de ses formations (H1). La chargée de formation n'apparaît pour le formateur et le stagiaire que si elle est déjà connue (Q14).
- [ ] Ouvrir un fil marque ses messages entrants non lus comme lus (un `PATCH /messages/{id}/read` par message, Q15) ; un échec n'empêche pas l'affichage.
- [ ] Tuile « Messages » : pastille du total de non lus avec libellé accessible ; rien à zéro ou en erreur.
- [ ] « Envoyer un message » sur le détail d'un formateur et d'un stagiaire, seulement si l'on peut leur écrire (US-013 AC-05).
- [ ] Fil d'une personne hors droit : lecture seule avec avis, ou « Conversation introuvable » + « Retour » (H8).
- [ ] Accessibilité : clavier, annonces d'état ; jest-axe sans violation (liste et fil).
- [ ] Gabarit des autres pages (H11) : « Retour » vers le tableau de bord, bouton « Nouvelle conversation » en haut à droite, pastilles « Toutes » / « Non lues » sous le titre, liste des conversations dans une carte arrondie ; pastille « non lus » de la tuile en police de texte.
- Reporté : envoi groupé (TICKET-032), pagination des fils.
