# Proposal

## Why

Une fois une version livrée, la chargée de formation et les formateurs de l'ADAC testent le portail au quotidien, mais leurs remarques arrivent aujourd'hui par des canaux épars (mails, téléphone, réunions), sans la page concernée ni le navigateur utilisé. Un bouton « Envoyer un retour » dans l'en-tête leur permet de signaler un bug ou une suggestion en quelques secondes, avec le contexte joint automatiquement, directement dans la boîte mail du développeur. Conception validée dans `docs/decisions/decisions-feedback.md` (U1–U15).

## What Changes

**Côtés concernés : front et back** (le back est modifié par Manon sur une branche de travail, U15 / D66).

- **Front** — un bouton icône « Envoyer un retour », placé avant la cloche dans l'en-tête, visible seulement pour la chargée de formation (`SUPER_ADMIN`) et les formateurs (`ADMIN`).
- **Front** — une boîte de dialogue : type (Bug / Suggestion), message (10–2000 caractères), image facultative (png / jpeg / webp, 3 Mo max), liste visible du contexte joint (page, navigateur, taille de fenêtre, version), avertissement sur les données personnelles dans la capture.
- **Front** — confirmation dans une région `role="status"` ; en cas d'erreur (400, 429, 503), la boîte reste ouverte avec la saisie.
- **Front** — version de l'application injectée au build (`__APP_VERSION__`).
- **Back** — nouvel endpoint `POST /api/feedback` (`multipart/form-data`), réservé à `SUPER_ADMIN` / `ADMIN`, qui envoie un email au destinataire configuré (`FEEDBACK_RECIPIENT`), avec `Reply-To` = l'auteur, image en pièce jointe, contenu échappé ; identité lue depuis le JWT ; rien n'est stocké.
- **Back** — limite d'environ 10 retours par utilisateur et par heure (429) ; un échec d'envoi SMTP répond 503 au lieu de 500.
- **Back** — `tech.md` documente l'endpoint ; changement consigné dans `docs/charlotte/changements-back.md`.

**Hors périmètre** : formulaire de retour sur les pages publiques (connexion, activation, mot de passe oublié — U13) ; capture d'écran automatique ; stockage des retours (table, Supabase, logs) ; copie par email à l'auteur ; mention dans la page « Confidentialité » (risque accepté, U14) ; valeur de `FEEDBACK_RECIPIENT` dans l'env de prod (à Charlotte, Q18).

Aucun ticket de `back-readonly/docs/TICKETS.md` ne couvre cette fonctionnalité : elle est nouvelle.

## Capabilities

### New Capabilities
- `client-feedback`: envoi d'un retour (bug ou suggestion) par la chargée de formation et les formateurs depuis l'en-tête — formulaire, contexte joint, endpoint `POST /api/feedback`, email au développeur, limites et erreurs.

### Modified Capabilities
- `page-layout`: l'exigence « En-tête et logo sans chevauchement » liste les commandes de l'en-tête (session, mode sombre, accessibilité) ; elle doit inclure le bouton de retour (et la cloche) pour que le non-chevauchement avec le logo reste garanti avec une icône de plus.

## Impact

- **Front** : `src/components/organisms/Header/Header.jsx` (nouveau bouton), nouveau dossier `src/features/feedback/` (bouton, boîte, hook `useMutation`, appel API — design D-1), `src/utils/validation.js` (validateurs), `vite.config.js` (`define`), mock MSW `src/test/feedback.js`.
- **Back** (`../back-readonly`, branche `feature/feedback` depuis `origin/dev`) : nouveau `FeedbackController`, `EmailService` / `EmailServiceImpl` / `EmailTemplateBuilder` (email multipart), `GlobalExceptionHandler` (`FeedbackDeliveryException` → 503, design D-8), limiteur de débit, `application.yml` (`app.feedback.recipient`), `docs/tech.md`.
- **API** : ajout d'un endpoint, aucun endpoint existant modifié (pas de changement cassant).
- **Dépendances** : aucune nouvelle (lucide-react, React Hook Form, TanStack Query, Spring Mail déjà présents).
- **Exploitation** : nouvelle variable d'environnement `FEEDBACK_RECIPIENT` côté back (prod : Charlotte, Q18 ; à changer à la passation, U10).
