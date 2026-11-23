# Décisions — Retours client (bouton « Envoyer un retour »)

Statut : **implémenté le 2026-11-23** (change OpenSpec `client-feedback`) — front sur `feature/feedback`, back sur `feature/feedback` du clone (non poussés). Décisions numérotées **U** (retours **u**tilisateurs) : F est pris par les formations et R par les risques du plan.
Le côté back relève des cas « mis de côté » de D66 (2 et 3) : **Manon a décidé** de le faire elle-même (U15). Seule la valeur de `FEEDBACK_RECIPIENT` dans l'env de prod reste à Charlotte (Q18 de `docs/charlotte/points-pour-charlotte.md`).

## Contrat (exigences immuables)

1. Un bouton icône dans le header, avant la cloche (U11), ouvre un formulaire de retour.
2. Visible seulement pour `SUPER_ADMIN` (chargée de formation) et `ADMIN` (formateur) ; jamais pour `STAGIAIRE` ni pour un visiteur anonyme.
3. Champs saisis : type (**Bug** / **Suggestion**, obligatoire), message (obligatoire, 10–2000 caractères), image facultative (png / jpeg / webp, 3 Mo max, U12).
4. Contexte joint automatiquement : page (`pathname`, sans query string), navigateur (`userAgent`), taille de fenêtre, version de l'application. L'utilisateur voit la liste de ce qui est joint.
5. Identité et rôle de l'auteur lus **côté back depuis le JWT**, jamais depuis le corps de la requête.
6. Canal : `POST /api/feedback` → email envoyé par le mailer existant (`EmailServiceImpl`, Brevo en prod, Mailtrap en dev) à l'adresse `FEEDBACK_RECIPIENT` (une seule adresse, celle de Manon), `Reply-To` = email de l'auteur, image en pièce jointe.
7. Rien n'est stocké (ni table, ni Supabase).
8. Confirmation dans l'application uniquement (pas d'email de copie à l'auteur).
9. Fonctionnalité **permanente** (pas de drapeau de build).

## Critères de réussite

- [ ] Un formateur et la chargée voient le bouton ; un stagiaire ne le voit pas (test).
- [ ] Le back renvoie 403 à un `STAGIAIRE` et 401 sans session.
- [ ] Un envoi valide produit un email dans Mailtrap avec sujet, contexte, Reply-To et pièce jointe.
- [ ] Image > 3 Mo ou d'un type non autorisé : 400 côté back (vérification par signature du fichier), message lisible côté front.
- [ ] Au-delà de la limite d'envoi : 429, message lisible ; le texte saisi est conservé.
- [ ] Le message de l'utilisateur est échappé dans l'email HTML.
- [ ] jest-axe sans violation sur la boîte de dialogue ; `npm run check` vert ; tests back verts.
- [ ] `tech.md` mis à jour sur la branche du back ; changement consigné dans `docs/charlotte/changements-back.md`.

## Interdits (anti-patterns)

- ❌ Aucun service tiers de feedback (Sentry, Userback, Formspree…) — D31 : aucune donnée personnelle envoyée à un tiers, aucun tracker.
- ❌ Aucune adresse destinataire dans le code ou le bundle front — elle vit dans l'env du back (sinon exposée publiquement et collectable).
- ❌ Ne pas faire confiance à l'identité ou au rôle envoyés par le front — falsifiable.
- ❌ Pas de capture d'écran automatique (html2canvas…) — dépendance lourde (budget du bundle) et capture de données personnelles à l'insu de l'utilisateur.
- ❌ Pas de stockage de l'image ni du message — sinon question de rétention RGPD pour un simple formulaire.
- ❌ Pas d'insertion du message en HTML brut dans l'email — XSS dans le client mail.
- ❌ Ne jamais coder le back sur `dev` ni pousser sans demande de Manon : branche `feature/feedback` depuis `origin/dev`, journal dans `changements-back.md` (D66).
- ❌ Ne pas toucher à l'env de déploiement de prod (`.env`, compose) — c'est à Charlotte (D66, cas 3) ; seuls `application*.yml` et l'env de dev local sont modifiés.

## Décisions

### U1 — Public : chargée + formateurs
- **Décision** : bouton rendu si le rôle de `/auth/me` est `SUPER_ADMIN` ou `ADMIN` ; le back l'impose aussi (`@PreAuthorize`).
- **Pourquoi** : ce sont les testeurs côté ADAC ; groupe restreint et connu, peu de bruit.
- **Alternatives rejetées** : chargée seule (moins de couverture) ; tous les connectés (bruit et support des stagiaires) ; y compris la page de connexion (endpoint public → spam).

