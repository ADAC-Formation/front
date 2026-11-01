# Design

## Context

- `FormationsPage` et `FormationDetails` (sous `components/Pages/`) lisent `utils/simFormations.jsx` ; `ListItem` retrouve la couleur d'une catégorie dans `utils/categories.js` par son nom. `CreateFormationPage` et `CategoryManagement` utilisent aussi `categories.js` (reportés à 025/048/049).
- Le back renvoie `FormationResponse` avec `category` complète (`id`, `nom`, `couleur`, `isActive`), `formateur` (UserResponse), `inscriptionsCount`, `status` (`ACTIVE | ARCHIVED`), `modalite`, `dateDebut`, `dateFin`, `description` nullable (`tech.md` §4, DTOs). Pas de lieu, pas de « public », pas de code de référence (Q9).
- Le périmètre par rôle est calculé par le back : `SUPER_ADMIN` tout, `ADMIN` ses formations (D46 voudrait toutes, demande Q3 en cours), `STAGIAIRE` les siennes. `GET /formations/{id}` : `404` (formateur hors périmètre) ou `403` (stagiaire non inscrit). `GET /formations/{id}/inscriptions` : jamais pour un stagiaire.
- Conventions en place : code par domaine dans `src/features/<nom>/` (D32), `api.js` + `hooks.js` TanStack Query (modèle : `features/accounts`), erreurs normalisées en `ApiError` (D12), pages avec `lazyPage` (D59), gabarit `PageShell` (D57), `ConfirmDialog` partagé, MSW en test avec helpers dans `src/test/*.js`.
- Voir `proposal.md` pour la motivation et `docs/decisions-formations.md` (F1–F6) pour les décisions de produit.

## Goals / Non-Goals

**Goals:**
- Remplacer les données mockées des pages liste et détail par l'API, avec une vue par rôle, sans régression visuelle (même design, D41, D56).
- Garder la liste et le détail testables avec MSW, sans dépendre du back réel.
- Préparer les changes suivants (025, 027, 048) sans y toucher : même dossier `features/formations`, même clé de cache.

