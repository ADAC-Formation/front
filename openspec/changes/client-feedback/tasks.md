# Tasks

Ordre : back d'abord (D-10), puis front. TDD obligatoire : chaque groupe commence par des tests rouges (RED confirmé), puis l'implémentation minimale (GREEN confirmé). Un commit par groupe, Conventional Commits. Ne jamais pousser sans demande de Manon.

## 1. Back — préparation de la branche

- [x] 1.1 Dans `../back-readonly`, vérifier `git status` propre, `git fetch origin`, créer `feature/feedback` depuis `origin/dev` ; lire `AGENTS.md`, `CLAUDE.md`, `docs/BACKEND_WORKFLOW.md`, `docs/STACK.md`, `docs/ADAC_KNOWLEDGE.md` ; vérifier que `mvn test` est vert sur la base de départ (référence avant changement)

## 2. Back — validation de l'image et limiteur de débit

- [x] 2.1 Écrire `FeedbackScreenshotValidatorTest` (png, jpeg, webp acceptés avec type canonique ; PDF déclaré `image/png` refusé ; > 3 Mo refusé ; fichier vide = absent) et confirmer RED à la compilation/exécution
- [x] 2.2 Implémenter `FeedbackScreenshotValidator` (D-7) et confirmer GREEN sur `FeedbackScreenshotValidatorTest`
- [x] 2.3 Écrire `FeedbackRateLimiterTest` avec `Clock` fixe (10 envois acceptés, 11e refusé, fenêtre glissante libérée après 1 h, utilisateurs indépendants, purge) et confirmer RED
- [x] 2.4 Implémenter `FeedbackRateLimiter` (D-9) et confirmer GREEN ; commit `feat(feedback): validate screenshot and rate-limit feedback per user`

## 3. Back — email de retour

- [x] 3.1 Écrire dans `EmailTemplateBuilderTest` les cas `buildFeedbackEmail` (message, rôle, page, navigateur, taille, version présents ; `<img src=x onerror=alert(1)>` échappé ; retours à la ligne conservés) et confirmer RED
- [x] 3.2 Écrire dans `EmailServiceImplTest` les cas `sendFeedbackEmail` (destinataire = `app.feedback.recipient`, `Reply-To` = auteur, sujet `[ADAC][Bug] Prénom Nom — /page`, retours à la ligne retirés du sujet, pièce jointe présente avec le type canonique, pas de pièce jointe sans image) et confirmer RED
- [x] 3.3 Implémenter `FeedbackType`, `FeedbackRequest`, `EmailTemplateBuilder.buildFeedbackEmail`, `EmailService(Impl).sendFeedbackEmail` (D-6) et la propriété `app.feedback.recipient: ${FEEDBACK_RECIPIENT:}` ; confirmer GREEN sur les deux classes de test ; commit `feat(feedback): send feedback email with reply-to and attachment`

## 4. Back — service, endpoint et erreurs

