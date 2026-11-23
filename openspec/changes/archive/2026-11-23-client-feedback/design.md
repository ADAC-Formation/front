# Design

## Context

Voir `proposal.md` (Why) et `docs/decisions/decisions-feedback.md` (U1–U15) pour les choix fonctionnels. État actuel qui contraint l'approche :

- **En-tête** : `SiteHeader` (`components/organisms/Header/Header.jsx`) rend `LoginButton`, `NotificationBell`, `ThemeToggle`, `AccessibilityMenu`, puis `CurrentUser`. La cloche vit dans `features/notifications/components/` et lit la session elle-même : c'est le modèle à suivre.
- **Boîtes modales** : `useModalFocus` (`src/hooks/useModalFocus.js`) gère focus initial, Échap, piège de Tab et retour du focus ; `ConfirmDialog` ne prend que du texte, inadapté à un formulaire.
- **Upload multipart** : `features/documents/api.js` construit un `FormData` et retire l'en-tête JSON par défaut du client axios. `ApiError` normalise `{status, message, details}` ; `message` vient du back.
- **Back – mail** : `EmailServiceImpl.send` utilise `MimeMessageHelper(message, false, "UTF-8")` (pas de pièce jointe), synchrone. `EmailTemplateBuilder` échappe déjà avec `HtmlUtils.htmlEscape`.
- **Back – erreurs** : `GlobalExceptionHandler` mappe `RateLimitException` → 429, `MaxUploadSizeExceededException` → 413 (limite globale 20 Mo, `application.yml`), et tout le reste → 500 avec `log.error`.
- **Back – fichiers** : `FileValidator` vérifie la signature des documents (pdf, png, jpeg, docx, xlsx) avec une limite de 20 Mo ; il ne connaît pas webp.
- **Back – limitation de débit** : `LoginAttemptService` tient une fenêtre en mémoire (`ConcurrentHashMap` + `Clock` injectable + purge `@Scheduled`), testée par `LoginAttemptServiceTest`.
- **Back – session** : les contrôleurs lisent l'utilisateur via `@AuthenticationPrincipal AdacUserDetails` ; les tests utilisent `@WithMockAdacUser`.
- Le clone du back est actuellement sur `local/integration` ; le travail part de `origin/dev`.
- **Build front** : `.dockerignore` exclut `.git` ; le `Dockerfile` reçoit déjà `ARG VITE_API_URL`.

## Goals / Non-Goals

**Goals:**
- Réutiliser les briques existantes (hook modal, motif multipart, échappement, motif de limiteur en mémoire) plutôt que d'en créer de nouvelles.
- Ne changer le comportement d'aucun endpoint existant.
- Garder chaque côté testable isolément : back par MockMvc + `JavaMailSender` simulé ; front par MSW.

**Non-Goals:**
- Pas d'envoi asynchrone ni de file d'attente des emails.
- Pas de limiteur de débit partagé entre plusieurs instances du back (une seule instance déployée).
- Pas de refonte de `ConfirmDialog` en composant générique.
- Pas de passage du SHA git par la CI dans ce change (voir Open Questions).

## Decisions

