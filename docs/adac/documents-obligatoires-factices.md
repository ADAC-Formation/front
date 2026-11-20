# Documents obligatoires — liste FICTIVE (hypothèse de travail)

> ⚠️ **Document inventé par l'équipe de développement, pas fourni par l'ADAC.** Il sert à construire et tester la checklist des pièces comme si l'ADAC avait répondu à `questions-pour-adac.md` §A. Dès que l'ADAC répond, ce fichier est remplacé par la vraie liste et les décisions qui s'en appuient sont revues. Ne jamais le présenter comme une exigence réelle (Qualiopi, financeurs ou autre).

Créé le 2026-11-20. Suit le modèle de tableau de la question A1.

## Réponses supposées (A2 à A9)

| # | Hypothèse retenue pour développer |
|---|---|
| A2 | Une liste **commune à toutes les formations**, plus des pièces **propres à une catégorie** (voir tableau). Pas de règle par financeur pour l'instant. |
| A3 | Trois états : **obligatoire**, **facultatif**, **selon la situation** (la chargée de formation décide si la pièce s'applique à un stagiaire). |
| A4 | Pièces d'inscription : **avant le début** de la formation (date limite : J-7). Attestations et évaluations : **après** la fin (J+15). |
| A5 | Le stagiaire dépose les pièces personnelles ; l'**ADAC fournit** convention, programme, convocation, règlement intérieur et attestation de fin de formation (ils n'entrent pas dans la checklist « à fournir »). |
| A6 | Un document déposé est **reçu** ; la chargée de formation peut le passer à **validé** ou **à refaire**. |
| A7 | Pièce manquante : **relance par message groupé** (filtre « Documents manquants »), pas de blocage de l'inscription. |
| A8 | **Sensibles**, visibles de la chargée de formation seulement : situation de handicap, prise en charge financière, pièce d'identité. |
| A9 | Conservation : 5 ans après la fin de la formation ; accès en lecture seule pour la chargée de formation après archivage. |

## Pièces à fournir par le stagiaire (réponse supposée à A1)

| Formation, catégorie ou « toutes » | Nom du document | Obligatoire ? | Fourni par | À fournir quand ? | Date limite | Remarque |
|---|---|---|---|---|---|---|
| Toutes | Pièce d'identité (recto-verso) | oui | stagiaire | avant le début | J-7 | sensible |
| Toutes | Fiche d'inscription signée | oui | stagiaire | à l'inscription | J-7 | modèle fourni par l'ADAC |
| Toutes | Justificatif de prise en charge (employeur, OPCO ou autre financeur) | selon la situation | stagiaire | avant le début | J-7 | sensible ; absent si le stagiaire finance lui-même |
| Toutes | Attestation de situation de handicap / besoin d'adaptation | selon la situation | stagiaire | avant le début | J-7 | sensible ; facultatif, pour adapter la formation |
| Toutes | CV à jour | facultatif | stagiaire | avant le début | — | aide le formateur à situer le parcours |
| Toutes | Évaluation de la formation à chaud | oui | stagiaire | après la fin | J+15 | indicateur Qualiopi de satisfaction |
| Secourisme | Certificat médical d'aptitude | oui | stagiaire | avant le début | J-7 | |
| Numérique | Photo d'identité numérique (pour l'attestation) | facultatif | stagiaire | avant le début | — | |
| Intra (formation en intra) | Liste d'émargement signée | oui | stagiaire | pendant | fin de formation | |
| Intra (formation en intra) | Courrier d'accord de l'employeur | oui | stagiaire | avant le début | J-7 | |

## Documents fournis par l'ADAC (hors checklist du stagiaire)

| Document | Moment | Remarque |
|---|---|---|
| Convention de formation | avant le début | signée par les deux parties |
| Programme de la formation | avant le début | |
| Convocation | avant le début | date, lieu ou lien de visio |
| Règlement intérieur | avant le début | |
| Attestation de fin de formation | après la fin | remise au stagiaire |

## Ce que le back ne sait pas encore faire avec cette liste

- Un `Document` n'a ni **type** ni **libellé** : impossible de savoir qu'un fichier est « la pièce d'identité ». Il n'existe pas non plus de « document requis » par formation ni d'état reçu / validé / à refaire (`decisions-documents.md`, checklist nommée reportée).
- Le filtre « Documents manquants » du message groupé reste donc celui du back (aucun document déposé), pas « il manque la pièce d'identité ».
- Pour bâtir la checklist, le front devra de toute façon passer par une demande à Charlotte (documents requis par formation, type sur chaque dépôt) ; en attendant, cette liste sert de donnée de maquette et de test côté front.
