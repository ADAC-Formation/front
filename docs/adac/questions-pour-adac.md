# Questions pour l'ADAC

Document à remettre à l'ADAC (la chargée de formation) pour cadrer ce que le portail doit gérer. Les réponses décident des changements à demander ensuite à Charlotte (back) et de ce que le front affiche. Aucune question ici n'est adressée à Charlotte.

Créé le 2026-11-09. Chaque réponse est à noter dans la colonne ou sous la question, puis reportée dans `docs/decisions/decisions-*.md` par Manon.

Autres questions déjà prêtes pour l'ADAC, ailleurs : `qualiopi-criteres.md` §6 (preuves demandées à l'audit, certification, sous-traitance, registre officiel, référents) et `adac-site-reference.md` §9 (équivalences de rôles, libellés).

---

## A. Documents obligatoires pour un stagiaire

Contexte : un stagiaire peut aujourd'hui déposer des documents dans le portail, et la chargée de formation voit s'il a envoyé quelque chose. Le portail ne sait pas **quels documents** doivent être fournis : il ne peut donc pas dire « il manque la pièce d'identité ». Pour afficher une liste de contrôle (une ligne par stagiaire, une coche verte par document reçu, avec le lien du fichier), il faut connaître cette liste.

| # | Question | Réponse de l'ADAC |
|---|---|---|
| A1 | **Existe-t-il des documents que chaque stagiaire doit fournir ?** Si oui, merci de nous envoyer la liste (voir le modèle de tableau plus bas). | |
| A2 | Cette liste est-elle **la même pour toutes les formations**, ou **propre à chaque formation** (ou à une catégorie, ou à un financeur) ? Si elle change, quelle règle la détermine ? | |
| A3 | Pour chaque document : est-il **obligatoire** ou **facultatif** ? Y a-t-il des documents « selon la situation » (par exemple une prise en charge par un employeur ou un organisme) ? | |
| A4 | **À quel moment** doit-il être fourni : à l'inscription, avant le début de la formation, pendant, après (attestation, évaluation) ? Y a-t-il une **date limite** par document ? | |
| A5 | Qui fournit quoi ? Le **stagiaire** dépose-t-il tous ces documents, ou certains viennent-ils de l'ADAC (convention, programme, convocation, règlement intérieur, attestation de fin de formation) ? Si oui, merci de les lister aussi. | |
| A6 | Un document reçu doit-il être **validé** par la chargée de formation (états « reçu », « validé », « à refaire ») ou suffit-il qu'il soit déposé ? | |
| A7 | Que se passe-t-il quand un document manque : **relance** (par message, par e-mail, à quelle fréquence), blocage de l'inscription, autre ? | |
| A8 | Y a-t-il des documents **sensibles** (situation de handicap, financement, état civil) qui ne doivent être vus que par la chargée de formation, et pas par le formateur ? | |
| A9 | **Combien de temps** conserve-t-on ces documents après la fin de la formation, et que devient le dossier d'une formation archivée (suppression, archivage, accès) ? | |
| A10 | Formats et taille : PDF, JPG, PNG, DOCX et 10 Mo par fichier conviennent-ils ? Faut-il d'autres formats (par exemple un tableur) ? | |

Modèle de tableau pour répondre à A1 (une ligne par document ; copier-coller dans un tableur ou un courriel est possible) :

| Formation, catégorie ou « toutes » | Nom du document | Obligatoire ? (oui / non / selon la situation) | Fourni par (stagiaire / ADAC) | À fournir quand ? | Date limite | Remarque |
|---|---|---|---|---|---|---|
| | | | | | | |

---

## B. Informations d'une formation, en plus des champs actuels

Champs déjà présents dans le portail : **intitulé**, **description** (texte libre), **date de début**, **date de fin**, **modalité** (distanciel, présentiel, mixte), **catégorie**, **formateur** (un seul), **statut** (active ou archivée). Le portail ne gère pas encore le **code de référence** du site (ES01, MI02, DB04, PCB1…).

