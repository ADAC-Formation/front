# Design

## Context

- Contrat (`tech.md` § 2, confirmé dans `UserController`/`CreateUserRequest`/`UpdateUserRequest` du back) : `GET /users/formateurs|stagiaires` (SUPER_ADMIN et ADMIN ; `?active=true`), `POST` des deux (SUPER_ADMIN, `409` e-mail), `GET /users/{id}` (SUPER_ADMIN, ADMIN), `PUT /users/{id}` (SUPER_ADMIN, champs partiels), `PATCH /users/{id}/deactivate|reactivate` (SUPER_ADMIN). `UserResponse` : `id, email, prenom, nom, role, isActive, emailNotificationsEnabled`.
- Le ticket 021 est antérieur à `tech.md` : il parle de `PATCH /users/{id}` avec `isActive` (déjà relevé, `points-pour-charlotte.md` ligne 5) ; `tech.md` l'emporte (D40).
- L'API ne permet pas de filtrer les suspendus : le filtre « Suspendus » se fait côté client sur la liste complète du SUPER_ADMIN.
- Le menu Gestion pointe déjà vers `/admin/formateurs`, `/admin/formateurs/nouveau`, `/admin/stagiaires`, `/admin/stagiaires/nouveau` (non routés). On garde ces chemins plutôt que de renommer vers `/gestion/*` (TICKET-043, hors périmètre).
- Existant réutilisable : `ApiError` (D12), `FormField`/`FormInput`, `Alert`, `validateRequired`/`validateEmail`, `RequireRole`, `renderWithProviders`, `mockSession`.

## Goals / Non-Goals

**Goals:**
- Écrans de comptes complets pour SUPER_ADMIN, lecture seule pour ADMIN, branchés sur le vrai back.
- Un module `features/accounts` autonome, sans dépendre des formations ni de la messagerie.

**Non-Goals:**
- Colonne formations, choix de formations à la création, « Envoyer un message », profil, import Excel.
- Pagination ou recherche : < 300 utilisateurs à 6–12 mois, la liste complète suffit.

## Decisions

1. **Un module `src/features/accounts/`** (`api.js`, `hooks.js`, `pages/`, `components/`), comme `features/auth` (D32). Les pages sont paramétrées par rôle cible (`ROLES.ADMIN` pour formateurs, `ROLES.STAGIAIRE` pour stagiaires) : une seule `AccountListPage`, une seule `AccountFormPage`, une seule `AccountDetailPage`, avec une table de configuration (libellés, endpoint, chemins). *Alternative écartée* : pages dupliquées par rôle (le ticket en prévoit deux listes) — la seule différence réelle est le titre et l'endpoint.
2. **Clés TanStack Query** : `['accounts', role, 'list']` et `['accounts', 'detail', id]`. Création/édition/suspension invalident les listes et mettent à jour le détail avec la réponse du back (`setQueryData`). Pas d'optimistic update : l'état affiché reste celui confirmé par le back.
3. **Filtre actifs/inactifs** : « Tous » = requête sans paramètre, « Actifs » = `?active=true` (donc le back filtre), « Inactifs » = « Tous » filtré côté client sur `isActive === false`. Le libellé est « Inactif », pas « Suspendu » : vérifié contre le vrai back, un compte tout juste créé a `isActive: false` (jamais activé) et `reactivate` répond alors `409` « Ce compte n'a jamais été activé » ; le DTO n'a aucun champ pour distinguer les deux cas (D55, demande à Charlotte Q8). Le filtre est un état local de page (pas d'URL ni de stockage, D31).
4. **Droits dans l'UI** : `useCurrentUser().role === SUPER_ADMIN` conditionne boutons Créer / Modifier / Suspendre et filtre. Les routes de création et de modification (`/nouveau`, `/:id/modifier`, ce dernier lié depuis le détail) sont sous `RequireRole roles={[SUPER_ADMIN]}`, les listes et détails sous `MANAGEMENT_ROLES` (déjà en place). Le back reste l'autorité : un `403` s'affiche comme erreur.
5. **Création et édition via un même formulaire** (React Hook Form + `validateRequired`/`validateEmail`, D13). `409` → erreur sur le champ e-mail via `setError`, valeurs conservées. Édition : n'envoie que les champs modifiés (le back traite `null` comme « inchangé »). Avertissement affiché si l'e-mail change et que `isActive` est vrai.
6. **Création de stagiaire avec `formationIds: []`** : le champ est optionnel côté back (`List<Long>` nullable) ; à vérifier au passage manuel. Le sélecteur de formations arrive avec `feature/formations`.
7. **Confirmation de suspension** : dialogue modal accessible (focus piégé, Échap, retour du focus) plutôt que `window.confirm`, pour tester et pour WCAG. Si aucun composant de dialogue n'existe, une molécule `ConfirmDialog` est créé dans `src/components/molecules/` (réutilisable par les catégories).
8. **Responsive (D42)** : tableau sur desktop, cartes empilées sur mobile (CSS Modules, tokens `index.css`).
9. **ADMIN et stagiaires** : `tech.md` indique « actifs uniquement, filtre par défaut : ses formations » pour ADMIN. Le front affiche ce que le back renvoie ; l'interaction avec D46 (le formateur voit toutes les formations) est ajoutée comme question de suivi dans `points-pour-charlotte.md`, sans bloquer.
10. **Menu Gestion** : `ManagementMenu` masque le lien « Créer… » pour ADMIN (la tuile « Formations » garde le sien comme aujourd'hui tant que `feature/formations` ne l'a pas traité).

## Risks / Trade-offs

- [`POST /users/stagiaires` avec `formationIds: []` refusé ou non géré] → test manuel contre le vrai back ; sinon omettre le champ ; noter le résultat dans `points-pour-charlotte.md`.
- [Changer l'e-mail d'un compte activé déconnecte l'utilisateur ciblé] → avertissement explicite avant enregistrement (spec) ; si la chargée de formation modifie son propre e-mail, sa session s'invalide et le handler 401 existant la renvoie vers `/login`.
- [Filtre « Suspendus » côté client sur la liste entière] → acceptable pour < 300 comptes ; à revoir si le volume grandit.
- [Détail ADMIN d'un compte hors de « ses formations » : le back peut répondre `404`] → l'écran « Compte introuvable » couvre ce cas.
- [Lien de création retiré du menu pour ADMIN modifie la coque existante] → test du menu par rôle.
