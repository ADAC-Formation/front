# Spec Delta

## Purpose

Permet à la chargée de formation de créer, consulter, corriger, suspendre et réactiver les comptes des formateurs et des stagiaires, et au formateur de les consulter en lecture seule, en s'appuyant sur les endpoints `/users` du back (`tech.md` § 2).

## ADDED Requirements

### Requirement: Accès aux écrans de comptes selon le rôle
Les routes `/admin/formateurs`, `/admin/stagiaires` et leurs détails SHALL être réservées aux rôles `SUPER_ADMIN` et `ADMIN`. Les routes `/admin/formateurs/nouveau` et `/admin/stagiaires/nouveau` SHALL être réservées à `SUPER_ADMIN`. Un autre rôle SHALL voir la page « Accès refusé », un visiteur SHALL être redirigé vers `/login`. Le back reste l'autorité (403).

#### Scenario: Stagiaire sur la liste des formateurs
- **WHEN** un `STAGIAIRE` ouvre `/admin/formateurs`
- **THEN** la page « Accès refusé » s'affiche et aucun appel `/users` n'est émis

#### Scenario: Formateur sur la création
- **WHEN** un `ADMIN` ouvre `/admin/stagiaires/nouveau`
- **THEN** la page « Accès refusé » s'affiche

#### Scenario: Visiteur non connecté
- **WHEN** un visiteur ouvre `/admin/formateurs`
- **THEN** il est redirigé vers `/login`

### Requirement: Liste des formateurs et des stagiaires
La page `/admin/formateurs` SHALL lister les comptes de `GET /users/formateurs` et `/admin/stagiaires` ceux de `GET /users/stagiaires`, avec nom, prénom, e-mail et statut (« Actif » / « Suspendu »). Pendant le chargement un état de chargement SHALL s'afficher ; en cas d'erreur un message avec « Réessayer » ; sans résultat un état vide.

#### Scenario: Liste affichée
- **WHEN** le back répond `200` avec deux formateurs
- **THEN** la page affiche deux lignes avec nom, prénom, e-mail et statut

#### Scenario: Liste vide
- **WHEN** le back répond `200` avec une liste vide
- **THEN** un message « Aucun formateur » (ou « Aucun stagiaire ») s'affiche

#### Scenario: Erreur serveur
- **WHEN** le back répond `500`
- **THEN** un message d'erreur annoncé et un bouton « Réessayer » s'affichent

### Requirement: Filtre actifs / suspendus pour la chargée de formation
Pour `SUPER_ADMIN`, chaque liste SHALL proposer un filtre « Tous / Actifs / Suspendus ». « Actifs » SHALL envoyer `?active=true` ; « Suspendus » SHALL afficher uniquement les comptes dont `isActive` est `false`. Pour `ADMIN`, le filtre SHALL être absent et seuls les comptes actifs renvoyés par le back SHALL être affichés.

#### Scenario: Filtrer les actifs
- **WHEN** la chargée de formation choisit « Actifs »
- **THEN** la requête contient `active=true` et seuls des comptes actifs sont affichés

#### Scenario: Filtrer les suspendus
- **WHEN** la chargée de formation choisit « Suspendus »
- **THEN** seuls les comptes avec `isActive: false` sont affichés

#### Scenario: Formateur sans filtre
- **WHEN** un `ADMIN` ouvre une liste
- **THEN** aucun filtre de statut n'est proposé et aucun bouton de création, d'édition ou de suspension n'apparaît

### Requirement: Création d'un compte
Pour `SUPER_ADMIN`, le formulaire de création SHALL demander nom, prénom et adresse e-mail, tous obligatoires, l'e-mail devant être valide. Un formateur SHALL être créé par `POST /users/formateurs` et un stagiaire par `POST /users/stagiaires` avec `formationIds: []`. Aucun appel ne SHALL être émis tant que la validation côté client échoue.

#### Scenario: Création réussie
- **WHEN** la chargée de formation soumet un formulaire valide et le back répond `201`
- **THEN** elle revient à la liste, le nouveau compte y figure et le message « Compte créé, e-mail d'activation envoyé » est annoncé

