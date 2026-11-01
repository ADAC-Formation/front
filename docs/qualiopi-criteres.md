# Qualiopi — ce que le portail couvre, ce qui manque, ce qui est hors périmètre

Qualiopi est un point central pour l'ADAC (attestation 2024–2027, voir `adac-site-reference.md` §4). Ce document confronte les 7 critères / 32 indicateurs au portail (front + back, état au 2026-11-01).

> **Sources et limites.** Intitulés tirés de https://www.digiforma.com/certification-qualiopi/criteres/ ; les descriptions sont des **reformulations**, pas le texte officiel du référentiel national qualité (RNQ). Avant toute décision, relire l'indicateur dans le référentiel officiel et demander à l'ADAC ce que l'auditeur lui demande réellement comme preuve.
> **Périmètre du portail.** Qualiopi certifie l'organisme, pas un logiciel. Le portail sert d'**outil de preuve et de suivi** : il ne rend pas l'ADAC conforme, il rend la conformité plus facile à démontrer.
> **Contrainte d'équipe.** Le front ne peut pas modifier le back. Tout manque qui exige une donnée ou un endpoint est marqué « back » et devrait passer par `points-pour-charlotte.md`.
> Ce document n'est pas une décision : aucun manque ci-dessous n'est planifié tant que Manon ne l'a pas retenu.

## Vue d'ensemble : les 32 indicateurs

**Légende** (une seule case cochée par indicateur) :

- **Dans l'app** : 🟢 couvert en totalité · 🟠 couvert en partie
- **Manque** (priorité) : 🔴 haute · 🟠 moyenne · 🟡 basse
- **Hors périmètre** : ⚪

