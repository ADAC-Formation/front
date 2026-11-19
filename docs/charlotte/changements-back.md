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

### 2026-11-19 — `AGENTS.md` : le plan d'un ticket peut être validé par n'importe quel humain, pas seulement Charlotte (prêt à relire)

- **Branche et commit** (clone `back-readonly`, depuis `origin/dev`) : `chore/agents-human-validation`, `0615bc4`. Non poussé.
- **Quoi et pourquoi** : `AGENTS.md` demandait de « présenter un plan concret et attendre la validation de Charlotte » avant chaque ticket. Avec D66 (Manon peut modifier le back), cette règle bloquait. La phrase devient : présenter le plan **à un humain (Charlotte, ou Manon quand c'est elle qui conduit la session)** et attendre **sa** validation. Un humain reste dans la boucle, comme voulu à l'origine ; seule la personne change.
- **Fichiers touchés** : `AGENTS.md` (ligne 17, une phrase). Aucun test, aucun code.
- **Contrat** : aucun changement de `tech.md`.
- **À vérifier / risques** : deux autres endroits disent encore « Charlotte » et n'ont **pas** été modifiés, donc les agents du back y liront toujours son nom : `docs/BACKEND_WORKFLOW.md` ligne 30 (« Attendre la validation de Charlotte. ») et `.claude/skills/backend-agent/SKILL.md` ligne 12. À aligner si tu es d'accord (une phrase chacun).
- **Lien avec** : D66 (`decisions-front-foundations.md`).
