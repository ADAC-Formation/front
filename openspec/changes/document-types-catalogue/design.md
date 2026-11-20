# Design

## Context

- Décisions de référence : G19 à G32 de `docs/decisions/decisions-documents.md` (catalogue, portée, obligatoire, sensible, délai, formats, actif, Gestion), D12 (erreurs), D15 (accessibilité), D46 et D54 (rôles de gestion), D59 (`lazyPage`), D66 (changements du back sur branche).
- Modèle à imiter : les **catégories** (back : `Category`, `CategoryController`, `CategoryServiceImpl`, `tech.md` §3 ; front : `features/categories`). Même contrat : liste, création, `PUT`, `PATCH activate` et `deactivate`, `409` sur un nom déjà pris, jamais de suppression. Le formulaire est plus grand que celui d'une catégorie : il suit plutôt les **comptes** (`AccountFormPage`, pages de création et de modification) qu'une boîte de dialogue.
- Le back n'a aucun type de document : `Document` a seulement un fichier et une cible (`formationId` ou `inscriptionId`). Cette tranche ne touche pas aux documents eux-mêmes (tranche 2).

## Goals / Non-Goals

**Goals :** un catalogue complet et modifiable par la chargée (back et front) ; la liste fictive en données de départ du développement ; la page Gestion réorganisée (G32).

**Non-Goals :** voir proposal (dépôt typé, checklist, « non applicable », délais calculés, vue du formateur, règles de lecture des fichiers sensibles, retrait de `MISSING_DOCS`).

## Decisions

### Back

1. **Migration `V6__add_document_types.sql`** (aucune donnée) :
   - `document_types(id, nom, aide, is_required, is_sensitive, applies_to_all, deadline_days, deadline_anchor, allowed_formats, is_active, created_at, updated_at)` ;
   - `document_type_categories(document_type_id, category_id)`, clé primaire sur les deux colonnes, deux clés étrangères ;
   - index unique `UPPER(nom)` (même choix que `uk_categories_nom_upper` : la contrainte vit en base, pas seulement dans un contrôle du service) ;
   - contraintes : `deadline_days` et `deadline_anchor` tous deux nuls ou tous deux renseignés ; `deadline_days` entre 0 et 365 ; `deadline_anchor` ∈ {`BEFORE_START`, `AFTER_END`}.
   - Rien d'inséré : la liste fictive n'existe qu'en développement (`seed-local-admin.sql`).
2. **Entité `DocumentType`** (`@ManyToMany` vers `Category`, table de jointure ci-dessus), `DocumentTypeRepository` (`existsByNomIgnoreCase`, `existsByNomIgnoreCaseAndIdNot`, liste filtrée sur `isActive`), `DocumentTypeServiceImpl`, `DocumentTypeController` `/api/document-types`, mapper MapStruct, enum `DeadlineAnchor`.
3. **Contrat** (à reporter dans `tech.md`, section « Types de document ») :
   - `GET /api/document-types` (`?active=true`) → `DocumentTypeResponse[]`, **SUPER_ADMIN seulement** pour cette tranche (la checklist des tranches 2 et 3 donnera aux autres rôles ce dont ils ont besoin) ;
   - `POST` (201), `PUT /{id}` (200), `PATCH /{id}/activate` et `/deactivate` (200) : SUPER_ADMIN seulement ; `403` sinon, `404` si le type est inconnu ;
   - corps : `{ nom, aide, isRequired, isSensitive, appliesToAllFormations, categoryIds, deadlineDays, deadlineAnchor, allowedFormats }` ;
   - réponse : les mêmes champs avec `categories` (`CategoryResponse[]`) à la place de `categoryIds`, plus `id`, `isActive`, `createdAt`, `updatedAt` ; les booléens sont sérialisés `isRequired`, `isSensitive`, `isActive` (`@JsonProperty`, comme `CategoryResponse`).
4. **Validation** (`400`, message du back affiché tel quel, D12) : `nom` non vide, 255 au plus ; `aide` 500 au plus ; `appliesToAllFormations = true` exige `categoryIds` vide, `false` exige au moins une catégorie ; une catégorie inconnue répond `404` ; `deadlineDays` et `deadlineAnchor` ensemble ou aucun, jours de 0 à 365 ; `allowedFormats` dans {`pdf`, `jpg`, `jpeg`, `png`, `docx`, `xlsx`} (une liste vide vaut « règle générale ») ; nom déjà utilisé (casse ignorée) : `409`.
5. **Pas de verrou optimiste** (`version`) : comme les catégories, une seule chargée modifie le catalogue ; ajouter si le besoin apparaît.
6. **Les catégories désactivées restent liables** : une catégorie désactivée porte toujours des formations ; empêcher de la lier à un type n'apporte rien.

