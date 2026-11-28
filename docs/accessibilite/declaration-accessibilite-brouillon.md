# Déclaration d'accessibilité — BROUILLON

> **À ne pas publier en l'état.** Brouillon établi d'après l'auto-évaluation du 28 novembre 2026 (`audit-rgaa-2026-11-28.md`), sur la structure du modèle de déclaration publié par la DINUM. Avant publication :
> 1. **L'ADAC confirme si la loi l'oblige** (article 47 de la loi n° 2005-102 du 11 février 2005 : organismes publics, organismes chargés d'une mission de service public, grandes entreprises). Si elle n'est pas concernée, la déclaration reste possible et volontaire : retirer alors la phrase d'engagement légal.
> 2. Les **valeurs entre crochets** sont renseignées par l'ADAC (jamais inventées, comme pour les mentions légales, D65).
> 3. Les **voies de recours** et la formulation sont relues sur le modèle officiel en vigueur (accessibilite.numerique.gouv.fr).
> 4. Idéalement, les non-conformités faciles sont corrigées d'abord et l'audit refait : le taux change.
> 5. La déclaration est publiée sur une page « Accessibilité » du portail, avec la mention « Accessibilité : partiellement conforme » dans le pied de page de chaque page.

---

## Déclaration d'accessibilité

L'ADAC s'engage à rendre son portail de formation accessible conformément à l'article 47 de la loi n° 2005-102 du 11 février 2005. *[Phrase à retirer si l'ADAC n'est pas soumise à l'obligation légale.]*

Cette déclaration d'accessibilité s'applique au **portail de formation de l'ADAC** ([adresse du portail]).

### État de conformité

Le portail de formation de l'ADAC est **partiellement conforme** avec le référentiel général d'amélioration de l'accessibilité (RGAA), version 4.1.2, en raison des non-conformités énumérées ci-dessous.

### Résultats des tests

L'audit de conformité réalisé par [l'équipe de développement du portail] révèle que :

- **88,7 %** des critères du RGAA 4.1.2 applicables sont respectés (63 critères conformes sur 71 applicables) ;
- 34 critères ne sont pas applicables (pas de vidéo, de son, de cadre ni de CAPTCHA sur le portail) ;
- 1 critère reste à vérifier (validité du code source, critère 8.2).

## Contenus non accessibles

### Non-conformités

- Les pages ont toutes le même titre, ce qui ne permet pas de les distinguer (critère 8.6).
- Il n'existe pas de lien permettant d'aller directement au contenu principal (critère 12.7).
- Le portail ne propose qu'un seul système de navigation commun à toutes les pages, le plan du site (critère 12.1).
- Sur la liste des formations, les listes de tri et de catégorie dépassent de l'écran sur un petit écran ou avec un texte agrandi (critères 10.4 et 10.11).
- La zone de dépôt de documents contient un champ sans étiquette (critère 11.1).
- Les champs obligatoires ne sont signalés qu'après l'envoi du formulaire (critère 11.10).
- Le message d'erreur d'une adresse e-mail invalide n'indique pas le format attendu (critère 11.11).

### Dérogations pour charge disproportionnée

Aucune.

### Contenus non soumis à l'obligation d'accessibilité

- Les documents déposés par les stagiaires (pièces justificatives, CV, etc.) : contenus de tiers, qui ne sont ni produits ni contrôlés par l'ADAC.

*Les documents déposés par l'ADAC elle-même (convocations, règlements, livrets d'accueil, supports) restent soumis à l'obligation : ils doivent être accessibles (PDF balisés, documents structurés).*

## Établissement de cette déclaration d'accessibilité

Cette déclaration a été établie le [date de publication].

### Technologies utilisées pour la réalisation du portail

- HTML
- CSS
- JavaScript (React)

### Environnement de test

Les vérifications de restitution de contenus ont été réalisées avec :

- Google Chrome [version], sous Windows ;
- [lecteur d'écran et version, par exemple NVDA : à compléter après le test de `test-lecteur-ecran.md`].

### Outils pour évaluer l'accessibilité

- axe-core (audit automatique de toutes les pages, en mode clair, sombre et haut contraste) ;
- Playwright (parcours au clavier, affichage à 320 px, texte agrandi à 200 %, espacement du texte) ;
- vérifications manuelles du code et de l'affichage.

### Pages du portail ayant fait l'objet de la vérification de conformité

Connexion · Activation du compte · Mentions légales et confidentialité · Accueil · Plan du site · Liste des formations · Détail d'une formation · Créer une formation · Conversation · Message groupé · Liste des stagiaires · Créer un stagiaire · Importer des comptes · Mon profil · Notifications.

## Retour d'information et contact

Si vous n'arrivez pas à accéder à un contenu ou à un service, vous pouvez contacter [le responsable du portail à l'ADAC] pour être orienté vers une alternative accessible ou obtenir le contenu sous une autre forme :

- [adresse e-mail de contact] ;
- [adresse postale ou téléphone].

## Voies de recours

*[À relire sur le modèle officiel avant publication.]*

Si vous constatez un défaut d'accessibilité vous empêchant d'accéder à un contenu ou une fonctionnalité du portail, que vous nous le signalez et que vous ne parvenez pas à obtenir une réponse de notre part, vous êtes en droit de faire parvenir vos doléances ou une demande de saisine au Défenseur des droits.

Plusieurs moyens sont à votre disposition :

- écrire un message au Défenseur des droits (formulaire en ligne sur defenseurdesdroits.fr) ;
- contacter le délégué du Défenseur des droits dans votre région ;
- envoyer un courrier par la poste (gratuit, ne pas mettre de timbre) : Défenseur des droits, Libre réponse 71120, 75342 Paris CEDEX 07.
