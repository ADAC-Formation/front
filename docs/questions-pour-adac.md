# Questions pour l'ADAC

Document à remettre à l'ADAC (la chargée de formation) pour cadrer ce que le portail doit gérer. Les réponses décident des changements à demander ensuite à Charlotte (back) et de ce que le front affiche. Aucune question ici n'est adressée à Charlotte.

Créé le 2026-11-09. Chaque réponse est à noter dans la colonne ou sous la question, puis reportée dans `docs/decisions-*.md` par Manon.

Autres questions déjà prêtes pour l'ADAC, ailleurs : `qualiopi-criteres.md` §6 (preuves demandées à l'audit, certification, sous-traitance, registre officiel, référents) et `adac-site-reference.md` §9 (sens de « PCB », équivalences de rôles, libellés).

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

Champs déjà présents dans le portail : **intitulé**, **description** (texte libre), **date de début**, **date de fin**, **modalité** (visio, présentiel, mixte), **catégorie**, **formateur** (un seul), **statut** (active ou archivée). Le portail ne gère pas encore le **code de référence** du site (ES01, MI02, DB04, PCB1…).

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
| B6. Le **fichier Excel** des formations (import) : peut-on nous envoyer un exemple réel ? Ses colonnes, aujourd'hui provisoires, doivent reprendre les informations de B1. | |
| B7. Quelles informations doivent être **visibles par le stagiaire**, et lesquelles seulement par la chargée de formation et le formateur ? | |
| B8. Y a-t-il des **documents attachés à la formation** (programme PDF, fiche formation, support de cours) à publier dès sa création ? | |

---

Merci de répondre dans ce document (ou par courriel) ; nous reportons ensuite chaque réponse dans les décisions du projet.