### U2 — Canal : email via le back
- **Décision** : `POST /api/feedback` envoie un email avec le mailer existant à `FEEDBACK_RECIPIENT`, `Reply-To` = l'auteur. Sujet : `[ADAC][Bug] Prénom Nom — /chemin`.
- **Pourquoi** : réutilise l'infra mail existante, aucune table, aucun tiers ; on répond directement depuis sa boîte.
- **Alternatives rejetées** : issue GitHub créée par le back (secret à gérer, dépendance à GitHub) ; table + page d'admin (le plus de travail, migration à faire valider) ; lien `mailto:` (dépend du client mail de l'utilisateur, pas de contexte automatique).

### U3 — Image en pièce jointe, rien de stocké
- **Décision** : requête `multipart/form-data` ; l'image est jointe à l'email puis oubliée. Limites : 3 Mo (U12), png/jpeg/webp, signature du fichier vérifiée.
- **Pourquoi** : seule option sans donnée persistée ; même schéma multipart que l'upload de documents.
- **Alternatives rejetées** : stockage Supabase + lien (rétention, contrôle d'accès du lien) ; base64 dans du JSON (+33 % de taille, incohérent avec les documents).
- **Ne pas revenir dessus sauf si** : Brevo refuse les pièces jointes de cette taille en prod.

### U4 — Formulaire minimal
- **Décision** : type + message (+ image facultative). Pas de titre, pas de modèle « attendu / obtenu ».
- **Pourquoi** : 10 secondes pour remplir → le formulaire est réellement utilisé ; le contexte automatique couvre le reste.

### U5 — Contexte automatique, transparent
- **Décision** : `pathname`, `userAgent`, viewport, version (`__APP_VERSION__` = version de `package.json` + SHA git, injectée par `define` dans `vite.config.js`, à créer). Mention repliable « Envoyé avec votre retour : … » dans la boîte de dialogue.
- **Pourquoi** : indispensable pour reproduire un bug ; l'afficher respecte l'esprit de D31.

### U6 — Confirmation dans l'application
- **Décision** : fermeture de la boîte + message « Merci, votre retour a bien été envoyé. » dans une région `role="status"`. En cas d'erreur, la boîte reste ouverte avec le texte saisi.
- **Alternatives rejetées** : copie par email à l'auteur (double le volume de mails et le travail de gabarit).

### U7 — Limite d'envoi
- **Décision** : environ 10 retours par utilisateur et par heure → 429 (`RateLimitException` existante).
- **Pourquoi** : protège la boîte de Manon et le quota Brevo d'une boucle ou d'un abus.

### U8 — Échec d'envoi de l'email
- **Date** : 2026-11-23
- **Décision** : l'envoi reste synchrone ; le back traduit une `MailException` en **503** « Envoi impossible pour le moment, réessayez plus tard. » (nouveau gestionnaire dans `GlobalExceptionHandler`, qui renvoie aujourd'hui 500). Le front garde la boîte ouverte avec le type, le message et l'image, et propose de réessayer. Toujours rien de stocké.
- **Pourquoi** : l'utilisateur sait que son retour n'est pas parti et ne perd rien ; le contrat « rien n'est stocké » (U3) tient.
- **Alternatives rejetées** : écrire le retour dans les logs du back en secours (données personnelles dans les logs, rétention non maîtrisée) ; stocker en base (contredit U3, migration à faire valider).

### U9 — Confirmation : région `role="status"` locale (réponse trouvée dans le code)
- **Date** : 2026-11-23
- **Décision** : la confirmation de U6 utilise une région `role="status"` locale, comme le reste du front (`DocumentDropzone`, `AccountListPage`, `CategoryManagementPage`…). Pas de système de toast global.
- **Pourquoi** : motif déjà en place et testé dans une dizaine de composants ; un toast global serait une nouvelle brique pour un seul usage.