### Front

7. **`features/documentTypes/`** : `api.js` (`listDocumentTypes({ active })`, `createDocumentType`, `updateDocumentType`, `setDocumentTypeActive`), `hooks.js` (clé `['document-types']`, toute mutation l'invalide), `documentTypeForm.js` (logique pure et testée : validation, `toRequest`, `fromType`), `documentTypeLabels.js` (libellés des formats, des repères de délai et résumé de portée), pages et composants.
8. **Pages** (toutes derrière `RequireRole` chargée, `lazyPage`, `PageShell`, `BackButton`) :
   - `/admin/documents` : liste (nom, « Obligatoire » ou « Facultatif », « Sensible », portée, délai, état actif ou désactivé), « Nouveau type », « Modifier », « Désactiver » (`ConfirmDialog`, texte : « s'applique aux formations en cours », G27) et « Réactiver ». État vide : « Aucun type de document pour le moment ». Erreur de chargement avec « Réessayer ».
   - `/admin/documents/nouveau` et `/admin/documents/:id/modifier` : un même `DocumentTypeFormPage`. La modification lit le type dans la liste en cache (aucun `GET /{id}` n'est demandé au back) ; un type introuvable affiche « Type de document introuvable » avec retour.
9. **Formulaire** : champs nom, texte d'aide, case « Obligatoire », case « Sensible », portée (deux boutons radio « Toutes les formations » / « Certaines catégories », puis une case par catégorie active **et** par catégorie déjà liée), délai (liste « Aucun délai », « Jours avant le début », « Jours après la fin », puis un nombre), formats (une case par format ; aucune case cochée = « règle générale : PDF, JPG, JPEG, PNG, DOCX, XLSX, 10 Mo »). Erreurs liées aux champs, `409` sur le nom, aucun appel si le formulaire est invalide. Catégories lues avec `useCategories` (existant).
10. **Page Gestion** : `ManagementMenu` ne garde que trois tuiles, **Formations** (inchangée), **Documents** (chargée seulement : « Créer un type de document », « Consulter les types existants »), **Profils**. `ManagementTile` accepte `sections` (liste de `{ label, createLabel, listLabel, createPath, listPath }`) : « Profils » en porte deux, Formateurs et Stagiaires. Les liens de création restent réservés à la chargée (D54). Les règles d'accessibilité des tuiles ne changent pas : actions visibles sans survol, libellés jamais coupés à 320 px et 150 % (`page-layout`).
11. **Plan du site** : « Documents » ajouté pour la chargée seulement.
12. **Mocks de test** `src/test/documentTypes.js` : fixtures (types « toutes » et « par catégorie », actif et désactivé) et `mockDocumentTypes`, `mockCreateDocumentType`, `mockUpdateDocumentType`, `mockSetDocumentTypeActive` avec capture du corps.
13. **Données de développement** : la liste fictive (10 types à fournir, `documents-obligatoires-factices.md`) est ajoutée à `docs/dev/seed-local-admin.sql`, rejouable (`ON CONFLICT` sur le nom), liée aux catégories par leur nom.

## Risks / Trade-offs

- **Le schéma, les droits et l'interface étaient « mis de côté » (D66)** : ils sont validés par Manon (G19 à G32). Charlotte relit par PR ; la migration `V6` est le point le plus sensible de la relecture.
- **La liste de l'ADAC n'existe pas** : les types fictifs sont des données de développement, jamais de migration. Si l'ADAC répond autrement, seul le contenu du catalogue change, pas le modèle.
- **Formulaire plus long que les autres** : une page (pas une boîte de dialogue) pour tenir sur mobile ; la portée et le délai restent compacts (boutons radio, une liste).
- **Pas d'ordre d'affichage** (G30) : la liste est triée par nom, sans tenir compte de la casse ni des accents.

## Open Questions

Aucune bloquante. Hypothèses prises ci-dessus (points 4 à 6, 8, 9) à corriger à la relecture du plan : catégories désactivées liables, délai de 0 à 365 jours, pas de verrou optimiste, formulaire en page, lecture du type depuis la liste.
