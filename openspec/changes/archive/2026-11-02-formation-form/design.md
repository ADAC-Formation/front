# Design

## Context

- `CreateFormationPage` (371 lignes, `components/Pages/`) est une coque : état local, `console.log`, champs hors contrat (référence, public, lieu), date unique, catégorie du mock `utils/categories.js`, formateur en texte libre, dépôt de fichiers, lien « + Créer une catégorie » sans effet. Son CSS (`CreateFormationPage.module.css`) définit déjà le design du formulaire (sections, champs, boutons) validé en D41.
- Contrat (`tech.md` §2–4) : `POST /formations` et `PUT /formations/{id}` (SUPER_ADMIN), corps `{intitule, description?, dateDebut, dateFin, modalite, categoryId, formateurId?}` ; `400` (catégorie ou formateur invalides, `dateFin` avant `dateDebut`, formation archivée), `404`, `409` (verrou optimiste) ; `GET /categories?active=true` ; `GET /users/formateurs?active=true`. `FormationResponse` renvoie `category` et `formateur` complets.
- Patron déjà en place pour un formulaire commun création / modification : `features/accounts/pages/AccountFormPage.jsx` (React Hook Form, `FormField`, validateurs à la main, `changedFields`, notices par `location.state`). `FormField` ne sait rendre qu'un `<input>`.
- `formations-list-detail` fournit `features/formations/{api,hooks}.js`, `FormationNotice`, le détail et la clé de cache `['formations']`. Il n'est pas encore archivé : `openspec/specs/formation-browsing` n'existe pas.
- Voir `proposal.md` pour la motivation et `docs/decisions-formations.md` (F9–F13).

## Goals / Non-Goals

**Goals:**
- Un seul formulaire pour créer et modifier, branché sur l'API, fidèle au contrat et au design existant.
- Réutiliser les patrons des comptes (RHF, `FormField`, notices) plutôt que d'en inventer.
- Préparer 049 (gestion des catégories) en isolant la lecture des catégories dans `features/categories/`.

**Non-Goals:**
- Import Excel, documents, inscriptions, création de catégorie, code de référence.
- Modifier le formateur par `PATCH /formations/{id}/formateur` (non implémenté côté back) : tout passe par `PUT`.

## Decisions

### 1. Une page, deux modes : `FormationFormPage`
`/formations/creer` (sans id) et `/formations/:formationId/modifier` (id) rendent le même composant, comme `AccountFormPage`. En modification, la page charge `useFormation(id)` ; le formulaire s'affiche une fois la formation reçue (états chargement, `404`, erreur). Une formation `ARCHIVED` n'affiche qu'un message et un lien de retour.
- *Pourquoi* : même patron que les comptes, un seul endroit à tester et à rendre accessible.
- *Alternative écartée* : deux pages (duplication du formulaire et de ses tests).

### 2. Logique pure dans `formationForm.js`
`emptyValues`, `valuesFromFormation(formation)`, `toRequest(values)` (trim de l'intitulé et de la description, `description` vide → `null`, `formateurId` vide → `null`, nombres pour `categoryId`/`formateurId`), `changedFields(formation, values)` (seuls les champs modifiés, comparés aux valeurs d'origine) et `validateDateRange(debut, fin)`. Testés sans rendu.
- *Pourquoi* : la règle « seuls les champs modifiés » et les dates sont les points délicats ; les isoler les rend testables.
- *Alternative écartée* : tout dans le composant.

### 3. Dates « Du » / « Au » (F10)
Deux `<input type="date">` en RHF. Un `onChange` sur « Du » remplit « Au » si « Au » est vide ou égale à l'ancienne valeur de « Du ». Validation : `dateFin >= dateDebut` (comparaison de chaînes ISO, sûre pour `AAAA-MM-JJ`), message sur le champ « Au ».
- *Pourquoi* : le cas courant (un jour) ne demande qu'une saisie ; le back refuse de toute façon une plage inversée.

### 4. Catégories : `features/categories/` en lecture seule
`api.js` (`listCategories({ active })`) et `hooks.js` (`useCategories({ active })`, clé `['categories', 'list', 'active'|'all']`) créés ici ; 049 y ajoutera création, modification et (dés)activation. Le sélecteur utilise `{ active: true }`. En modification, si la catégorie de la formation n'est pas dans la liste (désactivée), elle est ajoutée en option — marquée « (désactivée) » — pour rester sélectionnée sans être proposée ailleurs.
- *Pourquoi* : F12 ; isoler le domaine « catégories » dès maintenant évite de le loger dans `formations`.
- *Alternative écartée* : joindre la catégorie par son nom depuis le mock (supprimé de ce formulaire).