Pour chaque information ci-dessous, merci d'indiquer : **indispensable**, **souhaitable** ou **inutile**, et, si elle existe déjà ailleurs (fiche PDF, site, tableur), de nous en envoyer un exemple. Les références « ind. » renvoient aux indicateurs Qualiopi (`qualiopi-criteres.md`).

### B1. Informations de la fiche formation

| Information | Pourquoi | Indispensable / souhaitable / inutile | Exemple ou remarque |
|---|---|---|---|
| Code de référence (ES01, MI02…) | Retrouver la formation du catalogue du site | | |
| Durée totale en heures | Information du public (ind. 1) | | |
| Horaires et nombre de jours (dates non consécutives ?) | Planning réel du stagiaire | | |
| Lieu : adresse et salle, ou lien de la visio | Convocation, accès | | |
| Effectif minimum et maximum (places) | Maintien ou annulation, liste d'attente | | |
| Public visé | Information du public (ind. 1) | | |
| Prérequis | Information du public (ind. 1, 8) | | |
| Objectifs, formulés en compétences visées | Ind. 5 | | |
| Programme ou déroulé détaillé | Ind. 6 (aujourd'hui : texte libre dans « description ») | | |
| Méthodes pédagogiques | Ind. 6 | | |
| Modalités d'évaluation des acquis | Ind. 6, 11 | | |
| Tarif (par personne, groupe ou intra) et prise en charge / financement | Ind. 1 | | |
| Délai d'accès et date limite d'inscription | Ind. 1 | | |
| Accessibilité aux personnes en situation de handicap | Ind. 4, 9 | | |

### B2. Personnes et rôles liés à la formation

| Information | Pourquoi | Indispensable / souhaitable / inutile | Exemple ou remarque |
|---|---|---|---|
| Plusieurs formateurs pour une même formation (aujourd'hui : un seul) | Intervenants multiples | | |
| Référent pédagogique, référent administratif, référent handicap | Ind. 9 | | |
| Parcours et qualifications du formateur (CV, diplômes) | Ind. 21 | | |

### B3. Organisation des formations

| Question | Réponse de l'ADAC |
|---|---|
| B4. Une formation du catalogue est-elle **organisée plusieurs fois** dans l'année (plusieurs sessions avec leurs propres dates, lieux, stagiaires) ? Si oui, faut-il distinguer la **formation** (la fiche du catalogue) de la **session** (une date précise) ? | |
| B5. Quels **types d'actions** faut-il distinguer : catalogue, sur mesure, intra (pour un employeur) ? Pour le sur mesure ou l'intra, faut-il retenir le **client** ou l'**organisme** demandeur ? | |
| B6. Le **fichier Excel** des formations (import) : voir la section E. Ses colonnes doivent reprendre les informations de B1. | |
| B7. Quelles informations doivent être **visibles par le stagiaire**, et lesquelles seulement par la chargée de formation et le formateur ? | |
| B8. Y a-t-il des **documents attachés à la formation** (programme PDF, fiche formation, support de cours) à publier dès sa création ? | |

---

## C. Ce que voit le formateur (ex-Q3 et Q8.2 pour Charlotte)

Contexte : aujourd'hui le back limite le formateur à **ses propres formations** (et aux stagiaires de ces formations). Le front voudrait lui montrer **toutes les formations en lecture seule**, avec « Mes formations » par défaut. Charlotte attend votre avis avant de toucher au back.

| # | Question | Réponse de l'ADAC |
|---|---|---|
| C1 | Un formateur doit-il pouvoir **voir les formations des autres formateurs** (titre, dates, modalité) ? Pourquoi (coordination, remplacement, culture commune) ? | |
| C2 | Si oui, que doit-il voir sur une formation qui n'est **pas la sienne** : seulement la fiche, ou aussi la **liste des inscrits** et les **documents** ? | |
| C3 | Le formateur doit-il voir **tous les stagiaires actifs** de l'ADAC, ou seulement ceux de ses formations ? | |
| C4 | Un formateur peut-il écrire à un stagiaire qui n'est pas dans l'une de ses formations ? | |

---

## D. Code de référence des formations et série « PCB » (ex-Q9 et Q10 pour Charlotte)

| # | Question | Réponse de l'ADAC |
|---|---|---|
| D1 | Les codes du site (**ES01, MI02, DB04, PCB1, IN03**…) sont-ils **utilisés au quotidien** par la chargée de formation (devis, conventions, planning, tableur) ? D'où viennent-ils et que signifient leurs lettres et leurs chiffres ? | |
| D2 | Faut-il les **afficher et les saisir** dans le portail (champ facultatif « Référence ») ? Doivent-ils être **uniques** ? | |
| D3 | **« PCB » = Point Conseil Budget** (confirmé). Les « intervenants PCB » sont donc les professionnels des Points Conseil Budget : est-ce exact ? | |
| D4 | La série « Spécial PCB » (PCB1 à PCB3) correspond-elle à un **public cible**, à une **catégorie** de formations ou à un **type d'intervenant** ? Le portail doit-il la gérer à part (filtre, champ), ou le titre et la catégorie suffisent-ils ? | |

---

## E. Fichier Excel des formations (import)

Le portail permet à la chargée de formation d'importer des formations depuis un fichier Excel. Ses colonnes sont **provisoires** tant que nous n'avons pas votre fichier réel.

| # | Demande | Réponse de l'ADAC |
|---|---|---|
| E1 | **Pouvez-vous nous envoyer le fichier Excel (.xlsx) que vous utilisez pour vos formations**, même incomplet ou avec des données fictives ? Les en-têtes de colonnes et deux ou trois lignes d'exemple suffisent. | |
| E2 | Ce fichier a-t-il **une ligne par formation** ou par session ? Y a-t-il plusieurs feuilles ? | |
| E3 | Quelles colonnes sont **toujours remplies**, lesquelles sont facultatives ? Quel format pour les dates, les durées et les tarifs ? | |

---

Merci de répondre dans ce document (ou par courriel) ; nous reportons ensuite chaque réponse dans les décisions du projet.

---

## F. Vocabulaire du portail (HU-S03)

| # | Question | Réponse de l'ADAC |
|---|---|---|
| F1 | Le site parle de « formatrices » au féminin. Dans le portail, le rôle doit-il s'appeler **« Formateur »**, **« Formateur·rice »** ou **« Formatrice »** ? | |
| F2 | Qui est la **« chargée de formation »** à l'ADAC (le site ne la nomme pas) ? C'est la personne qui crée les formations et gère les comptes dans le portail : quel est son intitulé de poste réel ? | |
| F3 | La modalité « à distance » s'appelle-t-elle chez vous **« distanciel »**, « visio » ou « webinaire » ? Le portail affiche « Présentiel / Distanciel / Mixte ». | |

---

## G. Mentions légales et confidentialité (HU-S02)

La page `/mentions-legales` du portail est en ligne. Ces informations n'étant pas sur votre site, elle affiche « À renseigner par l'ADAC » à leur place : nous ne pouvons pas les deviner. Adresse, e-mail et téléphone sont repris de votre site : merci de confirmer qu'ils sont aussi ceux à afficher.

| # | Demande | Réponse de l'ADAC |
|---|---|---|
| G1 | Quel est le **numéro SIRET** de l'ADAC ? | |
| G2 | Quel est le **numéro de déclaration d'activité** (organisme de formation) ? | |
| G3 | Qui est le **directeur ou la directrice de la publication** du portail (nom et fonction) ? | |
| G4 | Pendant combien de temps conservez-vous les données des stagiaires (compte, inscriptions, documents, messages) **après la fin d'une formation** ? Le 1 an envisagé est-il confirmé ? (voir aussi `meeting-points-back.md` #11) | |
| G5 | Quelle adresse de contact faut-il donner pour **exercer ses droits** sur ses données (accès, rectification, effacement) : adac@adac.asso.fr ou une autre ? Y a-t-il un référent pour les données personnelles ? | |
| G6 | **Qui héberge le portail** (nom et adresse de l'hébergeur) ? Si vous ne le savez pas, Charlotte, qui gère le déploiement, pourra le dire : dites-nous seulement que c'est à elle de le fournir. | |
| G7 | Souhaitez-vous **relire ou remplacer le texte de la section « Confidentialité »** par celui de votre association (s'il existe déjà) ? | |
