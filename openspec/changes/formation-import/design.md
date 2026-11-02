# Design

## Context

- Contrat (`tech.md` §4, lu aussi dans `ExcelImportUtil` du back `dev`, lecture seule) : `POST /formations/import`, SUPER_ADMIN, `multipart/form-data`, champ `file` (`.xlsx`), tout ou rien, `201` → `FormationResponse[]`, `400` (format invalide, fichier trop volumineux, lignes invalides). Limites du back : 2 Mo, 1000 lignes, 50 erreurs au plus. Les erreurs arrivent dans un seul `message` : entrées jointes par ` | `, chacune `ligne N, colonne X : texte` ; `details[]` est vide (Q12).
- Colonnes provisoires (A–G) : `intitule`, `description`, `dateDebut`, `dateFin`, `modalite`, `categorie` (nom exact), `formateur` (e-mail, vide → chargée assignée). Le vrai fichier d'ADAC n'est pas arrivé (R10, F16).
- Client axios unique : `Content-Type: application/json` par défaut, interception des erreurs en `ApiError` (`message` = texte du back ou message générique, `isNetworkError`). Aucun appel multipart n'existe encore.
- Patrons en place : `FormationFormPage` (page de formulaire dans `PageShell`, `BackButton`, `Alert`), `FormationNotice` (confirmation passée par `location.state`), `useCreateFormation` (mutation + invalidation de `['formations']`), `lazyPage` et budget du bundle (D59).
- Voir `proposal.md` pour la motivation et `docs/decisions-formations.md` (F16–F21).

## Goals / Non-Goals

**Goals:**
- Une page d'import fidèle au contrat, qui rend les erreurs du back lisibles ligne par ligne.
- Colonnes définies à un seul endroit : le jour où le vrai fichier arrive, seuls ce module et les tests changent.
- Aucune lecture de fichier ni bibliothèque lourde dans l'entrée du bundle.

**Non-Goals:**
- Colonnes définitives, aperçu du fichier, validation du contenu côté navigateur, comptage des lignes.
- Import d'inscriptions ou de catégories.

## Decisions

### 1. Colonnes dans `importColumns.js`
Tableau ordonné `IMPORT_COLUMNS` (`key`, `required`, `format`, `example`) et `MODALITES`. La page (tableau des consignes) et le modèle (en-tête + exemple) le lisent ; rien d'autre ne cite un nom de colonne, sauf les tests de contrat.
- *Pourquoi* : F16 ; un seul endroit à refaire quand le fichier d'ADAC arrive.
- *Alternative écartée* : colonnes écrites en dur dans la page et dans le modèle (divergence possible).

### 2. Découpage des erreurs : `parseImportErrors(message)` pure
Découpe sur ` | `, applique `^ligne (\d+), colonne ([^:]+) : (.+)$` à chaque entrée ; renvoie `{ rows: [{ line, column, problem }], others: [texte] }`. Une entrée qui ne correspond pas va dans `others` telle quelle. Entrée vide ou message vide → `others` vide.
- *Pourquoi* : F20 ; testable sans rendu, tolérante aux changements de format du back.
- *Alternative écartée* : n'afficher que le message brut (pas de tableau, AC-04 mal servi).

### 3. Modèle : `importTemplate.js`, bibliothèque `write-excel-file`
`downloadImportTemplate()` importe dynamiquement `write-excel-file/browser`, construit la feuille (ligne d'en-tête = `key` de chaque colonne, ligne d'exemple = `example`) et appelle `.toFile('modele-import-formations.xlsx')`. `write-excel-file` 4.1.1 : écriture seule (pas de lecture, donc pas de surface d'analyse de fichiers non fiables), environ 1,8 Mo décompressés sur le disque, chargée au clic et hors de l'entrée.
- *Pourquoi* : F18 ; `exceljs` pèse environ 20 Mo décompressés pour le même besoin, et `xlsx` (SheetJS) est surtout une bibliothèque de lecture, dont la version npm n'est plus maintenue (à revérifier à l'installation).
- *Alternative écartée* : fichier statique dans `public/` (peut diverger des colonnes).
- *Test* : la bibliothèque est mockée (`vi.mock`) et le test vérifie l'en-tête transmis et le nom du fichier ; le vrai contenu est vérifié au passage manuel.

