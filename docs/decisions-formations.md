# Décisions — formations (`feature/formations`)

Clarifications de la phase SDD pour TICKET-024 (liste et détail des formations). Numérotation locale F1, F2… (les décisions D1–D60 sont dans `decisions-front-foundations.md`).

## F1 — Périmètre du premier change : 024 + lecture des catégories
- Date : 2026-11-01
- **Décision** : le premier change de `feature/formations` livre la liste et le détail des formations branchés sur l'API (filtre actives / archivées, archiver, vue par rôle) et la lecture des catégories via `GET /categories` (pastille couleur + nom sur la carte). La création de formation et l'import Excel (025), le sélecteur de catégorie (048) et la gestion des catégories (049) viennent dans des changes suivants de la même branche (D3, D43).
- **Pourquoi** : la carte de formation a besoin de la catégorie dès 024 (ticket) ; on supprime ainsi `simFormations.jsx` / `categories.js` sans élargir le change (D11).
- **Alternatives écartées** : 024 seul avec catégories en dur (garde `categories.js`) ; toute la branche en un change (relecture difficile).

## F2 — Formateur : filtre « Mes formations / Toutes » côté client (applique D46)
- Date : 2026-11-01
- **Décision** : pour le rôle ADMIN, la liste propose deux pastilles « Mes formations » (défaut) et « Toutes », filtrées côté client sur `formateur.id === utilisateur courant`. Tant que le back ne renvoie que les formations du formateur (`tech.md`), « Toutes » équivaut à « Mes formations » ; l'alignement du back (`points-pour-charlotte.md` Q3) ne demande aucune retouche du front. Un `404` sur le détail affiche « Formation introuvable ou non accessible » (pas de plantage).
- **Pourquoi** : D46 est visible et testable dès maintenant, sans dépendre de Charlotte.
- **Alternatives écartées** : pas de filtre avant l'alignement du back (D46 invisible) ; mettre le ticket en pause jusqu'à la réponse à Q3.

## F3 — Détail : inscrits affichés, documents reportés, pas d'inscription ici
- Date : 2026-11-01
- **Décision** : le détail lit les inscrits par `GET /formations/{id}/inscriptions` pour la chargée de formation et le formateur uniquement (jamais le stagiaire : l'e-mail des co-inscrits serait exposé, `tech.md` §5) ; le stagiaire ne voit que le nombre d'inscrits (`inscriptionsCount`). La section « Documents » est un emplacement réservé, branché dans `feature/documents` (027) : aucun appel, aucun faux contenu d'ici là. Inscrire / désinscrire (POST/DELETE inscriptions) et la colonne « formations » des comptes restent hors de ce change.
- **Pourquoi** : respecter les critères de 024 sans dépendre des documents ni élargir le change ; protéger la vie privée des stagiaires.
- **Alternatives écartées** : ajouter inscrire / désinscrire maintenant (change plus large, touche aux comptes, D54) ; détail sans inscrits (écart avec 024).

## F4 — Actions : « Archiver » livré, « Modifier » avec le formulaire de 025
- Date : 2026-11-01
- **Décision** : la chargée de formation peut archiver depuis le détail (confirmation, `PATCH /formations/{id}/archive`, retour à la liste, badge « Archivée », formation en lecture seule ; un `409` du verrou optimiste invite à recharger). Le bouton « Modifier » n'apparaît qu'avec le formulaire de 025 : pas de bouton mort. Formateur et stagiaire n'ont aucune action.
- **Pourquoi** : pas de bouton qui mène à une page encore mockée ; l'archivage est autonome côté API.
- **Alternatives écartées** : « Modifier » vers `CreateFormationPage` mockée (bouton non fonctionnel) ; aucune action (écart avec 024).

## F5 — Liste : recherche, tri et statut côté client ; filtre catégorie reporté à 048
- Date : 2026-11-01
- **Décision** : la liste reçoit les formations d'un coup (le back n'a ni pagination ni recherche). Recherche par intitulé et tri (date, intitulé) côté client, comme les comptes (D56) ; pastilles Actives / Archivées via `?status`. Le filtre par catégorie (`CategoryFilter`) reste dans 048 ; la carte réserve déjà la pastille (couleur + nom) de la catégorie.
- **Pourquoi** : cohérence avec les pages de comptes ; volume attendu faible pour ADAC ; 048 est *Could*.
- **Alternatives écartées** : filtre catégorie dès maintenant (alourdit le change) ; statut seul (perd la recherche de la coque).

