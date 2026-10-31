# Constitution du front ADAC

Courte et stable. Les règles propres à une fonctionnalité vont dans `spec.md` / `plan`.

1. Le contrat API (`back` `dev`, `docs/tech.md`) fait autorité ; le front ne le modifie pas.
2. Authentification par cookie HttpOnly : aucun jeton en JavaScript ni en localStorage.
3. Interface en français, code (identifiants, fichiers) en anglais, commits Conventional Commits.
4. Contenu utilisateur toujours rendu en texte (jamais en HTML).
5. Accessibilité non négociable : clavier, `aria-*`, mode sombre, grand texte, contraste élevé.
6. Rien n'est poussé ni créé sur l'organisation GitHub sans demande explicite de Manon.
7. Une décision = une entrée écrite dans `docs/decisions-*.md` au moment où elle est prise.
8. « Terminé » = DoD du plan de projet (§11) : lint + build verts, contrat respecté, doc à jour.
