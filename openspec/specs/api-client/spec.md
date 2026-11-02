# api-client Specification

## Purpose

Définit comment le front dialogue avec l'API du back : authentification par cookie HttpOnly uniquement, adresse configurable au build, et normalisation de toutes les erreurs HTTP en une erreur applicative unique (dont la règle de session expirée sur 401).

## Requirements

### Requirement: Authentification par cookie uniquement
Toute requête du front vers l'API SHALL transporter l'identité de l'utilisateur uniquement via le cookie HttpOnly `jwt`. Le front SHALL NOT envoyer d'en-tête `Authorization`, ni lire, stocker ou transmettre un jeton en JavaScript ou dans le stockage du navigateur.

#### Scenario: Les cookies accompagnent chaque requête
- **WHEN** le front émet une requête vers l'API
- **THEN** la requête inclut les identifiants (cookies) de l'origine de l'API

#### Scenario: Aucun jeton côté JavaScript
- **WHEN** une requête est émise après une connexion réussie
- **THEN** elle ne comporte aucun en-tête `Authorization` et aucun jeton n'est présent dans `localStorage` ni `sessionStorage`

### Requirement: Adresse de l'API configurable au build
L'adresse de base de l'API SHALL provenir de la variable `VITE_API_URL` fixée au build (`http://localhost:8080/api` en local, `/api` en production, même origine).

#### Scenario: Adresse locale
- **WHEN** `VITE_API_URL` vaut `http://localhost:8080/api`
- **THEN** un appel à `/auth/me` cible `http://localhost:8080/api/auth/me`

### Requirement: Normalisation des erreurs de l'API
Toute réponse d'erreur de l'API SHALL être convertie en une erreur applicative unique portant `status` (nombre), `message` (texte) et `details` (liste de textes, vide si absente), conformément au format d'erreur standard de `tech.md` (`{status, message, details[]}`). Le `message` et les `details` SHALL être traités comme du texte, jamais comme du HTML.

#### Scenario: Erreur au format standard
- **WHEN** l'API répond `400` avec `{"status":400,"message":"Données invalides","details":["Email invalide"]}`
- **THEN** l'appelant reçoit une erreur avec `status` 400, `message` « Données invalides » et `details` `["Email invalide"]`

#### Scenario: Corps d'erreur absent ou inattendu
- **WHEN** l'API répond `502` avec un corps vide ou non JSON
- **THEN** l'appelant reçoit une erreur avec `status` 502, un `message` générique en français et `details` vide

#### Scenario: Serveur injoignable
- **WHEN** aucune réponse n'est reçue (réseau coupé, back arrêté)
- **THEN** l'appelant reçoit une erreur signalée comme erreur réseau (sans `status` HTTP) avec un `message` générique en français

### Requirement: Session expirée sur 401
Une réponse `401` à une requête autre que `POST /auth/login` SHALL signaler une session expirée : la session de l'utilisateur est considérée comme terminée et l'application redirige vers `/login` avec le message « session expirée », sans rechargement complet de la page.

#### Scenario: Session expirée pendant la navigation
- **WHEN** une requête `GET /formations` reçoit `401`
- **THEN** l'utilisateur est redirigé vers `/login` avec le message « session expirée », sans rechargement dur

### Requirement: Les 401 de connexion et de visiteur ne sont pas une session expirée
Une réponse `401` à `POST /auth/login` (identifiants invalides) SHALL NOT déclencher la redirection de session expirée et SHALL être transmise à l'appelant pour affichage en ligne. `GET /auth/me` répondant `401` pour un visiteur non connecté SHALL NOT afficher le message « session expirée ».

#### Scenario: Identifiants invalides à la connexion
- **WHEN** `POST /auth/login` reçoit `401`
- **THEN** aucune redirection n'a lieu et l'erreur est remise au formulaire de connexion

#### Scenario: Visiteur non connecté
- **WHEN** `GET /auth/me` reçoit `401` au chargement initial
- **THEN** l'application considère l'utilisateur comme non connecté, sans message « session expirée »

### Requirement: Traitement des autres codes d'erreur
Les erreurs `403`, `404`, `409`, `429`, `5xx` et réseau SHALL être transmises à l'appelant sous forme d'erreur normalisée, de sorte que l'interface puisse : afficher une page dédiée pour `403` et `404` (le `404` du back est volontaire, anti-sondage d'existence), afficher le `message` en ligne pour `400`, `409` et `429`, et un message global pour `5xx` et réseau. Un `429` à la connexion SHALL conserver le message du back (« Trop de tentatives. Réessayez dans 15 minutes. »).

#### Scenario: Trop de tentatives de connexion
- **WHEN** `POST /auth/login` reçoit `429` avec `{"status":429,"message":"Trop de tentatives. Réessayez dans 15 minutes."}`
- **THEN** l'appelant reçoit une erreur `status` 429 dont le `message` est celui du back

#### Scenario: Compte non activé
- **WHEN** `POST /auth/login` reçoit `403` « Compte non activé. Veuillez consulter vos emails. »
- **THEN** l'appelant reçoit une erreur `status` 403 avec ce `message`, sans redirection de session
