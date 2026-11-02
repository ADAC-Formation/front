# Spec Delta

## Purpose

Permet à la chargée de formation de gérer les catégories qui classent les formations : voir toutes les catégories, en créer, corriger leur nom et leur couleur, les désactiver ou les réactiver, sans jamais en supprimer (`GET` / `POST /categories`, `PUT /categories/{id}`, `PATCH …/activate` et `…/deactivate`, `tech.md` §3).

## ADDED Requirements

### Requirement: Accès réservé à la chargée de formation
Le système SHALL réserver la page `/formations/categories` à la chargée de formation (`SUPER_ADMIN`).

#### Scenario: Chargée de formation
- **WHEN** la chargée de formation ouvre `/formations/categories`
- **THEN** la page « Catégories » est affichée

#### Scenario: Formateur ou stagiaire
- **WHEN** un formateur ou un stagiaire ouvre `/formations/categories`
- **THEN** la page « Accès refusé » est affichée et aucune catégorie n'est demandée au back

#### Scenario: Visiteur non connecté
- **WHEN** un visiteur ouvre `/formations/categories`
- **THEN** il est renvoyé vers la connexion

### Requirement: Liste de toutes les catégories
Le système SHALL afficher toutes les catégories, actives et désactivées, dans l'ordre renvoyé par `GET /categories`, avec pour chacune une pastille de sa couleur, son nom et son état écrit en texte (« Active » ou « Désactivée »), sans jamais s'appuyer sur la couleur seule.

#### Scenario: Catégories actives et désactivées
- **WHEN** le back renvoie deux catégories actives et une désactivée
- **THEN** les trois sont listées, chacune avec sa pastille, son nom et son état ; le total est annoncé (« 3 catégories »)

#### Scenario: Chargement, vide et erreur
- **WHEN** les catégories sont en cours de chargement, absentes ou en erreur
- **THEN** un message annoncé indique respectivement le chargement, qu'aucune catégorie n'existe, ou l'erreur avec un bouton « Réessayer » qui relance l'appel

### Requirement: Aucune suppression
Le système SHALL ne proposer aucune action de suppression d'une catégorie.

#### Scenario: Pas de bouton Supprimer
- **WHEN** la page est affichée avec des catégories
- **THEN** aucun bouton, lien ou texte « Supprimer » n'est présent

### Requirement: Création d'une catégorie
Le système SHALL ouvrir, depuis « Créer une catégorie », une boîte de dialogue à nom et couleur, et SHALL envoyer `POST /categories` avec `{ nom, couleur }` à la validation.

#### Scenario: Création réussie
- **WHEN** la chargée de formation saisit un nom et une couleur valides et valide
- **THEN** `POST /categories` est appelé avec le nom nettoyé des espaces en tête et en fin et la couleur en majuscules, la boîte se ferme, la catégorie apparaît dans la liste et le message « Catégorie créée » est annoncé

#### Scenario: Nom absent ou trop long
- **WHEN** le nom est vide (espaces seuls compris) ou dépasse 255 caractères
- **THEN** une erreur est liée au champ et aucun appel n'est fait

#### Scenario: Nom déjà utilisé
- **WHEN** le back répond `409`
- **THEN** son message est affiché dans la boîte, qui reste ouverte avec la saisie conservée

#### Scenario: Autre erreur du back
- **WHEN** l'appel échoue (`400`, `403`, serveur injoignable)
- **THEN** le message est annoncé dans la boîte, qui reste ouverte, et le bouton de validation redevient actif

#### Scenario: Annulation
- **WHEN** la chargée de formation ferme la boîte sans valider
- **THEN** aucun appel n'est fait et la liste est inchangée

### Requirement: Couleur au format #RRGGBB
Le système SHALL proposer la couleur par un sélecteur de couleur et un champ hexadécimal synchronisés, avec une pastille d'aperçu, et SHALL refuser sans appel toute valeur qui n'est pas de la forme `#` suivie de six chiffres hexadécimaux.

#### Scenario: Synchronisation
- **WHEN** la chargée de formation saisit `#12427c` dans le champ hexadécimal, ou choisit une couleur avec le sélecteur
- **THEN** l'autre contrôle et la pastille reprennent cette couleur