## F6 — Stagiaire : même page « Mes formations », actives par défaut
- Date : 2026-11-01
- **Décision** : une seule page paramétrée par rôle (D54). Le stagiaire voit « Mes formations » sur `/formations`, pastilles Actives (défaut) / Archivées comme les autres rôles, sans aucune action ; son détail affiche le nombre d'inscrits sans la liste (F3). Un `403` (non inscrit) affiche « Accès refusé » (D52).
- **Pourquoi** : éviter un composant dupliqué pour la même donnée ; la liste ne grossit pas avec le temps.
- **Alternatives écartées** : actives et archivées mélangées ; page dédiée stagiaire.

## Points laissés ouverts
- [NEEDS CLARIFICATION: code de référence des formations (ES01, MI02…) — champ `reference` absent de `tech.md` ; question Q9 à Charlotte. Le front n'affiche que l'intitulé tant qu'elle n'a pas répondu.]

## F7 — Catégorie lue dans la formation, pas d'appel à `GET /categories` (précise F1)
- Date : 2026-11-01
- **Décision** : `FormationResponse` contient déjà `category` complète (`nom`, `couleur`, `isActive`, toujours renseignée, même désactivée). Le change `formations-list-detail` lit donc la catégorie dans la formation et n'appelle pas `/categories` ; cet endpoint sert au sélecteur (048) et à la gestion (049). `ListItem` reçoit la couleur en propriété ; `utils/simFormations.jsx` est supprimé, `utils/categories.js` reste jusqu'à 048/049 car `CreateFormationPage` et `CategoryManagement` l'utilisent.
- **Pourquoi** : pas d'appel ni de jointure inutiles ; une seule source (le back).
- **Alternatives écartées** : appeler `GET /categories` et joindre par id.

## F8 — Constats d'implémentation de `formations-list-detail`
- Date : 2026-11-01
- **Décision** : (1) `ListItem` reçoit `categoryColor` et un `badge` optionnel (texte « Archivée ») au lieu de chercher la couleur dans `categories.js` ; (2) la feuille de style de la liste et du détail (`FormationPages.module.css`) reprend celle des comptes (D56) : même design, pas de feuille partagée entre features ; (3) la recherche ignore la casse et les accents (en plus de F5) ; (4) `src/components/Pages/Stagiaire/Formations/FormationsPage.jsx`, un espace réservé inutilisé, est laissé tel quel (hors périmètre) ; (5) le passage manuel contre le vrai back local reste à faire (Docker) : tâche 7.3 non cochée.
- **Pourquoi** : garder le change borné et noter ce qui s'écarte du design initial.

## F9 — Après la création : redirection vers la formation créée
- Date : 2026-11-01
- **Décision** : à la validation du formulaire de création (TICKET-025), la chargée de formation est redirigée vers le détail de la formation qu'elle vient de créer (`/formations/:id`, id renvoyé par le `201` de `POST /formations`), avec le bandeau « Formation créée » passé par `location.state` (rien dans le stockage, D31). Pas de retour à la liste, pas de page qui reste affichée : l'action doit visiblement avoir réussi. Une erreur (400, 409) reste en ligne sur le formulaire, valeurs conservées.
- **Pourquoi** : constaté par Manon au passage manuel : le formulaire actuel (coque mockée, `console.log` seulement) donne l'impression que rien ne s'est passé.
- **Alternatives écartées** : retour à la liste ; rester sur le formulaire avec un message.
- **Application** : critère de TICKET-025, à reprendre dans sa spec et ses tâches (le bandeau demandera d'ajouter la clé `formation-created` à `FormationNotice`, qui s'affichera sur le détail).

