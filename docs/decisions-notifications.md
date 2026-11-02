# Décisions — Notifications (tickets 035, 036)

Branche `feature/notifications` (créée depuis `dev`). Contrat : `tech.md` §8 (`GET /notifications`, `/unread`, `PATCH /{id}/read`, `PATCH /read-all`, `DELETE /{id}`), polling 30–60 s, cloche plafonnée à 50, historique plafonné à 200, jamais de suppression de l'historique.

## N1 — Cible du clic sur une notification `MESSAGE`

- **Date** : 2026-11-02
- **Décision** : cliquer une notification `MESSAGE` marque la notification comme lue puis navigue vers `/messages/:entityId` (`entityId` = id de l'autre participant, `tech.md` §8). Le routeur n'a aujourd'hui que `/messages` : cette branche ajoute `messages/:userId` pointant vers la même coque vide (`MessagesPage`), que `feature/messagerie` remplacera, pour ne pas afficher « adresse inconnue » (`RouteError`). Les notifications `FORMATION` naviguent vers `/formations/:entityId`.
- **Pourquoi** : fixe dès maintenant le contrat d'URL que la messagerie devra honorer, sans retoucher les notifications plus tard.
- **Alternatives rejetées** : marquer comme lue sans naviguer (le clic ne ferait rien de visible, puis changerait de comportement plus tard) ; naviguer vers `/messages` sans id (laisse le contrat d'URL indécidé).

## N2 — Emplacement de la cloche

- **Date** : 2026-11-02
- **Décision** : la cloche est dans `SiteHeader`, affichée seulement quand une session existe (requête `['auth','me']`). Aucun polling ni appel `/notifications` pour un visiteur anonyme (connexion, activation, mot de passe oublié).
- **Pourquoi** : US-015 AC-01 / TICKET-035 demandent une cloche sur toutes les pages authentifiées ; le header y est déjà présent partout.
- **Alternatives rejetées** : emplacement dans un nouveau gabarit authentifié (plus de structure pour le même résultat) ; badge sur la tuile du tableau de bord seulement (écarte US-015 AC-01/02).

## N3 — Fréquence d'interrogation de la cloche

- **Date** : 2026-11-02
- **Décision** : `GET /notifications/unread` est interrogé toutes les 45 s (`refetchInterval: 45_000`), mis en pause quand l'onglet est masqué (`refetchIntervalInBackground: false`), et relancé au retour sur l'onglet (`refetchOnWindowFocus`). Clé de requête `['notifications','unread']`.
- **Pourquoi** : dans la fourchette 30–60 s du contrat (`tech.md` §8, US-015 AC-07), sans appels inutiles depuis un onglet en arrière-plan.
- **Alternatives rejetées** : 30 s en continu (appels depuis les onglets masqués) ; 60 s (un nouveau message peut mettre une minute à apparaître).

## N4 — Clic sur une notification de la cloche : mise à jour optimiste

- **Date** : 2026-11-02
- **Décision** : le clic retire aussitôt la notification du panneau et décrémente le badge (mise à jour optimiste de `['notifications','unread']`), lance `PATCH /notifications/{id}/read` en arrière-plan et navigue. Le panneau se ferme à la navigation. Si le `PATCH` échoue, la notification revient dans le panneau et un message d'erreur est annoncé (région `role="status"`/`alert`).
- **Pourquoi** : la navigation n'attend pas un back lent, et l'état reste cohérent en cas d'échec.
- **Alternatives rejetées** : attendre le `PATCH` avant de naviguer (navigation retardée) ; naviguer sans retour arrière (badge périmé jusqu'au prochain sondage).

## N5 — Actions du panneau de la cloche

- **Date** : 2026-11-02
- **Décision** : le panneau offre, pour chaque notification, un bouton « ✕ » (`DELETE /notifications/{id}` : retire de la cloche seulement, l'historique la garde), puis en pied de panneau « Tout marquer comme lu » (`PATCH /notifications/read-all`, optimiste comme N4) et un lien « Voir toutes les notifications » vers `/notifications`. Panneau vide : « Aucune nouvelle notification ».
- **Pourquoi** : couvre US-015 AC-02 à AC-04 et utilise `read-all`, déjà fourni par le back ; le lien donne accès à l'historique depuis la cloche.
- **Alternatives rejetées** : « ✕ » + lien seulement (read-all inutilisé) ; read-all aussi sur la page d'historique (plus d'interface à tester pour peu de gain).

## N6 — Page d'historique `/notifications`

- **Date** : 2026-11-02
- **Décision** : la page liste tout l'historique (lues et non lues) via `GET /notifications`. Filtre de statut « Toutes / Non lues / Lues » envoyé au back (`?read=false|true`, rien pour « Toutes »). Le « filtre par date » de US-015 AC-05 est un tri récent → ancien / ancien → récent, côté client. Cliquer une notification a le même effet que dans la cloche (N1 : marquer lue puis naviguer). Une note indique que seules les 200 plus récentes sont affichées (plafond du back, `tech.md` §8). Aucune suppression depuis cette page. Clé de requête `['notifications','all', filtre]`.
- **Pourquoi** : le back n'a pas de paramètre de plage de dates ; le tri couvre l'usage sans interface en plus.
- **Alternatives rejetées** : sélecteur de plage de dates côté client (plus d'interface, peu de valeur sur 200 éléments) ; liste sans filtre (écarte US-015 AC-05).

## N7 — Présentation des types de notification

- **Date** : 2026-11-02
- **Décision** : l'icône et la couleur d'une notification dépendent de `entityType` (`MESSAGE`, `FORMATION`), jamais des chaînes `type` (`NEW_MESSAGE`, `DOCUMENT_UPLOADED`…), dont `tech.md` ne donne que des exemples. Toute valeur inconnue reçoit une présentation neutre (pas d'erreur). `content` est affiché en texte, jamais en HTML (règle XSS du projet). L'information n'est jamais portée par la couleur seule (WCAG 2.1 AA, D15) : un libellé caché pour lecteurs d'écran (« Message », « Formation ») accompagne l'icône.
- **Pourquoi** : `NotificationType` n'est pas listé en entier dans `tech.md` ; deviner des chaînes casserait en silence à la prochaine valeur.
- **Alternatives rejetées** : styler d'après `type` (s'appuie sur des chaînes à moitié documentées) ; une seule icône pour tout (perd la distinction demandée par US-015 AC-06).

## Constats sur le back (lecture de `back-readonly`, 2026-11-02)

- `NotificationType` : `NEW_MESSAGE`, `DOCUMENT_UPLOADED`, `FORMATION_UPDATED`. `EntityType` : `FORMATION`, `MESSAGE`. Une notification de document utilise bien `EntityType.FORMATION` avec l'id de la formation (`DocumentServiceImpl`) : la navigation par `entityType` (N1, N7) couvre les trois types.
- `GET /notifications` ignore `sort` (toujours du plus récent au plus ancien, 200 max) et accepte `read` (booléen). Le tri « plus anciennes d'abord » reste donc côté client (N6).
- `GET /notifications/unread` : 50 max, non lues et non retirées de la cloche, `count` total.

## À remonter à Charlotte (à recopier dans `points-pour-charlotte.md` et `points-pour-charlotte-nouveautes.md`)

À recopier quand cette branche sera fusionnée avec `feature/documents` (ces deux fichiers y sont en cours de modification : les éditer ici créerait un conflit).

- **`tech.md` §8 incomplet (documentation seulement)** : `NotificationType` n'y est donné qu'en exemples. Les trois valeurs réelles (`NEW_MESSAGE`, `DOCUMENT_UPLOADED`, `FORMATION_UPDATED`) mériteraient d'y figurer ; le paramètre `?sort=date` y est annoncé mais le back l'ignore. Aucun impact sur le front.
