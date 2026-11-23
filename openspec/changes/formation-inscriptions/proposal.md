# Proposal

## Why

La chargée de formation ne peut toujours pas inscrire un stagiaire à une formation depuis le portail : le front l'avait reporté (F3, `spec.md`), alors que le back a les routes depuis le début. Manon a tranché le 2026-11-23 (`docs/decisions/decisions-inscriptions.md`, J1 à J9) : quelle que soit la discussion avec Fatma, la chargée inscrit ses stagiaires dès la création de leur profil, puis depuis la page du stagiaire ou celle de la formation (point 10 des notes ADAC).

## What Changes

- **Back (changements demandés et validés par Manon, D66, branche depuis `origin/dev`)** :
  - `POST /formations/{id}/inscriptions` accepte un stagiaire **jamais activé** ; un stagiaire suspendu reste refusé (`404`) (J2).
  - `DELETE /formations/{id}/inscriptions/{stagiaireId}` supprime aussi les documents de l'inscription (lignes, puis fichiers du stockage, échec du stockage journalisé) au lieu de finir en `500` (J6), et répond `409 « Formation archivée »` sur une formation archivée (J7).
  - `tech.md`, un ticket (`TICKET-053`) et `TICKETS.md` sont mis à jour.
- **Front** (chargée de formation seulement, J5) :
  - Formulaire de création d'un stagiaire : section « Formations (facultatif) », cases des formations actives avec recherche (J3). Après création, un `POST` par formation cochée ; récapitulatif sur la page du stagiaire (J4).
  - Page du stagiaire : « Formations » avec « Inscrire à une formation » et « Désinscrire » (confirmation qui annonce la perte des documents, J6).
  - Page de la formation, « Stagiaires inscrits » : « Inscrire des stagiaires » (`StagiairePicker` réutilisé, J8) et « Désinscrire » par ligne.
  - Rien de tout cela sur une formation archivée (J7) ; ni le formateur ni le stagiaire ne voient ces actions.

Hors périmètre (`docs/future-implementation-ideas.md`) : choisir les stagiaires en créant une formation, formations dans le formulaire de modification d'un stagiaire (J5), notification ou e-mail d'inscription (J9). Pas de changement de schéma.

## Capabilities

### New Capabilities
- `formation-inscriptions` : inscrire et désinscrire un stagiaire, à la création de son profil, depuis sa page et depuis la page de la formation.

### Modified Capabilities
- Aucune exigence existante n'est retirée. Le report « inscrire / désinscrire » de `formation-browsing` (F3) est levé par ce change.

## Impact

- **Back** (`back-readonly`, branche `feature/formation-inscriptions`) : `InscriptionServiceImpl` (et son test), `DocumentRepository` (documents d'une inscription), `docs/tech.md`, `docs/tickets/TICKET-053.md`, `docs/TICKETS.md`.
- **Front** : `features/formations/` (`api.js` : `enrollStagiaire`, `unenrollStagiaire` ; `hooks.js` ; `FormationDetailPage` et un composant de gestion des inscrits) ; `features/accounts/` (`AccountFormPage`, `AccountDetailPage`) ; un sélecteur de formations (`FormationPicker`) ; `features/messagerie/components/StagiairePicker` (options : comptes jamais activés inclus, identifiants exclus) ; `src/test/` (mocks MSW `POST` / `DELETE` des inscriptions).
- **Docs** : `decisions-inscriptions.md` (fait), `docs/charlotte/changements-back.md`, `etat-front.md`, `CLAUDE.md`, `docs/projet/spec.md`.
- **Dépendance Charlotte** : aucune pour développer ; relecture par PR. Point à lui signaler : la désinscription supprime définitivement des documents (preuves Qualiopi).