- [x] 4.1 Écrire `FeedbackServiceImplTest` (validation type/message 10–2000 → `BadRequestException` ; limiteur consulté avant envoi et alimenté seulement après succès ; `MailException` → `FeedbackDeliveryException` ; identité prise de l'utilisateur de session) et confirmer RED
- [x] 4.2 Écrire `FeedbackControllerTest` (MockMvc multipart : 201 pour `SUPER_ADMIN` et `ADMIN` ; 403 `STAGIAIRE` ; 401 sans session ; 400 type inconnu, message trop court, image déguisée ; 429 au-delà de la limite ; 503 sur `FeedbackDeliveryException` avec le message attendu ; une partie `email`/`role` ajoutée est ignorée) et le cas 503 dans `GlobalExceptionHandlerTest` ; confirmer RED
- [x] 4.3 Implémenter `FeedbackService(Impl)`, `FeedbackDeliveryException` + son gestionnaire 503 (D-8), `FeedbackController` (D-5) ; vérifier qu'aucun journal ne contient message ni email ; confirmer GREEN sur les tests ciblés puis `mvn test` complet vert ; commit `feat(feedback): add POST /api/feedback endpoint`

## 5. Back — contrat et journal

- [x] 5.1 Ajouter la section `POST /api/feedback` à `docs/tech.md` (parties multipart, rôles, 201/400/401/403/413/429/503, messages d'erreur, `FEEDBACK_RECIPIENT`) et l'exemple de variable dans la doc d'env du back si elle existe ; commit `docs(feedback): document POST /api/feedback in tech.md`
- [ ] 5.2 Fusionner `feature/feedback` dans `local/integration` pour le back local ; lancer le back via Docker compose avec `FEEDBACK_RECIPIENT` dans `ADAC/dev-compose/.env` ; vérifier avec un `curl` multipart authentifié qu'un email arrive dans Mailtrap avec sujet, Reply-To et image jointe
- [x] 5.3 Ajouter l'entrée du 2026-11-23 dans `front/docs/charlotte/changements-back.md` (branche, commits, fichiers, tests, contrat, points à vérifier, lien Q18) et vérifier que `git -C ../back-readonly status` ne montre que la branche voulue

## 6. Front — version de l'application et accès API

- [x] 6.1 Ajouter `__APP_VERSION__` (D-4) dans `vite.config.js` (build et test) et comme global dans `eslint.config.js` ; vérifier que `npm run lint` et `npm run build` passent et que le bundle contient `0.0.0+local`
- [x] 6.2 Écrire `features/feedback/api.test.js` (MSW : `sendFeedback` envoie un multipart avec `type`, `message`, `page`, `userAgent`, `viewport`, `appVersion`, `screenshot` facultatif ; `collectFeedbackContext` retire query string et fragment) et le mock `mockSendFeedback()` dans `src/test/msw/` (201 par défaut, options 400/429/503) ; confirmer RED
- [x] 6.3 Implémenter `features/feedback/api.js` (`sendFeedback`, `collectFeedbackContext`) et `useSendFeedback` (D-3) ; confirmer GREEN ; commit `feat(feedback): add feedback API client and app version`

## 7. Front — boîte de dialogue

- [x] 7.1 Ajouter dans `utils/validation.test.js` les cas `validateFeedbackMessage` (< 10, 10, 2000, > 2000) et `validateFeedbackImage` (> 3 Mo, type refusé, png/jpeg/webp acceptés) ; confirmer RED
- [x] 7.2 Écrire `FeedbackDialog.test.jsx` : focus initial dans la boîte, Échap/Annuler ferment sans requête, erreurs de champ sans requête, avertissement U14 et liste du contexte visibles, image trop lourde bloque l'envoi, succès appelle `onSent`, 429/503 laissent la saisie et affichent le message du back en `role="alert"`, double clic = une requête, check jest-axe ; confirmer RED
- [x] 7.3 Implémenter les validateurs et `FeedbackDialog` (+ CSS Module en jetons, `rem`, focus visible) (D-2) ; confirmer GREEN ; commit `feat(feedback): add feedback dialog`

## 8. Front — bouton dans l'en-tête

- [x] 8.1 Écrire `FeedbackButton.test.jsx` (visible pour `SUPER_ADMIN` et `ADMIN` ; absent pour `STAGIAIRE`, sans session et pendant le chargement de `/auth/me` ; ouvre la boîte ; après succès, « Merci, votre retour a bien été envoyé. » annoncé en `role="status"` et focus rendu au bouton) et compléter `Header.test.jsx` (bouton avant la cloche ; mocks `mockNotificationApi()`) ; confirmer RED
- [x] 8.2 Implémenter `features/feedback/components/FeedbackButton` (D-1) avec l'atome `IconButton` et une icône lucide, l'insérer avant `NotificationBell` dans `SiteHeader` ; confirmer GREEN ; vérifier que les tests de styles (tailles en `rem`, jetons, focus) passent
- [ ] 8.3 Vérifier les scénarios `page-layout` « En-tête et logo sans chevauchement » dans le navigateur pour une session `SUPER_ADMIN` à 320, 390, 850 et 1100 px (texte 150 %) : aucune icône sur le logo, aucun débordement horizontal ; ajuster l'espacement de `.inner` si besoin ; commit `feat(feedback): add feedback button to header`

## 9. Intégration et documentation front

- [x] 9.1 `npm run check` vert (lint + tests + build + budget du bundle)
- [ ] 9.2 Passage manuel sur le vrai back local : chargée et formateur envoient un bug avec image et une suggestion sans image, l'email arrive dans Mailtrap ; un stagiaire ne voit pas le bouton ; message de plus de 3 Mo refusé ; 11e envoi → message 429 ; SMTP coupé (mauvais `MAIL_HOST`) → message 503 avec saisie conservée
- [x] 9.3 Mettre à jour `docs/dev/etat-front.md` (fonctionnalité, mocks `mockSendFeedback()`, pièges), `docs/decisions/decisions-feedback.md` (statut « implémenté », emplacement du bouton dans `features/feedback/` selon D-1) et l'index `docs/README.md` si les décisions y sont listées ; commit `docs(feedback): document feedback feature`
- [ ] 9.4 Avant la livraison au client : un envoi réel via Brevo avec une image de ~3 Mo (avec Charlotte, une fois Q18 traité) arrive avec la pièce jointe intacte

## Workflow follow-up

- Fusion en avance rapide de `feature/feedback` dans `dev` du front (D64, pas de PR), seulement une fois le back fusionné et sur demande de Manon pour le push.
- Branche `feature/feedback` du back : poussée et PR vers `dev` du back seulement sur demande de Manon ; Charlotte relit d'après `changements-back.md`.
- Archiver le change OpenSpec une fois livré, en listant Q18 (`FEEDBACK_RECIPIENT` en prod) comme demande encore ouverte côté back.
