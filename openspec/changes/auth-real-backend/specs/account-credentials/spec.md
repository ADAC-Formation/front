## ADDED Requirements

### Requirement: Règle de mot de passe validée côté client
Tout formulaire qui définit un mot de passe (activation, réinitialisation) SHALL exiger 8 à 72 caractères, au moins une majuscule et au moins un chiffre, ainsi qu'une confirmation identique, et SHALL afficher en français la règle non respectée avant tout envoi. Le back reste l'autorité : une erreur `400` SHALL être affichée en ligne.

#### Scenario: Mot de passe trop court
- **WHEN** l'utilisateur saisit un mot de passe de 7 caractères
- **THEN** aucun appel n'est émis et un message indique la longueur minimale

#### Scenario: Majuscule ou chiffre manquant
- **WHEN** le mot de passe ne contient aucun chiffre ou aucune majuscule
- **THEN** aucun appel n'est émis et un message indique la règle manquante

#### Scenario: Confirmation différente
- **WHEN** la confirmation ne correspond pas au mot de passe
- **THEN** aucun appel n'est émis et un message l'indique

#### Scenario: Mot de passe trop long
- **WHEN** le mot de passe dépasse 72 caractères
- **THEN** aucun appel n'est émis et un message indique la longueur maximale

### Requirement: Activation de compte par code
La page `/activation` SHALL demander l'adresse e-mail (préremplie et modifiable si fournie dans le lien par un paramètre `email`), le code de vérification à 6 chiffres, le nouveau mot de passe et sa confirmation, puis envoyer `POST /auth/activate` avec `{email, code, newPassword}`. En cas de succès, l'utilisateur SHALL être redirigé vers `/login` avec le bandeau « Compte activé avec succès ».

#### Scenario: Activation réussie
- **WHEN** le code est valide et le mot de passe respecte la règle
- **THEN** l'utilisateur est redirigé vers `/login` avec le bandeau de succès

#### Scenario: Code invalide ou expiré
- **WHEN** le back répond `400` « Code invalide ou expiré »
- **THEN** le formulaire affiche ce message sans distinguer les causes et propose le bouton « Renvoyer un code »

#### Scenario: Adresse fournie dans le lien
- **WHEN** l'utilisateur ouvre `/activation?email=nom@exemple.fr`
- **THEN** le champ e-mail contient `nom@exemple.fr` et peut être modifié

### Requirement: Renvoi du code d'activation
Le bouton « Renvoyer un code » SHALL envoyer `POST /auth/resend-activation` avec `{email}` et afficher le message du back. Un `429` SHALL être affiché avec le message du back.

#### Scenario: Renvoi accepté
- **WHEN** le back répond `200` « Si cet email existe, un code vous a été envoyé. »
- **THEN** ce message est annoncé à l'utilisateur

#### Scenario: Limite de renvois atteinte
- **WHEN** le back répond `429` « Trop de demandes. Réessayez dans 15 minutes. »
- **THEN** ce message est affiché et l'utilisateur peut toujours saisir un code

### Requirement: Mot de passe oublié
La page `/mot-de-passe-oublie` SHALL demander l'adresse e-mail et envoyer `POST /auth/forgot-password`. Quelle que soit la situation du compte, le front SHALL afficher le même message de confirmation (« Si cet email existe, un code vous a été envoyé. ») puis proposer de passer à la réinitialisation, sans jamais révéler l'existence du compte.

#### Scenario: E-mail connu ou inconnu
- **WHEN** le back répond `200` avec le message générique
- **THEN** le même message est affiché dans tous les cas et un lien mène à `/reinitialisation`

### Requirement: Réinitialisation du mot de passe
La page `/reinitialisation` SHALL demander l'adresse e-mail (préremplie si fournie dans le lien par un paramètre `email`), le code, le nouveau mot de passe et sa confirmation, puis envoyer `POST /auth/reset-password` avec `{email, code, newPassword}`. En cas de succès, l'utilisateur SHALL être redirigé vers `/login` avec le bandeau « Mot de passe mis à jour ».

#### Scenario: Réinitialisation réussie
- **WHEN** le code est valide et le mot de passe respecte la règle
- **THEN** l'utilisateur est redirigé vers `/login` avec le bandeau « Mot de passe mis à jour »

#### Scenario: Code invalide ou expiré
- **WHEN** le back répond `400` « Code invalide ou expiré »
- **THEN** le formulaire affiche ce message en ligne et conserve les champs saisis, sauf les mots de passe

### Requirement: Accessibilité des formulaires d'accès
Les pages de connexion, d'activation, de mot de passe oublié et de réinitialisation SHALL avoir chaque champ étiqueté, être utilisables au clavier, annoncer les erreurs et les confirmations dans une région `aria-live`, et ne présenter aucune violation détectée par l'outil d'audit automatique d'accessibilité (WCAG 2.1 AA).

#### Scenario: Erreur annoncée
- **WHEN** une erreur est affichée après un envoi
- **THEN** elle est annoncée aux technologies d'assistance sans déplacer la page
