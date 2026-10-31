## ADDED Requirements

### Requirement: Utilisateur courant lu depuis le back
Au chargement de l'application, le front SHALL déterminer l'utilisateur courant uniquement par `GET /auth/me`. Tant que la réponse n'est pas arrivée, l'application SHALL afficher un état de chargement et SHALL NOT afficher de contenu protégé ni rediriger. Le rôle (`SUPER_ADMIN`, `ADMIN` ou `STAGIAIRE`) SHALL provenir exclusivement de cette réponse. Aucun rôle, jeton ni donnée personnelle SHALL être lu ou écrit dans le stockage du navigateur.

#### Scenario: Visiteur non connecté
- **WHEN** `GET /auth/me` répond `401` au chargement
- **THEN** l'utilisateur est considéré comme non connecté et aucun message « session expirée » n'est affiché

#### Scenario: Utilisateur déjà connecté
- **WHEN** `GET /auth/me` répond `200` avec un utilisateur de rôle `STAGIAIRE`
- **THEN** l'application connaît l'identité et le rôle de l'utilisateur sans nouvelle connexion

#### Scenario: Aucune donnée personnelle dans le navigateur
- **WHEN** un utilisateur est connecté
- **THEN** `localStorage` et `sessionStorage` ne contiennent ni son rôle, ni son e-mail, ni un indicateur de connexion

### Requirement: Connexion par e-mail et mot de passe
La page `/login` SHALL proposer les champs « Adresse e-mail » et « Mot de passe », un bouton de soumission, un lien « Mot de passe oublié / Activer mon compte » et le texte « Pas de compte ? Contactez votre administrateur » (sans lien d'inscription). Elle SHALL envoyer `POST /auth/login` avec `{email, password}`. En cas de succès, l'utilisateur SHALL être redirigé vers le tableau de bord `/`.

#### Scenario: Connexion réussie
- **WHEN** l'utilisateur soumet des identifiants valides et le back répond `200` avec un utilisateur
- **THEN** il est redirigé vers `/` et l'application connaît son rôle

#### Scenario: Champs obligatoires
- **WHEN** l'utilisateur soumet le formulaire avec un champ vide
- **THEN** aucun appel n'est émis et un message en français indique le champ à renseigner

#### Scenario: Retour du bandeau de succès
- **WHEN** l'utilisateur arrive sur `/login` après une activation ou une réinitialisation réussie
- **THEN** un bandeau « Compte activé avec succès » ou « Mot de passe mis à jour » est annoncé et affiché

### Requirement: Erreurs de connexion affichées en ligne
Les erreurs de `POST /auth/login` SHALL être affichées dans le formulaire, annoncées aux technologies d'assistance, sans redirection et sans vider le champ e-mail.

#### Scenario: Identifiants invalides
- **WHEN** le back répond `401` « Identifiants invalides »
- **THEN** le formulaire affiche « Identifiants invalides » et l'utilisateur reste sur `/login`

#### Scenario: Compte non activé
- **WHEN** le back répond `403` « Compte non activé. Veuillez consulter vos emails. »
- **THEN** le formulaire affiche ce message et propose un lien vers l'activation

#### Scenario: Trop de tentatives
- **WHEN** le back répond `429` « Trop de tentatives. Réessayez dans 15 minutes. »
- **THEN** le formulaire affiche ce message

#### Scenario: Serveur injoignable
- **WHEN** aucune réponse n'est reçue
- **THEN** le formulaire affiche un message d'erreur de connexion au serveur

### Requirement: Déconnexion
Un utilisateur connecté SHALL pouvoir se déconnecter via `POST /auth/logout`. Après la déconnexion, la session SHALL être vidée, toute donnée mise en cache de l'utilisateur SHALL être supprimée et l'utilisateur SHALL être redirigé vers `/login`. Le bouton d'en-tête SHALL afficher « Se connecter » pour un visiteur et « Se déconnecter » pour un utilisateur connecté.

#### Scenario: Déconnexion réussie
- **WHEN** l'utilisateur connecté clique sur « Se déconnecter » et le back répond `204`
- **THEN** il est redirigé vers `/login` et ne peut plus accéder aux pages protégées

#### Scenario: Déconnexion sur session déjà expirée
- **WHEN** `POST /auth/logout` répond `401`
- **THEN** l'utilisateur est quand même considéré comme déconnecté et redirigé vers `/login`

### Requirement: Session expirée
Lorsqu'une requête autre que `POST /auth/login` et `GET /auth/me` reçoit `401`, l'application SHALL vider la session, supprimer les données mises en cache et rediriger vers `/login` avec le message « Votre session a expiré. Veuillez vous reconnecter. », sans rechargement complet de la page.

#### Scenario: Session expirée pendant la navigation
- **WHEN** une requête de données reçoit `401` alors que l'utilisateur est connecté
- **THEN** il arrive sur `/login` avec le message de session expirée et l'application ne s'est pas rechargée

### Requirement: Routes protégées par authentification
Toute route de l'application SHALL exiger une session, sauf `/login`, `/activation`, `/mot-de-passe-oublie` et `/reinitialisation`. Un visiteur non connecté qui demande une route protégée SHALL être redirigé vers `/login`. Un utilisateur connecté qui demande `/login` SHALL être redirigé vers `/`.

#### Scenario: Visiteur sur une page protégée
- **WHEN** un visiteur non connecté ouvre `/formations`
- **THEN** il est redirigé vers `/login`

#### Scenario: Utilisateur connecté sur la page de connexion
- **WHEN** un utilisateur connecté ouvre `/login`
- **THEN** il est redirigé vers `/`

### Requirement: Routes réservées par rôle
Les routes de gestion SHALL être réservées selon le rôle : `/admin/*` aux rôles `SUPER_ADMIN` et `ADMIN`, la création de formation et la gestion des catégories au seul rôle `SUPER_ADMIN`. Un utilisateur connecté sans le rôle requis SHALL voir une page « Accès refusé » (sans redirection vers `/login`). Le back reste l'autorité : un `403` ou `404` d'une requête SHALL être affiché de la même manière.

#### Scenario: Stagiaire sur la gestion
- **WHEN** un utilisateur `STAGIAIRE` ouvre `/admin/gestion`
- **THEN** il voit la page « Accès refusé » et aucune donnée de gestion n'est demandée

#### Scenario: Formateur sur la gestion des catégories
- **WHEN** un utilisateur `ADMIN` ouvre `/formations/categories`
- **THEN** il voit la page « Accès refusé »

#### Scenario: Chargée de formation
- **WHEN** un utilisateur `SUPER_ADMIN` ouvre `/formations/creer`
- **THEN** la page s'affiche

### Requirement: Tableau de bord selon le rôle réel
La route `/` SHALL afficher le tableau de bord. La première tuile SHALL être « Formations » pour `STAGIAIRE` et « Gestion » pour `SUPER_ADMIN` et `ADMIN`. Les libellés de rôle affichés SHALL être « Chargée de formation » (`SUPER_ADMIN`), « Formateur » (`ADMIN`) et « Stagiaire » (`STAGIAIRE`). Aucun sélecteur de rôle simulé SHALL exister dans l'application.

#### Scenario: Tuile du stagiaire
- **WHEN** un `STAGIAIRE` connecté ouvre `/`
- **THEN** la tuile « Formations » est affichée et la tuile « Gestion » ne l'est pas

#### Scenario: Tuile de la chargée de formation
- **WHEN** un `SUPER_ADMIN` connecté ouvre `/`
- **THEN** la tuile « Gestion » est affichée
