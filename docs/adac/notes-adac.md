# Notes de l'ADAC — corrections demandées sur le portail

> **Source.** Notes manuscrites de Manon, photographiées puis transcrites le 2026-11-11. Les passages entre crochets sont des lectures incertaines. Les précisions du 2026-11-12 viennent de Manon elle-même.
> **Statut.** Ce document n'est pas une décision : aucune correction ci-dessous n'est planifiée tant que Manon ne l'a pas retenue. Tout point qui exige une donnée ou un endpoint est marqué « back » et passe par `points-pour-charlotte.md`.

## 1. Transcription fidèle

Lignes dans l'ordre de la feuille. `[…]` = lecture incertaine.

**En haut**

- Rediscuter le concept d'inscription avec Fatma.
  - faisable sur le site ?
  - rôle chargée de formation client ?
  - rôle profil Adeline (appels d'offre + création docu[ments] / tout ?) — orthographe corrigée par Manon le 2026-11-12 (transcrit d'abord « Addline »)
- En haut à droite : **LOGO plus gros**

**Côté stagiaire**

- Formations « disponibles » : confusant.
  - enlever le nombre d'inscrits aux formations (laisser pour formateur et chargée)
  - enlever l'option de ne plus recevoir d'e-mail ? (pour ne pas qu'il rate la survey 6 mois plus tard)
  - autoriser envoi CSV !

**Côté formateur**

- permettre un classement de conversations par formations (deux mots barrés dans la phrase ; « conversation » est écrit au-dessus)
- ajouter CVs aux profils formateurs
- ajouter vision documents dans le profil

**Côté chargée**

- création profil en Excel
- lien formation – stagiaire
  - when creating formation
  - when creating stagiaire

**En bas**

- Bug reporting function with form..
- Entouré, en bas à droite : **import fichier marche pas !**

## 2. Corrections demandées (précisées par Manon, 2026-11-12)

| # | Qui | Demande | Précision et piste | Back ? |
| --- | --- | --- | --- | --- |
| 1 | Tous | Logo plus gros | Agrandir le logo du bandeau | Non |
| 2 | Stagiaire | Le mot « disponibles » prête à confusion | Revoir le libellé de la liste des formations vue par le stagiaire | Non |
| 3 | Stagiaire | Enlever le nombre d'inscrits (le garder pour formateur et chargée) | Masquer ce nombre pour le rôle stagiaire | Non |
| 4 | Stagiaire | Enlever l'option « ne plus recevoir d'e-mail » | **Décision : retrait total.** Le stagiaire reçoit toujours les e-mails, sans réglage dans son profil (indicateur 30 : le questionnaire à 6 mois ne doit pas être raté). À vérifier : les comptes qui ont déjà coupé les e-mails, et si le back doit forcer l'envoi | À voir |
| 5 | Tous | « Envoi CSV » | **Précision : les fichiers Excel doivent aussi être acceptés comme documents déposés, par tous les rôles** (pas du CSV). La liste actuelle est pdf, jpg, jpeg, png et docx, fixée par le back (Q5) : il faut ajouter les formats Excel (.xlsx, et .xls ?) | Oui |
| 6 | Formateur | Classer les conversations par formation | Regrouper la liste de la messagerie par formation | Peut-être (la messagerie ne connaît pas la formation) |
| 7 | Formateur | Ajouter des CV aux profils formateurs | Dépôt d'un CV sur la fiche du formateur. Lien avec l'indicateur 21 (compétences des acteurs) | Oui |
| 8 | Formateur | Voir les documents dans le profil | **Précision : les siens.** Dans son propre profil, le formateur voit les documents qu'il a déposés (comme « Mes documents » du stagiaire) | À voir |
| 9 | Chargée | Créer des profils par Excel | Import Excel des comptes (formateurs et stagiaires), reporté jusqu'ici | Oui |
| 10 | Chargée | Lier formation et stagiaire à la création | Inscrire des stagiaires en créant une formation, et choisir des formations en créant un stagiaire (les inscriptions sont reportées) | Oui |
| 11 | Tous | Fonction de signalement de bug, avec formulaire | Nouveau formulaire « Signaler un problème » | Oui |
| 12 | Chargée | **Bug : l'import de fichier ne marche pas** | Résolu le 2026-11-12 : l'erreur « ligne 2, colonne categorie : valeur manquante » venait du modèle vide, importé tel quel (deux fichiers de même nom, un dans Téléchargements, un sur le Bureau). Le fichier rempli s'importe. Aucun changement de code | Non |

## 3. Deux nouveaux rôles à évoquer (décision de Manon, 2026-11-12)

Ordre : **d'abord avec Charlotte (back), ensuite avec l'ADAC.** Aucun rôle n'est créé tant que ce n'est pas discuté.

| Rôle envisagé | Ce qu'il ferait | À déterminer |
| --- | --- | --- |
| **Chargée de formation côté client** | Inscrire des stagiaires à des formations ; gérer une partie de la documentation | Quelle partie de la documentation ; limité aux formations de son entreprise ? |
| **Adeline** (a aujourd'hui ce rôle, tel que Manon l'a noté) | Répondre aux appels d'offres de formations ; créer de nouvelles formations ; créer des documents et des outils de formation | Droits exacts par rapport à la chargée de formation (SUPER_ADMIN) |

Les rôles actuels du back sont `SUPER_ADMIN` (chargée de formation), `ADMIN` (formateur) et `STAGIAIRE`. Ces deux rôles s'ajouteraient aux trois ; cela touche l'API de Charlotte, les gardes du front et l'indicateur 18 (coordination des acteurs).

## 4. Questions encore ouvertes

1. **Inscription** (à discuter avec Fatma) : le concept d'inscription est à rediscuter ; est-ce faisable sur le site ? Les inscriptions sont encore reportées côté portail et la décision doit venir avant de les construire (point 10).
2. **Deux nouveaux rôles** : à évoquer avec Charlotte puis avec l'ADAC (section 3).
3. **Excel (point 5)** : seulement `.xlsx`, ou aussi l'ancien `.xls` ?
4. **E-mails (point 4)** : que faire des stagiaires qui ont déjà coupé les e-mails, et faut-il le garantir côté back ?

## 5. Liens avec Qualiopi

- Point 4 : indicateur 30, recueil des appréciations (questionnaire à froid).
- Point 7 : indicateur 21, compétences des acteurs (fiche formateur avec CV).
- Point 11 : amélioration continue, indicateur 32, si le formulaire sert aussi à recueillir des retours.
- Rôles : indicateur 18, coordination des acteurs.

## 6. Suites possibles (non engagées)

- Valider la liste avec Manon, puis reporter les points « back » dans `points-pour-charlotte.md`.
- Pour toute correction retenue, passer par le flux spec → plan → tâches (TDD).
