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
