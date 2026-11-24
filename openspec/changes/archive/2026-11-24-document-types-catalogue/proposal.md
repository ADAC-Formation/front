# Proposal

## Why

La chargée de formation doit pouvoir définir elle-même les pièces que les stagiaires fournissent (pièce d'identité, certificat médical…) au lieu de les attendre d'un développeur. C'est la tranche 1 de la checklist des documents (`docs/decisions/decisions-documents.md` G19 à G32) : le **catalogue des types de document** et sa page de gestion. Les tranches suivantes (checklist du stagiaire, vue de la chargée et du formateur, retrait du filtre « Documents manquants ») lisent ce catalogue.

## What Changes

- **Back (changement demandé et fait par Manon, D66, branche depuis `origin/dev`)** : nouvelle table `document_types` et sa liaison aux catégories (migration `V6`), entité, dépôt, service et contrôleur `/api/document-types` : lister (chargée seulement), créer, modifier (`PUT`), activer et désactiver, sur le modèle des catégories. Aucune suppression (on désactive, G30). `tech.md`, `DB_MODEL` et un ticket sont mis à jour.
- **Front** :
  - « Gestion » (`/admin/gestion`) devient **Formations, Documents, Profils** (G32) : la tuile Documents (chargée seulement) mène au catalogue ; la tuile Profils regroupe deux sections, Formateurs et Stagiaires.
  - Pages `/admin/documents` (liste, état actif ou désactivé, modifier, désactiver ou réactiver avec confirmation), `/admin/documents/nouveau` et `/admin/documents/:id/modifier` (formulaire).
  - Un type a : nom, texte d'aide, sensible, portée (toutes les formations ou une ou plusieurs catégories), délai optionnel (N jours avant le début ou après la fin), formats acceptés optionnels, actif (G30). Le champ « obligatoire ou facultatif » prévu au départ a été retiré (G33, 2026-11-21) : tout type applicable est à envoyer.
  - (G33) « Mes documents » du stagiaire montre un créneau rouge ou vert par type à envoyer ; les types d'une formation sont lus par `GET /api/formations/{id}/document-types`.
- **Données de départ (développement seulement)** : la liste fictive `docs/adac/documents-obligatoires-factices.md` est ajoutée à `docs/dev/seed-local-admin.sql`. Aucune donnée dans la migration : rien de fictif ne doit exister en production.
- Plan du site : `Documents` ajouté pour la chargée.

Hors périmètre (tranches 2 à 4, G31) : dépôt typé, checklist, « non applicable », délais calculés et « en retard », vue du formateur, règles des types sensibles à la lecture des fichiers, retrait de `MISSING_DOCS`. Hors périmètre aussi : ordre d'affichage réglable, validation des documents, relances (`docs/future-implementation-ideas.md`).

Les points « parqués » de D66 (schéma, droits, interface) sont **validés par Manon** par les décisions G19 à G32 du 2026-11-20.

## Capabilities

### New Capabilities
- `document-types`: catalogue des types de document : liste, création, modification, activation et désactivation par la chargée de formation.

### Modified Capabilities
- `page-layout`: la page « Gestion » passe à trois tuiles (Formations, Documents, Profils) ; la tuile Profils regroupe Formateurs et Stagiaires (routes inchangées) ; Documents n'est visible que pour la chargée.

## Impact

- **Back** (`back-readonly`, branche `feature/document-types`) : `src/main/resources/db/migration/V6__add_document_types.sql`, entité `DocumentType`, `DocumentTypeRepository`, `DocumentTypeService(Impl)`, `DocumentTypeController`, DTO de requête et de réponse, mapper ; tests (service, contrôleur, dépôt) ; `docs/tech.md` (nouvelle section), `docs/DB_MODEL.md` et `.mmd`, nouveau ticket dans `docs/tickets`.
- **Front** : nouveau `src/features/documentTypes/` (`api.js`, `hooks.js`, `documentTypeForm.js`, pages et composants) ; `components/Pages/ManagementMenu`, `components/molecules/ManagementTiles` (tuile à deux sections) ; `components/Pages/SiteMapPage` ; `router/router.jsx` (trois routes, chargée seulement, `lazyPage`) ; `src/test/documentTypes.js` (fixtures et mocks MSW) ; `docs/dev/seed-local-admin.sql`.
- **Docs** : `decisions-documents.md` (fait), `docs/charlotte/changements-back.md`, `etat-front.md`, `CLAUDE.md`, `docs/projet/spec.md`.
- **Dépendance Charlotte** : aucune pour développer ; sa relecture se fait par PR.
