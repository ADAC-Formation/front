# Back en local pour le développement du front (D16–D20)

Le back de Charlotte ne documente pas de parcours « développeuse front » : son `docker-compose.yml` est orienté production. Ce dossier complète ce compose **sans toucher à `back-readonly`**.

| Fichier | Rôle |
|---|---|
| `docker-compose.dev.yml` | surcharge : profil `dev`, port 8080 publié, front désactivé |
| `seed-local-admin.sql` | comptes fictifs (SUPER_ADMIN, ADMIN, STAGIAIRE, compte non activé), local uniquement |
| `../../../../dev-compose/.env` | secrets locaux (hors des deux dépôts, jamais committé) — `DB_PASSWORD` et `JWT_SECRET` générés |

Toutes les commandes se lancent depuis la racine du repo front (`ADAC Front/front`).

## Premier lancement

```bash
# 1. (optionnel) Mailtrap : renseigner MAIL_USERNAME / MAIL_PASSWORD dans ../../dev-compose/.env
#    — nécessaire seulement pour recevoir les codes d'activation / réinitialisation.
#    Supabase : les valeurs factices suffisent tant qu'on ne teste pas les documents.

# 2. Démarrer base + back (le premier build Maven prend quelques minutes)
docker compose -p adac-dev --env-file ../../dev-compose/.env \
  -f ../../back-readonly/docker-compose.yml -f docs/dev/docker-compose.dev.yml up -d --build db backend

# 3. Attendre « Started PortailAdacApplication » dans les logs
docker compose -p adac-dev --env-file ../../dev-compose/.env \
  -f ../../back-readonly/docker-compose.yml -f docs/dev/docker-compose.dev.yml logs -f backend

# 4. Insérer les comptes de dev (à faire une seule fois, rejouable)
docker compose -p adac-dev --env-file ../../dev-compose/.env \
  -f ../../back-readonly/docker-compose.yml -f docs/dev/docker-compose.dev.yml \
  exec -T db psql -U adac_user -d adac_portail < docs/dev/seed-local-admin.sql

# 5. Vérifier
curl -i http://localhost:8080/api/auth/me     # 401 : normal tant qu'on n'est pas connecté
# Swagger : http://localhost:8080/swagger-ui.html
```

Ensuite, à la racine du front : `cp .env.example .env` (une seule fois ; `VITE_API_URL=http://localhost:8080/api`), puis `npm run dev` (front sur http://localhost:5173, origine CORS autorisée). Sans `.env`, le front interroge le serveur Vite au lieu du back.

## Comptes de dev

Mot de passe commun : `DevAdmin2026`

| E-mail | Rôle |
|---|---|
| `chargee.dev@adac.test` | SUPER_ADMIN (Chargée de formation) |
| `formateur.dev@adac.test` | ADMIN (Formateur) |
| `stagiaire.dev@adac.test` | STAGIAIRE |
| `inactif.dev@adac.test` | STAGIAIRE non activé → 403 « Compte non activé » |

## Arrêter / réinitialiser

```bash
# arrêter (les données restent dans le volume)
docker compose -p adac-dev --env-file ../../dev-compose/.env \
  -f ../../back-readonly/docker-compose.yml -f docs/dev/docker-compose.dev.yml down

# tout effacer, base comprise (puis refaire le premier lancement)
docker compose -p adac-dev --env-file ../../dev-compose/.env \
  -f ../../back-readonly/docker-compose.yml -f docs/dev/docker-compose.dev.yml down -v
```

## Essayer « Mes documents » du stagiaire avant la réponse à Q13

Le back n'envoie pas encore `inscriptionId` au stagiaire (Q13 de `docs/points-pour-charlotte.md`). En développement seulement, un raccourci le complète :

1. Avec un stagiaire inscrit à une formation (compte de dev, inscription faite par la chargée de formation), lire l'id d'inscription en tant que chargée de formation : `GET /api/formations/{id}/inscriptions` (Swagger, onglet « Authorize » avec le cookie `jwt`) ; le champ `id` de la ligne du stagiaire est son `inscriptionId`.
2. Dans `.env` (git-ignoré) : `VITE_DEV_INSCRIPTION_IDS={"<idFormation>":<idInscription>}` (plusieurs formations : `{"101":7,"102":9}`), puis redémarrer `npm run dev`.
3. Connecté en stagiaire, `/profile` affiche la zone de dépôt de cette formation. Le champ du back, quand il existera, l'emporte sur le raccourci ; le build de production ne le lit jamais.
4. Ce raccourci est temporaire : le retirer (`devInscriptionId` dans `src/features/documents/documentFiles.js`, cette section, `.env.example`) quand Charlotte aura répondu.

## Notes

- Après un `git -C ../../back-readonly pull`, relancer l'étape 2 (le `--build` reconstruit l'image).
- `git -C ../../back-readonly status` doit rester propre : la surcharge et le `.env` vivent hors de ce dépôt.
- Activation / mot de passe oublié : les e-mails arrivent dans la boîte Mailtrap (compte gratuit personnel, D19).
