---
name: run-front
description: Démarrer le front ADAC en local avec le back (Docker compose depuis ../back-readonly). À utiliser pour lancer l'app, la vérifier sur le vrai back local ou diagnostiquer un front qui n'atteint pas le back.
---

# Démarrer le front et le back en local

## Back en local (D16–D20)

- Docker compose depuis `../back-readonly` + `docs/dev/docker-compose.dev.yml` (D53) + `ADAC/dev-compose/.env` hors dépôts (secrets, comptes dev personnels Mailtrap/Supabase). Commandes : `docs/dev/README.md`.
- Le back ne crée aucun SUPER_ADMIN : utiliser `docs/dev/seed-local-admin.sql`.

## Démarrer le frontend — checklist

1. `npm install`
2. **Le back doit tourner** sur `http://localhost:8080` (voir « Back en local » ci-dessus et `docs/dev/README.md`).
3. **`.env` à la racine, obligatoire** (git-ignoré) : `cp .env.example .env` (`VITE_API_URL=http://localhost:8080/api`). Sans lui, le front interroge le serveur Vite au lieu du back ; redémarrer `npm run dev` après modification.
4. `npm run dev` — le serveur Vite démarre sur `http://localhost:5173` (origine CORS par défaut du back, ne pas changer de port)
5. Vérifier : la page s'affiche et `GET /auth/me` répond (401 si non connecté, c'est normal)