### U10 — Destinataire après la passation
- **Date** : 2026-11-23
- **Décision** : `FEEDBACK_RECIPIENT` reste l'adresse de Manon pour l'instant ; le document de passation indique que Charlotte (qui gère le déploiement) la remplace par l'adresse du ou de la prochaine responsable. Aucun changement de code à la passation.
- **Pourquoi** : la fonctionnalité est permanente (exigence 9) mais la personne qui lit les retours change ; une variable d'environnement suffit.
- **Alternatives rejetées** : alias neutre dès maintenant (boîte à créer et à faire posséder par quelqu'un) ; bouton masqué si la variable est vide (comportement de plus à coder et à tester).

### U11 — Emplacement du bouton
- **Date** : 2026-11-23
- **Décision** : dans `Header.jsx`, le bouton se place **avant la cloche** : Retour · Cloche · Mode sombre · Accessibilité · Utilisateur. Cible tactile identique aux autres icônes (44 px).
- **Pourquoi** : garde groupés les réglages d'affichage (mode sombre, accessibilité) ; bouton visible en un clic pour le client.
- **Alternatives rejetées** : juste après le mode sombre (sépare la paire de réglages d'affichage) ; dans le menu de l'utilisateur (deux clics, moins visible).

### U12 — Taille maximale de l'image : 3 Mo
- **Date** : 2026-11-23
- **Décision** : image limitée à **3 Mo**, vérifiée côté front (message « Image trop lourde (3 Mo maximum) ») et côté back (400).
- **Pourquoi** : l'encodage d'une pièce jointe ajoute environ 33 % (3 Mo → ~4 Mo transmis), largement sous toute limite plausible du relais Brevo, dont la limite exacte n'est pas documentée dans le projet. Une capture d'écran Windows courante pèse 0,3 à 2 Mo.
- **Alternatives rejetées** : 5 Mo (~6,7 Mo transmis, à vérifier contre Brevo) ; redimensionnement dans le navigateur (plus de code front à tester pour un cas rare).

### U13 — Problème de connexion : hors périmètre
- **Date** : 2026-11-23
- **Décision** : aucun formulaire de retour sur les pages publiques (connexion, activation, mot de passe oublié). Un utilisateur bloqué passe par le canal habituel (email ou téléphone à Manon ou à l'ADAC).
- **Pourquoi** : quelques testeurs connus ; un endpoint public ouvrirait une surface de spam sans identité vérifiable.
- **Alternatives rejetées** : ligne de contact statique sur la page de connexion (adresse dans le bundle, contraire aux interdits) ; endpoint public + captcha (lourd pour une poignée d'utilisateurs).

### U14 — RGPD : avertissement dans la boîte de dialogue
- **Date** : 2026-11-23
- **Décision** : la boîte affiche, près du champ image : « Évitez d'inclure des données personnelles de stagiaires dans la capture. » La page « Confidentialité » (D31, texte attendu de l'ADAC) n'est pas modifiée pour cette fonctionnalité.
- **Pourquoi** : réduit le risque principal (captures contenant des données de tiers) sans dépendre du calendrier de l'ADAC.
- **Alternatives rejetées** : question ajoutée à `questions-pour-adac.md` pour couvrir le traitement dans le texte de confidentialité ; bloquer la mise en production tant que le texte ne le mentionne pas.
- **Risque accepté** : le traitement (nom, email, contexte, capture → boîte mail du développeur) n'est pas décrit dans la page de confidentialité.

### U15 — Qui code le back
- **Date** : 2026-11-23
- **Décision** : Manon fait faire le back et le front dans cette session (cas 2 et 3 de D66 tranchés par Manon) : branche `feature/feedback` du back depuis `origin/dev`, entrée dans `docs/charlotte/changements-back.md`, `tech.md` mis à jour sur la même branche. Charlotte reçoit seulement, via `points-pour-charlotte.md`, la demande de renseigner `FEEDBACK_RECIPIENT` dans l'env de prod.
- **Pourquoi** : le changement du back est petit et isolé (un contrôleur, une méthode de mail, un gestionnaire d'erreur) ; pas besoin d'attendre.
- **Alternatives rejetées** : demander l'accord de Charlotte et coder le front en parallèle ; attendre Charlotte avant tout code ; laisser Charlotte coder le back.

## Architecture

**Front** (`ADAC-Formation/front`)
- `features/feedback/components/FeedbackButton` — `IconButton` + icône lucide `MessageSquareWarning`, `aria-label="Envoyer un retour"`, placé dans `organisms/Header/Header.jsx` avant `NotificationBell` (U11). Dans `features/` et non `components/molecules/` comme prévu d'abord : il lit la session, comme la cloche (design D-1 du change).
- `features/feedback/components/FeedbackDialog` (même habillage que `CategoryFormDialog`, `useModalFocus`), formulaire React Hook Form, validateurs `validateFeedbackMessage` / `validateFeedbackImage` dans `utils/validation.js`, `useSendFeedback` (`hooks.js`), `sendFeedback` / `collectFeedbackContext` (`api.js`).
- `vite.config.js` — `define: { __APP_VERSION__ }`.

**Back** (`ADAC-Formation/back`, branche `feature/feedback` depuis `origin/dev`)
- `FeedbackController` — `POST /api/feedback`, rôles `SUPER_ADMIN`/`ADMIN` ; `FeedbackService(Impl)`, `FeedbackRateLimiter`, `FeedbackScreenshotValidator`, `FeedbackDeliveryException` (→ 503 pour ce seul endpoint).
- `EmailService.sendFeedbackEmail(...)` — `MimeMessageHelper` en mode multipart, `Reply-To`, contenu échappé ; gabarit dans `EmailTemplateBuilder`.
- `app.feedback.recipient: ${FEEDBACK_RECIPIENT}` dans `application*.yml`.
- `tech.md` : nouvelle section ; `docs/charlotte/changements-back.md` : entrée.

## Questions ouvertes

Toutes résolues le 2026-11-23 : destinataire et passation → U10 ; taille Brevo → U12 ; échec SMTP → U8 ; page de connexion → U13 ; toast → U9 ; RGPD → U14 ; qui code le back → U15.
