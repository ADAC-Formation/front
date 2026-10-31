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
