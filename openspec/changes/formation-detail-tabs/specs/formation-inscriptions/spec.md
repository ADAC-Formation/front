# Spec Delta

## MODIFIED Requirements

### Requirement: Inscrire depuis la page de la formation
Sur une formation active, l'onglet « Liste stagiaires » SHALL proposer à la chargée « Inscrire des stagiaires » : la liste de cases des stagiaires (recherche, « Tout sélectionner ») avec les comptes actifs et jamais activés, sans les suspendus ni les déjà inscrits, le nom seul (jamais l'e-mail). Un `POST` par stagiaire coché SHALL partir, la liste des inscrits SHALL être rechargée et les échecs SHALL être listés par nom.

#### Scenario: Compte jamais activé
- **WHEN** la chargée ouvre « Inscrire des stagiaires » alors qu'un stagiaire n'a pas encore activé son compte et qu'un autre est suspendu
- **THEN** le premier est proposé, le second non

#### Scenario: Action dans l'onglet
- **WHEN** la chargée ouvre le détail d'une formation active
- **THEN** « Inscrire des stagiaires » et un « Désinscrire » par ligne se trouvent dans l'onglet « Liste stagiaires », et dans aucun autre onglet
