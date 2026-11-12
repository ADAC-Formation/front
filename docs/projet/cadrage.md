# Cadrage du projet — Portail de Formation ADAC (front)

Fusion de l'ancienne `constitution.md` (règles stables) et de l'ancien `project-brief.md` (le « pourquoi »). Les règles propres à une fonctionnalité vont dans `spec.md` et `plan-de-proyecto.md`.

## Brief : le pourquoi

Source de vérité du « pourquoi ». À ne pas réécrire : les sources client sont citées, pas résumées.

### Client et besoin
- Client : ADAC (formations en travail social et santé mentale). Projet bénévole, sans contrat de maintenance.
- Compte rendu de la 1re rencontre (06/07/2026) : `docs/adac/2026.07.06 1er Rencontre Programatrice-vu LBA (2).pdf` (fichier local **ignoré par git** : il contient des noms de personnes, ne jamais le committer).
- Besoins exprimés : publier des formations avec documents, messagerie individuelle/par critères, notifications, UX simple, login avec comptes créés par l'admin, conformité Qualiopi, ~130 stagiaires/an.

### Sources techniques (dépôt `back`, branche `dev`, lecture seule)
`../back-readonly/docs/` : `PRD.md`, `STORIES.md`, `USERFLOW.md`, `tech.md` (contrat API), `DB_MODEL.md`, `DESIGN.md`, `STACK.md`, `INFRASTRUCTURE.md`, `TICKETS.md`.

### Répartition
Manon = front-end. Charlotte = back-end, BD, déploiement. Aucune action sur le dépôt `back` ni sur l'organisation GitHub sans demande explicite.

## Constitution : les règles stables

1. Le contrat API (`back` `dev`, `docs/tech.md`) fait autorité ; le front ne le modifie pas.
2. Authentification par cookie HttpOnly : aucun jeton en JavaScript ni en localStorage.
3. Interface en français, code (identifiants, fichiers) en anglais, commits Conventional Commits.
4. Contenu utilisateur toujours rendu en texte (jamais en HTML).
5. Accessibilité non négociable : clavier, `aria-*`, mode sombre, grand texte, contraste élevé.
6. Rien n'est poussé ni créé sur l'organisation GitHub sans demande explicite de Manon.
7. Une décision = une entrée écrite dans `docs/decisions/decisions-*.md` au moment où elle est prise.
8. « Terminé » = DoD du plan de projet (§11) : lint + build verts, contrat respecté, doc à jour.