### 4. Appel d'import
`importFormations(file)` dans `api.js` construit un `FormData` (`file`) et fait `apiClient.post('/formations/import', formData, { headers: { 'Content-Type': undefined } })` : retirer l'en-tête JSON par défaut laisse le navigateur écrire `multipart/form-data` avec sa limite (boundary). `useImportFormations()` dans `hooks.js` : mutation qui, au succès, invalide `['formations']`.
- *Risque* : axios et jsdom/MSW gèrent le `FormData` différemment ; le test MSW lit `request.formData()` et le passage manuel contre le vrai back confirme le champ `file`.

### 5. Page `FormationImportPage`, sans React Hook Form
La page tient un seul champ fichier (`<input type="file" accept=".xlsx">`, étiqueté) : son état (`file`, `fileError`) est local, sans RHF, qui n'apporterait ici ni validation de champs ni valeurs de formulaire ; la règle d'extension et de taille est une fonction pure `checkImportFile(file)` dans `importFile.js` (`MAX_IMPORT_BYTES = 2 * 1024 * 1024`), testée seule. Le bouton « Importer » est inactif sans fichier valide ou pendant l'envoi. Le modèle se télécharge par un bouton « Télécharger le modèle » ; une erreur de génération s'affiche dans un `Alert`.
- *Pourquoi* : un formulaire à un seul champ ne justifie pas RHF (D8, D13 visent les formulaires à champs multiples) ; la logique pure garde la page mince.
- *Alternative écartée* : RHF avec `register('file')` (état dupliqué entre RHF et l'affichage du nom du fichier).

### 6. Résultat et navigation
Succès : `navigate('/formations', { state: { notice: 'formations-imported', count } })` ; `FormationNotice` lit `state.count` et écrit « 1 formation importée » / « N formations importées ». Échec `400` : tableau des lignes reconnues (légende, `<th scope="col">`, annoncé par `role="alert"` sur un conteneur qui porte aussi le résumé « N erreur(s) ») et liste des entrées non reconnues. Autres échecs : `Alert` d'erreur annoncé avec `error.message`. Choisir un autre fichier efface les erreurs (`mutation.reset()`).
- *Pourquoi* : même mécanisme que `formation-created` ; rien dans le stockage du navigateur (D31).

### 7. Route, lien et lazy
`formations/importer` dans `router.jsx` (`lazyPage`, derrière `RequireRole` `SUPER_ADMIN`, avant `formations/:formationId` pour ne pas être pris pour un identifiant). `FormationFormPage` (création seulement) affiche le lien « Importer un fichier Excel » sous l'introduction (F22) ; « Retour » et « Annuler » de la page d'import reviennent à `/formations/creer`. Le logo reçoit `pointer-events: none` : sa zone transparente recouvrait les boutons d'en-tête de la liste.

### 8. Tests (TDD, avant le code)
Helper MSW `mockImportFormations` dans `src/test/formations.js` (201 avec N formations, 400 avec message, 403, erreur réseau, capture du `FormData`). Tests : `importColumns.test.js`, `importErrors.test.js`, `importFile.test.js` (logique pure), `importTemplate.test.js` (bibliothèque mockée), hooks, `FormationImportPage.test.jsx` (page + jest-axe sans et avec erreurs), création (lien présent en création, absent en modification) et liste (aucun lien d'import), routeur (accès par rôle), `FormationNotice` (nombre).

## Risks / Trade-offs

- [Le format du `message` du back change] → les entrées non reconnues s'affichent telles quelles ; Q12 demande `details[]` ; le découpage est isolé dans `importErrors.js`.
- [Colonnes provisoires fausses (R10)] → un seul module à refaire ; le modèle et les consignes suivent.
- [`Content-Type: undefined` mal géré par axios dans un navigateur réel] → passage manuel contre le vrai back avant de cocher la tâche.
- [Le modèle généré est invalide ou illisible dans Excel] → vérifié à la main (ouverture dans Excel ou LibreOffice) au passage manuel ; la bibliothèque est mockée dans les tests.
- [50 erreurs au plus côté back : un fichier très faux ne montre pas tout] → le texte « et d'autres erreurs » du back s'affiche ; l'utilisatrice corrige puis renvoie.
- [Nouvelle dépendance] → écriture seule, chargée à la demande ; `npm audit` relevé à l'ajout.

## Migration Plan

Aucune donnée à migrer. Retour arrière : revert ; la dépendance se retire avec le commit.
