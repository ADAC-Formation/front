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
- [ ] Le « ? » à côté de « Fichier à importer » ouvre l'aide : les sept colonnes provisoires (A `intitule` … G `formateur`), leurs formats et les modalités (F23) ; « Télécharger le modèle », sous le champ fichier, donne un `.xlsx` généré dans le navigateur (en-tête + une ligne d'exemple).
- [ ] Seuls les fichiers `.xlsx` de 2 Mo au plus sont acceptés ; sinon message précis, aucun appel, bouton « Importer » inactif.
- [ ] Envoi `POST /formations/import` (`multipart/form-data`, champ `file`), bouton désactivé pendant l'envoi.
- [ ] `201` → retour à `/formations` avec « N formation(s) importée(s) » et liste rechargée.
- [ ] `400` → tableau Ligne / Colonne / Problème tiré du `message` du back (F20), entrées non reconnues affichées telles quelles ; rien n'est créé ; autre fichier = nouvel essai.
- [ ] Autres erreurs (`403`, réseau, `5xx`) en bandeau annoncé, fichier conservé ; jest-axe sans violation avec et sans erreurs.
- Reporté : colonnes définitives (R10), aperçu du fichier, comptage des lignes côté navigateur.
