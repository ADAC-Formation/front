## 1. Préparation

- [x] 1.1 Vérifier que l'on est sur `feature/formations` (créée depuis `dev`), que `npm run check` est vert au départ et que `git -C ../../back-readonly status` est propre
- [x] 1.2 Rafraîchir le back (`git -C ../../back-readonly pull`) et relire `tech.md` §4–5 et les DTOs `FormationResponse` / `InscriptionResponse` ; noter dans `docs/points-pour-charlotte.md` tout écart constaté
- [x] 1.3 Écrire dans `docs/spec.md` les critères de TICKET-024 tirés de la spec du change (`formation-browsing`), pour validation de Manon ; vérifier que le fichier les contient

## 2. API et hooks des formations (TDD)

- [x] 2.1 Créer `src/test/formations.js` (formations et inscrits fictifs au format de `tech.md`, `mockFormationList` avec `?status`, `mockFormationDetail` 200/403/404, `mockInscriptions` 200/500, `mockArchive` 200/409) ; vérifier qu'un appel non déclaré fait échouer le test
- [x] 2.2 RED : `src/features/formations/hooks.test.jsx` — la liste transmet `status`, le détail remonte `404` et `403` en `ApiError`, les inscrits ne sont pas demandés quand `enabled` est faux, l'archivage appelle `PATCH …/archive` et invalide la liste et le détail, le `409` remonte ; confirmer RED
- [x] 2.3 Créer `api.js` et `hooks.js` (`useFormations`, `useFormation`, `useInscriptions`, `useArchiveFormation`) ; `npm run test -- formations` GREEN
- [x] 2.4 Commit `feat: add formations API and query hooks`

## 3. Logique d'affichage de la liste (TDD)

- [x] 3.1 RED : `listView.test.js` — recherche (intitulé, formateur, catégorie, insensible à la casse), tri (date, intitulé, formateur), filtre « Mes formations » par `formateur.id`, formatage des dates et libellés de modalité (`formationLabels.js`) ; confirmer RED
- [x] 3.2 Créer `listView.js` et `formationLabels.js` (fonctions pures) ; GREEN
- [x] 3.3 Commit `feat: add formation list filtering and labels`

## 4. Liste des formations (TDD)

- [x] 4.1 RED : `FormationListPage.test.jsx` — chargement, cartes (intitulé, dates, formateur, inscrits, catégorie), vide, erreur + « Réessayer », « Archivées » appelle `status=ARCHIVED` et affiche le badge, recherche sans nouvel appel, `ADMIN` : « Mes formations » par défaut puis « Toutes », `STAGIAIRE` : titre « Mes formations » sans lien « Créer » ni « Gérer les catégories », `SUPER_ADMIN` : les deux liens, catégorie désactivée lisible, check jest-axe ; confirmer RED
- [x] 4.2 Adapter `ListItem` (couleur de catégorie en propriété `categoryColor`, plus d'import de `utils/categories`) avec son test, créer `FormationListPage` (même design que la page actuelle, D41/D56, `PageShell`, `BackButton`) ; GREEN
- [x] 4.3 Commit `feat: wire formation list to the API`

## 5. Détail et archivage (TDD)

- [x] 5.1 RED : `FormationDetailPage.test.jsx` — champs affichés, description absente non rendue, contenu `<script>` rendu en texte, badge « Archivée » sans action, `404` « Formation introuvable ou non accessible », `403` « Accès refusé », inscrits listés pour `SUPER_ADMIN` et `ADMIN`, aucun appel aux inscriptions pour `STAGIAIRE` (nombre seul), erreur des inscrits isolée avec « Réessayer », section « Documents » sans appel `/documents`, bouton « Archiver » seulement pour `SUPER_ADMIN` sur une formation active, confirmation / annulation (focus revient sur le bouton), succès → retour à la liste avec bandeau, `409` → message de rechargement, check jest-axe ; confirmer RED
- [x] 5.2 Créer `FormationDetailPage` (réutilise `ConfirmDialog`, `Alert`) ; GREEN
- [ ] 5.3 Commit `feat: wire formation detail and archiving to the API`

## 6. Routes, nettoyage et vérifications (TDD)

- [ ] 6.1 RED : tests du routeur — visiteur redirigé vers `/login` sur `/formations` et `/formations/:id`, les trois rôles accèdent à la liste, `/formations/creer` et `/formations/categories` restent réservés à `SUPER_ADMIN` ; confirmer RED (ou GREEN si déjà couvert, le dire)
- [ ] 6.2 Pointer `router.jsx` sur `features/formations` (`lazyPage`), supprimer `components/Pages/FormationsPage`, `components/Pages/FormationDetails` et `utils/simFormations.jsx` (déplacer leurs feuilles de style) ; vérifier qu'aucun import ne subsiste (`grep simFormations src`) ; `utils/categories.js` reste pour 025/048/049
- [ ] 6.3 `npm run check` vert (lint + tests + build + budget du bundle, une page ajoutée via `lazyPage`)
- [ ] 6.4 Commit `refactor: remove mocked formations data and old formation pages`

## 7. Documentation et passage manuel

- [ ] 7.1 Mettre à jour `CLAUDE.md` (« État actuel » : formations liste et détail branchés, `simFormations.jsx` supprimé, `categories.js` restant), `docs/decisions-formations.md` si une décision a évolué, et `docs/points-pour-charlotte.md` (comportement observé du formateur, Q3 et Q9 toujours ouvertes)
- [ ] 7.2 Commit `docs: record formations list and detail`
- [ ] 7.3 Passage manuel contre le vrai back local (comptes de `docs/dev/seed-local-admin.sql`, formations créées par SQL ou Swagger) : liste et détail pour les trois rôles, filtre actives / archivées, recherche, archivage avec confirmation, `404` formateur sur une formation d'un autre, `403` stagiaire non inscrit, lecture au clavier et zoom 200 % — ne pas cocher sans l'avoir fait (Docker requis)
- [ ] 7.4 Relecture de Manon ; la PR unique vers `dev` ne se fait qu'au dernier ticket de `feature/formations` (025) et à sa demande, aucun push avant

## Workflow follow-up

- Archiver le change après relecture (`/opsx:archive`) et lister les demandes encore ouvertes pour Charlotte (Q3, Q9).
