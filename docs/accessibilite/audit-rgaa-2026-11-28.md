# Audit RGAA 4.1.2 du portail de formation — 28 novembre 2026

> **Nature de cet audit.** Auto-évaluation réalisée par l'équipe de développement (Claude Code, session de Manon), pas un audit d'un organisme indépendant. Elle suit la méthode du RGAA 4.1.2 (référentiel publié par la DINUM : 106 critères, 13 thématiques) sur un échantillon de 15 pages. Elle peut servir de base à une déclaration d'accessibilité (brouillon : `declaration-accessibilite-brouillon.md`), à relire avant toute publication.

## Résultat

| | Nombre |
| --- | --- |
| Critères conformes (C) | 63 |
| Critères non conformes (NC) | 8 |
| Critères non applicables (NA) | 34 |
| Critère non testé | 1 (8.2, validité du code) |
| **Taux de conformité** (C ÷ (C + NC)) | **88,7 %** (63 ÷ 71) |

**Statut : partiellement conforme** (au moins 50 % des critères respectés, moins de 100 %).

Le taux exclut le critère 8.2, non testé (voir « Limites »). Compté non conforme, il donnerait 87,5 %.

## Méthode

- **Référentiel** : liste officielle des critères RGAA 4.1.2, fichier `RGAA/criteres.json` du dépôt public `DISIC/accessibilite.numerique.gouv.fr` (106 critères).
- **Environnement** : Chrome (version installée sur le poste) piloté par Playwright, sur le front local branché au vrai back local (comptes de développement, `docs/dev/seed-local-admin.sql`). Branche `dev` du front au commit `aa01c83` (après NOTES-34).
- **Relevés automatiques** sur chaque page de l'échantillon : titre, langue, repères (`header`, `nav`, `main`, `footer`), titres de section, images, liens, boutons, champs (étiquette, caractère obligatoire, `autocomplete`, regroupement), tableaux, messages de statut, identifiants dupliqués, parcours au clavier (ordre, focus visible, piège), affichage à 320 px de large, texte agrandi à 200 %, espacement du texte augmenté (WCAG 1.4.12), feuilles de styles désactivées.
- **Contrastes** : audit axe-core (WCAG 2.2 AA) de toutes les pages en mode clair, sombre et haut contraste, et calcul des couleurs du thème (D68, `src/test/a11y-contrast.test.js`).
- **Lecture du code** pour les composants (boîtes de dialogue, onglets, menus, zone de dépôt, messages d'erreur).
- **Vérifications ciblées** des cas douteux (captures d'écran à l'appui).

## Échantillon

| Id | Page | Profil |
| --- | --- | --- |
| P01 | Connexion (`/login`) | visiteur |
| P02 | Activation du compte (`/activation`) | visiteur |
| P03 | Mentions légales et confidentialité (`/mentions-legales`) | visiteur |
| P04 | Accueil (`/`) | chargée de formation |
| P05 | Plan du site (`/plan-du-site`) | chargée de formation |
| P06 | Liste des formations (`/formations`) | chargée de formation |
| P07 | Détail d'une formation, avec dépôt de documents (`/formations/:id`) | stagiaire |
| P08 | Créer une formation (`/formations/creer`) | chargée de formation |
| P09 | Conversation (`/messages/:id`) | chargée de formation |
| P10 | Message groupé (`/messages/groupe`) | chargée de formation |
| P11 | Liste des stagiaires (`/admin/stagiaires`) | chargée de formation |
| P12 | Créer un stagiaire (`/admin/stagiaires/nouveau`) | chargée de formation |
| P13 | Importer des comptes (`/admin/comptes/importer`) | chargée de formation |
| P14 | Mon profil (`/profile`) | stagiaire |
| P15 | Notifications (`/notifications`) | stagiaire |

La page « Accessibilité » (déclaration) n'existe pas encore : elle n'a pas pu être auditée.

## Non-conformités et corrections proposées

| Critère | Constat | Pages | Correction proposée |
| --- | --- | --- | --- |
| **8.6** Titre de page pertinent | Toutes les pages ont le même titre « ADAC Formations » : un utilisateur de lecteur d'écran ou d'onglets ne distingue pas les pages. | toutes | Un titre par page, sur le modèle « Liste des formations – ADAC Formations ». |
| **12.7** Lien d'évitement | Aucun lien « Aller au contenu » : au clavier, il faut traverser l'en-tête sur chaque page. | toutes | Lien « Aller au contenu » en tête de page, visible au focus, vers `main`. |
| **12.1** Deux systèmes de navigation | Seul le plan du site (menu Accessibilité) est présent sur toutes les pages ; pas de menu de navigation permanent ni de moteur de recherche. Les tuiles de l'accueil et les liens « Retour » ne comptent pas comme menu. | toutes | **Décision de design** : menu de navigation principal (`nav`) dans l'en-tête, ou moteur de recherche. |
| **10.11** Affichage à 320 px | Liste des formations : les listes « Catégorie » et « Organiser par » mesurent 395 px (option la plus longue) ; la page défile horizontalement. | P06 | Même correction que le sélecteur de formations (NOTES-26) : largeur en pourcentage, `min-width: 0`. |
| **10.4** Texte agrandi à 200 % | Même cause que 10.11 sur la liste des formations. | P06 | Corrigé par la même modification. |
| **11.1** Étiquette de champ | La zone de dépôt de documents contient un champ fichier sans étiquette (hors de la tabulation, mais trouvé par un lecteur d'écran). | P07 | Masquer ce champ aux technologies d'assistance (le bouton « Choisir un fichier » de chaque créneau reste l'accès) ou lui donner une étiquette. |
| **11.10** Contrôle de saisie | Les champs obligatoires ne sont signalés qu'après l'envoi (message d'erreur) ; aucune indication visible avant (mention « obligatoire » ou astérisque expliqué). | P01, P02, P08, P12, P14 | **Décision de design** : mention « (obligatoire) » dans l'étiquette, ou phrase « Tous les champs sont obligatoires sauf mention contraire » en tête de formulaire. |
| **11.11** Suggestions de correction | « L'adresse e-mail n'est pas valide. » ne donne pas le format attendu (les messages du mot de passe, eux, donnent la règle). | P01, P02, P12 | Ajouter un exemple : « L'adresse e-mail n'est pas valide (exemple : nom@exemple.fr). » |

## Grille complète

Légende : **C** conforme · **NC** non conforme · **NA** non applicable · **NT** non testé.

### 1. Images

| Critère | Statut | Note |
| --- | :-: | --- |
| 1.1 Image porteuse d'information avec alternative | C | Logo : `alt="ADAC Formation"`. |
| 1.2 Image de décoration ignorée | C | Toutes les icônes (SVG) sont `aria-hidden="true"` (1 à 71 par page). |
| 1.3 Alternative pertinente | C | Logo. |
| 1.4 Alternative d'un CAPTCHA ou image-test | NA | Aucun CAPTCHA. |
| 1.5 Accès alternatif au CAPTCHA | NA | Aucun CAPTCHA. |
| 1.6 Description détaillée si nécessaire | NA | Aucune image complexe. |
| 1.7 Description détaillée pertinente | NA | Idem. |
| 1.8 Image texte remplacée par du texte stylé | C | Seul le logo contient du texte (exception logo). |
| 1.9 Légende d'image reliée | NA | Aucune légende d'image. |

### 2. Cadres

| Critère | Statut | Note |
| --- | :-: | --- |
| 2.1 Titre de cadre | NA | Aucun `iframe`. |
| 2.2 Titre de cadre pertinent | NA | Idem. |

### 3. Couleurs

| Critère | Statut | Note |
| --- | :-: | --- |
| 3.1 Information pas uniquement par la couleur | C | Statuts, catégories, pastilles et non-lus sont aussi donnés en texte (dont texte réservé aux lecteurs d'écran : « (lue) »). |
| 3.2 Contraste du texte | C | Audit axe-core de toutes les pages, trois thèmes : aucune erreur après D68. |
| 3.3 Contraste des composants et éléments graphiques | C | Bords des champs et anneau de focus ≥ 3:1 dans tous les thèmes (D68), mesurés dans le navigateur. |

### 4. Multimédia

| Critère | Statut | Note |
| --- | :-: | --- |
| 4.1 à 4.13 | NA | Aucun média audio ou vidéo, aucun média non temporel. |

### 5. Tableaux

| Critère | Statut | Note |
| --- | :-: | --- |
| 5.1 Résumé d'un tableau complexe | NA | Aucun tableau complexe. |
| 5.2 Résumé pertinent | NA | Idem. |
| 5.3 Tableau de mise en forme compréhensible linéarisé | NA | Aucun tableau de mise en forme. |
| 5.4 Titre associé au tableau de données | C | P13 : `caption` « Colonnes attendues ». |
| 5.5 Titre pertinent | C | Idem. |
| 5.6 En-têtes déclarés | C | `th` avec `scope="col"`. |
| 5.7 Association cellules / en-têtes | C | Idem. |
| 5.8 Pas d'éléments de tableau de données dans une mise en forme | NA | Aucun tableau de mise en forme. |

### 6. Liens

| Critère | Statut | Note |
| --- | :-: | --- |
| 6.1 Lien explicite | C | « Retour » et « Annuler » mènent à des pages différentes selon la page, explicites par leur contexte (cas admis). |
| 6.2 Lien avec intitulé | C | Aucun lien sans intitulé sur l'échantillon. |

### 7. Scripts

| Critère | Statut | Note |
| --- | :-: | --- |
| 7.1 Script compatible avec les technologies d'assistance | C | Boîtes de dialogue (`role="dialog"`, `aria-modal`, titre), onglets (`tablist` / `tab` / `tabpanel`, flèches), menus et bulle d'en-tête (`aria-expanded`, `aria-controls`). Restitution réelle à confirmer au lecteur d'écran (voir « Limites »). |
| 7.2 Alternative à un script pertinente | NA | Aucune alternative nécessaire. |
| 7.3 Script contrôlable au clavier et à la souris | C | Parcours au clavier de toutes les pages : aucun piège, tous les contrôles atteints. |
| 7.4 Changement de contexte annoncé ou contrôlé | C | Aucun changement de contexte à la saisie ou à la sélection. |
| 7.5 Messages de statut restitués | C | Zones `role="status"` et `role="alert"` (chargements, confirmations, erreurs, compteurs). |

### 8. Éléments obligatoires

| Critère | Statut | Note |
| --- | :-: | --- |
| 8.1 Type de document | C | `<!doctype html>`. |
| 8.2 Code source valide | **NT** | Pas d'identifiant dupliqué ni d'imbrication interdite relevés (axe) ; le validateur du W3C n'a pas été passé (voir « Limites »). |
| 8.3 Langue par défaut | C | `lang="fr"`. |
| 8.4 Code de langue pertinent | C | Idem. |
| 8.5 Titre de page présent | C | « ADAC Formations ». |
| 8.6 Titre de page pertinent | **NC** | Titre identique sur toutes les pages. |
| 8.7 Changements de langue indiqués | C | Interface entièrement en français ; les noms de fichiers déposés par les utilisateurs sont du contenu tiers. |
| 8.8 Code de langue des changements valide | C | Idem. |
| 8.9 Balises non utilisées à des fins de présentation | C | Aucun `br` ni paragraphe vide servant d'espacement. |
| 8.10 Changements du sens de lecture signalés | NA | Aucun. |

### 9. Structuration de l'information

| Critère | Statut | Note |
| --- | :-: | --- |
| 9.1 Information structurée par des titres | C | Un seul `h1` par page, niveaux sans saut. |
| 9.2 Structure du document cohérente | C | `header`, `main`, `footer` sur chaque page. Pas de navigation principale (voir 12.1). |
| 9.3 Listes correctement structurées | C | Listes en `ul` / `ol` ; aucune erreur axe. |
| 9.4 Citations indiquées | NA | Aucune citation. |

### 10. Présentation de l'information

| Critère | Statut | Note |
| --- | :-: | --- |
| 10.1 Présentation par feuilles de styles | C | CSS Modules et jetons globaux. |
| 10.2 Contenu visible conservé sans styles | C | Même texte avec et sans feuilles de styles ; aucun texte généré en CSS. |
| 10.3 Information compréhensible sans styles | C | Ordre du code : logo, en-tête, contenu, pied de page. |
| 10.4 Texte lisible à 200 % | **NC** | P06 : débordement horizontal (listes déroulantes). Autres pages : conformes. |
| 10.5 Couleurs de fond et de texte déclarées ensemble | C | Fond et texte définis par les mêmes jetons. |
| 10.6 Liens visibles dans le texte | C | Liens dans un paragraphe soulignés (P03) ; liens sans style : couleur du texte et soulignés (D68). |
| 10.7 Focus visible | C | Anneau de focus sur chaque élément, y compris sur le conteneur des champs de recherche et sur toute la carte des listes de comptes. |
| 10.8 Contenus cachés ignorés à bon escient | C | Textes réservés aux lecteurs d'écran ; rangée d'en-tête repliée `inert`. |
| 10.9 Information pas uniquement par la forme, taille ou position | C | Icônes accompagnées de texte ou d'un nom accessible ; flèche des cartes décorative. |
| 10.10 Idem, mise en œuvre pertinente | C | Idem. |
| 10.11 Pas de défilement horizontal à 320 px | **NC** | P06 (voir 10.4). Autres pages : conformes. |
| 10.12 Espacement du texte redéfinissable | C | Aucune perte de contenu avec les valeurs WCAG 1.4.12. |
| 10.13 Contenus additionnels au survol ou au focus contrôlables | C | Libellés « Se déconnecter » et « Envoyer un retour » dépliés au survol ou au focus, sans recouvrir d'autre contenu. |
| 10.14 Contenus additionnels en CSS atteignables au clavier | C | Les mêmes libellés se déplient aussi au focus clavier. |

### 11. Formulaires

| Critère | Statut | Note |
| --- | :-: | --- |
| 11.1 Champ avec étiquette | **NC** | P07 : champ fichier de la zone de dépôt sans étiquette. Tous les autres champs ont une étiquette. |
| 11.2 Étiquette pertinente | C | |
| 11.3 Étiquettes cohérentes entre pages | C | « Adresse e-mail », « Mot de passe », « Organiser par : »… |
| 11.4 Étiquette et champ accolés | C | 7 à 34 px. |
| 11.5 Champs de même nature regroupés | C | `fieldset` (création de formation, filtres de statut, choix des formations) ; `radiogroup` nommé pour le message groupé. |
| 11.6 Regroupement avec légende | C | Idem. |
| 11.7 Légende pertinente | C | « Informations générales », « Organisation », « Statut », « Formations »… |
| 11.8 Items de liste de choix regroupés | NA | Listes courtes, sans regroupement nécessaire. |
| 11.9 Intitulé de bouton pertinent | C | Y compris « Suspendre <nom> », « Télécharger <fichier> ». |
| 11.10 Contrôle de saisie pertinent | **NC** | Caractère obligatoire non indiqué avant l'envoi. Les erreurs, elles, sont annoncées et reliées au champ. |
| 11.11 Suggestions de correction | **NC** | Format de l'adresse e-mail non suggéré. |
| 11.12 Données modifiables ou récupérables | C | Suppressions et désinscriptions confirmées ; suspension réversible. |
| 11.13 Finalité des champs (remplissage automatique) | C | `autocomplete` sur les données de l'utilisateur (e-mail, mots de passe, code). Les champs de création de compte décrivent une autre personne : `autocomplete="off"` voulu. |

### 12. Navigation

| Critère | Statut | Note |
| --- | :-: | --- |
| 12.1 Deux systèmes de navigation | **NC** | Plan du site seulement (voir non-conformités). |
| 12.2 Menus et barres de navigation toujours à la même place | C | En-tête identique sur toutes les pages. |
| 12.3 Plan du site pertinent | C | Liens vers les grandes rubriques (formations, messages, notifications, profil, gestion, formateurs, stagiaires, documents). Intitulé à corriger : « Plan de site ». |
| 12.4 Plan du site accessible de manière identique | C | Lien « Plan de site » du menu Accessibilité, sur toutes les pages. |
| 12.5 Moteur de recherche atteignable de manière identique | NA | Pas de moteur de recherche du site (les champs de recherche filtrent une liste). |
| 12.6 Zones de regroupement atteignables ou évitables | C | Repères `header`, `main`, `footer`. |
| 12.7 Lien d'évitement | **NC** | Absent. |
| 12.8 Ordre de tabulation cohérent | C | En-tête, puis contenu dans l'ordre de lecture, puis pied de page. |
| 12.9 Pas de piège au clavier | C | Aucun sur l'échantillon ; les boîtes de dialogue gardent le focus et se ferment à Échap. |
| 12.10 Raccourcis à une seule touche contrôlables | NA | Aucun raccourci (seule la touche Échap ferme les panneaux). |
| 12.11 Contenus additionnels atteignables au clavier | C | Cloche, menu Accessibilité, bulle d'en-tête : ouverts et parcourus au clavier (D67). |

### 13. Consultation

| Critère | Statut | Note |
| --- | :-: | --- |
| 13.1 Limite de temps contrôlable | C | Session de 24 h (exception : plus de 20 heures). |
| 13.2 Pas de nouvelle fenêtre sans action | C | Un seul lien en nouvelle fenêtre (« Retour d'expérience »), sur action de l'utilisateur et annoncé « (nouvelle fenêtre) ». |
| 13.3 Document bureautique en version accessible | C | Seul document produit par le portail : le modèle d'import Excel (en-têtes de colonnes). Les documents déposés par les utilisateurs sont des contenus tiers. |
| 13.4 Version accessible équivalente | NA | Pas de version alternative nécessaire. |
| 13.5 Contenu cryptique avec alternative | C | « ≡ » et « → » : nom accessible ou décoratifs. |
| 13.6 Alternative pertinente | C | Idem. |
| 13.7 Flashs et changements brusques de luminosité | NA | Aucun. |
| 13.8 Contenu en mouvement contrôlable | NA | Aucun contenu en mouvement de plus de 5 s ni en boucle (relevé sur l'échantillon). |
| 13.9 Consultable dans les deux orientations | C | Pas de blocage d'orientation. |
| 13.10 Gestes complexes : alternative simple | C | Glisser-déposer des documents doublé d'un bouton « Choisir un fichier ». |
| 13.11 Actions au pointeur annulables | C | Actions déclenchées au relâchement (clic) ; `mousedown` sert seulement à fermer un panneau en cliquant ailleurs. |
| 13.12 Mouvement de l'appareil : alternative | NA | Aucune fonction liée au mouvement. |

## Limites

- **Pas de test au lecteur d'écran.** La restitution vocale (NVDA, VoiceOver) n'a pas été écoutée : les critères 7.1, 7.5, 9 et 11 reposent sur la lecture du code et l'arbre d'accessibilité. Un passage manuel est prévu : `test-lecteur-ecran.md`.
- **Critère 8.2 non testé.** Le validateur du W3C n'a pas été utilisé : le service en ligne recevrait le code des pages. À faire avec le validateur installé en local (`vnu`), ou en acceptant d'envoyer des pages de démonstration sans données réelles.
- **Échantillon de 15 pages.** Les autres pages partagent les mêmes composants, mais n'ont été vérifiées qu'à l'audit axe-core (D68).
- **Contenus déposés par les utilisateurs** (documents PDF, Word, images) : hors du contrôle du portail ; leur accessibilité relève de leurs auteurs.
- **Auto-évaluation** : à faire confirmer par un audit indépendant si l'ADAC doit publier une déclaration engageante.
