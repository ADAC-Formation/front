# Site officiel de l'ADAC — référence pour le portail

Source : https://www.adac.asso.fr/ (pages consultées le 2026-11-01 : accueil, Formations ADAC, Qui sommes-nous, Contact, R&D – ESF-Lab, Les Rencontres de l'ADAC, Les interventions sociales).

> Document de contexte, pas une décision. Les décisions en vigueur restent dans `decisions-front-foundations.md`. En cas de conflit avec `tech.md`, `tech.md` l'emporte (D40).
> Limite : les couleurs, polices et le logo n'ont pas pu être extraits (HTML non récupérable). Les fiches PDF des formations (durée, prix, prérequis, objectifs, dates) n'ont pas été lues.

## 1. Identité et ton

- Association d'action sociale basée à Saint-Étienne, présente en régions (Île-de-France, PACA, Occitanie, Nouvelle-Aquitaine, Hauts-de-France, Bourgogne-Franche-Comté, Auvergne-Rhône-Alpes).
- Slogan : « Une vision dynamique et moderne de l'action sociale ». Thèmes du bandeau : ACCOMPAGNER, DYNAMISER, AGIR, CRÉER.
- Charte : chaque personne doit être « acteur de son propre devenir » (pouvoir d'agir, participation, identité).
- Ton : chaleureux, participatif, professionnel ; vouvoiement. Éviter un vocabulaire administratif froid.
- Triptyque ADAC : intervention sociale, expérimentation, formation continue.

## 2. Vocabulaire à reprendre dans l'interface

- Fiche (de formation), Réf. (code de la formation)
- Présentiel / distanciel, webinaire
- Catalogue / sur mesure / intra (réservé à l'organisation cliente) / format court / formation-action
- Public : salariés, travailleurs sociaux, intervenants sociaux, intervenants PCB (PCB = **Point Conseil Budget**, précisé par Manon le 2026-11-09 ; non défini sur le site)
- Termes métier : pouvoir d'agir, savoirs expérientiels, accompagnement budgétaire, co-diagnostic, pratique réflexive, écoute active

## 3. Catalogue de formations (thèmes et références)

| Thème | Références |
| --- | --- |
| Estime de soi en travail social | ES01, ES03, ES04, ES05 |
| Méthodologie d'intervention sociale | MI01 à MI04 |
| Difficultés budgétaires et surendettement | DB01 à DB06 |
| Mieux-être au travail | BE01, BE02 |
| Spécial PCB | PCB1 à PCB3 (compléments suggérés : BE01, BE02, MI04) |
| Formations en intra | IN01 à IN05 |

Titres : voir la page https://www.adac.asso.fr/formations-2-2/.

- Lieux : Amiens, Paris, Marseille, Bordeaux, Saint-Étienne, ou à distance.
- Chaque formation a un code de référence (lettres + numéro) → champ `reference` possible dans le DTO formation (à vérifier dans `tech.md`).
- Les thèmes alimentent naturellement `categories.js` (mock à remplacer, D11).

## 4. Qualiopi et documents

- Certification Qualiopi (attestation 2024–2027) ; logos « Qualiopi action de formation » et « ESA Format ».
- Documents publiés sur le site (pertinents pour la fonction documents du portail) : récapitulatif des formations 2026–2027, fiche de pré-inscription, équipe de formatrices, « Méthodes et évaluations ADAC », offre sur mesure, Conditions Générales de Vente, fiches par formation.
- Réclamations : formation@adac.asso.fr.
- Référente handicap : Clémentine Nebouy (clementine.nebouy@adac.asso.fr) ; formations adaptables aux personnes en situation de handicap.

## 5. Équipe et rôles

- Direction : Nathalie Bouvier (directrice), Adeline Rouyer-Fessard et Virginie Seewagen (directrices adjointes) ; présidente : Hélène Vallet.
- Administration : Fatma Aydin (responsable administrative et formatrice), Evelyne Dolmazon (comptable).
- Intervenantes : Conseillères ESF, dont plusieurs aussi **formatrices** (Laurie Balp, Célia Breant, Aurélie Douay, Claire Jondeau, Clémentine Nebouy).
- Le site ne nomme pas de « chargée de formation » : l'équivalence avec le rôle `SUPER_ADMIN` est à confirmer.
- Le site emploie le féminin « formatrices » ; D33 fixe « Formateur ». Décision à prendre : libellé inclusif (« Formateur·rice ») ou non.

## 6. Contact (pied de page, aide, à propos)

- adac@adac.asso.fr · 04 77 33 65 34
- 35 rue Pierre et Dominique Ponchardier, 42100 Saint-Étienne
- LinkedIn, Facebook, Instagram
- Pas de SIRET, de numéro de déclaration d'activité ni de politique RGPD visibles sur le site → le portail devra avoir ses propres mentions légales.

## 7. Accessibilité et vie privée

- Le site propose une barre d'outils : texte agrandi, niveaux de gris, contraste élevé, contraste inversé, fond clair, liens soulignés, police lisible. Les options D60 du portail reprennent déjà cette liste.
- Le site affiche un bandeau cookies (statistiques, marketing). Le portail ne le reproduit pas (D31 : aucun tracker).

## 8. Autres contenus (faible priorité)

- Interventions sociales : budget, logement, estime de soi et pouvoir d'agir, événements de vie, santé/alimentation/consommation, méthodologie de projet, accompagnement de projets d'organisation, développement social.
- ESF-Lab (laboratoire de recherche créé en 2021) : veille, recherche, prospective ; partenaires France ESF, Futuribles, Haut Conseil en Travail Social.
- Rencontres de l'ADAC : colloque des 4–6 novembre 2025 (40 ans de l'ADAC).
- Aucun impact direct sur le portail.

## 9. Questions ouvertes

1. ~~Que signifie « PCB » ?~~ Réponse (2026-11-09) : **Point Conseil Budget**. Reste à demander : « Spécial PCB » (PCB1 à PCB3) est-il un public cible, une catégorie ou un type d'intervenant dans le portail ?
2. Équivalence « chargée de formation » ↔ `SUPER_ADMIN` : qui, côté ADAC ?
3. Libellé du rôle formateur : inclusif ou non ?
4. Charte graphique réelle du site (couleurs, polices, logo) à comparer avec `design-front.md` : extraction à faire avec un navigateur.
5. Champ `reference` (code de formation) à prévoir dans le DTO formation ? À vérifier dans `tech.md`.
