# in-app-notifications Specification

## Purpose
Informer chaque utilisateur connecté, depuis n'importe quelle page, des événements qui le concernent (nouveau message, document, mise à jour de formation) grâce à une cloche d'en-tête et à une page d'historique, en s'appuyant sur `GET/PATCH/DELETE /notifications` (`tech.md` §8).

## Requirements

### Requirement: Cloche visible seulement avec une session
Le front SHALL afficher une cloche de notifications dans l'en-tête sur toute page quand une session existe (utilisateur lu par `GET /auth/me`), quel que soit le rôle. Pour un visiteur non connecté, ou tant que la session n'est pas connue, la cloche SHALL NOT être affichée et aucune requête `/notifications` SHALL être envoyée.

#### Scenario: Utilisateur connecté
- **WHEN** un utilisateur connecté ouvre une page quelconque
- **THEN** la cloche est affichée dans l'en-tête

#### Scenario: Visiteur non connecté
- **WHEN** un visiteur ouvre `/login`
- **THEN** aucune cloche n'est affichée et aucun appel à `/notifications` n'est émis

#### Scenario: Déconnexion
- **WHEN** l'utilisateur se déconnecte
- **THEN** la cloche disparaît et ses notifications ne restent pas en cache pour l'utilisateur suivant

### Requirement: Badge du nombre de non lues
La cloche SHALL afficher le `count` renvoyé par `GET /notifications/unread`. Le badge SHALL être masqué quand le compteur est zéro et afficher « 99+ » au-delà de 99. Le nom accessible du bouton SHALL être « Notifications, N non lues » (« Notifications » si zéro). Le badge SHALL ne pas porter l'information par la couleur seule.

#### Scenario: Trois non lues
- **WHEN** le back répond `{ count: 3, notifications: [...] }`
- **THEN** le badge affiche « 3 » et le bouton s'appelle « Notifications, 3 non lues »

#### Scenario: Aucune non lue
- **WHEN** le back répond `{ count: 0, notifications: [] }`
- **THEN** aucun badge n'est affiché

#### Scenario: Plus de 99
- **WHEN** le `count` vaut 120
- **THEN** le badge affiche « 99+ »

### Requirement: Interrogation périodique
Tant qu'une session existe, le front SHALL interroger `GET /notifications/unread` toutes les 45 secondes, SHALL suspendre cette interrogation quand l'onglet est masqué et SHALL relancer une requête au retour sur l'onglet. Il SHALL NOT utiliser WebSocket ni SSE.

#### Scenario: Onglet visible
- **WHEN** 45 secondes s'écoulent sur un onglet visible
- **THEN** une nouvelle requête `GET /notifications/unread` est émise et le badge est mis à jour

#### Scenario: Onglet masqué
- **WHEN** l'onglet est masqué
- **THEN** aucune requête périodique n'est émise

#### Scenario: Retour sur l'onglet
- **WHEN** l'utilisateur revient sur l'onglet
- **THEN** le compteur est rafraîchi sans attendre l'échéance suivante

### Requirement: Panneau des non lues
Activer la cloche SHALL ouvrir un panneau listant uniquement les notifications non lues renvoyées par `GET /notifications/unread`, avec pour chacune son contenu, sa date et une icône par type. Un panneau sans notification SHALL afficher « Aucune nouvelle notification ». Le panneau SHALL se fermer par la touche Échap, par un clic à l'extérieur et à la navigation, et le focus SHALL revenir au bouton de la cloche.

#### Scenario: Ouverture
- **WHEN** l'utilisateur active la cloche avec 3 non lues
- **THEN** le panneau liste ces 3 notifications et le bouton annonce `aria-expanded="true"`

#### Scenario: Panneau vide
- **WHEN** l'utilisateur ouvre la cloche sans notification non lue
- **THEN** le panneau affiche « Aucune nouvelle notification »

#### Scenario: Fermeture au clavier
- **WHEN** le panneau est ouvert et l'utilisateur appuie sur Échap
- **THEN** le panneau se ferme et le focus revient sur la cloche

### Requirement: Ouvrir une notification
Activer une notification SHALL la marquer comme lue (`PATCH /notifications/{id}/read`) puis naviguer vers l'élément concerné : `/messages/:entityId` pour `entityType = MESSAGE` (`entityId` est l'id de l'autre participant) et `/formations/:entityId` pour `FORMATION`. Un `entityType` inconnu SHALL marquer comme lue sans naviguer.

#### Scenario: Notification de message
- **WHEN** l'utilisateur active une notification `MESSAGE` d'`entityId` 7 dans la cloche
- **THEN** `PATCH /notifications/{id}/read` est envoyé et l'application navigue vers `/messages/7`

#### Scenario: Notification de formation
- **WHEN** l'utilisateur active une notification `FORMATION` d'`entityId` 12
- **THEN** l'application navigue vers `/formations/12`

#### Scenario: Type inconnu
- **WHEN** l'utilisateur active une notification d'un `entityType` non géré
- **THEN** elle est marquée comme lue et aucune navigation n'a lieu

### Requirement: Mise à jour immédiate de la cloche
Dans la cloche, une notification marquée comme lue, retirée ou incluse dans « Tout marquer comme lu » SHALL disparaître du panneau et le compteur SHALL diminuer immédiatement, sans attendre la réponse du back. Si la requête échoue, l'état précédent SHALL être rétabli et une erreur SHALL être annoncée aux lecteurs d'écran.

#### Scenario: Marquage immédiat
- **WHEN** l'utilisateur active une notification de la cloche
- **THEN** elle quitte le panneau et le badge diminue de 1 avant la réponse du `PATCH`

#### Scenario: Échec du marquage
- **WHEN** le `PATCH` répond une erreur
- **THEN** la notification réapparaît dans le panneau, le badge est rétabli et un message d'erreur est annoncé

