# Design

## Context

- Contrat (`tech.md` §3 et §6, TICKET-026) : `GET /formations` (stagiaire : uniquement ses formations) ; `GET /documents?inscriptionId=` (stagiaire : sa propre inscription) → `DocumentResponse[]` ; `POST /documents` multipart (`file` + exactement un de `formationId` / `inscriptionId` ; stagiaire : `inscriptionId` de sa propre inscription, sinon `403`) ; `GET /documents/{id}/download` ; `DELETE` autorisé au stagiaire sur ses propres dépôts seulement (`403` sinon, G15).
- **Contrat (G8, G15)** : `FormationResponse.inscriptionId` est renseigné par le back pour le seul stagiaire inscrit (Q13 traitée le 2026-11-09).
- État actuel : `features/documents/` (change `formation-documents`) fournit `api.js` (`uploadDocument(file, formationId)`), `hooks.js` (`useDocuments`, `useUploadDocuments`, `useDeleteDocument`, `useDownloadDocument`), `documentFiles.js` (règles pures), `DocumentDropzone` (« réutilisable par 028 »), `DocumentList` (affiche l'expéditeur, `canDelete` par document) et `DocumentSection` (formation). La page de profil est un bouchon `<div>ProfilePage</div>` dans `components/Pages/Stagiaire/ProfilePage/`, routé sur **`/profile`** (tuile du tableau de bord, plan du site) ; les décisions écrivaient « `/profil` » par erreur : la route existante est conservée.
- Voir `proposal.md` et `docs/decisions-documents.md` (G8–G12).

## Goals / Non-Goals

**Goals:**
- Réutiliser telles quelles la zone de dépôt, la liste, le téléchargement et les règles de fichier de 027 ; aucun doublon de logique.
- Un seul point du code lit `inscriptionId` : changer de contrat (champ sur la formation, ou `GET /inscriptions/me`) ne touche qu'un fichier.
- Aucun appel ni bouton menant à une erreur évitable (pas de dépôt sans `inscriptionId`, « Supprimer » seulement sur ses propres dépôts).

**Non-Goals:**
- Voir ces documents côté chargée de formation (US-010), reste du profil (044), suppression par le stagiaire, toute modification du back ou de `tech.md`.

## Decisions

### 1. Cible de dépôt généralisée, 027 inchangé
`uploadDocument(file, target)` prend `{ formationId }` ou `{ inscriptionId }` et écrit exactement l'un des deux champs multipart ; une cible avec les deux ou aucun lève une erreur de programmation (jamais envoyée au back). `useUploadDocuments(target)` et `useDocuments(target)` suivent. Clés : formation inchangée `['documents', formationId]` (les tests de 027 restent valides), inscription `['documents', 'inscription', inscriptionId]` ; `useDeleteDocument` invalide déjà le préfixe `['documents']`.
- Alternatives : fonctions dupliquées `uploadStagiaireDoc` / `getStagiaireDocuments` comme le ticket (doublon du multipart, du contrôle et des erreurs par fichier) ; nouvelle clé `['documents', 'formation', id]` (réécrit les tests de 027 sans gain).

### 2. `inscriptionIdOf(formation)` dans `documentFiles.js`
Fonction pure, seul point qui lit `formation.inscriptionId` (`null` si absent ou non numérique). Test unitaire avec et sans le champ. Quand la réponse de Charlotte arrivera (autre champ, ou `GET /inscriptions/me`), seuls cette fonction et la source des formations changent.

### 3. `DocumentList` : expéditeur et suppression facultatifs
Nouvelle propriété `showSender` (vrai par défaut : 027 inchangé) ; `canDelete` absent ou `() => false` retire « Supprimer ». Le stagiaire passe `showSender={false}` et un `canDelete` limité à ses propres dépôts (G15). Les formations, qui n'ont pas besoin de nom d'expéditeur côté stagiaire (ce sont ses envois), n'affichent ni prénom ni nom.

### 4. `StagiaireDocSection` et sa sous-section par formation
`features/documents/components/StagiaireDocSection.jsx` : `useFormations()` (clé `['formations','list','all']`, déjà utilisée par la liste), tri stable actives puis archivées, une `<section>` titrée `<h3>` par formation sous un `<h2>` « Mes documents ». États : chargement annoncé, erreur avec « Réessayer », aucune formation. Le composant interne `InscriptionDocuments` (formation) :
- sans `inscriptionIdOf` : « Dépôt indisponible pour le moment », aucun hook de documents activé (`enabled` faux) ;
- sinon : `useDocuments({ inscriptionId })`, `useUploadDocuments({ inscriptionId })`, `useDownloadDocument()`, `DocumentList` (sans expéditeur, sans suppression), `DocumentDropzone` seulement si `status !== 'ARCHIVED'`, et les mêmes avis qu'en 027 (succès `Alert`, refus `role="alert"` listés par fichier, erreur de téléchargement).
Chaque sous-section a ses propres états (une erreur de liste ne masque pas les autres formations). Pour éviter de recopier les avis de `DocumentSection`, ils sont extraits dans un petit composant `UploadNotices` utilisé par les deux (refactor sans changement de comportement, couvert par les tests de 027).
- Alternative : un seul état partagé pour toutes les formations (envoi d'une formation qui bloque les autres) ; refusée.

### 5. Page de profil et route
`features/profile/pages/ProfilePage.jsx` (D32) : `PageShell`, `<h1>` « Mon profil », puis `StagiaireDocSection` si `user.role === ROLES.STAGIAIRE` (`useCurrentUser`). Le dossier `components/Pages/Stagiaire/ProfilePage/` est supprimé ; `router.jsx` charge la page avec `lazyPage` (D59) sur la même route `profile`. Le budget du bundle reste inchangé (la page est hors de l'entrée).

### 6. Tests (MSW, TDD)
`src/test/documents.js` : `mockDocumentApi` gère déjà la liste par `formationId` ; on ajoute la liste et le dépôt par `inscriptionId` (état en mémoire séparé, `calls.uploaded` garde `{ name, formationId, inscriptionId }`). Tout test qui rend `ProfilePage` en stagiaire déclare `mockDocumentApi()` et la liste des formations ; celui d'un ADMIN prouve qu'aucun appel `/documents` n'est émis (appel non déclaré = échec). Un check jest-axe sur la page en stagiaire.

## Risks / Trade-offs

- **Passage manuel** : le contrat est confirmé par le back (G15) ; le « Done » du ticket (D30) reste **ouvert** jusqu'au passage manuel sur le back reconstruit depuis `dev`.
- **Formation archivée** : règle d'interface seulement (G3/G10), le back accepte encore le dépôt.
- **Suppression** : le stagiaire retire ses propres dépôts ; le contrôle « seulement les siens, formation active » est une règle d'interface, le back ne vérifie que l'auteur.
- **Liste des formations** : `GET /formations` sans pagination (hors périmètre V1) ; une sous-section par formation lance une requête de documents par formation, acceptable pour quelques inscriptions par stagiaire.
