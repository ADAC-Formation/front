# Changements faits dans le back par Manon

> Journal à relire par Charlotte avant de merger. Règle : D66 (`docs/decisions/decisions-front-foundations.md`). Chaque changement est sur une **branche de travail** du clone `back-readonly`, créée depuis `origin/dev`, jamais sur `dev`, et n'est poussé que sur demande de Manon. Les points qui restent à décider avec Charlotte (rôles et permissions, UX visible, base de données et déploiement, endpoints cassés) ne sont **pas** ici : ils sont dans `points-pour-charlotte.md`.

## Comment lire une entrée

Une entrée par changement, la plus récente en haut :

- **Date, titre court, état** : `en cours` / `prêt à relire` / `poussé (PR #…)` / `mergé`.
- **Branche et commit** du back.
- **Quoi et pourquoi** : le besoin du front, en une ou deux phrases.
- **Fichiers touchés** (chemins du back) et **tests ajoutés**.
- **Contrat** : `tech.md` change-t-il ? Quels endpoints, champs, codes HTTP ?
- **À vérifier / risques** : ce que Charlotte doit regarder en priorité.
- **Lien avec** : référence de `points-pour-charlotte.md` (Q…, À…) que cela résout, le cas échéant.

## Entrées

### 2026-11-20 — `GET /users/{id}/inscriptions` ouvert au formateur pour ses propres formations (Q16) ; variables de stockage documentées (prêt à relire)

