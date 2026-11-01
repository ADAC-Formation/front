# page-loading Specification

## Purpose

Définit comment les pages de l'application se chargent : à la demande, route par route, avec un retour clair pendant le chargement ou en cas d'échec, et un budget de taille qui protège le fichier d'entrée.

## Requirements

### Requirement: Pages chargées à la demande
Le code de chaque page SHALL être téléchargé seulement quand une route qui l'utilise est ouverte, et non dans le fichier d'entrée. Le fichier d'entrée SHALL contenir uniquement le gabarit commun, les gardes de routes, la session, le thème et le client API. Le comportement des pages, leurs adresses et leurs gardes SHALL rester identiques.

#### Scenario: Page de connexion légère
- **WHEN** un visiteur ouvre `/login`
- **THEN** le navigateur ne télécharge pas le code des pages formations, catégories, création de formation ni comptes

#### Scenario: Page chargée au premier passage
- **WHEN** un utilisateur connecté ouvre `/admin/formateurs` pour la première fois
- **THEN** le code de cette page est téléchargé à ce moment-là et la page s'affiche comme avant

### Requirement: Chargement annoncé
Pendant le chargement d'une page, l'application SHALL afficher « Chargement… » dans une région `status` annoncée aux technologies d'assistance : au premier affichage de l'application, et lors d'un changement de page tant que le code de la nouvelle page n'est pas arrivé. L'écran SHALL ne jamais rester vide sans message.

#### Scenario: Premier affichage
- **WHEN** l'application démarre sur une route dont le code n'est pas encore chargé
- **THEN** un message « Chargement… » de rôle `status` est présent jusqu'à l'affichage de la page

#### Scenario: Navigation vers une page non chargée
- **WHEN** l'utilisateur clique sur un lien vers une page jamais ouverte
- **THEN** une région `status` annonce le chargement jusqu'à l'arrivée de la page, puis disparaît

### Requirement: Échec de chargement d'une page
Si le code d'une page ne peut pas être téléchargé (réseau coupé, fichier remplacé par une nouvelle version), l'application SHALL afficher un message en français indiquant que la page n'a pas pu être chargée, annoncé comme une erreur, avec une action « Réessayer » qui recharge l'application. L'écran SHALL ne jamais rester blanc.

#### Scenario: Réseau coupé
- **WHEN** le téléchargement du code d'une page échoue
- **THEN** un message d'erreur annoncé et un bouton « Réessayer » s'affichent à la place de la page

#### Scenario: Réessayer
- **WHEN** l'utilisateur clique sur « Réessayer »
- **THEN** l'application se recharge et tente de nouveau le chargement

### Requirement: Session demandée sans attendre la page
La requête de l'utilisateur courant (`GET /auth/me`) SHALL partir dès le démarrage de l'application, en parallèle du téléchargement du code de la page, et non après l'affichage des gardes. Le résultat SHALL être réutilisé par les gardes sans seconde requête.

#### Scenario: Démarrage sur une page protégée
- **WHEN** l'application démarre sur `/formations` avec une session valide
- **THEN** `GET /auth/me` est émis une seule fois et avant l'affichage de la page

#### Scenario: Visiteur non connecté
- **WHEN** `GET /auth/me` répond `401` au démarrage
- **THEN** le visiteur est redirigé vers `/login` comme avant, sans message d'erreur

### Requirement: Budget de taille du fichier d'entrée
Le projet SHALL déclarer dans un fichier versionné la taille gzip maximale du fichier JavaScript d'entrée. Le contrôle de build SHALL échouer, en indiquant la taille mesurée et le budget, si ce budget est dépassé ou si le code d'une page apparaît dans le fichier d'entrée. Ce contrôle SHALL faire partie de la vérification complète (`npm run check`).

#### Scenario: Budget respecté
- **WHEN** le build produit un fichier d'entrée de taille gzip inférieure ou égale au budget et sans code de page
- **THEN** le contrôle réussit

#### Scenario: Budget dépassé
- **WHEN** le fichier d'entrée dépasse le budget
- **THEN** le contrôle échoue en affichant les deux valeurs

#### Scenario: Page importée par erreur dans l'entrée
- **WHEN** un import statique d'une page est réintroduit dans le routeur
- **THEN** le contrôle échoue en nommant le fichier de la page

### Requirement: Comportement des routes inchangé
Le découpage SHALL NOT modifier les gardes ni les redirections existantes : un visiteur reste redirigé vers `/login`, un rôle insuffisant voit « Accès refusé », les routes réservées restent réservées.

#### Scenario: Rôle insuffisant
- **WHEN** un `STAGIAIRE` ouvre `/admin/formateurs`
- **THEN** la page « Accès refusé » s'affiche et le code de la liste des comptes n'est pas nécessaire pour l'afficher

#### Scenario: Utilisateur connecté sur la connexion
- **WHEN** un utilisateur connecté ouvre `/login`
- **THEN** il est renvoyé vers le tableau de bord