### 5. Formateur : réutiliser `useAccounts('formateurs', { active: true })`
Le hook existe dans `features/accounts`. Première option « Assigné à la chargée de formation » (valeur vide → `formateurId: null`). En modification, si le formateur actuel est la chargée de formation (`role: 'SUPER_ADMIN'`), l'option vide est préselectionnée ; sinon l'`id` du formateur. Un formateur désactivé après coup est ajouté comme option, comme pour la catégorie.
- *Pourquoi* : pas de seconde lecture des formateurs ; import entre features limité à un hook public.
- *Alternative écartée* : champ libre (la coque), qui ne peut pas fournir d'`id`.

### 6. Contrôles de formulaire : `FormField` accepte `as`
`FormField` gagne une prop `as` (`"input"` par défaut, `"select"`, `"textarea"`) et des `children` pour les `<option>`, en gardant l'étiquette, `aria-invalid`, `aria-describedby` et l'erreur. Les styles viennent de `FormInput` étendus aux deux balises.
- *Pourquoi* : D8/D13 : une seule mécanique de champ accessible ; la coque dupliquait les étiquettes et n'avait pas d'erreurs.
- *Alternative écartée* : `<select>`/`<textarea>` écrits à la main dans la page (erreurs non liées, régressions d'accessibilité).

### 7. Mutations, cache et navigation
`useCreateFormation()` et `useUpdateFormation(id)` dans `hooks.js`. Succès : invalider `['formations']` (listes et détails). Création : `navigate('/formations/<id>', { state: { notice: 'formation-created' } })` ; modification : même chemin avec `formation-updated`. Erreurs : `400` et autres dans un `Alert` annoncé au-dessus du formulaire (valeurs conservées) ; `409` → message de rechargement avec bouton « Recharger » (rejoue `GET /formations/{id}` et réinitialise le formulaire, ce qui efface la saisie : le message le dit). `FormationNotice` reçoit les deux clés et s'affiche aussi sur le détail.
- *Pourquoi* : même schéma que `formations-list-detail` (D52 : rien dans le stockage).

### 8. Détail : bouton « Modifier »
`FormationDetailPage` affiche `Modifier` (lien) aux côtés d'`Archiver` pour `SUPER_ADMIN` sur une formation active, et `<FormationNotice />`. Ces deux changements touchent du code de `formations-list-detail` (déjà livré dans la branche) et sont couverts par les tests de ce change.

### 9. Routes et nettoyage
`router.jsx` : `formations/creer` pointe sur `FormationFormPage`, ajout de `formations/:formationId/modifier`, les deux derrière `RequireRole` `SUPER_ADMIN`. `CreateFormationPage` et son dossier sont supprimés ; leur feuille de style est reprise dans `features/formations/pages/FormationForm.module.css` (design inchangé, sections « Informations générales » et « Organisation », sans « Documents »). `utils/categories.js` reste pour `CategoryManagement`.

### 10. Tests (TDD, avant le code)
Helpers MSW dans `src/test/formations.js` (`mockCreateFormation`, `mockUpdateFormation`) et `src/test/categories.js` (`CATEGORIES_LIST`, `mockCategories`). Tests : `formationForm.test.js` (logique pure), hooks (corps, invalidation, erreurs), `FormationFormPage.test.jsx` (création, modification, erreurs, dates, catégories, formateur, accessibilité), `FormField.test.jsx` (`select`, `textarea`), détail (« Modifier », bandeaux), routeur (accès par rôle).

## Risks / Trade-offs

- [`PUT` ignore `formateurId: null` (constaté sur le vrai back le 2026-11-01 ; `PATCH /formateur` répond 500)] → en modification, « Assigné à la chargée de formation » envoie l'identifiant de la chargée connectée ; à la création `null` fonctionne. Consigné dans `points-pour-charlotte.md` Q11.
- [Perte de la saisie au « Recharger » après un `409`] → le message l'annonce ; cas rare (deux modifications simultanées).
- [`FormField` est partagé : l'étendre peut régresser les pages d'auth et de comptes] → l'ajout est rétrocompatible (`as="input"` par défaut) et leurs tests restent dans la suite.
- [Catégorie ou formateur désactivés après chargement de la liste] → le `400` du back s'affiche tel quel.
- [Le bouton « Modifier » et les bandeaux modifient le détail de `formations-list-detail`] → tests de non-régression de ce détail conservés.

## Migration Plan

Aucune donnée à migrer. Suppression de `CreateFormationPage` dans le commit qui branche la nouvelle page. Retour arrière : revert.

## Open Questions

- Aucune : le comportement de `PUT` avec `formateurId: null` est tranché (voir Risques).
