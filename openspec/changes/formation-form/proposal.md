# Proposal

## Why

Le formulaire de création de formation (`CreateFormationPage`) est une coque mockée : `handleSubmit` ne fait qu'un `console.log`, la date est unique, la catégorie vient de `utils/categories.js`, le formateur est un champ libre, et plusieurs champs (référence, public, lieu) n'existent pas dans le contrat. La chargée de formation ne peut donc ni créer ni corriger une formation, alors que le back expose `POST /formations` et `PUT /formations/{id}`. C'est la seconde moitié de TICKET-025 et la suite directe de `formations-list-detail`. Décisions de cadrage : `docs/decisions-formations.md` F9 (redirection), F10 (dates du/au), F11 (création + modification, sans import), F12 (catégories de l'API), F13 (formateur au choix, sans dépôt de documents).

## What Changes

- Brancher la création sur `POST /formations` : intitulé, description (facultative), dates « Du » / « Au » (F10), modalité, catégorie, formateur (facultatif). Succès (`201`) → redirection vers le détail de la formation créée avec le bandeau « Formation créée » (F9).
- Brancher la modification sur `PUT /formations/{id}` avec le même formulaire (route `/formations/:formationId/modifier`, préremplie, seuls les champs modifiés sont envoyés) ; succès → retour au détail avec « Formation mise à jour ». Bouton « Modifier » sur le détail pour la chargée de formation, formation active seulement.
- Sélecteur de catégorie alimenté par `GET /categories?active=true` (F12) ; en modification, une catégorie désactivée déjà portée par la formation reste sélectionnée et affichée.
- Sélecteur de formateur alimenté par `GET /users/formateurs?active=true` ; sans choix, le back assigne la chargée de formation (F13).
- Validation côté client : intitulé, dates et modalité et catégorie obligatoires, `dateFin` pas avant `dateDebut`, « Au » préremplie par « Du ». Erreurs `400` / `409` du back affichées sans perdre la saisie.
- Retirer de la coque ce que le contrat ne porte pas : champs « Référence » (Q9 en attente), « Public », « Lieu », zone de dépôt de documents (revient avec 027), lien « + Créer une catégorie » (049).
- Supprimer `CreateFormationPage` ; `utils/categories.js` reste pour `CategoryManagement` (049).

Côté back : aucune demande nouvelle. À vérifier au passage manuel : `PUT` avec `formateurId: null` (voir design, risque).

Hors périmètre : import Excel (`POST /formations/import`, change ultérieur, F11), documents (027), inscrire / désinscrire, gestion des catégories (049), code de référence (Q9).

## Capabilities

### New Capabilities
- `formation-management`: créer et corriger une formation depuis un formulaire (champs du contrat, validation, catégorie et formateur choisis dans l'API, redirection après création), réservé à la chargée de formation.

### Modified Capabilities

(aucune) — le détail d'une formation affichera « Modifier » et les bandeaux de confirmation, mais `formation-browsing` n'existe pas encore dans `openspec/specs/` (son change `formations-list-detail` n'est pas archivé) : ces comportements sont donc écrits comme exigences de `formation-management`, sans delta sur un spec absent.

## Impact

- Code : `src/features/formations/` (`api.js`, `hooks.js`, nouvelle `pages/FormationFormPage.jsx`, `formationForm.js`, `components/FormationNotice.jsx`, `pages/FormationDetailPage.jsx`), nouveau `src/features/categories/` (`api.js`, `hooks.js` : lecture des catégories actives), `src/router/router.jsx` (routes création et modification), `src/test/formations.js` et un helper de catégories ; suppression de `src/components/Pages/CreateFormationPage/`.
- API (lecture seule, `tech.md` §3–4, §2) : `POST /formations`, `PUT /formations/{id}`, `GET /categories?active=true`, `GET /users/formateurs?active=true`.
- Dépendances : aucune nouvelle (React Hook Form et `validation.js` existent, D8, D13).
- Docs : `docs/spec.md` (critères de TICKET-025, hors import), `docs/decisions-formations.md`, `CLAUDE.md` (« État actuel »), `docs/points-pour-charlotte.md` si le `PUT` appelle une réponse.
- Budget du bundle : page ajoutée avec `lazyPage`.
