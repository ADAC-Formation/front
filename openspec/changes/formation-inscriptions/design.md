# Design

Décisions : `docs/decisions/decisions-inscriptions.md` (J1 à J9).

## 1. Contrat back après le change

| Appel | Avant | Après |
|---|---|---|
| `POST /formations/{id}/inscriptions` `{ stagiaireId }` | `404` si le stagiaire n'est pas actif | `404` seulement s'il est inconnu, pas `STAGIAIRE`, ou **suspendu** (inactif et déjà activé une fois, `activationService.hasEverActivated`) ; un compte jamais activé est inscrit (`201`) |
| `DELETE /formations/{id}/inscriptions/{stagiaireId}` | supprime la ligne ; `500` si l'inscription a des documents (clé étrangère) | formation archivée → `409 « Formation archivée »` ; sinon supprime les documents de l'inscription puis l'inscription (même transaction), puis les fichiers du stockage (échec journalisé, `204` quand même) ; toujours idempotent |

Inchangés : `201` / `400` (archivée) / `409` (déjà inscrit) du `POST`, rôle SUPER_ADMIN, réponses `InscriptionResponse`.

## 2. Back : mise en œuvre

- `InscriptionServiceImpl.findStagiaireOrThrow` : `!user.isActive() && activationService.hasEverActivated(user)` → `404` (le message reste « Stagiaire introuvable »).
- `deleteInscription` : `findFormationOrThrow`, refus si `ARCHIVED` (`ConflictException`, même texte que `DocumentServiceImpl`), puis recherche de l'inscription (absente → retour sans erreur), lecture des documents de l'inscription (`DocumentRepository.findAllByInscription`), mémorisation des `storagePath`, suppression des documents puis de l'inscription, puis `storageService.delete` par chemin dans un `try/catch` journalisé. La suppression dans le stockage après la transaction suit `DocumentServiceImpl.deleteDocument`.
- Pas de migration (pas de `ON DELETE CASCADE` : la suppression reste explicite et testée).

## 3. Front : données

- `features/formations/api.js` : `enrollStagiaire(formationId, stagiaireId)` → `POST`, `unenrollStagiaire(formationId, stagiaireId)` → `DELETE`.
- `features/formations/hooks.js` : `useEnrollStagiaires()` envoie une liste de couples `{ formationId, stagiaireId }` **l'un après l'autre** (pas en parallèle : ordre lisible et pas de rafale sur le back) et renvoie `{ enrolled: [...], failed: [{ …, message }] }` ; un `409` compte comme inscrit. `useUnenrollStagiaire()`. Les deux invalident `['formations']`, les inscrits de la formation et `GET /users/{id}/inscriptions` du stagiaire.
- Règle pure `inscriptionOutcome.js` : transforme les résultats en texte du récapitulatif (J4) ; message du back affiché en texte ; erreur réseau → « Erreur de connexion ».

## 4. Front : écrans

- **`FormationPicker`** (`features/formations/components/`) : `fieldset` « Formations (facultatif) », recherche sans casse ni accents (même `normalize` que `StagiairePicker`), cases natives « Intitulé — du … au … », compte « N formations sélectionnées » annoncé. Données : `useFormations({ status: 'ACTIVE' })`. Composant contrôlé (`selectedIds`, `onChange`), option `excludeIds`.
- **Création d'un stagiaire** (`AccountFormPage`, `kind === 'stagiaires'` et création seulement) : `FormationPicker` sous les champs d'identité. À l'envoi : `POST /users` ; si aucune formation n'est cochée, parcours inchangé (liste + « Compte créé ») ; sinon `useEnrollStagiaires`, puis la page du stagiaire avec `location.state.enrollment` (récapitulatif, aucun stockage navigateur). Une erreur de création du compte ne lance aucune inscription.
- **Page du stagiaire** (`AccountDetailPage`, chargée de formation) : section « Formations » avant « Documents » : ses inscriptions (`useStagiaireInscriptions`), chacune avec un lien vers la formation et « Désinscrire » si la formation est active ; « Inscrire à une formation » ouvre `FormationPicker` (formations déjà suivies exclues) avec « Inscrire » / « Annuler » ; récapitulatif J4 en tête de section (`role="status"`). Le formateur voit la liste sans action.
- **Page de la formation** (`FormationDetailPage`, chargée de formation, formation active) : dans « Stagiaires inscrits », bouton « Inscrire des stagiaires » qui ouvre `StagiairePicker` (inscrits exclus, jamais activés inclus) avec « Inscrire » / « Annuler » ; « Désinscrire » par ligne ; récapitulatif J8 par nom.
- **`StagiairePicker`** : nouvelles options `includePending` (charge `GET /users/stagiaires` sans filtre et garde actifs + jamais activés, jamais les suspendus, `accountStatus`) et `excludeIds`. Par défaut, comportement inchangé pour le message groupé.
- **Désinscrire** : `ConfirmDialog` « Désinscrire Prénom Nom de « Intitulé » ? Ses documents déposés sur cette formation seront supprimés définitivement. » ; le nombre de documents est ajouté quand la page le connaît déjà (page de la formation : listes `SentDocuments`), sans appel de plus. Erreur du back affichée en texte dans la boîte.

## 5. Tests

- Back : `InscriptionServiceImplTest` (jamais activé inscrit, suspendu refusé, archivée `409` à la désinscription, documents et fichiers supprimés, stockage en échec sans erreur, idempotence conservée), `InscriptionControllerTest` (`409`), un test sur base réelle de la désinscription avec un document (la clé étrangère qui faisait le `500`).
- Front : tests de `FormationPicker`, `inscriptionOutcome`, des hooks ; pages (`AccountFormPage`, `AccountDetailPage`, `FormationDetailPage`) avec mocks MSW, rôles (formateur sans action), formation archivée sans action, échec partiel, un check jest-axe par page touchée.