**Non-Goals:**
- Aucun formulaire (création, modification), aucun appel à `/categories`, aucun appel à `/documents`, aucune inscription / désinscription.
- Pas de pagination ni de recherche côté serveur (le back n'en a pas).
- Pas de demande nouvelle à Charlotte.

## Decisions

### 1. Nouveau dossier `src/features/formations/`, pages déplacées
`api.js` (`listFormations`, `fetchFormation`, `listInscriptions`, `archiveFormation`), `hooks.js` (`useFormations`, `useFormation`, `useInscriptions`, `useArchiveFormation`), `pages/FormationListPage.jsx`, `pages/FormationDetailPage.jsx`, `components/` (carte, état « non accessible »), `formationLabels.js` (libellés de modalité, formatage de date), tests à côté. `router.jsx` pointe sur les nouvelles pages ; les anciens dossiers `components/Pages/FormationsPage` et `FormationDetails` sont supprimés, en gardant leurs feuilles de style déplacées (CSS Modules par composant) pour ne pas changer le design.
- *Pourquoi* : D32 (nouveau code par domaine) et même structure que `accounts`.
- *Alternative écartée* : réécrire sur place dans `components/Pages` (mélange ancien et nouveau code).

### 2. Clés de cache et invalidation
`['formations', 'list', { status }]`, `['formations', 'detail', String(id)]`, `['formations', 'detail', String(id), 'inscriptions']`. L'archivage invalide `['formations']` (toutes les listes et ce détail). Le formateur ne dépend pas de la clé : le filtre « Mes formations » est local.
- *Pourquoi* : même schéma que `accounts` ; une seule invalidation ; 025 pourra invalider `['formations']` après création.
- *Alternative écartée* : mettre à jour le cache à la main après archivage (risque de listes obsolètes).

### 3. Filtrage, recherche et tri purement côté client (F2, F5)
Le statut est le seul paramètre envoyé (`?status=`). Recherche (intitulé, formateur, catégorie), tri (date, intitulé, formateur) et « Mes formations / Toutes » sont des fonctions pures dans un module testable (`listView.js`), appliquées avec `useMemo`. « Mes formations » compare `formation.formateur.id` à l'id de `useCurrentUser()`.
- *Pourquoi* : le back n'expose rien d'autre ; le même code fonctionnera quand le back donnera toutes les formations au formateur (Q3).
- *Alternative écartée* : envoyer `?categoryId`/recherche au serveur (inutile à ce volume, et la recherche n'existe pas côté back).

### 4. La catégorie vient de la formation, `ListItem` reçoit la couleur en propriété
`ListItem` accepte `categoryColor` (et garde `category` pour le texte) ; il n'importe plus `utils/categories`. `simFormations.jsx` est supprimé ; `categories.js` reste pour `CreateFormationPage` et `CategoryManagement` jusqu'à 048/049. La couleur est transmise en variable CSS `--category-color` comme aujourd'hui, donc les règles de contraste élevé existantes (D58) continuent de s'appliquer ; la catégorie reste annoncée en texte (jamais par la couleur seule).
- *Pourquoi* : une seule source (le back), pas de seconde requête, une catégorie désactivée reste lisible.
- *Alternative écartée* : appeler `GET /categories` et joindre par id (appel et jointure inutiles : `category` est toujours renseignée).

### 5. Inscrits : requête séparée, activée seulement pour les rôles de gestion
`useInscriptions(id, { enabled })` n'est activée que si `role` est `SUPER_ADMIN` ou `ADMIN`. Son échec s'affiche dans la section des inscrits (avec « Réessayer ») sans masquer le détail. Le stagiaire ne voit que `inscriptionsCount`.
- *Pourquoi* : le back refuse les stagiaires et l'e-mail des co-inscrits ne doit pas fuiter (F3).
- *Alternative écartée* : tenter l'appel et ignorer le `403` (appel inutile, bruit en console).

### 6. Erreurs du détail
`ApiError.status === 404` → « Formation introuvable ou non accessible » avec lien vers la liste (D46) ; `403` → composant « Accès refusé » existant (D52) ; autre erreur → message + « Réessayer ». L'archivage : `409` → « Cette formation a été modifiée entre-temps. Rechargez la page. » avec un bouton « Recharger » qui relance la requête du détail ; autre erreur → message dans la boîte, sans quitter la page. Après succès, `navigate('/formations')` avec un bandeau passé par `location.state` (aucun stockage, D31/D52).
- *Pourquoi* : mêmes principes que D52 ; le 404 formateur est un cas attendu tant que Q3 est ouverte.

### 7. Emplacement « Documents »
Un bloc statique « Les documents de la formation arriveront bientôt. » sans appel. `feature/documents` (027) le remplace.
- *Alternative écartée* : masquer la section (l'écart avec les critères de 024 serait invisible) ; afficher des documents factices.

### 8. Routes
Aucun changement de chemin : `/formations`, `/formations/:formationId`, `/admin/formations` (même page). Le lien de retour de la liste reste celui de la page actuelle (menu Gestion pour les rôles de gestion, tableau de bord pour le stagiaire). Les liens « Créer une nouvelle formation » et « Gérer les catégories » sont réservés à `SUPER_ADMIN` (ils mènent aux pages encore mockées, retirées au profit des vrais formulaires en 025/049).
- *Pourquoi* : le renommage `/gestion/*` appartient à TICKET-043.

### 9. Tests (TDD, avant le code)
Helper `src/test/formations.js` (formations fictives, `mockFormationList`, `mockFormationDetail`, `mockInscriptions`, `mockArchive`) sur le modèle de `src/test/accounts.js`. Tests : hooks (statut transmis, invalidation après archivage, `404`/`409`), fonctions pures de `listView`, pages (un check jest-axe par page), détail par rôle.

## Risks / Trade-offs

- [Le back ne donne toujours pas toutes les formations au formateur → « Toutes » = « Mes formations »] → Comportement documenté (F2) ; Q3 reste ouverte dans `points-pour-charlotte.md`.
- [Le formateur reçoit `404` sur un détail hors périmètre] → Message dédié (décision 6), jamais de plantage.
- [Bouton « Créer une nouvelle formation » mène à une page encore mockée] → Réservé à `SUPER_ADMIN`, déjà le cas aujourd'hui ; remplacé en 025.
- [`ListItem` change de signature] → Un seul appelant aujourd'hui (la liste des formations) ; test du composant mis à jour.
- [Libellés de modalité et formats de date divergent entre pages] → Un seul module `formationLabels.js`.
- [Budget du bundle d'entrée] → Pages chargées avec `lazyPage` ; `npm run check` vérifie.

## Migration Plan

Aucune donnée à migrer. Suppression de `simFormations.jsx` et des deux anciens dossiers de pages dans le même commit que le branchement. Retour arrière : revert du commit.

## Open Questions

- Code de référence des formations (ES01, MI02…) : non affiché tant que Charlotte n'a pas répondu à Q9 ; l'ajout éventuel d'un champ n'altère pas ce design.
