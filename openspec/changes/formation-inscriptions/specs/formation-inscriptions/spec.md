# Spec Delta

## Purpose

Permet à la chargée de formation d'inscrire et de désinscrire les stagiaires : à la création de leur profil, depuis la page du stagiaire et depuis la page de la formation (`decisions-inscriptions.md`, J1 à J9).

## ADDED Requirements

### Requirement: Actions réservées à la chargée de formation
Le système SHALL n'afficher « Inscrire… » et « Désinscrire » qu'à la chargée de formation. Le formateur SHALL voir les inscriptions sans aucune de ces actions ; le stagiaire SHALL ne rien voir de nouveau. Aucune action SHALL être proposée sur une formation archivée, et une formation archivée SHALL n'être jamais proposée dans une liste de formations à cocher.

#### Scenario: Formateur
- **WHEN** un formateur ouvre la page d'une de ses formations, puis le profil d'un de ses stagiaires
- **THEN** il voit les inscrits et les formations du stagiaire, sans « Inscrire » ni « Désinscrire »

#### Scenario: Formation archivée
- **WHEN** la chargée ouvre une formation archivée, puis un stagiaire inscrit à cette formation
- **THEN** ni « Inscrire des stagiaires » ni « Désinscrire » n'apparaissent pour cette formation

### Requirement: Choisir des formations à la création d'un stagiaire
Le formulaire de création d'un stagiaire SHALL proposer une section « Formations (facultatif) » : les formations actives en cases à cocher natives (« Intitulé — du … au … »), un champ « Rechercher une formation » (sans casse ni accents) et le nombre sélectionné annoncé. La sélection SHALL survivre à la recherche. La section SHALL être absente du formulaire d'un formateur et du formulaire de modification. Une erreur de chargement des formations SHALL proposer « Réessayer » sans empêcher de créer le compte.

#### Scenario: Aucune formation cochée
- **WHEN** la chargée crée un stagiaire sans cocher de formation
- **THEN** seul `POST /users` part et le parcours est inchangé (liste des stagiaires, « Compte créé »)

#### Scenario: Deux formations cochées
- **WHEN** la chargée crée un stagiaire et coche deux formations
- **THEN** `POST /users` part, puis un `POST /formations/{id}/inscriptions` `{ stagiaireId }` par formation, l'un après l'autre, et la page du stagiaire affiche « Compte créé. Inscrit à : A, B. »

#### Scenario: Création du compte refusée
- **WHEN** `POST /users` répond `409` (e-mail déjà utilisé)
- **THEN** l'erreur s'affiche comme aujourd'hui et aucune inscription n'est envoyée

### Requirement: Échec partiel des inscriptions
Le système SHALL garder le compte créé quand une inscription échoue et SHALL afficher, en texte, les formations inscrites et celles qui ont échoué avec la raison (message du back, ou « Erreur de connexion »). Un `409` « déjà inscrit » SHALL compter comme une réussite. Le récapitulatif SHALL passer par l'état de navigation, jamais par le stockage du navigateur.

#### Scenario: Une formation archivée entre-temps
- **WHEN** l'inscription à la formation C répond `400 « Formation archivée, inscription impossible »`
- **THEN** la page du stagiaire affiche « Inscrit à : A. » et « Inscription impossible : C (Formation archivée, inscription impossible) », et la chargée peut réessayer depuis cette page

### Requirement: Formations d'un stagiaire sur sa page
La page d'un stagiaire SHALL afficher une section « Formations » : chaque inscription avec un lien vers la formation et, pour la chargée et une formation active, « Désinscrire ». « Inscrire à une formation » SHALL ouvrir la même liste de cases (formations déjà suivies exclues) avec « Inscrire » et « Annuler ». Sans inscription : « Ce stagiaire n'est inscrit à aucune formation ». Une erreur de chargement SHALL proposer « Réessayer ».

#### Scenario: Inscrire depuis le profil
- **WHEN** la chargée coche une formation dans « Inscrire à une formation » et valide
- **THEN** `POST /formations/{id}/inscriptions` part, la section est rechargée et la formation y apparaît

### Requirement: Inscrire depuis la page de la formation
Sur une formation active, la section « Stagiaires inscrits » SHALL proposer à la chargée « Inscrire des stagiaires » : la liste de cases des stagiaires (recherche, « Tout sélectionner ») avec les comptes actifs et jamais activés, sans les suspendus ni les déjà inscrits, le nom seul (jamais l'e-mail). Un `POST` par stagiaire coché SHALL partir, la liste des inscrits SHALL être rechargée et les échecs SHALL être listés par nom.

#### Scenario: Compte jamais activé
- **WHEN** la chargée ouvre « Inscrire des stagiaires » alors qu'un stagiaire n'a pas encore activé son compte et qu'un autre est suspendu
- **THEN** le premier est proposé, le second non

### Requirement: Désinscrire avec confirmation
« Désinscrire » SHALL ouvrir une confirmation qui nomme le stagiaire et la formation et annonce que ses documents déposés sur cette formation seront supprimés définitivement (avec leur nombre quand la page le connaît déjà). Après confirmation, `DELETE /formations/{id}/inscriptions/{stagiaireId}` SHALL partir et la liste concernée SHALL être rechargée. Une erreur SHALL s'afficher en texte dans la confirmation, sans la fermer.

#### Scenario: Stagiaire avec deux documents
- **WHEN** la chargée clique « Désinscrire » sur la ligne d'un inscrit qui a deux documents, puis confirme
- **THEN** la confirmation annonce « 2 documents » supprimés définitivement, le `DELETE` part et l'inscrit disparaît de la liste

#### Scenario: Annuler
- **WHEN** la chargée ferme la confirmation par « Annuler » ou Échap
- **THEN** aucun appel ne part et le focus revient sur « Désinscrire »

### Requirement: Accessibilité
Les listes de cases SHALL être dans un `fieldset` avec `legend`, utilisables au clavier ; les récapitulatifs et le nombre sélectionné SHALL être annoncés (`role="status"`) ; chaque page touchée SHALL passer jest-axe sans violation.

#### Scenario: Clavier
- **WHEN** la chargée inscrit un stagiaire depuis la page de la formation au clavier seul
- **THEN** elle ouvre la liste, coche, valide et entend le récapitulatif sans souris
