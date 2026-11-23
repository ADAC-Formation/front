# Spec Delta

## MODIFIED Requirements

### Requirement: Stagiaires inscrits
Pour `SUPER_ADMIN` et `ADMIN`, l'onglet « Liste stagiaires » du détail SHALL lister les stagiaires de `GET /formations/{id}/inscriptions` (nom, prénom, e-mail) avec, pour chacun, le compte de documents reçus (inscrit-documents-progress). Pour `STAGIAIRE`, aucun appel aux inscriptions ne SHALL être émis, l'onglet n'existe pas et le nombre d'inscrits n'est pas affiché. Une erreur de cette liste SHALL s'afficher dans l'onglet, sans masquer le reste du détail.

#### Scenario: Chargée de formation
- **WHEN** un `SUPER_ADMIN` ouvre le détail d'une formation à deux inscrits
- **THEN** l'onglet « Liste stagiaires », ouvert par défaut, liste les deux stagiaires avec leur e-mail et leur compte de documents

#### Scenario: Stagiaire
- **WHEN** un `STAGIAIRE` ouvre le détail
- **THEN** `GET /formations/{id}/inscriptions` n'est pas appelé et l'onglet « Liste stagiaires » n'existe pas

#### Scenario: Liste d'inscrits en erreur
- **WHEN** l'appel aux inscriptions répond `500`
- **THEN** un message avec « Réessayer » s'affiche dans l'onglet « Liste stagiaires » et le bloc d'informations reste visible

#### Scenario: Aucun inscrit
- **WHEN** la formation n'a aucun inscrit
- **THEN** l'onglet affiche « Aucun stagiaire inscrit »
