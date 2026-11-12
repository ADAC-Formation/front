# Back en local pour le développement du front (D16–D20)

Le back de Charlotte ne documente pas de parcours « développeuse front » : son `docker-compose.yml` est orienté production. Ce dossier complète ce compose **sans toucher à `back-readonly`**.

| Fichier | Rôle |
|---|---|
| `docker-compose.dev.yml` | surcharge : profil `dev`, port 8080 publié, front désactivé |
| `seed-local-admin.sql` | comptes fictifs (SUPER_ADMIN, ADMIN, STAGIAIRE, compte non activé), local uniquement |
| `../dev-compose/.env` | secrets locaux (hors des deux dépôts, jamais committé) — `DB_PASSWORD` et `JWT_SECRET` générés |

Toutes les commandes se lancent depuis la racine du repo front (`front`).

## Premier lancement

```bash
# 1. (optionnel) Mailtrap : renseigner MAIL_USERNAME / MAIL_PASSWORD dans ../dev-compose/.env
#    — nécessaire seulement pour recevoir les codes d'activation / réinitialisation.
#    Supabase : les valeurs factices suffisent tant qu'on ne teste pas les documents.

# 2. Démarrer base + back (le premier build Maven prend quelques minutes)
docker compose -p adac-dev --env-file ../dev-compose/.env \
  -f ../back-readonly/docker-compose.yml -f docs/dev/docker-compose.dev.yml up -d --build db backend

# 3. Attendre « Started PortailAdacApplication » dans les logs
docker compose -p adac-dev --env-file ../dev-compose/.env \
  -f ../back-readonly/docker-compose.yml -f docs/dev/docker-compose.dev.yml logs -f backend

# 4. Insérer les comptes de dev (à faire une seule fois, rejouable)
docker compose -p adac-dev --env-file ../dev-compose/.env \
  -f ../back-readonly/docker-compose.yml -f docs/dev/docker-compose.dev.yml \
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
docker compose -p adac-dev --env-file ../dev-compose/.env \
  -f ../back-readonly/docker-compose.yml -f docs/dev/docker-compose.dev.yml down

# tout effacer, base comprise (puis refaire le premier lancement)
docker compose -p adac-dev --env-file ../dev-compose/.env \
  -f ../back-readonly/docker-compose.yml -f docs/dev/docker-compose.dev.yml down -v
```

## Notes

- Après un `git -C ../back-readonly pull`, relancer l'étape 2 (le `--build` reconstruit l'image).
- `git -C ../back-readonly status` doit rester propre : la surcharge et le `.env` vivent hors de ce dépôt.
- Activation / mot de passe oublié : les e-mails arrivent dans la boîte Mailtrap (compte gratuit personnel, D19).
