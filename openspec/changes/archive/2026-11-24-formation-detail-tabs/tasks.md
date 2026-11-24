# Tasks

Front seul, branche `feature/formation-detail-tabs` créée depuis `dev`. TDD : chaque tâche commence par un test qui échoue pour la bonne raison (RED), puis le code minimal (GREEN). Un commit par groupe, en Conventional Commits.

## 1. Préparation

- [x] 1.1 Plan validé par Manon ; branche `feature/formation-detail-tabs` depuis `dev` ; `npm run check` vert au départ (vérifié par la sortie de la commande)

## 2. Composant `Tabs` (TDD)

- [x] 2.1 RED : `src/components/molecules/Tabs/Tabs.test.jsx` : rôles `tablist`/`tab`/`tabpanel`, `aria-selected`, panneau nommé par son onglet, panneaux inactifs `hidden` mais montés (un état local survit à un aller-retour), onglet par défaut, clic, ←/→ en boucle, Début/Fin, un seul onglet avec `tabIndex=0`, jest-axe. Vérifier RED
- [x] 2.2 GREEN : `Tabs.jsx` + `Tabs.module.css` (rem, jetons de couleur, focus visible, défilement horizontal sur mobile sans masquer de libellé). Vérifier `npm run test -- Tabs` vert et que les tests de feuilles de style passent

## 3. Calcul du suivi par inscrit (TDD)

- [x] 3.1 RED : `src/features/documents/inscritProgress.test.js` : seuls les dépôts du stagiaire comptent ; 8/10 avec deux fichiers sur un type ; 10/10 ; aucun type → « N documents envoyés » (singulier et pluriel) ; types indisponibles → nombre de fichiers ; fichiers hors créneau dans `others`. Vérifier RED
- [x] 3.2 GREEN : `inscritProgress.js` (`inscritDocumentProgress`, `progressLabel`) sur `splitBySlot`. Vérifier le test vert

## 4. Composants de documents par inscrit (TDD)

- [x] 4.1 RED : `InscritDocumentCount.test.jsx` (libellé, icône de réussite à Y/Y, chargement, erreur + « Réessayer » sans bloquer les autres) et `InscritDocumentsDetail.test.jsx` / `InscritsDocumentsPanel.test.jsx` (« Reçu »/« Manquant » par type, lien de téléchargement par blob, « Autres documents », nom de fichier rendu en texte, aucun inscrit, erreur des types affichée une fois), avec `mockDocumentApi()` et les mocks des types. Vérifier RED
- [x] 4.2 GREEN : les trois composants dans `src/features/documents/components/`, styles dans `Documents.module.css`. Vérifier ces tests verts

## 5. Page du détail en onglets (TDD)

- [x] 5.1 RED : mettre à jour `FormationDetailPage.test.jsx` : bloc d'informations et « Modifier »/« Archiver » avant la barre ; chargée/formateur → trois onglets, « Liste stagiaires » par défaut avec « X/Y documents reçus » ; « Inscrire des stagiaires »/« Désinscrire » seulement dans cet onglet et jamais sur une formation archivée ; « Documents ADAC » → liste et dépôt ; stagiaire → deux onglets, « Documents ADAC » par défaut, aucun appel aux inscriptions ; onglet conservé après un dépôt et après une désinscription (le bloc disparaît des deux onglets) ; erreur des inscrits dans l'onglet ; jest-axe pour chaque rôle. Vérifier RED
- [x] 5.2 GREEN : extraire `InscritsSection` vers `src/features/formations/components/InscritsPanel.jsx` (comptes à la place de `SentDocuments`) ; prop `titleClassName` sur `DocumentSection` et `MyDocumentsSection` (titre masqué visuellement dans l'onglet) ; composer la page avec `Tabs`. Vérifier les tests de la page et ceux de `router/` (`single-main`, `back-links`) verts
- [x] 5.3 Mise en page : `FormationPages.module.css` (barre sous les informations, panneaux espacés comme les sections), passage visuel à 375 px, 768 px et en bureau, en mode sombre et en contraste élevé (vérifié à l'écran)

## 6. Docs et décisions

- [x] 6.1 `docs/decisions/decisions-documents.md` : ajouter **G34** (onglets de la page de la formation ; résumé de G29 dans « Liste stagiaires », détail dans « Documents stagiaires » au lieu d'un dépliant ; profil inchangé ; alternatives : dépliant G29, tableau croisé). Note « modifié par G34 (page de la formation) » sous G29. Vérifier que les deux entrées se renvoient l'une à l'autre
- [x] 6.2 `docs/dev/etat-front.md` (section formations/documents : onglets, panneaux montés en `hidden`, sélecteurs de test) et `CLAUDE.md` (mock des types sur le détail de formation si les tests l'exigent). Vérifier en relisant que les deux fichiers décrivent l'état livré

## 7. Vérification

- [x] 7.1 `npm run check` vert (lint, tests, build, budget du bundle)
- [x] 7.2 Passage manuel sur le vrai back local avec les trois rôles : comptes cohérents avec les dépôts, inscription et désinscription, dépôt d'un document ADAC et d'un document stagiaire, navigation au clavier dans la barre
- [x] 7.3 Commit(s) en Conventional Commits sur `feature/formation-detail-tabs`, fusion en avance rapide dans `dev` ; pousser seulement sur demande de Manon (fusionné et poussé le 2026-11-24, branche locale supprimée)

## 8. Ajouts du 2026-11-23 (après un premier essai)

- [x] 8.1 Blocs repliables dans « Documents stagiaires » : tests RED (repliés à l'arrivée, clic, marque verte/rouge), `<details>` natif, styles ; tests verts (commit front `75d212a`)
- [x] 8.2 Back (plan validé par Manon) : `providedBy` sur `feature/document-types` en TDD (V7, enum, DTO, service), docs du back, `mvn test` 698 verts, commit `a9c8855`, fusion dans `local/integration` (`58bd39c`), back local reconstruit (V7 appliquée)
- [x] 8.3 Front : « Fourni par » dans le formulaire et la liste du catalogue, `typesProvidedBy`, exclusion des types `ADAC` du compte et de « Mes documents », créneaux `ADAC` dans « Documents ADAC ». Tests RED puis verts
- [x] 8.4 Docs : G35 et précision sous G34, `changements-back.md`, `etat-front.md`, `CLAUDE.md`, specs de ce change
- [x] 8.5 Passage manuel : passer un type en « L'ADAC » dans Gestion > Documents, vérifier les créneaux, le compte et « Mes documents »

## Workflow follow-up

- Archiver le change (`/opsx:archive`) et synchroniser les specs `formation-browsing`, `formation-inscriptions`, `formation-documents`, `formation-detail-layout`, `inscrit-documents-progress`.
- Pousser `feature/document-types` du back (PR #27) seulement quand Manon le décide.
