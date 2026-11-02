# Proposal

## Why

La chargée de formation saisit aujourd'hui les formations une par une avec le formulaire. Le back expose `POST /formations/import` (TICKET-023, « Done ») pour créer plusieurs formations depuis un fichier Excel ; TICKET-025 et US-005 demandent la partie front, reportée par F11 pour livrer d'abord le formulaire. Le vrai fichier d'ADAC n'est pas arrivé : on construit sur les colonnes provisoires de `tech.md` (D14, F16), isolées pour être refaites sans toucher à l'interface. Décisions de cadrage : `docs/decisions-formations.md` F16–F21.

## What Changes

- Nouvelle page `/formations/importer` (chargée de formation seulement), avec un bouton « Importer un fichier Excel » sur la liste des formations (F17).
- Consignes et colonnes attendues affichées sur la page ; modèle `.xlsx` généré dans le navigateur à partir de la définition des colonnes (en-tête + une ligne d'exemple, F18).
- Choix du fichier avec contrôle avant envoi : extension `.xlsx` et 2 Mo au plus, message précis et aucun appel sinon (F21).
- Envoi `POST /formations/import` en `multipart/form-data` (champ `file`). Succès (`201`) → redirection vers `/formations` avec un bandeau « N formation(s) importée(s) » (F19).
- Échec `400` : le `message` du back est découpé en tableau Ligne / Colonne / Problème ; toute entrée non reconnue s'affiche telle quelle dans une liste (F20). Aucune formation n'est créée (tout ou rien) ; le fichier peut être corrigé et renvoyé.
- Demande à Charlotte déjà consignée : erreurs structurées dans `details[]` (`points-pour-charlotte.md` Q12).

Côté back : aucune modification, seulement la demande Q12. Hors périmètre : colonnes définitives (attente du fichier d'ADAC, R10), import d'inscriptions, aperçu du contenu du fichier avant envoi, vérification du nombre de lignes côté navigateur.

## Capabilities

### New Capabilities
- `formation-import`: importer des formations depuis un fichier Excel (modèle téléchargeable, contrôle du fichier, retour du back en tableau d'erreurs ligne / colonne, confirmation), réservé à la chargée de formation.

### Modified Capabilities

(aucune) — le bouton sur la liste est écrit comme exigence de `formation-import` : `formation-browsing` n'existe pas encore dans `openspec/specs/` (son change `formations-list-detail` n'est pas archivé).

## Impact

- Code : nouveaux fichiers dans `src/features/formations/` (`importColumns.js`, `importErrors.js`, `importFile.js`, `importTemplate.js`, `pages/FormationImportPage.jsx` et sa feuille de style), `api.js` (`importFormations`), `hooks.js` (`useImportFormations`), `components/FormationNotice.jsx` (bandeau avec le nombre), `pages/FormationListPage.jsx` (bouton), `src/router/router.jsx` (route), `src/test/formations.js` (helpers MSW).
- API (lecture seule, `tech.md` §4, TICKET-023) : `POST /formations/import` (`201` → `FormationResponse[]`, `400`, `403`).
- Dépendances : `write-excel-file` (génération du modèle, version 4, sortie navigateur `write-excel-file/browser`), importée dynamiquement avec la page ; aucune dépendance de lecture de fichier.
- Docs : `docs/spec.md`, `docs/decisions-formations.md`, `docs/points-pour-charlotte.md` (Q12), `CLAUDE.md` (« État actuel »).
- Budget du bundle : page ajoutée avec `lazyPage`, bibliothèque hors de l'entrée.
