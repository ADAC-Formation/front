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
