# Design

## Context

Observé dans le code (`dev`) :
- `LoginPage` ne fait qu'un `console.log` ; `LoginForm` a un champ « Identifiant » et gère son état à la main ; `FormField`/`FormInput` ne gèrent ni erreur ni `aria-*` (mais `FormInput` transmet `...props`).
- `use-theme.js` porte un faux `isAuthenticated`/`toggleAuth`, persisté dans `localStorage` avec les préférences d'affichage ; `LoginButton` l'utilise.
- `router.jsx` : `/` enveloppe tout dans `Layout`, routes `/admin`, `/formateur`, `/stagiaire` (`HomePage role=…`), `/admin/gestion`, `/admin/formations`, `/formations/…`, `/profile`, `/notifications`, `/messages`. Aucune garde. `Layout` rend `RoleSwitcher` et importe `./layout.module.css` alors que le fichier suivi par git est `Layout.module.css` (casse : le build échouera sous Linux/CI).
- `src/context/UserProvider.jsx`, `utils/routeManager.jsx` et `utils/roles.js` sont des restes d'un autre projet (rôles ADMIN/FORMATEUR, ONG, espagnol).
- Déjà disponible : `apiClient` + `ApiError` + `setUnauthorizedHandler` (exempte `/auth/login` et `/auth/me`), `createQueryClient`, `QueryClientProvider` monté, `renderWithProviders`, MSW, jest-axe, React Hook Form installé.
- Contrat : `tech.md` § Auth. `UserResponse` = `{id, email, prenom, nom, role, isActive, emailNotificationsEnabled}`. Les corps d'`activate`/`reset-password` exigent l'e-mail (Q2 de `points-pour-charlotte.md`, non tranchée).

Contraintes : D1 (aligné sur le back), D8, D9, D10, D11, D12, D13, D15, D31, D32, D33, D40.

## Goals / Non-Goals

**Goals:**
- Un utilisateur réel avec un rôle réel, lu uniquement via `/auth/me`, et des routes réellement gardées.
- Connexion, déconnexion, activation, mot de passe oublié/réinitialisation fonctionnels contre le vrai back (et testés avec MSW).
- Supprimer tout ce qui simule l'authentification.

**Non-Goals:**
- Renommer les routes de gestion en `/gestion/*` et refaire le tableau de bord à 4 tuiles (TICKET-043, change suivant).
- Brancher les données de formations/catégories sur l'API.
- Changement de mot de passe depuis le profil, création de comptes.

## Decisions