Règle de cochage : si le cœur de l'indicateur n'existe pas dans le portail (par exemple l'évaluation ou la présence), il est coché « Manque », même si la messagerie ou les documents aident à la marge. Les détails sont dans les sections 2, 3 et 4.

| Critère | Ind. | Intitulé | Dans l'app | Manque | Hors périmètre | Commentaire |
| --- | --- | --- | :-: | :-: | :-: | --- |
| 1. Information au public | 1 | Information du public | 🟠 | | | Fiche formation visible des inscrits ; prérequis, durée, tarif, délai d'accès absents |
| | 2 | Indicateurs de résultats | | 🔴 | | Le portail devrait fournir les chiffres (satisfaction, réalisation, abandon) ; leur publication reste sur le site |
| | 3 | Taux d'obtention des certifications | | | ⚪ | Seulement si une formation ADAC est certifiante |
| 2. Objectif et adaptation | 4 | Analyse du besoin | | 🟠 | | Questionnaire avant formation, besoins liés au handicap |
| | 5 | Objectifs de la prestation | | 🟠 | | Champ « objectifs en compétences » absent |
| | 6 | Contenus et modalités | | 🟠 | | Seulement un champ `description` libre |
| | 7 | Contenus et exigences (certification) | | | ⚪ | Formations non certifiantes |
| | 8 | Positionnement à l'entrée | | 🟠 | | Positionnement et évaluation de sortie à créer |
| 3. Accueil, suivi, évaluation | 9 | Conditions de déroulement, référents | 🟠 | | | Documents d'accueil et formateur affiché ; pas de rubrique « référents » |
| | 10 | Adaptation de la prestation | | 🟠 | | Dépend de l'analyse du besoin (ind. 4) |
| | 11 | Atteinte des objectifs | | 🔴 | | Seuls des fichiers peuvent être déposés : ni évaluation ni attestation structurées |
| | 12 | Engagement des bénéficiaires | | 🔴 | | Messagerie et notifications aident à relancer ; aucun suivi de présence |
| | 13 | Coordination des apprentis | | | ⚪ | Spécifique aux CFA |
| | 14 | Exercice de la citoyenneté | | | ⚪ | Spécifique aux CFA |
| | 15 | Droits et devoirs de l'apprenti | | | ⚪ | Spécifique aux CFA |
| | 16 | Présentation à la certification | | | ⚪ | Formations non certifiantes |
| 4. Adéquation des moyens | 17 | Moyens humains et techniques | | | ⚪ | Locaux, matériel, preuves physiques |
| | 18 | Coordination des acteurs | 🟠 | | | Trois rôles, formateur affecté par formation ; pas d'organigramme |
| | 19 | Ressources pédagogiques | 🟠 | | | Documents téléchargeables ; conservation après la formation à trancher |
| | 20 | Personnels dédiés | | | ⚪ | Organisation interne ; spécifique CFA pour la mobilité |
| 5. Qualification du personnel | 21 | Compétences des acteurs | | 🟡 | | Fiche formateur (parcours, qualifications) possible |
| | 22 | Gestion de la compétence | | | ⚪ | Gestion RH |
| 6. Environnement professionnel | 23 | Veille légale et réglementaire | | | ⚪ | Activité de l'ADAC |
| | 24 | Veille emplois et métiers | | | ⚪ | Activité de l'ADAC (ESF-Lab) |
| | 25 | Veille pédagogique et technologique | | | ⚪ | Activité de l'ADAC (ESF-Lab) |
| | 26 | Situation de handicap (réseau) | | | ⚪ | Relations externes ; l'accessibilité du portail est notée sous l'ind. 4 |
| | 27 | Sous-traitance | | | ⚪ | À confirmer : l'ADAC sous-traite-t-elle ? |
| | 28 | Formation en situation de travail | | | ⚪ | Pas de période en entreprise |
| | 29 | Insertion professionnelle | | | ⚪ | Spécifique aux CFA |
| 7. Appréciations et amélioration | 30 | Recueil des appréciations | | 🔴 | | Questionnaires à chaud et à froid |
| | 31 | Traitement des réclamations | | 🔴 | | Messagerie = canal de contact ; pas de registre |
| | 32 | Amélioration continue | | 🔴 | | Synthèse des retours et des réclamations ; les décisions restent à l'ADAC |

**Bilan** : 4 indicateurs 🟠 couverts en partie (aucun couvert en totalité) · 12 à construire (6 🔴, 5 🟠, 1 🟡) · 16 hors périmètre.

## 1. Applicabilité (hypothèses à confirmer avec l'ADAC)

L'ADAC propose des **actions de formation** (catalogue, sur mesure, intra). Hypothèses :

- Indicateurs **réservés aux CFA / apprentissage** : 13, 14, 15 (en partie), 20 (mobilité), 29 → hors périmètre.
- Indicateurs **liés à une certification professionnelle** : 3, 7, 16 → hors périmètre **si** aucune formation ADAC ne mène à une certification (le site n'en mentionne aucune).
- Indicateur 28 (périodes en entreprise) → hors périmètre pour des formations de courte durée.
- Indicateur 27 (sous-traitance) → à confirmer : l'ADAC fait-elle intervenir des sous-traitants ?

## 2. Ce que le portail aide déjà à atteindre

| Ind. | Intitulé | Ce que le portail apporte | Limite |
| --- | --- | --- | --- |
| 1 | Information du public | Fiche formation : intitulé, description, dates, modalité (visio / présentiel / mixte), catégorie, formateur | Accessible aux seuls comptes connectés (stagiaires inscrits) ; le public général relève du site web |
| 9 | Conditions de déroulement, référents | Formateur rattaché à chaque formation ; documents de la formation (convocation, règlement, livret d'accueil) déposés et notifiés aux inscrits ; messagerie avec le formateur | Pas de rubrique « référents » explicite (pédagogique, administratif, handicap) |
| 11 | Atteinte des objectifs | Les documents de fin de formation (attestations, bilans) peuvent être déposés par stagiaire (document ciblé, US-010) | Dépôt de fichiers seulement : aucune évaluation ni attestation structurée |
| 12 | Engagement des bénéficiaires | Messagerie individuelle et groupée, notifications in-app et e-mail : relance rapide d'un stagiaire silencieux | Aucun suivi de présence ni détection d'abandon |
| 18 | Coordination des acteurs | Trois rôles distincts, formateur affecté par formation, changement de formateur (`PATCH /formations/{id}/formateur`) | Pas d'organigramme ni de planning de l'équipe |
| 19 | Ressources pédagogiques | Support de cours déposés sur la formation, téléchargeables par les inscrits | Dépend de la durée de conservation après la fin de la formation (point #11 de `meeting-points-back.md`) |
| 4 / 26 (accessibilité) | Accessibilité | Interface conforme WCAG 2.1 AA, options d'affichage (D15, D60) | Voir §3 pour le recueil des besoins |
| 31 | Traitement des réclamations | Canal de contact direct (messagerie) | Pas de registre, voir §3 |

**Effet de bord utile pour l'audit** : tout dépôt de document, inscription et message est horodaté (`createdAt`, `inscritLe`). C'est une trace datée de ce qui a été communiqué à qui.

## 3. Ce qui manque au portail pour aider à atteindre les critères

Classé par valeur probable pour un audit. « Back » = exige une évolution de l'API de Charlotte.

### 3.1 Priorité haute — preuves que l'auditeur demande le plus souvent

| Ind. | Manque | Back ? |
| --- | --- | --- |
| 30 | **Recueil des appréciations** : questionnaire de satisfaction à chaud (fin de formation) et à froid, avec relance par notification, et consultation des réponses par la chargée de formation | Oui (nouvelle ressource) |
| 31 | **Registre des réclamations** : formulaire de réclamation, statut (reçue / en traitement / clôturée), délai de réponse, historique | Oui |
| 32 | **Amélioration continue** : tableau de synthèse des appréciations et réclamations, avec actions décidées | Oui (données de 30 et 31) |
| 2 | **Indicateurs de résultats** : taux de satisfaction, de réalisation, d'abandon, par formation et par année, exportables pour publication | Oui (déduit de 11, 12, 30) |
| 11 | **Évaluation des acquis et attestation de fin de formation** (ou certificat de réalisation) générée ou suivie par stagiaire | Oui |
| 12 | **Émargement / présence** par session, repérage des absences | Oui |

### 3.2 Priorité moyenne — informations structurées à la fiche formation

| Ind. | Manque | Back ? |
| --- | --- | --- |
| 1 | Champs manquants à la fiche : prérequis, public visé, durée en heures, tarif, délai d'accès, lieu, code de référence (Q9) | Oui |
| 5 | **Objectifs formulés en compétences**, affichés au stagiaire | Oui (champ) |
| 6 | Programme / déroulé et modalités d'évaluation structurés (aujourd'hui : un champ `description` libre) | Oui (champ) |
| 4 / 10 | **Analyse du besoin** : questionnaire avant formation (attentes, besoins liés au handicap) et trace de l'adaptation décidée | Oui |
| 8 | **Positionnement à l'entrée** et évaluation de sortie pour mesurer la progression | Oui |
| 9 | Rubrique « Vos référents » (pédagogique, administratif, handicap) visible par le stagiaire | Front possible si le référent est une donnée connue |
| 4 | Case « besoin d'adaptation lié au handicap » à l'inscription, visible de la seule chargée de formation, avec mention du référent handicap | Oui (donnée sensible RGPD) |

### 3.3 Priorité basse — traçabilité et gestion documentaire

| Ind. | Manque | Back ? |
| --- | --- | --- |
| 18 | Documents internes (organigramme, fiches de poste, planning) rattachés à l'organisme plutôt qu'à une formation | Oui (ou espace documents « organisme ») |
| 19 | Règle de conservation et d'accès après la fin d'une formation archivée | Question ouverte |
| 21 | Fiche formateur : parcours, qualifications (CV, diplômes) pour justifier l'adéquation des intervenants | Oui |
| 4–32 | Export d'un « dossier de preuves » par formation (documents, inscriptions, messages, évaluations) pour la veille d'audit | Oui |

### 3.4 Contraintes à respecter en ajoutant ces fonctions

- **Vie privée (D31, RGPD)** : questionnaires, besoins liés au handicap et réclamations sont des données personnelles, parfois sensibles. La durée de conservation et la page Confidentialité sont encore ouvertes (`spec.md`, point #11).
- **Aucune donnée personnelle dans le stockage du navigateur** (D31).
- **Contenu affiché en texte, jamais en HTML** (réclamations et réponses libres : risque XSS).

## 4. Hors périmètre du portail

Ces indicateurs relèvent de l'organisation de l'ADAC, de son site public ou de ses ressources humaines. Le portail ne les couvre pas et ne doit pas chercher à le faire.

| Ind. | Intitulé | Pourquoi hors périmètre |
| --- | --- | --- |
| 1, 2, 3 (publication) | Information du public, résultats publiés | La publication au public se fait sur le site adac.asso.fr ; le portail peut seulement **fournir les chiffres** (§3.1) |
| 3 | Taux d'obtention des certifications | Seulement si une formation ADAC est certifiante (non indiqué sur le site) |
| 7, 16 | Référentiel de certification, présentation à la certification | Idem |
| 13, 14, 15 | Apprentis : coordination centre / entreprise, citoyenneté, droits et devoirs | Spécifiques aux CFA |
| 17 | Moyens humains et techniques (locaux, matériel, bail, document unique) | Preuves physiques et administratives |
| 20 | Personnels dédiés (mobilité, conseil de perfectionnement) | Organisation interne (mobilité : CFA) ; l'affichage des référents est traité sous l'ind. 9 |
| 22 | Développement des compétences de l'équipe (plan de formation, entretiens) | Gestion RH (l'ind. 21 a une partie portail : fiche formateur, §3.3) |
| 23, 24, 25 | Veilles légale, métiers, pédagogique | Activité de l'ADAC (en partie portée par l'ESF-Lab) ; une page de preuve pourrait être déposée en document, sans fonction dédiée |
| 26 | Réseau de partenaires handicap (AGEFIPH, FIPHFP) | Relations externes |
| 27 | Sous-traitance | Contrats et cahiers des charges, à confirmer si l'ADAC sous-traite |
| 28, 29 | Formation en situation de travail, insertion professionnelle | Non pertinents pour des formations courtes de salariés |
| 32 (décision) | Les actions d'amélioration elles-mêmes | Le portail fournit les données (§3.1), l'ADAC prend les décisions |

## 5. Synthèse par critère

| Critère | Couverture actuelle | Principal manque |
| --- | --- | --- |
| 1. Information au public | Partielle | Champs de la fiche (prérequis, durée, tarif, délai d'accès) |
| 2. Objectifs et adaptation | Quasi nulle | Besoin, objectifs, positionnement, adaptation |
| 3. Accueil, suivi, évaluation | Partielle (communication) | Évaluation, présence, attestation, référents |
| 4. Moyens | Faible (coordination, ressources) | Documents d'organisme |
| 5. Qualification du personnel | Hors périmètre | — |
| 6. Environnement professionnel | Hors périmètre | — |
| 7. Appréciations et amélioration | Quasi nulle | Satisfaction, réclamations, synthèse |

Le critère 7 est le plus fort écart **et** le plus réalisable côté portail : les données sont structurées et le stagiaire est déjà connecté.

## 6. Questions ouvertes (à poser à l'ADAC)

À discuter directement avec l'ADAC ; les réponses ajusteront le tableau d'ensemble.

1. Qu'a demandé l'auditeur comme preuves lors de la dernière certification (2024) ? Quels indicateurs ont posé problème ?
2. Une formation ADAC mène-t-elle à une certification professionnelle (indicateurs 3, 7, 16) ?
3. L'ADAC fait-elle appel à des sous-traitants (indicateur 27) ?
4. Comment sont collectées aujourd'hui les appréciations et les réclamations (papier, e-mail, Forms) ?
5. L'ADAC souhaite-t-elle que le portail devienne le **registre officiel** de ces preuves, ou seulement un outil d'appoint ?
6. Qui sont les référents (pédagogique, administratif, handicap) à afficher dans le portail ?
7. Les fiches PDF des formations (durée, prix, prérequis, objectifs) doivent-elles être reprises dans le portail ? Elles contiennent probablement déjà les données des indicateurs 1, 5 et 6.

## 7. Suites possibles (non engagées)

- Valider la liste avec Manon, puis avec la chargée de formation.
- Reporter les manques « back » dans `points-pour-charlotte.md` (une question par groupe : questionnaires / réclamations / champs de la fiche).
- Pour toute fonction retenue, passer par `/grill-me-with-docs` puis le flux spec → plan → tâches (TDD).