#### Scenario: Champs invalides
- **WHEN** elle soumet avec un nom vide ou un e-mail invalide
- **THEN** aucun appel n'est émis et un message en français désigne chaque champ en erreur

#### Scenario: E-mail déjà utilisé
- **WHEN** le back répond `409`
- **THEN** le message « Cet email est déjà utilisé » est affiché en ligne, annoncé, et les valeurs saisies sont conservées

### Requirement: Détail d'un compte
La page `/admin/formateurs/:id` ou `/admin/stagiaires/:id` SHALL afficher nom, prénom, e-mail, rôle (libellé D33) et statut issus de `GET /users/{id}`. Un `404` SHALL afficher un message « Compte introuvable ». Les contenus SHALL être rendus en texte.

#### Scenario: Détail affiché
- **WHEN** le back répond `200` pour l'identifiant demandé
- **THEN** les informations du compte sont affichées avec le libellé de rôle « Formateur » ou « Stagiaire »

#### Scenario: Compte inexistant
- **WHEN** le back répond `404`
- **THEN** « Compte introuvable » s'affiche avec un lien de retour vers la liste

### Requirement: Modification d'un compte
Pour `SUPER_ADMIN`, le détail SHALL permettre de corriger nom, prénom et e-mail par `PUT /users/{id}`, avec les mêmes validations que la création. Le rôle et le statut SHALL NOT être modifiables ici. Avant d'enregistrer un nouvel e-mail sur un compte actif, un avertissement SHALL indiquer que l'utilisateur devra se reconnecter.

#### Scenario: Modification réussie
- **WHEN** la chargée de formation change le prénom et le back répond `200`
- **THEN** le détail affiche la valeur mise à jour et un message de confirmation est annoncé

#### Scenario: E-mail déjà utilisé par un autre compte
- **WHEN** le back répond `409`
- **THEN** « Cet email est déjà utilisé » est affiché en ligne et les valeurs saisies sont conservées

#### Scenario: Avertissement de changement d'e-mail
- **WHEN** elle modifie l'e-mail d'un compte actif
- **THEN** un avertissement sur la reconnexion nécessaire est affiché avant l'enregistrement

### Requirement: Suspension et réactivation
Pour `SUPER_ADMIN`, la liste et le détail SHALL proposer « Suspendre » sur un compte actif (`PATCH /users/{id}/deactivate`) et « Réactiver » sur un compte suspendu (`PATCH /users/{id}/reactivate`). La suspension SHALL demander une confirmation. Le statut affiché SHALL être mis à jour avec la réponse du back.

#### Scenario: Suspension confirmée
- **WHEN** la chargée de formation confirme « Suspendre » sur un compte actif et le back répond `200`
- **THEN** le compte passe à « Suspendu » et le bouton devient « Réactiver »

#### Scenario: Suspension annulée
- **WHEN** elle annule la confirmation
- **THEN** aucun appel n'est émis et le statut est inchangé

#### Scenario: Réactivation
- **WHEN** elle clique « Réactiver » sur un compte suspendu et le back répond `200`
- **THEN** le compte repasse à « Actif »

#### Scenario: Action refusée par le back
- **WHEN** le back répond `403` ou `404`
- **THEN** un message d'erreur est annoncé et le statut affiché ne change pas

### Requirement: Accessibilité des écrans de comptes
Chaque écran (listes, création, détail) SHALL passer un contrôle jest-axe, associer chaque champ à son étiquette, annoncer les erreurs et confirmations aux technologies d'assistance, et rester utilisable sur tablette et mobile (la liste se réorganise sans défilement horizontal de la page).

#### Scenario: Contrôle d'accessibilité
- **WHEN** chacune des pages est rendue avec des données
- **THEN** jest-axe ne signale aucune violation

#### Scenario: Écran étroit
- **WHEN** la largeur est celle d'un mobile
- **THEN** les informations de chaque compte restent lisibles sans défilement horizontal de la page
