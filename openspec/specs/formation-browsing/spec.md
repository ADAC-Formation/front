# formation-browsing Specification

## Purpose

Permet de consulter les formations selon le rôle (liste, détail, inscrits, catégorie) et à la chargée de formation de les archiver, en s'appuyant sur les endpoints `/formations`, `/categories` et `/formations/{id}/inscriptions` du back (`tech.md` §3–5).

## Requirements

### Requirement: Accès aux pages de formations
Les routes `/formations`, `/formations/:id` et `/admin/formations` SHALL être accessibles à tout utilisateur connecté (D46). Un visiteur SHALL être redirigé vers `/login`. Le back reste l'autorité : le périmètre de chaque rôle est celui renvoyé par `GET /formations`.

#### Scenario: Visiteur non connecté
- **WHEN** un visiteur ouvre `/formations`
- **THEN** il est redirigé vers `/login` et aucun appel `/formations` n'est émis

#### Scenario: Stagiaire connecté
- **WHEN** un `STAGIAIRE` ouvre `/formations`
- **THEN** la page s'affiche avec les formations renvoyées par le back

### Requirement: Liste des formations
La page SHALL lister les formations de `GET /formations?status=<statut>` avec, pour chacune, l'intitulé, les dates, la modalité, le formateur, le nombre d'inscrits et la catégorie (pastille de couleur + nom). Pendant le chargement un état de chargement SHALL s'afficher ; en cas d'erreur un message avec « Réessayer » ; sans résultat un état vide. Chaque carte SHALL mener au détail.

#### Scenario: Liste chargée
- **WHEN** le back renvoie deux formations actives
- **THEN** deux cartes s'affichent avec intitulé, dates, formateur, nombre d'inscrits et catégorie

#### Scenario: Erreur de chargement
- **WHEN** `GET /formations` répond `500`
- **THEN** un message d'erreur et un bouton « Réessayer » s'affichent, le bouton relance l'appel

#### Scenario: Aucune formation
- **WHEN** le back renvoie une liste vide
- **THEN** un état vide « Aucune formation » s'affiche

### Requirement: Filtre actives / archivées
La liste SHALL proposer les pastilles « Actives » (par défaut) et « Archivées ». Choisir « Archivées » SHALL appeler `GET /formations?status=ARCHIVED`. Une formation archivée SHALL porter le badge « Archivée ».

#### Scenario: Passer aux archivées
- **WHEN** l'utilisateur choisit « Archivées »
- **THEN** l'appel est émis avec `status=ARCHIVED` et les cartes affichent le badge « Archivée »

### Requirement: Recherche et tri côté client
La liste SHALL proposer une recherche par intitulé, par nom du formateur et par nom de catégorie, ainsi qu'un tri par date, intitulé ou formateur, appliqués à la liste reçue sans nouvel appel au back.

#### Scenario: Recherche
- **WHEN** l'utilisateur saisit un terme présent dans un seul intitulé
- **THEN** seule cette formation reste affichée et aucun nouvel appel n'est émis

#### Scenario: Recherche sans résultat
- **WHEN** aucun intitulé, formateur ni catégorie ne contient le terme
- **THEN** l'état « Aucune formation trouvée » s'affiche

### Requirement: Vue du formateur
Pour `ADMIN`, la liste SHALL proposer « Mes formations » (par défaut) et « Toutes ». « Mes formations » SHALL n'afficher que les formations dont `formateur.id` est celui de l'utilisateur courant ; « Toutes » SHALL afficher la liste reçue (D46). Aucune action de gestion ne SHALL être proposée.

#### Scenario: Défaut « Mes formations »
- **WHEN** un `ADMIN` ouvre la liste et que le back renvoie une formation de lui et une d'un autre formateur
- **THEN** seule la sienne s'affiche, « Mes formations » est sélectionné

#### Scenario: Passer à « Toutes »
- **WHEN** il choisit « Toutes »
- **THEN** les deux formations s'affichent

#### Scenario: Pas d'action de gestion
- **WHEN** un `ADMIN` consulte la liste ou un détail
- **THEN** aucun bouton « Archiver » n'est présent

### Requirement: Vue du stagiaire
Pour `STAGIAIRE`, la page SHALL s'intituler « Mes formations » et n'afficher que les formations renvoyées par le back, actives par défaut, sans filtre « Mes formations / Toutes » ni action de gestion.

#### Scenario: Titre et absence d'actions
- **WHEN** un `STAGIAIRE` ouvre `/formations`
- **THEN** le titre est « Mes formations » et aucun lien « Créer » ni « Gérer les catégories » n'est présent

### Requirement: Actions réservées à la chargée de formation
Pour `SUPER_ADMIN`, la liste SHALL afficher les liens « Créer une nouvelle formation » et « Gérer les catégories ». Ces liens SHALL être absents pour les autres rôles.

