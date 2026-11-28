# Test au lecteur d'écran (NVDA) — 30 minutes

Complète l'audit RGAA du 28 novembre 2026 (`audit-rgaa-2026-11-28.md`, section « Limites ») : l'outil automatique ne peut pas **écouter** ce que le portail dit. Ce test se fait à la main, sur le back local, avec les comptes de développement (`docs/dev/seed-local-admin.sql`).

## Préparer (5 minutes)

1. Installer **NVDA** (gratuit) depuis nvaccess.org, version la plus récente.
2. Lancer NVDA, puis Chrome sur `http://localhost:5173`. Couper le son des autres applications.
3. Commandes utiles :

| Action | Touches |
| --- | --- |
| Arrêter la lecture | `Ctrl` |
| Élément suivant au clavier | `Tab` (précédent : `Maj+Tab`) |
| Lire en continu à partir d'ici | `Insert+↓` |
| Titre suivant | `H` (niveau 1 à 6 : `1` à `6`) |
| Repère suivant (en-tête, contenu, pied) | `D` |
| Liste des titres, liens, repères | `Insert+F7` |
| Champ de formulaire suivant | `F` |
| Passer en saisie dans un champ | `Entrée` (en sortir : `Échap`) |
| Quitter NVDA | `Insert+Q` |

## Scénarios

Pour chacun : noter **ce que NVDA dit** quand quelque chose est faux, absent ou confus.

| # | Scénario | Ce qu'on doit entendre |
| --- | --- | --- |
| 1 | **Connexion** : remplir l'e-mail et le mot de passe en se trompant d'adresse, valider. | L'étiquette de chaque champ ; à l'erreur, le message est lu et le champ est annoncé « invalide ». |
| 2 | **Accueil** (chargée de formation) : `Insert+F7`, onglet « Repères », puis « Titres ». | Repères « bannière », « principal », « informations de contenu » ; titre « Bonjour Chargée ». |
| 3 | **Liste des formations** : filtrer par catégorie, puis ouvrir une formation. | Le nom de la liste « Catégorie » et l'option choisie ; le nombre de formations mis à jour ; le nom de la formation dans chaque lien. |
| 4 | **Créer un stagiaire** : envoyer sans formation cochée, puis cocher une formation. | « Choisissez au moins une formation. » lu, relié au groupe « Formations » ; disparaît après la case cochée. |
| 5 | **Message** : ouvrir une conversation, écrire et envoyer un message. | Le fil « Messages » atteint au clavier et lu message par message (auteur, date, texte) ; confirmation d'envoi. |
| 6 | **Notifications** : ouvrir la cloche de l'en-tête, en lire une, fermer avec `Échap`. | « Notifications, N non lues » ; chaque notification lue avec son type ; retour du focus sur la cloche. |
| 7 | **Stagiaire, détail d'une formation** : ouvrir l'onglet « Mes documents », déposer un fichier. | Onglets annoncés « onglet, sélectionné, 1 sur 2 » ; le bouton de dépôt nommé avec le type de document ; la confirmation du dépôt. |
| 8 | **Menu Accessibilité** : l'ouvrir, activer « Haut contraste », le refermer. | Le menu annoncé ouvert ; l'état de l'option (cochée / activée) ; le focus revient au bouton. |

## Reporter les résultats

- Dans `audit-rgaa-2026-11-28.md` : une ligne par problème entendu, avec le critère concerné (souvent 7.1, 7.5, 9.1, 11.1, 11.10) ; mettre à jour la section « Limites ».
- Dans `declaration-accessibilite-brouillon.md` : la version de NVDA et de Chrome, section « Environnement de test ».