### D-1 — Bouton dans `features/feedback/`, pas dans `components/molecules/`
`FeedbackButton` lit la session (`useCurrentUser`) et ouvre une boîte métier : c'est du code de fonctionnalité (D32). Il vit dans `features/feedback/components/` et `SiteHeader` l'importe avant `NotificationBell`, comme il importe déjà la cloche. Il ne rend rien tant que la session n'est pas connue ni pour un `STAGIAIRE`. L'icône est rendue par l'atome `IconButton` existant.
*Alternative rejetée* : molécule partagée (ce que disait l'architecture de `decisions-feedback.md`) — une molécule ne doit pas dépendre de l'authentification ; la cloche a déjà tranché ce point.

### D-2 — `FeedbackDialog` propre, bâti sur `useModalFocus`
Formulaire React Hook Form (D8, D13) : radio `type`, `textarea` `message` avec compteur, `input type="file"` (`accept="image/png,image/jpeg,image/webp"`), paragraphe « Envoyé avec votre retour : … », avertissement U14. Validateurs écrits à la main ajoutés dans `utils/validation.js` (`validateFeedbackMessage`, `validateFeedbackImage`). Focus initial sur le premier radio ; `Annuler`/Échap via `useModalFocus`. Mêmes jetons visuels que `ConfirmDialog` (fond, ombre) mais sa propre feuille CSS Module.
*Alternative rejetée* : étendre `ConfirmDialog` avec des `children` riches — mélange deux responsabilités et touche un composant utilisé partout.

### D-3 — Envoi : `sendFeedback(fields)` + `useSendFeedback()`
`features/feedback/api.js` construit le `FormData` (`type`, `message`, `page`, `userAgent`, `viewport`, `appVersion`, `screenshot?`) en retirant l'en-tête JSON, comme `uploadDocument`. `useSendFeedback` est un `useMutation` sans invalidation de cache (aucune donnée serveur à rafraîchir). Le contexte est collecté au moment de l'envoi par une fonction pure `collectFeedbackContext()` : `window.location.pathname`, `navigator.userAgent`, `${innerWidth}x${innerHeight}`, `__APP_VERSION__`. Le bouton « Envoyer » est désactivé pendant `isPending` (scénario double clic).
Erreurs : la boîte reste ouverte et affiche `error.message` dans une région `role="alert"` — le back fournit des messages français pour 400/429/503/413 ; l'erreur réseau a déjà un message (`ApiError`). Succès : fermeture et message de U6 dans une région `role="status"` rendue par `FeedbackButton` (elle survit à la fermeture de la boîte), effacé après quelques secondes.

### D-4 — Version de l'application au build
`vite.config.js` ajoute `define: { __APP_VERSION__: JSON.stringify(\`${pkg.version}+${process.env.VITE_APP_COMMIT ?? 'local'}\`) }` (lecture de `package.json`). Déclaré dans `eslint.config.js` comme global en lecture seule, et dans la config de test Vitest (même `define`).
*Alternative rejetée* : `git rev-parse` dans `vite.config.js` — `.git` est exclu du contexte Docker, la commande échouerait dans l'image.

### D-5 — Back : `FeedbackController` → `FeedbackService` → `EmailService`
- `FeedbackController` : `@PostMapping(value = "/api/feedback", consumes = MULTIPART_FORM_DATA)`, `@PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")`, paramètres `@RequestParam` + `@RequestPart(required = false) MultipartFile screenshot`, `@AuthenticationPrincipal AdacUserDetails`. Répond `201` sans corps.
- `FeedbackService` (interface + `Impl`, comme les autres services) : valide les champs (→ `BadRequestException` existante, 400), vérifie le limiteur, charge l'utilisateur de session, appelle `EmailService.sendFeedbackEmail(...)`, enregistre l'envoi dans le limiteur.
- `FeedbackType` : enum `BUG`, `SUGGESTION` (libellés « Bug », « Suggestion » pour le sujet).
- Un record `FeedbackRequest` regroupe les champs texte ; les champs de contexte sont tronqués à 500 caractères (protection, pas une règle visible).
*Alternative rejetée* : tout dans le contrôleur — non testable sans MockMvc, et contraire au découpage du back.

### D-6 — Email multipart dans `EmailServiceImpl`
Nouvelle méthode `sendFeedbackEmail(User author, FeedbackRequest request, MultipartFile screenshot)` : `MimeMessageHelper(message, true, "UTF-8")`, `setTo(feedbackRecipient)`, `setReplyTo(author.getEmail())`, sujet `[ADAC][Bug] Prénom Nom — /page`, corps produit par `EmailTemplateBuilder.buildFeedbackEmail(...)` qui échappe **chaque** champ (`HtmlUtils.htmlEscape`) et conserve les retours à la ligne du message (`<br>` après échappement). Pièce jointe via `addAttachment("capture.<ext>", new ByteArrayResource(bytes), mimeType)` avec le type canonique déduit de la signature, pas du type déclaré. Destinataire : `@Value("${app.feedback.recipient}")`, `application.yml` → `${FEEDBACK_RECIPIENT:}` ; `application-dev.yml` peut fournir une valeur par défaut factice capturée par Mailtrap.
Le sujet est construit à partir de valeurs nettoyées des retours à la ligne (`\r`, `\n`) pour éviter l'injection d'en-têtes.

### D-7 — `FeedbackScreenshotValidator` dédié
Petit composant qui vérifie taille ≤ 3 Mo et signature png (`89 50 4E 47 0D 0A 1A 0A`), jpeg (`FF D8 FF`) ou webp (`RIFF` à 0 et `WEBP` à 8), et renvoie le type canonique. Fichier vide traité comme absent.
*Alternative rejetée* : étendre `FileValidator` — il sert aux documents (20 Mo, autres formats) ; y ajouter webp changerait les documents acceptés (D66, cas 2).

### D-8 — 503 limité au retour
`FeedbackService` attrape `MailException` et lève une nouvelle `FeedbackDeliveryException` ; `GlobalExceptionHandler` la mappe en 503 « Envoi impossible pour le moment, réessayez plus tard. ». Le journal ne contient que le type d'erreur et l'id de l'utilisateur, jamais le message ni l'email.
*Alternative rejetée* : mapper toute `MailException` en 503 — changerait la réponse des endpoints d'activation et de réinitialisation (D66, cas 4).

### D-9 — `FeedbackRateLimiter` en mémoire
Calqué sur `LoginAttemptService` : clé = id utilisateur, fenêtre glissante d'une heure stockée comme file d'horodatages (≤ 10), `Clock` injectable pour les tests, purge `@Scheduled`. `check(userId)` avant la validation coûteuse ; `record(userId)` seulement après un envoi réussi, pour qu'une panne SMTP (503) ne consomme pas le quota. Au-delà : `RateLimitException` existante → 429 « Trop de retours envoyés. Réessayez dans une heure. »
*Alternative rejetée* : compter en base (pas de stockage, U3) ; bibliothèque Bucket4j (nouvelle dépendance pour un compteur).

### D-10 — Ordre de travail : back d'abord
Le contrat `tech.md` et les codes d'erreur réels sont fixés par le back ; les mocks MSW du front les reprennent ensuite à l'identique.

## Risks / Trade-offs

- [Limiteur réinitialisé au redémarrage du back] → acceptable : protège d'une boucle, pas d'un attaquant ; une seule instance.
- [Envoi synchrone : la requête attend le SMTP (quelques secondes)] → bouton désactivé et libellé « Envoi… » pendant l'attente ; timeouts SMTP déjà configurés par Spring Mail.
- [Image > 20 Mo rejetée en 413 avant le contrôleur, hors de notre message] → le front bloque à 3 Mo avant envoi ; le message 413 existant (« Fichier trop volumineux ») reste lisible.
- [Limite réelle de Brevo non vérifiée] → 3 Mo (~4 Mo encodés) laisse de la marge ; un envoi de test réel avant la livraison est prévu dans les tâches.
- [`FEEDBACK_RECIPIENT` vide en prod] → l'envoi échoue en `MailException` → 503 : la fonctionnalité dit « impossible » plutôt que de perdre silencieusement. Le démarrage n'échoue pas (valeur par défaut vide), pour ne pas bloquer un déploiement de Charlotte avant Q18.
- [Le `userAgent` et le chemin viennent du client et peuvent être falsifiés] → ce sont des indices de débogage, échappés et tronqués ; l'identité, elle, vient de la session.
- [Une icône de plus dans l'en-tête sur 320 px] → couvert par le scénario `page-layout` « Téléphone étroit, toutes les icônes » ; si la place manque, réduire l'espacement de `.inner` plutôt que masquer un contrôle.

## Migration Plan

1. Back : branche `feature/feedback` depuis `origin/dev` ; commits TDD ; `tech.md` mis à jour ; entrée dans `docs/charlotte/changements-back.md`. Pas de migration de base.
2. Front : branche `feature/feedback` depuis `dev` ; fusion en avance rapide dans `dev` (D64) une fois le back fusionné, pour ne pas livrer un bouton qui répond 404.
3. Déploiement : Charlotte renseigne `FEEDBACK_RECIPIENT` (Q18).
4. Retour arrière : retirer `FeedbackButton` de `SiteHeader` suffit à masquer la fonctionnalité ; l'endpoint du back est additif et peut rester.

## Open Questions

- Passer le SHA du commit au build Docker (`ARG VITE_APP_COMMIT` + `--build-arg` dans `.github/workflows/ci.yml`) : utile pour distinguer deux builds de la même version, mais sans effet sur les specs ; d'ici là la version vaut `0.0.0+local`. À faire avec la prochaine retouche de la CI.