## F10 — Formulaire de création : une date de début et une date de fin
- Date : 2026-11-01
- **Décision** : le formulaire de création (TICKET-025) remplace le champ unique « Date » (`dateValue`) par deux champs obligatoires, « Du » (`dateDebut`) et « Au » (`dateFin`), comme le contrat (`POST /formations`, `tech.md` §4). Une formation d'un jour a la même date dans les deux champs ; à la saisie de « Du », « Au » est préremplie avec la même date. Validation côté client : `dateFin` ne précède pas `dateDebut` (le back répond aussi `400`). Le formulaire de modification (`PUT`) reprend les deux champs.
- **Pourquoi** : constaté par Manon : le formulaire actuel (coque mockée) ne permet de saisir qu'une journée ; les formations d'ADAC durent souvent plusieurs jours et le détail affiche déjà une plage de dates.
- **Alternatives écartées** : un champ « durée en jours » (le back attend deux dates) ; une seule date avec case « plusieurs jours ».
- **Application** : critère de TICKET-025, à reprendre dans sa spec, ses tests (`dateFin` avant `dateDebut`, formation d'un jour) et ses tâches.

## F11 — Périmètre du change 025 : création + modification, import Excel plus tard
- Date : 2026-11-01
- **Décision** : le change `formation-form` (TICKET-025, partie formulaire) branche la création (`POST /formations`) et réutilise le même formulaire pour « Modifier » (`PUT /formations/{id}`, reporté par F4). L'import Excel (`POST /formations/import`) fait l'objet d'un change ultérieur : les colonnes du back sont un placeholder et le vrai fichier du client n'est pas arrivé (D14 ; ordre de coupe D24, import coupé avant le reste).
- **Pourquoi** : livrer le cœur utile (créer, corriger) sans risquer de refaire l'import.
- **Alternatives écartées** : tout 025 d'un coup ; création seule (sans « Modifier »).

## F12 — Sélecteur de catégorie : lecture de `GET /categories?active=true`
- Date : 2026-11-01
- **Décision** : la catégorie (obligatoire, `categoryId`) se choisit dans la liste des catégories actives de l'API (partie « sélecteur » de 048). Le lien « + Créer une catégorie » du formulaire est retiré : les catégories se créent sur la page de gestion, branchée en 049. En modification, une formation dont la catégorie est désactivée garde son choix affiché tant qu'on ne le change pas.
- **Pourquoi** : le formulaire ne peut pas fonctionner sans catégories réelles ; la création en ligne tirerait 049 dans ce change.
- **Alternatives écartées** : sélecteur + création en ligne.

## F13 — Formateur au choix, dépôt de documents retiré du formulaire
- Date : 2026-11-01
- **Décision** : le formulaire propose le formateur parmi les formateurs actifs (`GET /users/formateurs?active=true`) ; sans choix, le back assigne la chargée de formation. La zone de dépôt de documents de la coque est retirée du formulaire et reviendra avec 027.
- **Pourquoi** : le contrat l'impose ; les documents dépendent d'un autre ticket.
- **Alternatives écartées** : pas de choix du formateur (toujours auto-assigné) ; zone de dépôt factice.

## F14 — Passage manuel de `formations-list-detail` : résultats
- Date : 2026-11-01
- **Décision** : le passage manuel contre le vrai back local (3 rôles, liste, détail, archivage, 404 formateur, 403 stagiaire, clavier, zoom) est validé par Manon. Deux ajustements demandés et faits : un espace entre le message « Formation introuvable ou non accessible » et le bouton « Retour » ; la page « Accès refusé » placée dans le gabarit de page (`PageShell`), sous le logo comme les autres contenus (valable pour toutes les pages qui l'affichent).
- **Pourquoi** : constaté au passage manuel.

## F15 — Modification : « Assigné à la chargée de formation » envoie l'identifiant de la chargée
- Date : 2026-11-01
- **Décision** : constaté sur le vrai back local, `PUT /formations/{id}` ignore `formateurId: null` (réponse `200`, aucun changement) et `PATCH /formations/{id}/formateur` répond `500`. En modification, l'option « Assigné à la chargée de formation » envoie donc l'identifiant de l'utilisatrice connectée ; à la création, `formateurId: null` reste correct (le back auto-assigne). Demande consignée : `points-pour-charlotte.md` Q11.
- **Pourquoi** : sans cela, repasser une formation à la chargée de formation semblerait réussir sans rien changer.
- **Alternatives écartées** : retirer l'option en modification ; utiliser le `PATCH` (non implémenté).