#### Scenario: Chargée de formation
- **WHEN** un `SUPER_ADMIN` ouvre la liste
- **THEN** les deux liens sont présents

#### Scenario: Formateur
- **WHEN** un `ADMIN` ouvre la liste
- **THEN** les deux liens sont absents

### Requirement: Détail d'une formation
La page `/formations/:id` SHALL afficher intitulé, description (si présente), dates, modalité, catégorie, formateur et nombre d'inscrits issus de `GET /formations/{id}`, et un lien de retour vers la liste. Le contenu serveur SHALL être rendu en texte, jamais en HTML. Une formation archivée SHALL afficher le badge « Archivée » et aucune action.

#### Scenario: Détail chargé
- **WHEN** le back renvoie une formation
- **THEN** ses champs sont affichés, la description absente n'est pas rendue

#### Scenario: Contenu rendu en texte
- **WHEN** la description contient `<script>`
- **THEN** le texte est affiché tel quel et aucun élément `script` n'est créé

#### Scenario: Formation introuvable
- **WHEN** `GET /formations/{id}` répond `404` (inconnue, ou hors périmètre du formateur, D46)
- **THEN** le message « Formation introuvable ou non accessible » s'affiche avec un lien vers la liste

#### Scenario: Stagiaire non inscrit
- **WHEN** `GET /formations/{id}` répond `403`
- **THEN** la page « Accès refusé » s'affiche

### Requirement: Stagiaires inscrits
Pour `SUPER_ADMIN` et `ADMIN`, le détail SHALL lister les stagiaires de `GET /formations/{id}/inscriptions` (nom, prénom, e-mail). Pour `STAGIAIRE`, aucun appel aux inscriptions ne SHALL être émis et seul le nombre d'inscrits SHALL être affiché. Une erreur de cette liste SHALL s'afficher à part, sans masquer le reste du détail.

#### Scenario: Chargée de formation
- **WHEN** un `SUPER_ADMIN` ouvre le détail d'une formation à deux inscrits
- **THEN** les deux stagiaires sont listés avec leur e-mail

#### Scenario: Stagiaire
- **WHEN** un `STAGIAIRE` ouvre le détail
- **THEN** `GET /formations/{id}/inscriptions` n'est pas appelé et seul le nombre d'inscrits est affiché

#### Scenario: Liste d'inscrits en erreur
- **WHEN** l'appel aux inscriptions répond `500`
- **THEN** un message avec « Réessayer » s'affiche dans la section des inscrits et le reste du détail reste visible

### Requirement: Archivage d'une formation
Pour `SUPER_ADMIN`, le détail d'une formation active SHALL proposer « Archiver ». Le bouton SHALL ouvrir une confirmation (focus initial sur « Annuler », Échap annule) ; la confirmation SHALL appeler `PATCH /formations/{id}/archive`, puis ramener à la liste, qui ne contient plus la formation parmi les actives. Un `409` SHALL inviter à recharger la page ; une autre erreur SHALL s'afficher sans quitter la page.

#### Scenario: Archivage confirmé
- **WHEN** un `SUPER_ADMIN` clique « Archiver » puis confirme
- **THEN** `PATCH /formations/{id}/archive` est appelé et il revient à la liste

#### Scenario: Archivage annulé
- **WHEN** il clique « Archiver » puis « Annuler »
- **THEN** aucun appel n'est émis et le focus revient sur « Archiver »

#### Scenario: Conflit
- **WHEN** le back répond `409`
- **THEN** un message invite à recharger la page et l'utilisateur reste sur le détail

#### Scenario: Formation déjà archivée
- **WHEN** le détail d'une formation archivée s'affiche
- **THEN** le bouton « Archiver » est absent

#### Scenario: Autre rôle
- **WHEN** un `ADMIN` ou un `STAGIAIRE` ouvre un détail
- **THEN** le bouton « Archiver » est absent

### Requirement: Catégories lues depuis l'API
La couleur et le nom de la catégorie d'une formation SHALL venir de `category` dans la réponse de la formation (`couleur`, `nom`), y compris pour une catégorie désactivée. Aucune donnée de formation ou de catégorie fictive ne SHALL être affichée.

#### Scenario: Catégorie désactivée
- **WHEN** une formation a une catégorie dont `isActive` est `false`
- **THEN** la pastille s'affiche avec le nom et la couleur renvoyés

### Requirement: Accessibilité des pages de formations
Les pages liste et détail SHALL respecter le gabarit commun (`PageShell`, un seul `<main>`), exposer un seul `<h1>`, annoncer les états de chargement et d'erreur, ne pas reposer sur la couleur seule (la catégorie et le statut portent aussi un texte) et ne produire aucune violation jest-axe.

#### Scenario: Contrôle jest-axe
- **WHEN** la liste puis le détail sont rendus avec des données
- **THEN** jest-axe ne rapporte aucune violation