- **Branche et commit** (clone `back-readonly`, depuis `origin/dev`) : `feature/user-inscriptions-for-formateur`, `d25a0d4`. Indépendante des deux autres branches. Pas poussée.
- **Quoi et pourquoi** : l'endpoint de la Q16 était réservé à la chargée ; le front du formateur devait donc lire les inscrits de **chaque** formation pour savoir où est inscrit un stagiaire. Décision de Manon (2026-11-20, sans discussion préalable) : un formateur (`ADMIN`) appelle le même endpoint et reçoit **seulement les formations qu'il anime**, et seulement pour un stagiaire qu'il peut déjà voir (actif, inscrit à l'une de ses formations ; sinon `404`, comme `GET /users/{id}`). Il ne voit donc jamais les autres formations du même stagiaire. Le stagiaire garde `403`. La règle de visibilité de `getById` est extraite en une méthode privée partagée (`getVisibleToAdminOrThrow`), sans changement de comportement pour `getById`.
- **Fichiers touchés** : `UserController` (`hasAnyRole('SUPER_ADMIN','ADMIN')`, principal), `UserService` et `UserServiceImpl` (`getInscriptionsOf(id, principal)`), `docs/tech.md`, `.env.example` (commentaires `SUPABASE_*` : URL du projet seule, clé `service_role`, bucket privé, 502 si URL mal formée) ; tests : `UserServiceImplTest` (+2 : filtre sur ses formations, stagiaire d'un autre formateur → 404) et `UserControllerTest` (ADMIN autorisé, STAGIAIRE refusé).
- **Tests** : `UserServiceImplTest` et `UserControllerTest` : 95 verts. Suite complète : 3 échecs, tous liés aux données de ma base locale et sans rapport (`CategoryRepositoryTest` ×2 : 5 catégories au lieu de 6 ; `ActivationTokenRepositoryTest` ×1 : jetons d'activation locaux préexistants).
- **Contrat** : `tech.md` (§ `GET /api/users/{id}/inscriptions`). Rétrocompatible pour la chargée.
- **À vérifier / risques** : (1) le front **ne l'utilise pas encore** pour le formateur : il garde son parcours des formations tant que cette branche n'est pas mergée et déployée (sinon `403` sur un back qui ne l'a pas) ; à basculer ensuite, c'est une simplification ; (2) c'est un élargissement de droit (le formateur lit un endpoint auparavant réservé), limité à ses propres formations et stagiaires.
- **Lien avec** : Q16 de `points-pour-charlotte.md` (À2).

### 2026-11-20 — Message groupé : mêmes destinataires pour tous les rôles, comptes suspendus écartés ; `tech.md` corrigé (prêt à relire)

- **Branche et commit** (clone `back-readonly`) : `fix/group-message-recipient-rules`, `4b9d488`. **Empilée sur** `feature/group-message-excluded-users` (même méthode `resolveGroupRecipients`) : relire et merger celle-là d'abord. Pas poussé.
- **Quoi et pourquoi** : (1) un message groupé de la chargée atteignait les stagiaires jamais activés, celui du formateur non (`canMessage` exige `isActive` pour un ADMIN) ; or le message les attend dans leur fil et leur cloche. Décision de Manon : même règle pour tous. (2) Les comptes **suspendus** (activés un jour, puis désactivés) ne reçoivent plus de message groupé, même de la chargée. (3) `tech.md` disait qu'un aperçu de groupe vide répond 400 ; il répond `200 []` (c'est l'envoi qui répond 400).
- **Règle** : actif → `canMessage` comme avant ; inactif → écarté si `hasEverActivated`, sinon reçu par la chargée et par le formateur. Les envois individuels ne changent pas.
- **Fichiers touchés** : `service/MessageServiceImpl.java` (`canReceiveGroupMessage`, `ActivationService` injecté), `docs/tech.md`, `MessageServiceImplTest` (3 tests ajoutés, 1 réécrit : « jamais activé » reçu par la chargée et le formateur, suspendu écarté, aperçu).
- **Tests** : rouge avant, vert après ; `Message*Test` : 91 verts.
- **Contrat** : `tech.md` (section groupée et aperçu). Aucun champ ni code HTTP nouveau.
- **À vérifier / risques** : un appel `hasEverActivated` (une requête) par destinataire inactif d'un groupe ; négligeable pour des formations, à surveiller sur `MISSING_DOCS` si beaucoup de comptes inactifs.
- **Lien avec** : À7 b et c de `points-pour-charlotte.md`.

### 2026-11-20 — Message groupé : `filter.excludedUserIds` pour retirer des personnes d'un envoi (prêt à relire)

- **Branche et commit** (clone `back-readonly`, depuis `origin/dev`) : `feature/group-message-excluded-users`, `9974577`. Pas poussé : à pousser et ouvrir en PR quand Manon le décide.
- **Quoi et pourquoi** : sur la page « Message groupé » du front, chaque personne de l'aperçu a une case (cochée par défaut, H20) pour la retirer de l'envoi, y compris pour le formateur. Le back n'avait pas d'exclusion, et `MANUAL` est réservé à la chargée de formation. Nouveau champ optionnel `filter.excludedUserIds` : les destinataires résolus (tout type de filtre) dont l'id y figure sont retirés avant l'envoi. Aucun nouveau droit : le formateur reste limité à ses formations, la règle `canMessage` s'applique toujours. Tout exclure donne le même 400 que « aucun destinataire ».
- **Fichiers touchés** : `dto/request/SendMessageRequest.java` (champ `excludedUserIds` + constructeur à 3 arguments conservé), `service/MessageServiceImpl.java` (`resolveGroupRecipients`), `docs/tech.md` (§ POST /messages/send) ; tests dans `MessageServiceImplTest` (4 : chargée, formateur sur sa formation, tout exclu → 400, id hors groupe sans effet).
- **Tests** : rouge (compilation) avant, vert après ; `Message*Test` : 87 verts. Vérifié sur le back local : formateur, formation à 4 stagiaires, une exclue → 3 destinataires ; quatre exclues → 400.
- **Contrat** : `tech.md` change (champ optionnel, rétrocompatible). L'aperçu (`GET /messages/group/preview`) ne prend pas le paramètre : il liste tout le monde, les cases du front font le reste.
- **À vérifier / risques** : un id inconnu ou hors groupe dans `excludedUserIds` est ignoré sans erreur (voulu, pour qu'une liste périmée ne bloque pas l'envoi).
- **Lien avec** : H20 de `decisions-messagerie.md`.

### 2026-11-19 — Les notifications de message n'étaient jamais enregistrées : correctif (mergé)

- **Branche et commit** (clone `back-readonly`, depuis `origin/dev`) : `fix/message-notifications-not-persisted`, `42dbdcb`. Mergé dans `dev` le 2026-11-20 (PR #22).
- **Quoi et pourquoi** : en vérifiant la messagerie groupée sur le vrai back, aucune notification `NEW_MESSAGE` n'existait en base, ni pour un message individuel ni pour un message groupé (US-013 AC-07 et US-014 AC-04 non tenus). `MessageServiceImpl.notifyAfterCommit` appelait `NotificationService.notify` depuis `afterCommit`, et `notify` (`@Transactional`, REQUIRED) rejoignait la transaction déjà validée : son `save` n'était jamais commité. Maintenant le notifier tourne dans sa propre transaction (`TransactionTemplate`, `PROPAGATION_REQUIRES_NEW`). Le message lui-même n'est pas touché : un échec de notification est toujours journalisé sans faire échouer l'envoi.
- **Fichiers touchés** : `src/main/java/com/adac/portail/service/MessageServiceImpl.java` (champ `PlatformTransactionManager`, `afterCommit`) ; nouveau test `src/test/java/com/adac/portail/service/MessageNotificationIntegrationTest.java` (`@SpringBootTest`, vraie base : individuel, groupé à deux destinataires, et l'expéditeur ne se notifie pas).
- **Tests** : rouge avant le correctif (les 2 tests de notification échouent, 0 ligne), vert après ; `MessageServiceImplTest` (53) et `NotificationServiceImplTest` (15) restent verts ; suite complète : seuls 2 tests de `CategoryRepositoryTest` échouent, aussi sur `dev` avec ma base locale (5 catégories au lieu de 6, données locales). Vérifié de bout en bout : un envoi groupé et un envoi individuel créent chacun une notification `NEW_MESSAGE` (`entityType` `MESSAGE`, `entityId` = expéditeur).
- **Contrat** : aucun changement de `tech.md` ni de réponse d'API.
- **À vérifier / risques** : (1) j'ai volontairement laissé `notify` tel quel : un `REQUIRES_NEW` directement dessus changerait l'atomicité des autres appelants (documents, etc.) ; (2) `MessageServiceImpl` a un champ de plus (le constructeur Lombok change, les tests unitaires l'ignorent car ils n'activent pas la synchronisation) ; (3) le test d'intégration écrit dans la base du profil `dev` et nettoie ses données (même principe que `ActivationServiceIntegrationTest`).
- **Lien avec** : À7 a de `points-pour-charlotte.md` ; H18 de `decisions-messagerie.md`.

### 2026-11-19 — `AGENTS.md` : le plan d'un ticket peut être validé par n'importe quel humain, pas seulement Charlotte (mergé)

- **Branche et commit** (clone `back-readonly`, depuis `origin/dev`) : `chore/agents-human-validation`, `0615bc4`. Mergé dans `dev` le 2026-11-20 (PR #21).
- **Quoi et pourquoi** : `AGENTS.md` demandait de « présenter un plan concret et attendre la validation de Charlotte » avant chaque ticket. Avec D66 (Manon peut modifier le back), cette règle bloquait. La phrase devient : présenter le plan **à un humain (Charlotte, ou Manon quand c'est elle qui conduit la session)** et attendre **sa** validation. Un humain reste dans la boucle, comme voulu à l'origine ; seule la personne change.
- **Fichiers touchés** : `AGENTS.md` (ligne 17, une phrase). Aucun test, aucun code.
- **Contrat** : aucun changement de `tech.md`.
- **À vérifier / risques** : deux autres endroits disent encore « Charlotte » et n'ont **pas** été modifiés, donc les agents du back y liront toujours son nom : `docs/BACKEND_WORKFLOW.md` ligne 30 (« Attendre la validation de Charlotte. ») et `.claude/skills/backend-agent/SKILL.md` ligne 12. À aligner si tu es d'accord (une phrase chacun).
- **Lien avec** : D66 (`decisions-front-foundations.md`).
