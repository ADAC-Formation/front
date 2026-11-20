# Décisions — Import de comptes par fichier Excel (NOTES-09)

Préfixe **I**. Back : TICKET-051 (`POST /api/users/import`), fait par Manon sur la branche `feature/user-import` du back (D66, journal : `docs/charlotte/changements-back.md`).

## I1 — Un seul fichier, ligne par ligne, sans formation
- Date : 2026-11-20
- **Décision** (Manon) : (1) un seul fichier pour les formateurs et les stagiaires, avec une colonne `role` (`Formateur` | `Stagiaire`) ; colonnes A `nom`, B `prenom`, C `email`, D `role`, en-tête ignoré, 200 lignes au plus ; (2) **ligne par ligne** : les lignes valides créent un compte en attente d'activation (e-mail d'activation, comme la création unitaire), les lignes invalides sont renvoyées avec leur ligne, leur colonne et le problème ; (3) un e-mail déjà utilisé par un compte, ou répété dans le fichier, est une erreur de ligne : un compte existant n'est jamais modifié ; (4) aucune inscription à une formation (NOTES-10, en attente de l'ADAC).
- **Pourquoi** : la chargée de formation importe tout le monde d'un coup ; ligne par ligne, elle corrige seulement les lignes signalées et les réimporte (les lignes déjà créées seraient refusées comme « e-mail déjà utilisé », sans doublon).
- **Alternatives écartées** : un import par rôle (deux modèles, deux boutons) ; tout ou rien comme l'import des formations (une seule faute bloque tout le fichier) ; ignorer silencieusement les e-mails existants.

## I2 — Écran
- Date : 2026-11-20
- **Décision** : page « Importer des comptes » (`/admin/comptes/importer`, chargée de formation seulement), sur le modèle de l'import des formations (mêmes styles, même contrôle du fichier `checkImportFile` : `.xlsx`, 2 Mo). Accès : « Importer depuis Excel » dans l'en-tête des listes Formateurs et Stagiaires et dans leurs tuiles du menu Gestion. Le modèle est généré au clic (`importAccountTemplate.js`), avec une liste déroulante Formateur / Stagiaire ; les colonnes ne sont citées que dans `importAccountColumns.js`. Résultat affiché sur la page : « N comptes créés » (ou « Aucun compte n'a été créé. »), puis le tableau « Lignes non importées » (Ligne / Colonne / Problème). Un fichier refusé en entier (`400`) affiche le message du back. Les textes du back sont rendus en texte. Les listes de comptes sont rechargées après un import.