### Requirement: Retirer de la cloche et tout marquer comme lu
Chaque notification du panneau SHALL avoir un bouton « ✕ » (nom accessible explicite) qui envoie `DELETE /notifications/{id}` : la notification quitte la cloche mais SHALL rester dans l'historique. Le panneau SHALL proposer « Tout marquer comme lu » (`PATCH /notifications/read-all`), qui vide le panneau et le badge de façon optimiste avec la même gestion d'échec que ci-dessus, et un lien « Voir toutes les notifications » vers `/notifications`.

#### Scenario: Retrait d'une notification
- **WHEN** l'utilisateur active « ✕ » sur une notification
- **THEN** `DELETE /notifications/{id}` est envoyé et la notification quitte le panneau mais reste dans la page d'historique

#### Scenario: Tout marquer comme lu
- **WHEN** l'utilisateur active « Tout marquer comme lu »
- **THEN** `PATCH /notifications/read-all` est envoyé, le panneau devient vide et le badge disparaît

#### Scenario: Accès à l'historique
- **WHEN** l'utilisateur active « Voir toutes les notifications »
- **THEN** l'application navigue vers `/notifications`

### Requirement: Page d'historique
La page `/notifications`, réservée aux utilisateurs connectés et chargée à la demande, SHALL afficher via `GET /notifications` toutes les notifications, lues et non lues, avec une distinction visible et lisible par un lecteur d'écran. Une note SHALL indiquer que seules les 200 plus récentes sont affichées. La page SHALL NOT permettre de supprimer une notification ; activer une notification y a le même effet que dans la cloche. Le filtre de statut et le tri sont décrits dans l'exigence suivante.

#### Scenario: Historique complet
- **WHEN** l'utilisateur ouvre `/notifications`
- **THEN** `GET /notifications` est appelé sans paramètre et les notifications lues et non lues sont listées

#### Scenario: Historique vide
- **WHEN** le back répond une liste vide
- **THEN** la page affiche « Aucune notification »

#### Scenario: Pas de suppression
- **WHEN** l'utilisateur consulte l'historique
- **THEN** aucun bouton de suppression n'est proposé

### Requirement: Filtre et tri de l'historique
Un filtre de statut « Toutes / Non lues / Lues » SHALL envoyer `?read=false|true` à `GET /notifications` (aucun paramètre pour « Toutes »). Un tri par date, du plus récent au plus ancien ou l'inverse, SHALL s'appliquer côté client sans nouvel appel au back.

#### Scenario: Filtre non lues
- **WHEN** l'utilisateur choisit « Non lues »
- **THEN** `GET /notifications?read=false` est appelé et seules les non lues sont affichées

#### Scenario: Filtre lues
- **WHEN** l'utilisateur choisit « Lues »
- **THEN** `GET /notifications?read=true` est appelé

#### Scenario: Tri
- **WHEN** l'utilisateur choisit « Plus anciennes d'abord »
- **THEN** la liste est réordonnée sans nouvel appel au back

### Requirement: Présentation par type et contenu sûr
Chaque notification SHALL afficher une icône et un libellé masqué (« Message », « Formation ») déterminés par `entityType`, jamais par la chaîne `type`. Une valeur inconnue SHALL recevoir une présentation neutre sans provoquer d'erreur. Le `content` SHALL être rendu en texte, jamais en HTML.

#### Scenario: Message
- **WHEN** une notification a `entityType = MESSAGE`
- **THEN** elle affiche l'icône des messages et le libellé « Message » pour les lecteurs d'écran

#### Scenario: Type inconnu
- **WHEN** une notification a un `entityType` inconnu
- **THEN** elle s'affiche avec l'icône neutre et la page ne plante pas

#### Scenario: Contenu avec balises
- **WHEN** `content` vaut `<img src=x onerror=alert(1)>`
- **THEN** le texte est affiché tel quel et aucun élément HTML n'est créé

### Requirement: Erreurs et chargement
Le panneau et la page SHALL afficher un état de chargement annoncé aux lecteurs d'écran et, si la requête échoue, un message d'erreur avec une action « Réessayer ». Un `401` SHALL suivre le comportement de session expirée existant (`ApiError`, D12) sans message propre aux notifications.

#### Scenario: Échec du chargement de l'historique
- **WHEN** `GET /notifications` répond `500`
- **THEN** la page affiche un message d'erreur et un bouton « Réessayer » qui relance la requête

#### Scenario: Session expirée
- **WHEN** une requête de notification répond `401`
- **THEN** l'application applique la gestion de session expirée existante

### Requirement: Route de conversation provisoire
Le routeur SHALL accepter `/messages/:userId` pour les utilisateurs connectés et l'afficher avec la page de messages actuelle, de sorte que le lien d'une notification `MESSAGE` n'aboutisse pas à une adresse inconnue en attendant la messagerie.

#### Scenario: Lien d'une notification de message
- **WHEN** un utilisateur connecté ouvre `/messages/7`
- **THEN** la page de messages est affichée et non l'erreur « adresse inconnue »

### Requirement: Accessibilité et préférences d'affichage
La cloche, le panneau et la page SHALL respecter WCAG 2.1 AA : navigation complète au clavier, anneau de focus visible, tailles en `rem`, couleurs en jetons, et rendu correct avec « Grand texte », contraste élevé et sur mobile (pas de débordement horizontal).

#### Scenario: Contrôle d'accessibilité
- **WHEN** la page d'historique et le panneau ouvert sont soumis à jest-axe
- **THEN** aucune violation n'est signalée

#### Scenario: Écran étroit
- **WHEN** la largeur est celle d'un téléphone
- **THEN** le panneau reste entièrement visible sans défilement horizontal de la page
