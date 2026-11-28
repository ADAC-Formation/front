# Documentation du front — index

Un dossier par public. En cas de doute : le dev lit `projet/` et `decisions/`, Charlotte lit `charlotte/`, l'ADAC lit `adac/`. Le suivi des tâches est sur le board GitHub (projet 1 de l'organisation `ADAC-Formation`), pas dans des fichiers.

## `projet/` : cadrage (dev)

| Fichier | Contenu |
| --- | --- |
| `cadrage.md` | Le pourquoi du projet (brief) et les règles stables (constitution) |
| `plan-de-proyecto.md` | Plan du front : périmètre, risques, priorités |
| `spec.md` | Spécification et critères d'acceptation par ticket |

## `decisions/` : décisions du front (dev)

| Fichier | Contenu |
| --- | --- |
| `decisions-front-foundations.md` | Décisions générales D1 à D66 (socle, design, accessibilité, déploiement) |
| `decisions-formations.md`, `decisions-documents.md`, `decisions-categories.md` | Formations (F), documents (G), catégories (C) |
| `decisions-messagerie.md`, `decisions-notifications.md`, `decisions-profil.md` | Messagerie (H), notifications (N), profil (P) |
| `decisions-import-comptes.md` | Import de comptes par fichier Excel (I, NOTES-09) |
| `decisions-feedback.md` | Bouton « Envoyer un retour » : bug ou suggestion envoyé par email au développeur (U) |

## `design/` : design

| Fichier | Contenu |
| --- | --- |
| `design-front.md` | Design du portail (couleurs, polices, composants) |
| `design-site.md` | Variante aux couleurs du site de l'ADAC (`?design=site`), pour la réunion avec l'ADAC |

## `dev/` : lancer le back en local

`README.md` (commandes Docker), `docker-compose.dev.yml`, `seed-local-admin.sql`.

## `charlotte/` : échanges avec le back

| Fichier | Contenu |
| --- | --- |
| `points-pour-charlotte.md` | Décisions, impacts sur le back, questions et conflits avec `tech.md`. Commence par la section « À envoyer à Charlotte » |
| `changements-back.md` | Journal des changements que Manon fait elle-même dans le back (sur branche, D66) : quoi, pourquoi, branche et commit, impact sur le contrat. À relire avant de merger |
| `meeting-points-back.md` | Ancienne liste de points de réunion (historique : les décisions la citent par numéro) |

## `adac/` : échanges avec l'ADAC et Qualiopi

| Fichier | Contenu |
| --- | --- |
| `questions-pour-adac.md` | Questions en attente pour l'ADAC, avec colonne de réponse |
| `notes-adac.md` | Notes manuscrites de Manon du 11 novembre, transcrites et précisées |
| `synthese-notes-adac.docx` | Version Word à envoyer : tableau des notes et tableau des questions |
| `qualiopi-criteres.md` | Les 32 indicateurs Qualiopi face au portail |
| `propositions-qualiopi.md` | Propositions pour la réunion avec l'ADAC |
| `adac-site-reference.md` | Ce que dit le site officiel de l'ADAC |
| `2026.07.06 1er Rencontre…pdf` | Compte rendu de la 1re rencontre. **Ignoré par git** (noms de personnes) : présent seulement sur le poste de Manon |

## `accessibilite/` : accessibilité (RGAA)

| Fichier | Contenu |
| --- | --- |
| `audit-rgaa-2026-11-28.md` | Auto-évaluation RGAA 4.1.2 : 106 critères, échantillon de 15 pages, non-conformités et corrections proposées |
| `declaration-accessibilite-brouillon.md` | Brouillon de déclaration d'accessibilité, à compléter et faire valider par l'ADAC |
| `test-lecteur-ecran.md` | Test manuel au lecteur d'écran (NVDA) qui complète l'audit |

## Règles

- Une décision = une entrée dans `decisions/` au moment où elle est prise.
- Après un envoi à Charlotte, vider la section « À envoyer à Charlotte » et y noter la date.
- Ne pas recréer de doublons : un suivi de tâches va sur le board, pas ici.