1. **Code dans `src/features/auth/`** (D32) : `api.js` (appels axios), `hooks.js` (TanStack Query), `UserProvider.jsx` + `user-context.js`, `guards/` (`RequireAuth`, `RequireRole`, `PublicOnly`), `pages/` (activation, mot de passe oublié, réinitialisation, accès refusé). `LoginPage`, `LoginForm`, `HomePage` restent à leur place et sont recâblés (D11). Les composants partagés (`FormField`, `FormInput`, nouvel atome `Alert`) restent dans `src/components/`.
2. **Session = requête TanStack Query `['auth','me']`**, pas un état parallèle. `queryFn` appelle `GET /auth/me` et renvoie `null` sur `401` (cas normal d'un visiteur, pas une erreur) ; les autres erreurs restent des erreurs. `useCurrentUser()` renvoie `{user, isLoading}`. Alternative écartée : `useState` dans un contexte (double source de vérité, plus difficile à vider).
3. **`UserProvider` monté sous le routeur**, via un composant racine `Root` (route parente) qui rend `UserProvider` puis `Layout`, car le handler 401 doit pouvoir appeler `navigate`. Il enregistre `setUnauthorizedHandler` dans un effet (nettoyé au démontage, sûr sous StrictMode) : `queryClient.clear()` puis `navigate('/login', { state: { notice: 'session-expired' }, replace: true })`. Alternative écartée : import du routeur dans le client (dépendance circulaire, déjà écartée dans D51).
4. **Connexion/déconnexion = mutations** : `useLogin` écrit la réponse (un `UserResponse`) dans `['auth','me']` puis navigue vers `/`. `useLogout` appelle `POST /auth/logout` ; dans `onSettled` (succès ou 401) il fait `queryClient.clear()`, met `['auth','me']` à `null` et navigue vers `/login`. Vider tout le cache évite qu'un utilisateur voie les données du précédent.
5. **Gardes en routes de mise en page** (`<Outlet/>`) : `RequireAuth` (chargement → loader accessible `role="status"` ; pas d'utilisateur → `<Navigate to="/login" replace/>`), `RequireRole roles={[…]}` (rôle absent → page « Accès refusé », pas de redirection), `PublicOnly` (utilisateur connecté → `/`). La garde du rôle est une aide d'interface ; le back reste l'autorité (D9).
6. **Table des routes** : publiques `/login`, `/activation`, `/mot-de-passe-oublie`, `/reinitialisation` ; protégées `/` (tableau de bord), `/formations`, `/formations/:formationId`, `/profile`, `/notifications`, `/messages` ; `SUPER_ADMIN`+`ADMIN` : `/admin/gestion`, `/admin/formations` ; `SUPER_ADMIN` seul : `/formations/creer`, `/formations/categories`. Les chemins existants sont conservés pour ne pas casser les liens ; leur renommage relève de TICKET-043. Les routes `/admin`, `/formateur`, `/stagiaire` sont supprimées. Hypothèse : la liste « formations » reste accessible à tous les rôles connectés (D46 non tranchée côté back).
7. **Formulaires** : React Hook Form (`register`, `handleSubmit`, `setError`) + validateurs purs dans `src/utils/validation.js` (`validateEmail`, `validatePassword`, `validatePasswordConfirmation`, `validateCode`), testés isolément. `FormField` reçoit `error` et `...inputProps`, lie `aria-invalid`/`aria-describedby`, rend le message d'erreur ; `FormInput` accepte `ref` comme prop (React 19). Un atome `Alert` (`role="alert"` pour les erreurs, `role="status"` pour les confirmations) sert aux messages du back, rendus en texte. Alternative écartée : validation par `required` HTML seul (messages non maîtrisés, non annoncés).
8. **Bandeaux de succès sans stockage** : `navigate('/login', { state: { notice: 'activated' | 'password-reset' | 'session-expired' } })`, lus via `useLocation().state`. Un rechargement les efface, ce qui est acceptable. Alternative écartée : `sessionStorage` (inutile et contraire à l'esprit de D31).
9. **E-mail d'activation/réinitialisation** : champ visible, prérempli par `?email=` s'il existe (Q2 non tranchée). Le code est validé comme 6 chiffres ; message du back affiché tel quel pour les `400` (indifférenciable, ne pas deviner la cause).
10. **Nettoyage** : supprimer `RoleSwitcher`, `src/context/UserProvider.jsx`, `ProtectedRoute` (s'il existe), `utils/routeManager.jsx`, `isAuthenticated`/`toggleAuth` de `use-theme.js` (et de sa persistance ; la valeur déjà stockée est simplement ignorée puis réécrite) ; réécrire `utils/roles.js` avec les rôles du back et les libellés D33 ; corriger l'import `./layout.module.css` → `./Layout.module.css`.
11. **Libellé du bouton de connexion** : on garde la coque « SE CONNECTER » (D11) plutôt que « Commencer la session » de US-001 AC-01 ; écart consigné dans les décisions et `points-pour-charlotte.md`. Le champ « Identifiant » devient « Adresse e-mail » (`tech.md` l'emporte sur le plan, D40).
12. **Tests** : MSW avec un utilisateur par rôle ; un helper `mockSession(role)` dans `src/test/` ; un check jest-axe par page (connexion, activation, mot de passe oublié, réinitialisation). Le 401 « session expirée » est testé de bout en bout (routeur en mémoire + handler).

## Risks / Trade-offs

- [Le cookie `jwt` est `SameSite=Strict` et `Secure` ; en dev local sur `http://localhost` la connexion peut échouer selon le navigateur] → `localhost` est traité comme contexte sûr par Chrome/Firefox et les ports ne changent pas le « site » ; à vérifier dans le passage manuel. Si ça échoue, le noter dans `points-pour-charlotte.md` plutôt que contourner côté front.
- [Passage manuel contre le vrai back impossible tant que Docker Desktop n'est pas installé (CLAUDE.md)] → les tests MSW couvrent le contrat ; la tâche de passage manuel reste ouverte et bloque le « Done » (D30) plutôt que d'être cochée sans preuve.
- [Fuite de données entre deux utilisateurs via le cache] → `queryClient.clear()` à la déconnexion et sur 401.
- [Boucle de redirection `/login` ↔ `/` si `/auth/me` échoue autrement que par 401 (réseau, 500)] → `RequireAuth` affiche une erreur avec « Réessayer » au lieu de rediriger quand `/auth/me` est en erreur non-401.
- [Suppression de `/admin`, `/formateur`, `/stagiaire` casse d'éventuels liens internes] → recherche exhaustive des usages (`navigate`, `to=`, `homePath`) en tâche 1 ; aucun lien externe n'existe (rien n'est déployé).
- [`/activation` : le lien envoyé par Charlotte peut ne pas contenir l'e-mail] → champ e-mail toujours présent et modifiable ; Q2 reste ouverte.

## Migration Plan

Changements du front uniquement, sans migration de données. Branche `feature/auth` créée depuis `dev`, un commit par groupe de tâches. Retour arrière : revert des commits. Le stockage laissé par l'ancien code (`app-theme-preferences.isAuthenticated`, `dev-role`) est ignoré ; `dev-role` est supprimé au premier chargement.

## Open Questions

- Q2 (Charlotte) : le lien d'e-mail contient-il `?email=` ? Sans effet sur les specs (le champ reste modifiable).
- Redirection après connexion vers la page demandée avant la redirection (`from`) plutôt que toujours `/` : amélioration possible, hors spec actuelle.
