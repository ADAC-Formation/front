# Design

## Context

`FormationDetailPage.jsx` rend aujourd'hui, dans une seule `<article>`, les informations, `InscritsSection` (défini dans la page, avec `SentDocuments` en ligne : coche + liens, G17), `DocumentSection` et, pour le stagiaire, `MyDocumentsSection`. Le projet n'a aucun composant d'onglets. Les briques à réutiliser existent déjà : `useInscriptions(formationId)`, `useDocuments({ inscriptionId })` (une requête par inscrit, déjà émise par `SentDocuments`), `useFormationDocumentTypes(formationId)` (`GET /formations/{id}/document-types`, ouvert aux trois rôles, `tech.md`), `splitBySlot(types, documents)` (rattachement par nom, G33), `useDownloadDocument`. Motivation : voir proposal.md.

## Goals / Non-Goals

**Goals:**
- Un composant d'onglets accessible, réutilisable, sans dépendance nouvelle.
- Le compte « X/Y » et le détail par type calculés par une seule fonction pure, testée seule.
- Aucune requête de plus qu'aujourd'hui (le seul appel nouveau pour la gestion est celui des types, une fois par formation).

**Non-Goals:**
- Onglet dans l'URL, chargement paresseux des panneaux, refonte visuelle de la carte d'informations.
- Toucher à `SentDocuments` / `StagiaireDocumentsSection` du profil.

## Decisions

### 1. `Tabs` dans `src/components/molecules/Tabs/`
API : `<Tabs label="…" tabs={[{ id, label, panel }]} defaultTabId />`. Le composant gère l'état sélectionné (`useState`, initialisé à `defaultTabId`), les rôles ARIA, les `id` (`useId`), le roving tabindex et les touches ←/→/Début/Fin avec activation immédiate. C'est une UI partagée sans logique métier, donc elle va dans `components/` (D32).
*Alternatives* : une bibliothèque (Radix, Headless UI) : dépendance et budget de bundle pour ~80 lignes. Des boutons sans motif ARIA : non conforme WCAG.

### 2. Panneaux tous montés, les inactifs avec `hidden`
Les trois (ou deux) panneaux sont rendus en même temps ; seul l'actif est visible. Cela garde l'état local d'un panneau quand on change d'onglet (picker « Inscrire » ouvert, avis de dépôt, confirmation en cours) et cela ne coûte rien de plus : aujourd'hui toutes les sections sont déjà montées et font les mêmes requêtes.
*Alternative* : ne monter que l'onglet actif. L'état serait perdu à chaque changement, et le compte de « Liste stagiaires » se rechargerait en revenant (cache TanStack, mais avec un clignotement).

### 3. Calcul pur `inscritDocumentProgress(types, documents, stagiaireId)`
Fichier `src/features/documents/inscritProgress.js`. Il filtre les documents déposés par le stagiaire (`uploadedBy.id`, comme G17), appelle `splitBySlot`, et renvoie `{ slots, others, received, total, sentCount }`. `received` = créneaux avec au moins un fichier, `total` = `types.length`, `sentCount` = nombre de fichiers envoyés. Le libellé (« X/Y documents reçus » ou « N document(s) envoyé(s) » si `total === 0` ou types en erreur) est fait par `progressLabel(progress, { typesAvailable })` dans le même fichier.
*Alternative* : calculer dans chaque composant. Les deux onglets doivent afficher exactement le même compte, donc on le calcule une seule fois.

### 4. Composants de documents par inscrit
Dans `src/features/documents/components/` :
- `InscritDocumentCount` (ligne de « Liste stagiaires ») : `useDocuments({ inscriptionId })` + types passés en prop ; icône `CircleCheck` si `received === total > 0`, sinon `CircleDashed` ; états chargement/erreur avec « Réessayer » par ligne.
- `InscritDocumentsDetail` (bloc de « Documents stagiaires ») : `<section aria-labelledby>` titré du nom, compte, liste des types (« Reçu » / « Manquant », liens de téléchargement en `linkButton` comme `SentDocuments`), puis « Autres documents ».
- `InscritsDocumentsPanel` : `useInscriptions` + `useFormationDocumentTypes`, un `InscritDocumentsDetail` par inscrit, l'erreur des types affichée une fois.
Chaque onglet lit les types avec `useFormationDocumentTypes` (même clé de requête : un seul appel) ; la page n'appelle aucun hook après ses retours anticipés.

### 5. Découpage de la page
`InscritsSection` sort de la page vers `src/features/formations/components/InscritsPanel.jsx` (liste + inscrire + désinscrire, `SentDocuments` remplacé par `InscritDocumentCount`). La page compose : en-tête (infos + actions de la chargée + erreurs d'archivage), puis `<Tabs>` avec les panneaux selon le rôle. `DocumentSection` et `MyDocumentsSection` deviennent le contenu des panneaux. Leur `<h2>` est gardé mais masqué visuellement (prop `titleClassName`, la page passe `srOnly`) : l'onglet nomme le panneau, et le titre garde la navigation par titres et l'ordre h1 → h2 → h3. Les autres appelants ne changent pas.

### 6. Désinscription et inscription
`useEnrollStagiaires` et `UnenrollDialog` invalident déjà `['formations', …]`, ce qui recharge `useInscriptions` : comme les deux onglets lisent la même requête, ils se mettent à jour ensemble sans code de plus.

## Risks / Trade-offs

- [Panneaux cachés encore dans le DOM : `getByText` des tests trouve du texte masqué] → tests avec `getByRole` (qui ignore `hidden`) et sélection explicite de l'onglet avant les assertions ; mise à jour des tests existants de la page.
- [Rattachement par nom de fichier (G33) : renommer un type détache ses fichiers et fait baisser le compte] → limite déjà acceptée dans G33 ; disparaîtra avec `documentTypeId` (demande à Charlotte).
- [Une requête par inscrit (N+1, comme aujourd'hui)] → inchangé ; un endpoint de checklist par formation est prévu à la tranche 3 (G31).
- [Changement de G29 pour la page de la formation] → consigné en G34, profil inchangé.
- [Le stagiaire ne voit plus le nombre d'inscrits] → c'était déjà le cas (`isManager`), aucun changement.

## Migration Plan

Front seul, sans données ni contrat touchés : la livraison et le retour arrière se font par le seul commit.