#### Scenario: Couleur invalide
- **WHEN** le champ hexadécimal contient `12427c`, `#12427` ou `#GGGGGG` et la chargée de formation valide
- **THEN** une erreur est liée au champ et aucun appel n'est fait

### Requirement: Modification d'une catégorie
Le système SHALL ouvrir, depuis « Modifier » (catégories actives ou désactivées), la même boîte de dialogue préremplie, et SHALL envoyer `PUT /categories/{id}` avec `{ nom, couleur }` à la validation.

#### Scenario: Modification réussie
- **WHEN** la chargée de formation change le nom ou la couleur et valide
- **THEN** `PUT /categories/{id}` est appelé avec les deux champs, la boîte se ferme, la liste montre les nouvelles valeurs et le message « Catégorie mise à jour » est annoncé

#### Scenario: Rien de modifié
- **WHEN** elle valide sans avoir changé ni le nom ni la couleur
- **THEN** la boîte se ferme sans appel

#### Scenario: Nom pris par une autre catégorie
- **WHEN** le back répond `409`
- **THEN** son message est affiché dans la boîte, qui reste ouverte avec la saisie

#### Scenario: Catégorie introuvable
- **WHEN** le back répond `404`
- **THEN** le message est annoncé dans la boîte et la liste est rechargée

### Requirement: Désactivation avec confirmation
Le système SHALL demander une confirmation avant de désactiver une catégorie, expliquer son effet, et n'appeler `PATCH /categories/{id}/deactivate` qu'après confirmation.

#### Scenario: Confirmation affichée
- **WHEN** la chargée de formation active « Désactiver » sur une catégorie active
- **THEN** une boîte de confirmation nomme la catégorie et explique qu'elle n'apparaîtra plus dans le choix de catégorie d'une formation mais restera affichée sur les formations qui la portent déjà

#### Scenario: Désactivation confirmée
- **WHEN** elle confirme
- **THEN** `PATCH /categories/{id}/deactivate` est appelé, la catégorie passe à « Désactivée » dans la liste et le message « Catégorie désactivée » est annoncé

#### Scenario: Désactivation annulée
- **WHEN** elle annule ou appuie sur Échap
- **THEN** aucun appel n'est fait et la catégorie reste active

### Requirement: Réactivation immédiate
Le système SHALL réactiver une catégorie désactivée par `PATCH /categories/{id}/activate`, sans confirmation.

#### Scenario: Réactivation
- **WHEN** la chargée de formation active « Réactiver » sur une catégorie désactivée
- **THEN** `PATCH /categories/{id}/activate` est appelé, la catégorie repasse à « Active » et le message « Catégorie réactivée » est annoncé

#### Scenario: Échec d'une activation ou désactivation
- **WHEN** l'appel échoue
- **THEN** un message d'erreur annoncé s'affiche sur la page et l'état de la catégorie reste celui du back

### Requirement: Données liées rechargées
Le système SHALL recharger, après toute création, modification, activation ou désactivation réussie, la liste complète des catégories, la liste des catégories actives proposée par le formulaire de formation, et les formations (qui embarquent la catégorie).

#### Scenario: Catégorie désactivée
- **WHEN** une catégorie est désactivée puis le formulaire de création de formation est ouvert
- **THEN** elle n'est plus proposée dans le choix de catégorie

#### Scenario: Catégorie renommée
- **WHEN** une catégorie est renommée puis la liste des formations est ouverte
- **THEN** les formations de cette catégorie affichent le nouveau nom et la nouvelle couleur

### Requirement: Boîtes de dialogue accessibles
Les boîtes de création, de modification et de confirmation SHALL être des dialogues modaux nommés par leur titre, SHALL garder le focus à l'intérieur (champs de formulaire compris), se fermer à Échap et rendre le focus au bouton qui les a ouvertes ; la page SHALL être utilisable au clavier et ne présenter aucune violation détectable par jest-axe.

#### Scenario: Focus et clavier
- **WHEN** une boîte de création ou de modification s'ouvre
- **THEN** le focus est placé sur le champ « Nom », Tab et Maj+Tab restent dans la boîte, Échap la ferme et le focus revient au bouton d'origine

#### Scenario: Contrôle d'accessibilité
- **WHEN** la page est affichée, avec une boîte de création ouverte, et avec une erreur de champ affichée
- **THEN** jest-axe ne détecte aucune violation
